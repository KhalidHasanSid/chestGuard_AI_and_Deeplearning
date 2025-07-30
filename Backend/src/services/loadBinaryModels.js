import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants for binary models
const BINARY_CLASS_NAMES = {
    pneumonia: ['Normal', 'Pneumonia'],
    tuberculosis: ['Normal', 'Tuberculosis']
};

// Python server configuration
const PYTHON_SERVER_CONFIG = {
    baseURL: 'http://127.0.0.1:5000',
    timeout: 30000, // 30 seconds timeout
    maxRetries: 3,
    retryDelay: 2000 // 2 seconds between retries
};

const CONFIDENCE_THRESHOLD = {
    pneumonia: 0.5,
    tuberculosis: 0.5
};

// Enhanced logging utility
const logger = {
    info: (message, data = null) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || ''),
    error: (message, error = null) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
    warn: (message, data = null) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '')
};

// Download image from Cloudinary URL and save to temp file
const downloadImageFromUrl = async (imageUrl) => {
    const tempDir = path.join(__dirname, '../temp');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `cloudinary_${Date.now()}.jpg`);

    try {
        logger.info(`Downloading image from Cloudinary URL: ${imageUrl}`);

        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'stream',
            timeout: 15000, // 15 second timeout for download
            headers: {
                'User-Agent': 'ChestGuard-Backend/1.0'
            }
        });

        // Pipe the response directly to file
        const writer = fs.createWriteStream(tempFilePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                const stats = fs.statSync(tempFilePath);
                logger.info(`Image downloaded successfully: ${tempFilePath}, size: ${stats.size} bytes`);

                if (stats.size === 0) {
                    reject(new Error('Downloaded file is empty'));
                    return;
                }

                resolve(tempFilePath);
            });

            writer.on('error', (error) => {
                logger.error('Error writing downloaded image:', error);
                reject(error);
            });

            response.data.on('error', (error) => {
                logger.error('Error downloading image:', error);
                reject(error);
            });
        });

    } catch (error) {
        logger.error('Failed to download image from URL:', error.message);

        // Cleanup partial file if it exists
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        throw new Error(`Failed to download image: ${error.message}`);
    }
};

// Alternative method: Download image to buffer first, then save
const downloadImageToBuffer = async (imageUrl) => {
    try {
        logger.info(`Downloading image to buffer from: ${imageUrl}`);

        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'ChestGuard-Backend/1.0'
            }
        });

        const buffer = Buffer.from(response.data);
        logger.info(`Image downloaded to buffer, size: ${buffer.length} bytes`);

        if (buffer.length === 0) {
            throw new Error('Downloaded image buffer is empty');
        }

        return buffer;

    } catch (error) {
        logger.error('Failed to download image to buffer:', error.message);
        throw new Error(`Failed to download image: ${error.message}`);
    }
};

// Save buffer to temp file with proper validation
const saveBufferToTempFile = async (buffer, extension = '.jpg') => {
    const tempDir = path.join(__dirname, '../temp');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `buffer_${Date.now()}${extension}`);

    try {
        logger.info(`Saving buffer to temp file: ${tempFilePath}, size: ${buffer.length} bytes`);

        // Validate buffer is not empty
        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer is empty or null');
        }

        // Write buffer to file synchronously to ensure completion
        fs.writeFileSync(tempFilePath, buffer);

        // Validate the written file
        const stats = fs.statSync(tempFilePath);
        if (stats.size !== buffer.length) {
            throw new Error(`File size mismatch: expected ${buffer.length}, got ${stats.size}`);
        }

        if (stats.size === 0) {
            throw new Error('Written file is empty');
        }

        logger.info(`Buffer saved successfully to: ${tempFilePath}, verified size: ${stats.size} bytes`);
        return tempFilePath;

    } catch (error) {
        logger.error('Failed to save buffer to temp file:', error.message);

        // Cleanup partial file if it exists
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        throw error;
    }
};

