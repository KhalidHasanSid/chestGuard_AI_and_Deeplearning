import os
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from tensorflow.keras.models import Sequential
from tensorflow.keras.applications import VGG16
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.metrics import Precision, Recall
from PIL import Image
import io
import tempfile
import re
import requests
from urllib.parse import urlparse

app = Flask(__name__)

# EXACT SAME CONSTANTS AS YOUR TRAINING
IMAGE_SIZE = 224  # From your notebook
BATCH_SIZE = 32   # From your notebook

def convert_gdrive_url(share_url):
    """
    Convert Google Drive share URL to direct download URL
    """
    try:
        # Extract file ID from Google Drive share URL
        if 'drive.google.com' in share_url and '/file/d/' in share_url:
            file_id = share_url.split('/file/d/')[1].split('/')[0]
            # Create direct download URL
            direct_url = f"https://drive.google.com/uc?export=download&id={file_id}"
            return direct_url
        else:
            return share_url
    except Exception as e:
        print(f"Error converting Google Drive URL: {e}")
        return share_url

def download_model_weights(url, local_path):
    """
    Download model weights from URL to local file with Google Drive support
    """
    try:
        print(f"Downloading weights from: {url}")
        print(f"Saving to: {local_path}")
        
        # Check if file already exists
        if os.path.exists(local_path):
            file_size = os.path.getsize(local_path)
            print(f"File already exists ({file_size} bytes), skipping download")
            return local_path
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(local_path) if os.path.dirname(local_path) else '.', exist_ok=True)
        
        # Convert Google Drive URL if needed
        download_url = convert_gdrive_url(url)
        print(f"Using download URL: {download_url}")
        
        # Start session for Google Drive downloads
        session = requests.Session()
        
        # First request to get the file
        response = session.get(download_url, stream=True, timeout=60)
        
        # Handle Google Drive virus scan warning for large files
        if 'virus scan warning' in response.text.lower() or 'download_warning' in response.text:
            print("Detected Google Drive virus scan warning, extracting confirm token...")
            
            # Look for the confirm token
            for line in response.text.split('\n'):
                if 'confirm=' in line and 'download' in line:
                    try:
                        confirm_token = line.split('confirm=')[1].split('&')[0].split('"')[0]
                        print(f"Found confirm token: {confirm_token}")
                        
                        # Make second request with confirm token
                        params = {'confirm': confirm_token, 'id': download_url.split('id=')[1]}
                        response = session.get('https://drive.google.com/uc', params=params, stream=True, timeout=120)
                        break
                    except:
                        continue
        
        response.raise_for_status()
        
        # Download with progress
        total_size = int(response.headers.get('content-length', 0))
        downloaded_size = 0
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded_size += len(chunk)
                    if total_size > 0:
                        progress = (downloaded_size / total_size) * 100
                        print(f"\rDownload progress: {progress:.1f}%", end='', flush=True)
        
        print(f"\n✓ Download completed: {downloaded_size} bytes")
        
        # Verify the file is not empty and is likely a valid model file
        if downloaded_size < 1000:  # Less than 1KB is suspicious
            print(f"⚠️ Warning: Downloaded file is very small ({downloaded_size} bytes)")
            with open(local_path, 'r') as f:
                content = f.read()[:500]  # Read first 500 chars
                if 'html' in content.lower() or 'error' in content.lower():
                    print("Downloaded file appears to be HTML (likely an error page)")
                    os.remove(local_path)
                    return None
        
        return local_path
        
    except Exception as e:
        print(f"❌ Failed to download weights: {e}")
        if os.path.exists(local_path):
            os.remove(local_path)
        return None

def sanitize_model_name(name):
    """
    Sanitize model name to match TensorFlow scope name requirements:
    ^[A-Za-z0-9.][A-Za-z0-9_.\\/>-]*$
    """
    # Replace spaces and special characters with underscores
    sanitized = re.sub(r'[^A-Za-z0-9._\-]', '_', name)
    # Ensure it starts with a valid character
    if not re.match(r'^[A-Za-z0-9.]', sanitized):
        sanitized = 'model_' + sanitized
    return sanitized

