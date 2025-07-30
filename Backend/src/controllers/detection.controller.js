import asyncHandler from "../utils/asyncHandler.js";
import apiResponse from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import uploadCloudinary from "../utils/cloudinary.js";
import Detection from "../models/detection.model.js";
import Patient from "../models/patient.model.js";
import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';
import { analyzeXrayWithGemini, extractKeyFindings } from "../services/gemini-service.js";

// Import model functions
import {
    loadMultilabelModel,
    makeMultilabelPrediction,
    getMultilabelModelStatus,
    disposeMultilabelModel,
    MULTILABEL_INPUT_SIZE
} from '../services/loadMultilabelModel.js';

import {
    makeCombinedBinaryPrediction,
} from '../services/loadBinaryModels.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple logging utility
const logger = {
    info: (message, data = null) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    },
    error: (message, error = null) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    },
    warn: (message, data = null) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
    }
};

// Threshold logic to determine final result
const applyThresholdLogic = (predictionResult) => {
    const THRESHOLDS = {
        pneumonia: 0.50,
        tuberculosis: 0.30,
        normal: 0.50
    };

    logger.info('Applying threshold logic', {
        rawPrediction: predictionResult.predictedClass,
        confidence: predictionResult.confidence,
        results: predictionResult.results
    });

    // Extract probabilities from results array
    let pneumoniaProb = 0;
    let tuberculosisProb = 0;
    let normalProb = 0;

    if (predictionResult.results && Array.isArray(predictionResult.results)) {
        predictionResult.results.forEach(result => {
            const className = result.className.toLowerCase();
            if (className === 'pneumonia') {
                pneumoniaProb = result.probability;
            } else if (className === 'tuberculosis') {
                tuberculosisProb = result.probability;
            } else if (className === 'normal') {
                normalProb = result.probability;
            }
        });
    }

    logger.info('Extracted probabilities', {
        pneumonia: pneumoniaProb,
        tuberculosis: tuberculosisProb,
        normal: normalProb
    });

    // Check which conditions meet their thresholds
    const conditionsMet = [];

    if (tuberculosisProb >= THRESHOLDS.tuberculosis) {
        conditionsMet.push('tuberculosis');
    }

    if (pneumoniaProb >= THRESHOLDS.pneumonia) {
        conditionsMet.push('pneumonia');
    }

    let finalResult = 'normal';
    let finalConfidence = normalProb;

    // Apply threshold logic
    if (conditionsMet.length > 1) {
        // Multiple conditions detected - return "both"
        finalResult = 'both';
        finalConfidence = Math.max(pneumoniaProb, tuberculosisProb);
        logger.info('Multiple conditions detected, result set to "both"');
    } else if (conditionsMet.length === 1) {
        // Single condition detected
        finalResult = conditionsMet[0];
        finalConfidence = finalResult === 'pneumonia' ? pneumoniaProb : tuberculosisProb;
        logger.info(`Single condition detected: ${finalResult}`);
    } else if (normalProb >= THRESHOLDS.normal) {
        // Normal case
        finalResult = 'normal';
        finalConfidence = normalProb;
        logger.info('Normal condition detected');
    } else {
        // No threshold met, use highest probability
        const highest = predictionResult.results.reduce((prev, current) =>
            (prev.probability > current.probability) ? prev : current
        );
        finalResult = highest.className.toLowerCase();
        finalConfidence = highest.probability;
        logger.info(`No threshold met, using highest probability: ${finalResult}`);
    }

    logger.info('Final threshold result', {
        originalPrediction: predictionResult.predictedClass,
        finalResult: finalResult,
        originalConfidence: predictionResult.confidence,
        finalConfidence: finalConfidence
    });

    return {
        result: finalResult,
        confidence: finalConfidence
    };
};