// Check if Python server is running
const checkServerHealth = async () => {
    try {
        const response = await axios.get(`${PYTHON_SERVER_CONFIG.baseURL}/health`, {
            timeout: 5000
        });
        return response.status === 200;
    } catch (error) {
        logger.warn('Python server health check failed:', error.message);
        return false;
    }
};

// Create axios instance with default configuration
const createAxiosInstance = () => {
    return axios.create({
        baseURL: PYTHON_SERVER_CONFIG.baseURL,
        timeout: PYTHON_SERVER_CONFIG.timeout,
        headers: {
            'Accept': 'application/json',
        }
    });
};

// Retry wrapper for API calls
const withRetry = async (operation, maxRetries = PYTHON_SERVER_CONFIG.maxRetries) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger.info(`Attempting operation (${attempt}/${maxRetries})`);
            return await operation();
        } catch (error) {
            lastError = error;
            logger.warn(`Attempt ${attempt} failed:`, error.message);

            if (attempt < maxRetries) {
                const delay = PYTHON_SERVER_CONFIG.retryDelay * attempt;
                logger.info(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

// Convert image file to FormData for Python server - FIXED VERSION
const prepareImageFormData = async (imagePath) => {
    if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
    }

    const stats = fs.statSync(imagePath);
    logger.info(`Preparing FormData for file: ${imagePath}, size: ${stats.size} bytes`);

    if (stats.size === 0) {
        throw new Error(`Image file is empty: ${imagePath}`);
    }

    const formData = new FormData();

    // Read the file synchronously to ensure we get the full content
    const fileBuffer = fs.readFileSync(imagePath);

    if (fileBuffer.length === 0) {
        throw new Error(`Failed to read file content: ${imagePath}`);
    }

    logger.info(`File buffer read successfully, size: ${fileBuffer.length} bytes`);

    // Append the buffer directly instead of using a stream
    formData.append('file', fileBuffer, {
        filename: path.basename(imagePath),
        contentType: 'image/jpeg'
    });

    return formData;
};

// Clean up temporary files
const cleanupTempFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`Cleaned up temp file: ${filePath}`);
        }
    } catch (error) {
        logger.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
    }
};

// Make prediction using Python server - IMPROVED VERSION
const makePythonServerPrediction = async (imagePath) => {
    const axiosInstance = createAxiosInstance();

    return await withRetry(async () => {
        logger.info('Sending prediction request to Python server...');

        // Validate file exists and is not empty
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        const stats = fs.statSync(imagePath);
        if (stats.size === 0) {
            throw new Error(`Image file is empty: ${imagePath}`);
        }

        logger.info(`Sending file: ${imagePath}, size: ${stats.size} bytes`);

        const formData = await prepareImageFormData(imagePath);

        const response = await axiosInstance.post('/predict', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.status !== 200) {
            throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
        }

        logger.info('Prediction successful, server response:', response.data);
        return response.data;
    });
};