def build_exact_binary_model(model_name="binary_model"):
    """
    Build the EXACT same model architecture as your Kaggle training
    This must match EXACTLY what you used in training
    """
    # Sanitize the model name
    safe_name = sanitize_model_name(model_name)
    
    base_vgg16 = VGG16(
        weights='imagenet',
        include_top=False,
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3)
    )
    
    # Fine-tune last few layers (EXACTLY as in your training)
    for layer in base_vgg16.layers[:-4]:
        layer.trainable = False
    
    model = Sequential([
        base_vgg16,
        GlobalAveragePooling2D(),
        Dense(256, activation='relu'),
        Dropout(0.5),
        Dense(128, activation='relu'),
        Dropout(0.3),
        Dense(1, activation='sigmoid') 
    ], name=safe_name)
    
    # EXACT same compilation as training
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss='binary_crossentropy',
        metrics=['accuracy', Precision(), Recall()]
    )
    
    return model

def load_model_with_weights_download(weights_url, model_name, local_filename):
    """
    Download weights from URL and load model with the exact architecture
    """
    try:
        print(f"Loading {model_name}...")
        
        # Download weights if not already present
        downloaded_path = download_model_weights(weights_url, local_filename)
        if downloaded_path is None:
            raise Exception("Failed to download model weights")
        
        # Build the exact same architecture with sanitized name
        model = build_exact_binary_model(model_name)
        
        # Load the weights from local file
        model.load_weights(downloaded_path)
        
        print(f"✓ {model_name} loaded successfully")
        print(f"  Model input shape: {model.input_shape}")
        print(f"  Model output shape: {model.output_shape}")
        
        # Verify the model structure
        print(f"  Total layers: {len(model.layers)}")
        print(f"  Trainable params: {model.count_params()}")
        
        return model
        
    except Exception as e:
        print(f"❌ Failed to load {model_name}: {e}")
        return None

def preprocess_image_from_bytes(image_bytes):
    """
    Preprocess image from raw bytes with exact same preprocessing as training
    """
    try:
        print(f"Processing image from bytes, size: {len(image_bytes)} bytes")
        
        # Create BytesIO object from bytes
        img_buffer = io.BytesIO(image_bytes)
        
        # Open image from buffer
        img = Image.open(img_buffer)
        
        print(f"Image opened successfully - mode: {img.mode}, size: {img.size}")
        
        # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
        if img.mode != 'RGB':
            print(f"Converting from {img.mode} to RGB")
            img = img.convert('RGB')
        
        # Resize to target size
        img = img.resize((IMAGE_SIZE, IMAGE_SIZE))
        print(f"Image resized to: {img.size}")
        
        # Convert to numpy array
        img_array = np.array(img, dtype=np.float32)
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        # CRITICAL: Use the EXACT same normalization as your training
        # Your ImageDataGenerator used rescale=1./255
        img_array = img_array / 255.0
        
        print(f"Image preprocessed successfully - shape: {img_array.shape}, range: [{img_array.min():.3f}, {img_array.max():.3f}]")
        
        return img_array
        
    except Exception as e:
        print(f"Error preprocessing image from bytes: {e}")
        return None

def preprocess_image_from_file_object(file_obj):
    """
    Preprocess image from file object (FileStorage) with exact same preprocessing as training
    """
    try:
        print(f"Processing file object: {file_obj}")
        
        # Read the file content to bytes
        file_obj.seek(0)  # Ensure we're at the beginning
        image_bytes = file_obj.read()
        
        print(f"Read {len(image_bytes)} bytes from file object")
        
        if len(image_bytes) == 0:
            raise Exception("File object is empty")
        
        # Use the bytes preprocessing function
        return preprocess_image_from_bytes(image_bytes)
        
    except Exception as e:
        print(f"Error preprocessing image from file object: {e}")
        return None