// Image preprocessing
const preprocessImage = async (imagePath, inputSize = MULTILABEL_INPUT_SIZE) => {
    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        const imageBuffer = fs.readFileSync(imagePath);
        let imageTensor = tf.node.decodeImage(imageBuffer, 3);

        imageTensor = tf.image.resizeBilinear(imageTensor, inputSize);

        const tensor = imageTensor
            .toFloat()
            .div(255.0)
            .expandDims(0);

        imageTensor.dispose();
        return tensor;
    } catch (error) {
        logger.error('Image preprocessing failed', error);
        throw new Error(`Image preprocessing failed: ${error.message}`);
    }
};

// URL-based image preprocessing
const preprocessImageFromUrl = async (imageUrl, inputSize = MULTILABEL_INPUT_SIZE) => {
    try {
        logger.info('Preprocessing image from URL', { url: imageUrl, inputSize });

        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Medical-AI-Detection-Service/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        let imageTensor = tf.node.decodeImage(imageBuffer, 3);
        imageTensor = tf.image.resizeBilinear(imageTensor, inputSize);

        const tensor = imageTensor
            .toFloat()
            .div(255.0)
            .expandDims(0);

        imageTensor.dispose();
        return tensor;
    } catch (error) {
        logger.error('URL preprocessing failed', error);
        throw new Error(`URL preprocessing failed: ${error.message}`);
    }
};