// Convert Python server response to our standard format
const convertServerResponseToStandardFormat = (serverResponse, modelType = 'combined') => {
    const {
        normal_confidence = 0,
        pneumonia_confidence = 0,
        tuberculosis_confidence = 0,
        pneumonia_detected = false,
        tb_detected = false,
        final_diagnosis = 'Unknown',
        recommendation = ''
    } = serverResponse;

    // Convert percentages to probabilities (0-1)
    const normalProb = normal_confidence / 100;
    const pneumoniaProb = pneumonia_confidence / 100;
    const tuberculosisProb = tuberculosis_confidence / 100;

    // Determine predicted class based on highest confidence
    let predictedClass = 'Normal';
    let confidence = normalProb;

    if (tb_detected && pneumonia_detected) {
        predictedClass = 'Both';
        confidence = Math.max(pneumoniaProb, tuberculosisProb);
    } else if (tb_detected) {
        predictedClass = 'Tuberculosis';
        confidence = tuberculosisProb;
    } else if (pneumonia_detected) {
        predictedClass = 'Pneumonia';
        confidence = pneumoniaProb;
    }

    // Create results array
    const results = [
        {
            className: 'Normal',
            probability: normalProb,
            confidence: normalProb > CONFIDENCE_THRESHOLD.pneumonia ? 'high' : normalProb > 0.3 ? 'medium' : 'low'
        },
        {
            className: 'Pneumonia',
            probability: pneumoniaProb,
            confidence: pneumoniaProb > CONFIDENCE_THRESHOLD.pneumonia ? 'high' : pneumoniaProb > 0.3 ? 'medium' : 'low'
        },
        {
            className: 'Tuberculosis',
            probability: tuberculosisProb,
            confidence: tuberculosisProb > CONFIDENCE_THRESHOLD.tuberculosis ? 'high' : tuberculosisProb > 0.3 ? 'medium' : 'low'
        }
    ];

    // Sort by probability (highest first)
    results.sort((a, b) => b.probability - a.probability);

    const predictionQuality = {
        isConfident: confidence > Math.max(CONFIDENCE_THRESHOLD.pneumonia, CONFIDENCE_THRESHOLD.tuberculosis),
        uncertaintyScore: 1 - confidence,
        classDistribution: results.map(r => ({
            class: r.className,
            probability: Math.round(r.probability * 1000) / 10
        }))
    };

    return {
        predictedClass,
        results,
        confidence,
        predictionQuality,
        modelType: modelType,
        serverResponse: {
            final_diagnosis,
            recommendation,
            raw: serverResponse
        },
        diseaseSpecific: {
            pneumonia: {
                detected: pneumonia_detected,
                confidence: pneumoniaProb
            },
            tuberculosis: {
                detected: tb_detected,
                confidence: tuberculosisProb
            },
            normal: {
                confidence: normalProb
            }
        }
    };
};

