import mongoose from "mongoose";

const detectionSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    
    detection: [{
        xray: {
            type: String,
            required: true
        },
        model_used: {
            type: String,
            enum: ['multilabel', 'binary'],
            default: 'multilabel'
        },
        date: {
            type: Date,
            default: Date.now
        },
        symptomPrediction:[
         {Prediction:{ type:String,},
            
      pneumoniaConfidenceSymptom:{type:Number},
     tubercluosisConfidenceSymptom:{type:Number}}]

        ,
        result: {
            type: String,
            required: true,
            enum: ['normal', 'pneumonia', 'tuberculosis', 'both']
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1
        },
        allProbabilities: [{
            className: String,
            probability: Number
        }],
       

        // **NEW: Detailed findings from Gemini analysis**
       /* detailed_findings: {
            locations_affected: {
                upper_right_lobe: {
                    type: String,
                    enum: ['normal', 'affected', 'consolidation', 'infiltrate', 'cavitation', 'fibrosis', 'unknown']
                },
                middle_right_lobe: {
                    type: String,
                    enum: ['normal', 'affected', 'consolidation', 'infiltrate', 'cavitation', 'fibrosis', 'unknown']
                },
                lower_right_lobe: {
                    type: String,
                    enum: ['normal', 'affected', 'consolidation', 'infiltrate', 'cavitation', 'fibrosis', 'unknown']
                },
                upper_left_lobe: {
                    type: String,
                    enum: ['normal', 'affected', 'consolidation', 'infiltrate', 'cavitation', 'fibrosis', 'unknown']
                },
                lower_left_lobe: {
                    type: String,
                    enum: ['normal', 'affected', 'consolidation', 'infiltrate', 'cavitation', 'fibrosis', 'unknown']
                },
                bilateral: {
                    type: String,
                    enum: ['yes', 'no', 'unknown']
                },
                apical_involvement: {
                    type: String,
                    enum: ['yes', 'no', 'unknown']
                },
                cavitation_present: {
                    type: String,
                    enum: ['yes', 'no', 'unknown']
                },
                note: String // For additional location notes
            },
            severity: {
                type: String,
                enum: ['minimal', 'mild', 'moderate', 'severe', 'advanced', 'unknown']
            },
            primary_findings: [String], // Array of main pathological findings
            secondary_findings: [String], // Array of additional observations
            pattern: {
                type: String,
                enum: ['lobar', 'bronchopneumonia', 'interstitial', 'mixed', 'primary', 'post-primary', 'miliary', 'cavitary', 'unknown']
            },
            gemini_confidence: {
                type: String,
                enum: ['high', 'medium', 'low']
            },
            analysis_timestamp: {
                type: Date,
                default: Date.now
            },
            gemini_success: {
                type: Boolean,
                default: false
            }
        },

        // **NEW: Store full Gemini analysis for detailed reports**
        full_gemini_analysis: {
            type: mongoose.Schema.Types.Mixed // Flexible schema for complete Gemini response
        },

        // For error tracking
        error: String,

        // Recommendations from Gemini
        recommendations: [String]*/
    }
        ]
}, {
    timestamps: true
});

// Add index for efficient querying
detectionSchema.index({ patient: 1 });
detectionSchema.index({ 'detection.date': -1 });
detectionSchema.index({ 'detection.result': 1 });

const Detection = mongoose.model('Detection', detectionSchema);

export default Detection;