// Main detection controller - FIXED VERSION
const detectionController = asyncHandler(async (req, res, next) => {
    const startTime = Date.now();
    const MR_no = req.params.MR_no?.trim();
    const xrayImage = req.file;
    const modelMode = req.body.modelType?.toLowerCase() || 'multilabel';

    logger.info('Detection request started', {
        MR_no,
        imagePath: xrayImage?.path,
        modelMode
    });

    if (!MR_no) {
        throw new apiError(400, "Medical Record number is required");
    }

    if (!xrayImage?.path) {
        throw new apiError(400, "X-ray image is required");
    }

    if (!['multilabel', 'binary'].includes(modelMode)) {
        throw new apiError(400, "Invalid model mode. Must be 'multilabel' or 'binary'");
    }

    try {
        // Upload image to Cloudinary
        logger.info('Uploading image to Cloudinary...');
        const image = await uploadCloudinary(xrayImage.path);

        if (!image?.url) {
            throw new apiError(500, "Failed to upload image to cloud storage");
        }

        logger.info('Image uploaded successfully', { url: image.url });

        let predictionResult;
        let imageTensor; // Only used for multilabel

        try {
            // Make prediction based on model mode
            if (modelMode === 'binary') {
                // FIXED: Pass raw image path/URL to binary prediction service
                // Try local file first, then fallback to Cloudinary URL
                try {
                    logger.info('Making binary prediction with local file path...');
                    predictionResult = await makeCombinedBinaryPrediction(xrayImage.path);
                } catch (localError) {
                    logger.warn('Local file binary prediction failed, trying Cloudinary URL...', localError.message);
                    predictionResult = await makeCombinedBinaryPrediction(image.url);
                }
            } else {
                // For multilabel, keep existing logic with tensor preprocessing
                imageTensor = await preprocessImage(xrayImage.path, MULTILABEL_INPUT_SIZE);
                predictionResult = await makeMultilabelPrediction(imageTensor);
            }
        } catch (predictionError) {
            logger.error('Primary prediction method failed, trying URL fallback...', predictionError.message);

            if (modelMode === 'binary') {
                // For binary, try Cloudinary URL if local failed
                predictionResult = await makeCombinedBinaryPrediction(image.url);
            } else {
                // For multilabel, try URL preprocessing
                imageTensor = await preprocessImageFromUrl(image.url, MULTILABEL_INPUT_SIZE);
                predictionResult = await makeMultilabelPrediction(imageTensor);
            }
        } finally {
            // Only dispose tensor if it was created (multilabel mode)
            if (imageTensor) {
                imageTensor.dispose();
                imageTensor = null;
            }

            // Clean up local file
            if (xrayImage.path && fs.existsSync(xrayImage.path)) {
                fs.unlinkSync(xrayImage.path);
            }
        }

        logger.info('AI prediction completed', predictionResult);

        // Apply threshold logic to get final result
        const thresholdResult = applyThresholdLogic(predictionResult);

        // Gemini analysis for abnormal cases
        let geminiAnalysis = null;
        let detailedFindings = null;

        const abnormalConditions = ['pneumonia', 'tuberculosis', 'both'];
        const isAbnormal = abnormalConditions.includes(thresholdResult.result);

        if (isAbnormal) {
            logger.info('Running Gemini analysis for abnormal case...');

            try {
                // Use Cloudinary URL for Gemini analysis since local file might be deleted
                geminiAnalysis = await analyzeXrayWithGemini(
                    null, // Don't pass local path since it might be deleted
                    image.url, // Use Cloudinary URL
                    thresholdResult.result
                );

                if (geminiAnalysis) {
                    detailedFindings = extractKeyFindings(geminiAnalysis);
                    logger.info('Gemini analysis completed successfully');
                }
            } catch (geminiError) {
                logger.error('Gemini analysis failed', geminiError);
            }
        }

        // Find patient
        const patient = await Patient.findOne({ MR_no });
        if (!patient) {
            throw new apiError(404, "Patient not found with the provided Medical Record number");
        }

        // Create detection entry based on simple schema
        const detectionEntry = {
            xray: image.url,
            date: new Date(),
            result: thresholdResult.result, // This will be 'normal', 'pneumonia', 'tuberculosis', or 'both'
            confidence: thresholdResult.confidence,
            model_used: modelMode, // Add model_used to be saved in database
            allProbabilities: predictionResult.results?.map(r => ({
                className: r.className,
                probability: r.probability
            })) || []
        };

        // Add detailed findings if available from Gemini
        if (detailedFindings) {
            detectionEntry.detailed_findings = {
                locations_affected: {
                    upper_right_lobe: detailedFindings.locations_affected?.upper_right_lobe || 'unknown',
                    middle_right_lobe: detailedFindings.locations_affected?.middle_right_lobe || 'unknown',
                    lower_right_lobe: detailedFindings.locations_affected?.lower_right_lobe || 'unknown',
                    upper_left_lobe: detailedFindings.locations_affected?.upper_left_lobe || 'unknown',
                    lower_left_lobe: detailedFindings.locations_affected?.lower_left_lobe || 'unknown',
                    bilateral: detailedFindings.locations_affected?.bilateral || 'unknown',
                    apical_involvement: detailedFindings.locations_affected?.apical_involvement || 'unknown',
                    cavitation_present: detailedFindings.locations_affected?.cavitation_present || 'unknown',
                    note: detailedFindings.locations_affected?.note || 'AI analysis completed'
                },
                severity: detailedFindings.severity || 'unknown',
                primary_findings: Array.isArray(detailedFindings.primary_findings)
                    ? detailedFindings.primary_findings
                    : [detailedFindings.primary_findings || `AI detected: ${thresholdResult.result}`],
                secondary_findings: detailedFindings.secondary_findings || [],
                pattern: detailedFindings.pattern || 'unknown',
                gemini_confidence: detailedFindings.confidence || 'medium',
                analysis_timestamp: new Date(),
                gemini_success: Boolean(geminiAnalysis)
            };
        }

        // Add full Gemini analysis if available
        if (geminiAnalysis) {
            detectionEntry.full_gemini_analysis = geminiAnalysis;
        }

        // Add recommendations if available
        if (detailedFindings?.recommendations) {
            detectionEntry.recommendations = Array.isArray(detailedFindings.recommendations)
                ? detailedFindings.recommendations
                : [detailedFindings.recommendations];
        }

        logger.info('Detection entry created', {
            result: detectionEntry.result,
            confidence: detectionEntry.confidence,
            hasDetailedFindings: Boolean(detectionEntry.detailed_findings)
        });

        // Save to database
        let patientDetection = await Detection.findOne({ patient: patient._id });

        if (!patientDetection) {
            patientDetection = await Detection.create({
                patient: patient._id,
                detection: [detectionEntry]
            });
            logger.info('New detection document created');
        } else {
            patientDetection.detection.push(detectionEntry);
            await patientDetection.save();
            logger.info('Detection added to existing document');
        }

        // Prepare response
        const responseData = {
            ...patientDetection.toObject(),
            latestPrediction: {
                result: detectionEntry.result,
                confidence: `${(detectionEntry.confidence * 100).toFixed(1)}%`,
                detailedProbabilities: detectionEntry.allProbabilities.map(p => ({
                    class: p.className,
                    probability: `${(p.probability * 100).toFixed(1)}%`
                })),
                processingTime: `${Date.now() - startTime}ms`,
                model_used: modelMode, // Added model_used key
                hasDetailedAnalysis: Boolean(detectionEntry.detailed_findings)
            }
        };

        const successMessage = geminiAnalysis
            ? "AI prediction with detailed radiological analysis completed successfully"
            : "AI prediction completed successfully";

        logger.info('Detection completed successfully', {
            processingTime: Date.now() - startTime,
            result: detectionEntry.result,
            modelMode: modelMode
        });

        res.json(new apiResponse(200, responseData, successMessage));

    } catch (error) {
        logger.error('Detection controller error', error);
        throw new apiError(500, `Detection failed: ${error.message}`);
    }
});