// Handle Cloudinary URL prediction
const predictFromCloudinaryUrl = async (cloudinaryUrl) => {
    let tempFilePath = null;

    try {
        logger.info(`Processing prediction from Cloudinary URL: ${cloudinaryUrl}`);

        // Method 1: Download directly to file
        try {
            tempFilePath = await downloadImageFromUrl(cloudinaryUrl);
        } catch (downloadError) {
            logger.warn('Direct download failed, trying buffer method:', downloadError.message);

            // Method 2: Download to buffer, then save to file
            const imageBuffer = await downloadImageToBuffer(cloudinaryUrl);
            tempFilePath = await saveBufferToTempFile(imageBuffer);
        }

        // Validate the downloaded file
        const stats = fs.statSync(tempFilePath);
        if (stats.size === 0) {
            throw new Error('Downloaded file is empty');
        }

        logger.info(`File ready for prediction: ${tempFilePath}, size: ${stats.size} bytes`);

        // Make prediction using the downloaded file
        const serverResponse = await makePythonServerPrediction(tempFilePath);
        logger.info('Python server response:', serverResponse);

        // Convert to standard format
        const standardResponse = convertServerResponseToStandardFormat(serverResponse, 'cloudinary_url');

        return standardResponse;

    } catch (error) {
        logger.error('Failed to predict from Cloudinary URL:', error.message);
        throw error;
    } finally {
        // Always cleanup the temp file
        if (tempFilePath) {
            cleanupTempFile(tempFilePath);
        }
    }
};
// Enhanced buffer handling for different input types
const processImageInput = async (imageInput) => {
    logger.info(`Processing image input - Type: ${typeof imageInput}, Constructor: ${imageInput?.constructor?.name}`);

    let buffer = null;

    // Handle string inputs (file paths or URLs)
    if (typeof imageInput === 'string') {
        if (fs.existsSync(imageInput)) {
            logger.info(`Reading file from path: ${imageInput}`);
            buffer = fs.readFileSync(imageInput);
        } else {
            throw new Error(`File not found: ${imageInput}`);
        }
    }
    // Handle direct Buffer objects
    else if (Buffer.isBuffer(imageInput)) {
        buffer = imageInput;
        logger.info(`Using provided buffer, size: ${buffer.length} bytes`);
    }
    // Handle objects with various buffer properties
    else if (imageInput && typeof imageInput === 'object') {
        logger.info(`Processing object input, keys: ${Object.keys(imageInput)}`);

        // Case 1: Express multer file object
        if (imageInput.buffer && Buffer.isBuffer(imageInput.buffer)) {
            buffer = imageInput.buffer;
            logger.info(`Extracted buffer from multer file object, size: ${buffer.length} bytes`);
        }
        // Case 2: File object with data property
        else if (imageInput.data && Buffer.isBuffer(imageInput.data)) {
            buffer = imageInput.data;
            logger.info(`Extracted buffer from data property, size: ${buffer.length} bytes`);
        }
        // Case 3: File object with _buf property (some file upload libraries)
        else if (imageInput._buf && Buffer.isBuffer(imageInput._buf)) {
            buffer = imageInput._buf;
            logger.info(`Extracted buffer from _buf property, size: ${buffer.length} bytes`);
        }
        // Case 4: ArrayBuffer (from browser file uploads)
        else if (imageInput instanceof ArrayBuffer) {
            buffer = Buffer.from(imageInput);
            logger.info(`Converted ArrayBuffer to buffer, size: ${buffer.length} bytes`);
        }
        // Case 5: Uint8Array (common in browser environments)
        else if (imageInput instanceof Uint8Array) {
            buffer = Buffer.from(imageInput);
            logger.info(`Converted Uint8Array to buffer, size: ${buffer.length} bytes`);
        }
        // Case 6: Object with arrayBuffer property
        else if (imageInput.arrayBuffer && typeof imageInput.arrayBuffer === 'function') {
            try {
                const arrayBuffer = await imageInput.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
                logger.info(`Converted from arrayBuffer() method, size: ${buffer.length} bytes`);
            } catch (error) {
                logger.error('Failed to get arrayBuffer:', error.message);
            }
        }
        // Case 7: Blob-like object
        else if (imageInput.stream && typeof imageInput.stream === 'function') {
            try {
                const stream = imageInput.stream();
                const chunks = [];
                const reader = stream.getReader();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }

                buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
                logger.info(`Read from stream, size: ${buffer.length} bytes`);
            } catch (error) {
                logger.error('Failed to read from stream:', error.message);
            }
        }
        // Case 8: Node.js ReadableStream
        else if (imageInput.readable && typeof imageInput.read === 'function') {
            logger.info('Processing Node.js readable stream');
            const chunks = [];

            return new Promise((resolve, reject) => {
                imageInput.on('data', chunk => {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                });

                imageInput.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    logger.info(`Stream processed, total size: ${buffer.length} bytes`);
                    resolve(buffer);
                });

                imageInput.on('error', error => {
                    logger.error('Stream error:', error.message);
                    reject(error);
                });

                // Start reading if the stream is paused
                if (imageInput.readable && !imageInput.readableFlowing) {
                    imageInput.resume();
                }
            });
        }
        // Case 9: FormData or similar objects with file content
        else if (imageInput.file && Buffer.isBuffer(imageInput.file)) {
            buffer = imageInput.file;
            logger.info(`Extracted buffer from file property, size: ${buffer.length} bytes`);
        }
        // Case 10: Objects with base64 encoded data
        else if (imageInput.base64 && typeof imageInput.base64 === 'string') {
            try {
                buffer = Buffer.from(imageInput.base64, 'base64');
                logger.info(`Decoded base64 data, size: ${buffer.length} bytes`);
            } catch (error) {
                logger.error('Failed to decode base64:', error.message);
            }
        }
        // Case 11: Objects with raw data property as string or array
        else if (imageInput.raw) {
            if (typeof imageInput.raw === 'string') {
                buffer = Buffer.from(imageInput.raw, 'binary');
                logger.info(`Converted raw string data, size: ${buffer.length} bytes`);
            } else if (Array.isArray(imageInput.raw)) {
                buffer = Buffer.from(imageInput.raw);
                logger.info(`Converted raw array data, size: ${buffer.length} bytes`);
            }
        }
        // Case 12: Try to convert the object directly if it looks like binary data
        else if (imageInput.length !== undefined && typeof imageInput[0] === 'number') {
            try {
                buffer = Buffer.from(imageInput);
                logger.info(`Converted array-like object to buffer, size: ${buffer.length} bytes`);
            } catch (error) {
                logger.error('Failed to convert array-like object:', error.message);
            }
        }
        // Case 13: Objects with content property
        else if (imageInput.content && Buffer.isBuffer(imageInput.content)) {
            buffer = imageInput.content;
            logger.info(`Extracted buffer from content property, size: ${buffer.length} bytes`);
        }
        // Case 14: Try to find any Buffer-like property in the object
        else {
            logger.info('Searching object properties for buffer data...');
            for (const [key, value] of Object.entries(imageInput)) {
                if (Buffer.isBuffer(value)) {
                    buffer = value;
                    logger.info(`Found buffer in property '${key}', size: ${buffer.length} bytes`);
                    break;
                } else if (value instanceof Uint8Array) {
                    buffer = Buffer.from(value);
                    logger.info(`Found Uint8Array in property '${key}', converted to buffer, size: ${buffer.length} bytes`);
                    break;
                } else if (value instanceof ArrayBuffer) {
                    buffer = Buffer.from(value);
                    logger.info(`Found ArrayBuffer in property '${key}', converted to buffer, size: ${buffer.length} bytes`);
                    break;
                }
            }
        }

        // If we still don't have a buffer, log the object structure for debugging
        if (!buffer) {
            logger.error('Failed to extract buffer from object. Object structure:', {
                type: typeof imageInput,
                constructor: imageInput.constructor?.name,
                keys: Object.keys(imageInput),
                hasBuffer: 'buffer' in imageInput,
                hasData: 'data' in imageInput,
                hasFile: 'file' in imageInput,
                hasContent: 'content' in imageInput,
                isArrayBuffer: imageInput instanceof ArrayBuffer,
                isUint8Array: imageInput instanceof Uint8Array,
            });
        }
    }
    // Handle ArrayBuffer directly
    else if (imageInput instanceof ArrayBuffer) {
        buffer = Buffer.from(imageInput);
        logger.info(`Converted ArrayBuffer to buffer, size: ${buffer.length} bytes`);
    }
    // Handle Uint8Array directly
    else if (imageInput instanceof Uint8Array) {
        buffer = Buffer.from(imageInput);
        logger.info(`Converted Uint8Array to buffer, size: ${buffer.length} bytes`);
    }
    // Handle array of numbers (byte array)
    else if (Array.isArray(imageInput) && imageInput.length > 0 && typeof imageInput[0] === 'number') {
        try {
            buffer = Buffer.from(imageInput);
            logger.info(`Converted number array to buffer, size: ${buffer.length} bytes`);
        } catch (error) {
            logger.error('Failed to convert number array to buffer:', error.message);
        }
    }
    // If all else fails, try to stringify and log the input for debugging
    else {
        logger.error(`Unsupported image input type: ${typeof imageInput}`, {
            constructor: imageInput?.constructor?.name,
            isArray: Array.isArray(imageInput),
            isArrayBuffer: imageInput instanceof ArrayBuffer,
            isUint8Array: imageInput instanceof Uint8Array,
            keys: typeof imageInput === 'object' ? Object.keys(imageInput || {}) : 'N/A'
        });
        throw new Error(`Unsupported image input type: ${typeof imageInput}`);
    }

    // Validate the buffer
    if (!buffer || buffer.length === 0) {
        throw new Error('Image buffer is empty or invalid');
    }

    // Additional validation: check if it looks like image data
    const firstBytes = buffer.slice(0, 10);
    logger.info(`Buffer validation - Size: ${buffer.length} bytes, First 10 bytes: ${firstBytes.toString('hex')}`);

    // Check for common image file signatures
    const imageSignatures = {
        'ffd8ff': 'JPEG',
        '89504e': 'PNG',
        '474946': 'GIF',
        '424d': 'BMP',
        '52494646': 'WEBP' // RIFF header for WebP
    };

    const hexStart = buffer.slice(0, 4).toString('hex');
    const imageType = Object.entries(imageSignatures).find(([sig]) => hexStart.startsWith(sig));

    if (imageType) {
        logger.info(`Detected image type: ${imageType[1]}`);
    } else {
        logger.warn(`Could not detect image type from buffer. Hex start: ${hexStart}`);
        // Don't throw error here as some valid images might not have standard headers
    }

    return buffer;
};

