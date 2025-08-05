import tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = {
    info: (message, data = null) => {
        // console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    },
    error: (message, error = null) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    },
    warn: (message, data = null) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
    }
};


// Cache for the loaded model to avoid reloading
let xrayValidationModel = null;

/**
 * Load the X-ray validation model
 * @returns {Promise<tf.LayersModel>} The loaded TensorFlow model
 */
async function loadXrayValidationModel() {
    if (xrayValidationModel) {
        return xrayValidationModel;
    }

    try {
        const modelPath = path.join(__dirname, '../trained_model/bin_xray/model.json'); // Adjust path as needed
        logger.info('Loading X-ray validation model from:', modelPath);
        
        xrayValidationModel = await tf.loadLayersModel(`file://${modelPath}`);
        logger.info('X-ray validation model loaded successfully');
        
        return xrayValidationModel;
    } catch (error) {
        logger.error('Failed to load X-ray validation model:', error);
        throw new Error(`X-ray validation model loading failed: ${error.message}`);
    }
}

/**
 * Preprocess image for X-ray validation
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<tf.Tensor>} Preprocessed image tensor
 */
async function preprocessImageForValidation(imagePath) {
    try {
        // Read image file and decode
        const imageBuffer = fs.readFileSync(imagePath);
        const imageTensor = tf.node.decodeImage(imageBuffer, 3); // Force 3 channels (RGB)
        
        // Resize to 150x150 and normalize
        const resized = tf.image.resizeBilinear(imageTensor, [150, 150]);
        const normalized = resized.toFloat().div(tf.scalar(255.0));
        const batched = normalized.expandDims(0); // Add batch dimension
        
        // Clean up intermediate tensors
        imageTensor.dispose();
        resized.dispose();
        normalized.dispose();

        return batched;
    } catch (error) {
        logger.error('Image preprocessing failed:', error);
        throw new Error(`Image preprocessing failed: ${error.message}`);
    }
}

/**
 * Preprocess image from URL for X-ray validation
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<tf.Tensor>} Preprocessed image tensor
 */
async function preprocessImageFromUrlForValidation(imageUrl) {
    try {
        const axios = await import('axios');
        
        // Download image
        const response = await axios.default.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // Decode and process with TensorFlow.js
        const imageTensor = tf.node.decodeImage(imageBuffer, 3); // Force 3 channels (RGB)
        
        // Resize to 150x150 and normalize
        const resized = tf.image.resizeBilinear(imageTensor, [150, 150]);
        const normalized = resized.toFloat().div(tf.scalar(255.0));
        const batched = normalized.expandDims(0); // Add batch dimension
        
        // Clean up intermediate tensors
        imageTensor.dispose();
        resized.dispose();
        normalized.dispose();

        return batched;
    } catch (error) {
        logger.error('Image preprocessing from URL failed:', error);
        throw new Error(`Image preprocessing from URL failed: ${error.message}`);
    }
}

/**
 * Validate if the uploaded image is an X-ray
 * @param {string} imagePath - Path to the image file (optional)
 * @param {string} imageUrl - URL of the image (optional, fallback)
 * @returns {Promise<Object>} Validation result
 */
async function validateXrayImage(imagePath = null, imageUrl = null) {
    let imageTensor = null;
    
    try {
        // Load model if not already loaded
        const model = await loadXrayValidationModel();
        
        // Preprocess image - try local file first, then URL
        if (imagePath && fs.existsSync(imagePath)) {
            logger.info('Preprocessing image from local path for validation...');
            imageTensor = await preprocessImageForValidation(imagePath);
        } else if (imageUrl) {
            logger.info('Preprocessing image from URL for validation...');
            imageTensor = await preprocessImageFromUrlForValidation(imageUrl);
        } else {
            throw new Error('No valid image path or URL provided for validation');
        }

        // Make prediction
        logger.info('Making X-ray validation prediction...');
        const prediction = await model.predict(imageTensor).data();
        const rawScore = prediction[0];
        
        // Classify
        const isXray = rawScore > 0.5;
        const confidence = isXray ? rawScore : (1 - rawScore);
        
        const result = {
            isXray: isXray,
            confidence: parseFloat(confidence.toFixed(4)),
            rawScore: parseFloat(rawScore.toFixed(4)),
            className: isXray ? 'X-ray' : 'Not X-ray',
            confidencePercentage: `${(confidence * 100).toFixed(1)}%`
        };

        logger.info('X-ray validation completed', {
            isXray: result.isXray,
            confidence: result.confidencePercentage,
            className: result.className
        });

        return result;

    } catch (error) {
        logger.error('X-ray validation failed:', error);
        throw new Error(`X-ray validation failed: ${error.message}`);
    } finally {
        // Clean up tensor
        if (imageTensor) {
            imageTensor.dispose();
        }
    }
}

/**
 * Validate if image is X-ray with threshold check
 * @param {string} imagePath - Path to the image file (optional)
 * @param {string} imageUrl - URL of the image (optional, fallback)
 * @param {number} threshold - Confidence threshold (default: 0.7)
 * @returns {Promise<Object>} Validation result with pass/fail status
 */
async function validateXrayWithThreshold(imagePath = null, imageUrl = null, threshold = 0.7) {
    try {
        const validationResult = await validateXrayImage(imagePath, imageUrl);
        
        const passed = validationResult.isXray && validationResult.confidence >= threshold;
        
        return {
            ...validationResult,
            passed: passed,
            threshold: threshold,
            message: passed 
                ? 'Image validation passed - confirmed as X-ray' 
                : validationResult.isXray 
                    ? `Image is X-ray but confidence (${validationResult.confidencePercentage}) below threshold (${(threshold * 100).toFixed(1)}%)`
                    : 'Image validation failed - not an X-ray'
        };
    } catch (error) {
        logger.error('X-ray validation with threshold failed:', error);
        throw error;
    }
}

export {
    loadXrayValidationModel,
    validateXrayImage,
    validateXrayWithThreshold,
    preprocessImageForValidation,
    preprocessImageFromUrlForValidation
};