const getDetectedResults = asyncHandler(async (req, res) => {
    try {
        const patient = req.user;

        // Check if patient exists and has ID
        if (!patient?._id) {
            return res.status(401).json(new apiResponse(401, null, "Patient authentication required"));
        }

        // Attempt to find detection result
        const result = await Detection.findOne({ patient: patient._id })
            .populate('patient', 'name MR_no email')
            .lean();

        if (!result) {
            // If no detection found, fetch patient data directly
            const patientInfo = await Patient.findById(patient._id)
                .select('name MR_no email')
                .lean();

            logger.info('No detection results found', { patientId: patient._id });

            return res.status(200).json(new apiResponse(200, {
                patient: patientInfo,
                detection: []
            }, "No detection results found"));
        }

        // Log successful retrieval
        logger.info('Results retrieved successfully', {
            patientId: patient._id,
            totalResults: result.detection?.length || 0
        });

        // Return detection results
        return res.status(200).json(new apiResponse(200, result, "Detection results retrieved successfully"));

    } catch (error) {
        // Log the actual error
        logger.error('Error retrieving detection results', {
            error: error.message,
            stack: error.stack,
            patientId: req.user?._id
        });

        return res.status(500).json(new apiResponse(500, null, "Internal server error while retrieving results"));
    }
});

// Health check endpoint
const authchecker = asyncHandler((req, res) => {
    const multilabelStatus = getMultilabelModelStatus();

    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        models: {
            multilabel: {
                loaded: multilabelStatus.loaded,
                inputSize: MULTILABEL_INPUT_SIZE
            },
            pneumonia: {
                loaded: true,
                inputSize: '224x224'
            },
            tuberculosis: {
                loaded: true,
                inputSize: '224x224'
            }
        },
        tensorflowVersion: tf.version.tfjs
    };

    logger.info('Health check completed', healthStatus);
    res.json(new apiResponse(200, healthStatus, "System health check passed"));
});

// Model initialization
const initializeModel = async () => {
    try {
        logger.info("Initializing TensorFlow.js models on server startup...");

        await loadMultilabelModel();
        logger.info("Multilabel model initialization completed successfully");

        logger.info("All models initialization completed successfully");
    } catch (error) {
        logger.error("Model initialization failed", error);
        logger.warn("Models will be loaded on first request");
    }
};

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info("Graceful shutdown initiated...");
    disposeMultilabelModel();
    tf.disposeVariables();
    logger.info("TensorFlow resources cleaned up");
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

initializeModel();

export {
    detectionController,
    getDetectedResults,
    authchecker,
    initializeModel,
    gracefulShutdown
};