// Main binary prediction function with improved buffer handling
const makeBinaryPrediction = async (imageInput, modelType = 'combined') => {
    let tempFilePath = null;
    let createdTempFile = false;

    try {
        logger.info(`Making binary prediction using Python server for ${modelType}...`);
        logger.info(`Input type: ${typeof imageInput}, isBuffer: ${Buffer.isBuffer(imageInput)}`);

        // Check if server is healthy
        const isServerHealthy = await checkServerHealth();
        if (!isServerHealthy) {
            throw new Error('Python server is not responding. Please ensure the server is running on https://chestguard-1.onrender.com');
        }

        // Handle Cloudinary URLs separately
        if (typeof imageInput === 'string' &&
            (imageInput.includes('cloudinary.com') || imageInput.includes('res.cloudinary.com'))) {
            logger.info('Detected Cloudinary URL, using direct URL prediction');
            return await predictFromCloudinaryUrl(imageInput);
        }

        // Handle local file path
        if (typeof imageInput === 'string' && fs.existsSync(imageInput)) {
            tempFilePath = imageInput;
            logger.info(`Using provided file path: ${tempFilePath}`);
        } else {
            // Process the input to get a buffer
            const imageBuffer = await processImageInput(imageInput);

            if (!imageBuffer || imageBuffer.length === 0) {
                throw new Error('Failed to process image input - buffer is empty');
            }

            logger.info(`Processed input to buffer, size: ${imageBuffer.length} bytes`);

            // Save buffer to temp file
            tempFilePath = await saveBufferToTempFile(imageBuffer);
            createdTempFile = true;
        }

        // Final validation of temp file
        if (!fs.existsSync(tempFilePath)) {
            throw new Error(`Temporary file was not created successfully: ${tempFilePath}`);
        }

        const fileStats = fs.statSync(tempFilePath);
        logger.info(`Temp file ready: ${tempFilePath}, size: ${fileStats.size} bytes`);

        if (fileStats.size === 0) {
            throw new Error(`Temporary file is empty: ${tempFilePath}`);
        }

        // Make prediction using Python server
        const serverResponse = await makePythonServerPrediction(tempFilePath);

        logger.info('Python server response:', serverResponse);

        // Convert to standard format
        const standardResponse = convertServerResponseToStandardFormat(serverResponse, modelType);

        logger.info(`Binary prediction completed successfully`, {
            predictedClass: standardResponse.predictedClass,
            confidence: `${(standardResponse.confidence * 100).toFixed(1)}%`,
            final_diagnosis: serverResponse.final_diagnosis
        });

        return standardResponse;

    } catch (error) {
        logger.error(`Binary prediction failed for ${modelType}:`, error.message);

        // Provide more specific error messages
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Cannot connect to Python server. Please ensure the server is running on https://chestguard-1.onrender.com');
        } else if (error.code === 'ENOTFOUND') {
            throw new Error('Python server not found. Check server address and port.');
        } else if (error.response) {
            throw new Error(`Server error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
        }

        throw new Error(`Binary prediction failed: ${error.message}`);
    } finally {
        // Clean up temporary file if we created one
        if (tempFilePath && createdTempFile) {
            cleanupTempFile(tempFilePath);
        }
    }
};

// Combined binary prediction (uses the same endpoint as individual predictions)
const makeCombinedBinaryPrediction = async (imageInput) => {
    return await makeBinaryPrediction(imageInput, 'combined_binary');
};

// Export all functions for use in your application
export {
    makeBinaryPrediction,
    makeCombinedBinaryPrediction,
    predictFromCloudinaryUrl,
    downloadImageFromUrl,
    downloadImageToBuffer,
    saveBufferToTempFile,
    checkServerHealth,
    processImageInput,
    BINARY_CLASS_NAMES,
    CONFIDENCE_THRESHOLD,
    PYTHON_SERVER_CONFIG
};