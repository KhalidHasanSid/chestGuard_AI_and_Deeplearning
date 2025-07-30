import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv'
dotenv.config()

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting state
let lastApiCall = 0;
const MIN_API_INTERVAL = 60000; // 1 minute between calls for free tier
let dailyCallCount = 0;
const MAX_DAILY_CALLS = 50; // Conservative limit for free tier

/**
 * Check if we can make an API call based on rate limits
 */
const canMakeApiCall = () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    // Reset daily count at midnight (simple implementation)
    const today = new Date().toDateString();
    const lastCallDate = new Date(lastApiCall).toDateString();
    if (today !== lastCallDate) {
        dailyCallCount = 0;
    }
    
    if (dailyCallCount >= MAX_DAILY_CALLS) {
        console.log('Daily API limit reached, skipping Gemini analysis');
        return false;
    }
    
    if (timeSinceLastCall < MIN_API_INTERVAL) {
        console.log(`Rate limit: Need to wait ${MIN_API_INTERVAL - timeSinceLastCall}ms`);
        return false;
    }
    
    return true;
};

/**
 * Analyze X-ray image using Gemini Vision API with rate limiting and shorter prompts
 */
const analyzeXrayWithGemini = async (imagePath, imageUrl, aiPrediction) => {
    try {
        // Check rate limits first
        if (!canMakeApiCall()) {
            console.log('Skipping Gemini analysis due to rate limits');
            return {
                success: false,
                rateLimited: true,
                analysis: createFallbackAnalysis(aiPrediction),
                timestamp: new Date(),
                model_used: "rate_limited"
            };
        }

        console.log('Starting Gemini analysis...');
        
        // Use faster model for free tier
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash" // Faster, cheaper model
        });

        // Prepare image data
        let imageData;
        
        try {
            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                imageData = {
                    inlineData: {
                        data: imageBuffer.toString('base64'),
                        mimeType: 'image/jpeg'
                    }
                };
                console.log('Using local image');
            } else {
                throw new Error('Local file not found');
            }
        } catch (localError) {
            console.log('Using URL fallback');
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            
            imageData = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: 'image/jpeg'
                }
            };
        }

        // Shorter prompt to save tokens
        const prompt = createShortPrompt(aiPrediction);

        // Update rate limiting state
        lastApiCall = Date.now();
        dailyCallCount++;

        console.log(`Making Gemini API call (${dailyCallCount}/${MAX_DAILY_CALLS} today)`);
        const result = await model.generateContent([prompt, imageData]);
        const response = await result.response;
        const analysisText = response.text();

        console.log('Gemini response received',analysisText);

        // Parse response
        let parsedAnalysis;
        try {
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedAnalysis = JSON.parse(jsonMatch[0]);
            } else {
                parsedAnalysis = parseTextResponse(analysisText, aiPrediction);
            }
        } catch (parseError) {
            console.log('Using text parsing fallback');
            parsedAnalysis = parseTextResponse(analysisText, aiPrediction);
        }

        return {
            success: true,
            analysis: parsedAnalysis,
            timestamp: new Date(),
            model_used: "gemini-1.5-flash"
        };

    } catch (error) {
        console.error('Gemini analysis failed:', error.message);
        
        // Handle rate limit errors specifically
        if (error.status === 429) {
            console.log('Rate limited by API, using fallback');
            return {
                success: false,
                rateLimited: true,
                analysis: createFallbackAnalysis(aiPrediction),
                timestamp: new Date(),
                model_used: "rate_limited"
            };
        }
        
        return {
            success: false,
            error: error.message,
            analysis: createFallbackAnalysis(aiPrediction),
            timestamp: new Date(),
            model_used: "fallback"
        };
    }
};

/**
 * Create shorter prompts to save tokens
 */
const createShortPrompt = (aiPrediction) => {
    const condition = aiPrediction.toLowerCase();
    
    if (condition === 'pneumonia') {
        return `Analyze this chest X-ray for pneumonia. Respond in JSON:
{
  "condition": "pneumonia",
  "findings": {
    "primary_findings": ["main findings"],
    "location": {"bilateral": "yes/no"},
    "severity": "mild/moderate/severe"
  },
  "confidence": "high/medium/low"
}`;
    } else if (condition === 'tuberculosis') {
        return `Analyze this chest X-ray for tuberculosis. Respond in JSON:
{
  "condition": "tuberculosis", 
  "findings": {
    "primary_findings": ["main findings"],
    "location": {"bilateral": "yes/no", "cavitation_present": "yes/no"},
    "severity": "minimal/moderate/advanced"
  },
  "confidence": "high/medium/low"
}`;
    } else {
        return `Analyze this normal chest X-ray. Respond in JSON:
{
  "condition": "normal",
  "findings": {
    "primary_findings": ["normal findings"],
    "lung_fields": "clear bilateral lung fields"
  },
  "confidence": "high/medium/low"
}`;
    }
};

/**
 * Parse text response when JSON parsing fails
 */
const parseTextResponse = (text, aiPrediction) => {
    const condition = aiPrediction.toLowerCase();
    
    return {
        condition: condition,
        findings: {
            primary_findings: [text.substring(0, 100) + '...'],
            location: condition !== 'normal' ? { bilateral: "unknown" } : {},
            severity: condition !== 'normal' ? "unknown" : undefined,
            additional_notes: "Parsed from text response"
        },
        confidence: "medium",
        recommendations: ["Manual review recommended"],
        raw_response: text
    };
};

/**
 * Create fallback analysis when Gemini is unavailable
 */
const createFallbackAnalysis = (aiPrediction) => {
    const condition = aiPrediction.toLowerCase();
    
    return {
        condition: condition,
        findings: {
            primary_findings: [`AI prediction: ${aiPrediction}`],
            location: condition !== 'normal' ? {
                bilateral: "unknown",
                note: "Gemini analysis unavailable"
            } : {},
            severity: condition !== 'normal' ? "unknown" : undefined,
            additional_notes: "Gemini analysis skipped due to rate limits"
        },
        confidence: "low",
        recommendations: ["Manual radiologist review recommended"]
    };
};

/**
 * Simplified function to get key findings for database storage
 */
const extractKeyFindings = (geminiResult) => {
    const analysis = geminiResult.analysis;
    
    return {
        condition: analysis.condition,
        locations_affected: analysis.findings.location || {},
        severity: analysis.findings.severity || 'unknown',
        primary_findings: analysis.findings.primary_findings || [],
        confidence: analysis.confidence || 'low',
        gemini_analysis_success: geminiResult.success,
        rate_limited: geminiResult.rateLimited || false,
        timestamp: geminiResult.timestamp
    };
};

/**
 * Check API quota status
 */
const getApiStatus = () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    const timeUntilNextCall = Math.max(0, MIN_API_INTERVAL - timeSinceLastCall);
    
    return {
        canMakeCall: canMakeApiCall(),
        dailyCalls: dailyCallCount,
        maxDailyCalls: MAX_DAILY_CALLS,
        timeUntilNextCall: Math.ceil(timeUntilNextCall / 1000), // in seconds
        lastCallTime: new Date(lastApiCall).toISOString()
    };
};

export { 
    analyzeXrayWithGemini, 
    extractKeyFindings,
    getApiStatus
};