def download_image_from_url(image_url):
    """
    Download image from URL (e.g., Cloudinary) and return as bytes
    """
    try:
        print(f"Downloading image from URL: {image_url}")
        
        headers = {
            'User-Agent': 'ChestGuard-Python-Server/1.0'
        }
        
        response = requests.get(image_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        image_bytes = response.content
        print(f"Downloaded {len(image_bytes)} bytes from URL")
        
        if len(image_bytes) == 0:
            raise Exception("Downloaded image is empty")
        
        return image_bytes
        
    except Exception as e:
        print(f"Error downloading image from URL: {e}")
        return None

def predict_with_exact_models_from_array(tb_model, pneumonia_model, img_array):
    """
    Make predictions using preprocessed image array
    """
    try:
        print(f"Making predictions with preprocessed array - shape: {img_array.shape}")
        
        # Get predictions from both models
        tb_pred = tb_model.predict(img_array, verbose=0)[0]
        pneumonia_pred = pneumonia_model.predict(img_array, verbose=0)[0]
        
        # Extract probabilities (your models output single sigmoid value)
        tb_disease_prob = float(tb_pred[0])  # Probability of TB
        pneumonia_disease_prob = float(pneumonia_pred[0])  # Probability of Pneumonia
        
        print(f"Raw predictions - TB: {tb_disease_prob:.4f}, Pneumonia: {pneumonia_disease_prob:.4f}")
        
        return {
            'tb_confidence': tb_disease_prob,
            'pneumonia_confidence': pneumonia_disease_prob,
            'tb_prediction': 'TB Detected' if tb_disease_prob > 0.5 else 'Normal',
            'pneumonia_prediction': 'Pneumonia Detected' if pneumonia_disease_prob > 0.5 else 'Normal'
        }
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

def process_and_return_result(result):
    """
    Process prediction result and return formatted response with correct normal calculation
    """
    try:
        # Get the disease probabilities
        tb_confidence = result['tb_confidence']
        pneumonia_confidence = result['pneumonia_confidence']
        
        # Calculate normal confidence correctly
        max_disease_confidence = max(tb_confidence, pneumonia_confidence)
        normal_confidence = 1 - max_disease_confidence
        
        # Determine detections
        tb_detected = tb_confidence > 0.5
        pneumonia_detected = pneumonia_confidence > 0.5
        
        # Determine final diagnosis
        if not tb_detected and not pneumonia_detected:
            final_diagnosis = "Normal Chest X-Ray"
            recommendation = "No significant pathology detected"
        elif tb_detected and not pneumonia_detected:
            final_diagnosis = "Tuberculosis Detected"
            recommendation = "TB screening, sputum test recommended"
        elif pneumonia_detected and not tb_detected:
            final_diagnosis = "Pneumonia Detected"
            recommendation = "Antibiotic treatment consideration"
        else:
            final_diagnosis = "Multiple Conditions Detected"
            recommendation = "Possible co-infection - requires urgent medical review"
        
        response_data = {
            'tuberculosis_confidence': round(tb_confidence * 100, 2),
            'pneumonia_confidence': round(pneumonia_confidence * 100, 2),
            'normal_confidence': round(normal_confidence * 100, 2),
            'tb_prediction': result['tb_prediction'],
            'pneumonia_prediction': result['pneumonia_prediction'],
            'final_diagnosis': final_diagnosis,
            'recommendation': recommendation,
            'tb_detected': tb_detected,
            'pneumonia_detected': pneumonia_detected
        }
        
        print(f"✓ Prediction successful: {final_diagnosis}")
        print(f"  TB: {response_data['tuberculosis_confidence']}%")
        print(f"  Pneumonia: {response_data['pneumonia_confidence']}%") 
        print(f"  Normal: {response_data['normal_confidence']}%")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error processing result: {e}")
        return jsonify({'error': f'Error processing result: {str(e)}'}), 500

# Updated URLs and local paths for model weights
TB_WEIGHTS_URL = "https://drive.google.com/file/d/1ajFFF0RxK84vMl2oOWhqxGKlEuSInOiF/view?usp=sharing"
PNEUMONIA_WEIGHTS_URL = "https://drive.google.com/file/d/1DVKSu94XYbL6hSDG--XcamaK0EP1MWJ3/view"

# Local file paths for caching the downloaded weights
TB_WEIGHTS_PATH = "tuberculosis_binary_weights.h5"
PNEUMONIA_WEIGHTS_PATH = "pneumonia_binary_weights.h5"

# Load models with weight downloading
print("🏗️ Loading models with weight downloading from Google Drive...")
tb_model = load_model_with_weights_download(TB_WEIGHTS_URL, "TB_Model", TB_WEIGHTS_PATH)
pneumonia_model = load_model_with_weights_download(PNEUMONIA_WEIGHTS_URL, "Pneumonia_Model", PNEUMONIA_WEIGHTS_PATH)

if tb_model is None or pneumonia_model is None:
    print("❌ ERROR: Failed to load models. Check your internet connection and URLs.")
    exit(1)

print("✅ Models loaded successfully!")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        print(f"Received prediction request - Content-Type: {request.content_type}")
        
        # Method 1: Handle direct URL in request body (JSON)
        if request.is_json:
            data = request.get_json()
            if 'url' in data:
                image_url = data['url']
                print(f"Processing prediction from URL: {image_url}")
                
                # Download image from URL
                image_bytes = download_image_from_url(image_url)
                if image_bytes is None:
                    return jsonify({'error': 'Failed to download image from URL'}), 400
                
                # Preprocess image from bytes
                img_array = preprocess_image_from_bytes(image_bytes)
                if img_array is None:
                    return jsonify({'error': 'Failed to preprocess image from URL'}), 400
                
                # Make prediction
                result = predict_with_exact_models_from_array(tb_model, pneumonia_model, img_array)
                
                if result is None:
                    return jsonify({'error': 'Prediction failed'}), 500
                
                # Process and return result
                return process_and_return_result(result)
        
        # Method 2: Handle file upload
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded and no URL provided'}), 400

        img_file = request.files['file']
        if img_file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        print(f"Received file: {img_file.filename}, content type: {img_file.content_type}")
        
        # Try to preprocess directly from file object
        img_array = preprocess_image_from_file_object(img_file)
        
        if img_array is not None:
            result = predict_with_exact_models_from_array(tb_model, pneumonia_model, img_array)
            if result:
                return process_and_return_result(result)
        
        return jsonify({'error': 'Failed to process image'}), 500
            
    except Exception as e:
        print(f"❌ Prediction endpoint failed with exception: {str(e)}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/predict_url', methods=['POST'])
def predict_url():
    """
    Dedicated endpoint for predicting from URLs (like Cloudinary)
    """
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        if 'url' not in data:
            return jsonify({'error': 'URL is required in request body'}), 400
        
        image_url = data['url']
        print(f"Direct URL prediction request: {image_url}")
        
        # Download image from URL
        image_bytes = download_image_from_url(image_url)
        if image_bytes is None:
            return jsonify({'error': 'Failed to download image from URL'}), 400
        
        # Preprocess image from bytes
        img_array = preprocess_image_from_bytes(image_bytes)
        if img_array is None:
            return jsonify({'error': 'Failed to preprocess image from URL'}), 400
        
        # Make prediction
        result = predict_with_exact_models_from_array(tb_model, pneumonia_model, img_array)
        
        if result is None:
            return jsonify({'error': 'Prediction failed'}), 500
        
        return process_and_return_result(result)
        
    except Exception as e:
        print(f"❌ URL prediction failed: {str(e)}")
        return jsonify({'error': f'URL prediction failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'models_loaded': tb_model is not None and pneumonia_model is not None,
        'model_info': {
            'image_size': IMAGE_SIZE,
            'preprocessing': 'rescale_1_over_255',
            'architecture': 'VGG16_with_custom_head',
            'normal_calculation': 'inverse_of_max_disease_confidence'
        },
        'supported_methods': [
            'file_upload',
            'url_prediction',
            'direct_bytes'
        ]
    })

@app.route('/test', methods=['GET'])
def test_models():
    """Test endpoint to verify models are working"""
    try:
        # Create a dummy image for testing
        dummy_img = np.random.rand(1, IMAGE_SIZE, IMAGE_SIZE, 3).astype(np.float32) / 255.0
        
        result = predict_with_exact_models_from_array(tb_model, pneumonia_model, dummy_img)
        
        if result:
            return process_and_return_result(result)
        else:
            return jsonify({'test_status': 'failed', 'error': 'Prediction failed'}), 500
            
    except Exception as e:
        return jsonify({'test_status': 'error', 'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask app with Google Drive weight downloading...")
    print(f"📊 Model configuration:")
    print(f"  - Image size: {IMAGE_SIZE}x{IMAGE_SIZE}")
    print(f"  - Preprocessing: rescale=1./255 (matches training)")
    print(f"  - Architecture: VGG16 + custom head with dropout")
    print(f"  - Output: Single sigmoid for binary classification")
    print(f"  - Normal calculation: 100% - max(disease_confidences)")
    print(f"  - Weight source: Google Drive")
    
    # Check if models loaded successfully before starting server
    if tb_model is None or pneumonia_model is None:
        print("❌ CRITICAL ERROR: Models failed to load!")
        exit(1)
    
    app.run(
        debug=False,
        host='0.0.0.0',
        port=5000,
        threaded=True,
        use_reloader=False
    )