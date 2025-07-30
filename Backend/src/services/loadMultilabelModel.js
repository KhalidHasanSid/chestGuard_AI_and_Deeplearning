import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants for multilabel model
const MULTILABEL_CLASS_NAMES = ['Normal', 'Pneumonia', 'Tuberculosis'];
const MULTILABEL_INPUT_SIZE = [150, 150];
const CONFIDENCE_THRESHOLD = 0.5;
const MAX_RETRIES = 3;

// Global model state
let multilabelModel = null;
let modelLoading = false;
let modelLoadPromise = null;

// Enhanced logging utility
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

// Load multilabel model
const loadMultilabelModel = async (retryCount = 0) => {
    // Return existing model if already loaded
    if (multilabelModel) return multilabelModel;

    // Check if model is currently loading
    if (modelLoading && modelLoadPromise) {
        return await modelLoadPromise;
    }

    modelLoadPromise = (async () => {
        try {
            modelLoading = true;
            logger.info('Loading multilabel model...', { attempt: retryCount + 1 });

            const modelPath = path.join(__dirname, '../trained_model/multilabel/model.json');

            if (!fs.existsSync(modelPath)) {
                throw new Error(`Model file not found at: ${modelPath}`);
            }

            const loadPromise = tf.loadLayersModel(`file://${modelPath}`);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Model loading timeout')), 30000)
            );

            const loadedModel = await Promise.race([loadPromise, timeoutPromise]);

            // Store the loaded model
            multilabelModel = loadedModel;

            logger.info('Multilabel model loaded successfully', {
                inputShape: loadedModel.inputs[0].shape,
                outputShape: loadedModel.outputs[0].shape
            });

            return loadedModel;
        } catch (error) {
            logger.error('Multilabel model loading failed', error);

            if (retryCount < MAX_RETRIES) {
                logger.info(`Retrying multilabel model load (${retryCount + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
                return loadMultilabelModel(retryCount + 1);
            }

            throw new Error(`Multilabel model loading failed after ${MAX_RETRIES} attempts: ${error.message}`);
        } finally {
            modelLoading = false;
            modelLoadPromise = null;
        }
    })();

    return await modelLoadPromise;
};

// Multilabel prediction function
const makeMultilabelPrediction = async (imageTensor) => {
    try {
        if (!multilabelModel) {
            await loadMultilabelModel();
        }

        logger.info('Making multilabel prediction', { inputShape: imageTensor.shape });

        const prediction = multilabelModel.predict(imageTensor);
        const predictionData = await prediction.data();

        logger.info('Raw multilabel prediction values:', Array.from(predictionData));

        const results = Array.from(predictionData).map((prob, idx) => ({
            className: MULTILABEL_CLASS_NAMES[idx],
            probability: prob,
            confidence: prob > CONFIDENCE_THRESHOLD ? 'high' : prob > 0.3 ? 'medium' : 'low'
        }));

        results.sort((a, b) => b.probability - a.probability);

        const predictedClass = results[0].className;
        const confidence = results[0].probability;

        const predictionQuality = {
            isConfident: confidence > CONFIDENCE_THRESHOLD,
            uncertaintyScore: 1 - confidence,
            classDistribution: results.map(r => ({
                class: r.className,
                probability: Math.round(r.probability * 1000) / 10
            }))
        };

        prediction.dispose();

        return {
            predictedClass,
            results,
            confidence,
            predictionQuality,
            modelType: 'multilabel'
        };
    } catch (error) {
        logger.error('Multilabel prediction failed', error);
        throw new Error(`Multilabel prediction failed: ${error.message}`);
    }
};

// Get model status
const getMultilabelModelStatus = () => {
    return {
        loaded: Boolean(multilabelModel),
        loading: modelLoading,
        inputSize: MULTILABEL_INPUT_SIZE,
        classes: MULTILABEL_CLASS_NAMES,
        confidenceThreshold: CONFIDENCE_THRESHOLD
    };
};

// Dispose model
const disposeMultilabelModel = () => {
    if (multilabelModel) {
        multilabelModel.dispose();
        multilabelModel = null;
        logger.info("Multilabel model disposed successfully");
    }
};

// Get model instance (for advanced usage)
const getMultilabelModelInstance = () => multilabelModel;

export {
    loadMultilabelModel,
    makeMultilabelPrediction,
    getMultilabelModelStatus,
    disposeMultilabelModel,
    getMultilabelModelInstance,
    MULTILABEL_CLASS_NAMES,
    MULTILABEL_INPUT_SIZE,
    CONFIDENCE_THRESHOLD
};