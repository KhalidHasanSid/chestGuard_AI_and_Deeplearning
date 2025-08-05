import axios from "axios";
import React, { useState, useEffect } from "react";
import { BASE_URL } from "./api";
import { useLocation } from 'react-router-dom';



export default function Result(props) {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();
const MR_no = location.state?.MR_no;

  // Define thresholds
  const THRESHOLDS = {
    pneumonia: 0.50,
    tuberculosis: 0.30,
    normal: 0.50
  };

  useEffect(() => {
    const userToken = localStorage.getItem("Accesstoken");

    const fetchData = async () => {
      try {
        console.log("here in get++",props.MR_no)
        const response = await axios.get(
       ` ${BASE_URL}/api/v1/chestguardDetection/getDetectedResults/${MR_no}`,
          {
            
            withCredentials: true,
          }
        );
        console.log("Response data:", response.data);
        setPatientData(response.data.data);
      } catch (err) {
        setError("Failed to load data. Please try again.");
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to determine correct result based on probabilities and thresholds
  const getCorrectResult = (allProbabilities) => {
    if (!allProbabilities || allProbabilities.length === 0) return null;

    const pneumoniaProb = allProbabilities.find(p => p.className.toLowerCase() === 'pneumonia')?.probability || 0;
    const tuberculosisProb = allProbabilities.find(p => p.className.toLowerCase() === 'tuberculosis')?.probability || 0;
    const normalProb = allProbabilities.find(p => p.className.toLowerCase() === 'normal')?.probability || 0;

    // Check for "both" condition first (both diseases above their thresholds)
    const pneumoniaMeetsThreshold = pneumoniaProb >= THRESHOLDS.pneumonia;
    const tuberculosisMeetsThreshold = tuberculosisProb >= THRESHOLDS.tuberculosis;

    if (pneumoniaMeetsThreshold && tuberculosisMeetsThreshold) {
      return 'both';
    }

    // Then check individual conditions in order of severity
    if (tuberculosisMeetsThreshold) {
      return 'tuberculosis';
    }
    if (pneumoniaMeetsThreshold) {
      return 'pneumonia';
    }
    if (normalProb >= THRESHOLDS.normal) {
      return 'normal';
    }

    // If no threshold is met, return the highest probability
    const highest = allProbabilities.reduce((prev, current) =>
      (prev.probability > current.probability) ? prev : current
    );
    return highest.className.toLowerCase();
  };

  const getResultColor = (result) => {
    switch (result.toLowerCase()) {
      case 'normal':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pneumonia':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'tuberculosis':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'both':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getModelColor = (model) => {
    switch (model?.toLowerCase()) {
      case 'multilabel':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'binary':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatFindings = (findings) => {
    if (!findings || !Array.isArray(findings) || findings.length === 0) return null;
    return findings.filter(finding => finding && finding.trim() !== '');
  };

  const hasValidFindings = (detection) => {
    const primaryFindings = formatFindings(detection.detailed_findings?.primary_findings);
    const secondaryFindings = formatFindings(detection.detailed_findings?.secondary_findings);
    const severity = detection.detailed_findings?.severity;
    const bilateral = detection.detailed_findings?.locations_affected?.bilateral;
    const cavitation = detection.detailed_findings?.locations_affected?.cavitation_present;

    return primaryFindings || secondaryFindings ||
      (severity && severity !== 'unknown') ||
      (bilateral && bilateral !== 'unknown') ||
      (cavitation && cavitation !== 'unknown');
  };

  const hasDetailedFindings = (detection) => {
    return detection.detailed_findings &&
      (detection.detailed_findings.primary_findings ||
        detection.detailed_findings.secondary_findings ||
        detection.detailed_findings.severity ||
        detection.detailed_findings.locations_affected ||
        detection.detailed_findings.gemini_confidence);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto border border-black">
        <h2 className="text-2xl font-semibold text-black mb-4 border-b pb-2">
          Chest Guard Analysis Results
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-black">Loading results...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : patientData ? (
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-black mb-2">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium text-black">MR Number:</span> <span className="text-gray-800">{patientData.patient?.MR_no}</span></p>
                <p><span className="font-medium text-black">Email:</span> <span className="text-gray-800">{patientData.patient?.email}</span></p>
              </div>
            </div>

            {/* Analytics Summary */}
            {patientData.analytics && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-black mb-2">Summary Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-2xl text-blue-600">{patientData.analytics.totalScans}</p>
                    <p className="text-gray-700">Total Scans</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-2xl text-green-600">{patientData.analytics.conditionHistory.normal || 0}</p>
                    <p className="text-gray-700">Normal</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-2xl text-orange-600">{patientData.analytics.conditionHistory.pneumonia || 0}</p>
                    <p className="text-gray-700">Pneumonia</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-2xl text-red-600">{patientData.analytics.conditionHistory.tuberculosis || 0}</p>
                    <p className="text-gray-700">Tuberculosis</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-700">
                    Average Confidence: <span className="font-medium text-black">{(patientData.analytics.averageConfidence * 100).toFixed(1)}%</span>
                  </p>
                </div>
              </div>
            )}

            {/* Detection Results */}
            <div>
              <h3 className="text-lg font-medium text-black mb-4">Detection History</h3>
              {patientData.detection && patientData.detection.length > 0 ? (
                <div className="space-y-4">
                  {patientData.detection
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((detection, index) => {
                      const correctResult = getCorrectResult(detection.allProbabilities);
                      const isResultIncorrect = correctResult && correctResult !== detection.result.toLowerCase();

                      return (
                        <div
                          key={detection._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                            <div className="flex items-center space-x-3 mb-2 md:mb-0 flex-wrap">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getResultColor(detection.result)}`}>
                                {detection.result.toUpperCase()}
                              </span>

                              {/* Show Model Used */}
                              {detection.model_used && (
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getModelColor(detection.model_used)}`}>
                                  {detection.model_used.toUpperCase()} MODEL
                                </span>
                              )}

                              {/* Show correct result if different */}
                              {isResultIncorrect && (
                                <>
                                  <span className="text-red-600 text-sm">→</span>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getResultColor(correctResult)} ring-2 ring-blue-400`}>
                                    SHOULD BE: {correctResult.toUpperCase()}
                                  </span>
                                </>
                              )}

                              <span className={`text-sm font-medium ${getConfidenceColor(detection.confidence)}`}>
                                {(detection.confidence * 100).toFixed(1)}% confidence
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(detection.date).toLocaleString()}
                            </div>
                          </div>

                          {/* Show threshold analysis if result is incorrect */}
                          {isResultIncorrect && (
                            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                              <h4 className="font-medium text-sm text-red-800 mb-2">⚠️ Result Analysis Issue:</h4>
                              <div className="text-sm text-red-700">
                                <p>Backend returned: <strong>{detection.result}</strong></p>
                                <p>Should be: <strong>{correctResult}</strong> based on probabilities and thresholds</p>
                                <p className="mt-1 text-xs">Check your backend threshold logic!</p>
                              </div>
                            </div>
                          )}

                          {/* X-ray Image */}
                          {detection.xray && (
                            <div className="mb-3">
                              <img
                                src={detection.xray}
                                alt="X-ray scan"
                                className="w-full max-w-xs h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(detection.xray, '_blank')}
                              />
                            </div>
                          )}


                          {/* All Probabilities with Threshold Indicators */}
                          {detection.allProbabilities && detection.allProbabilities.length > 0 && (
                            <div className="mb-3">
                              <h4 className="font-medium text-sm text-black mb-2">Detailed Probabilities:</h4>
                              <div className="space-y-2">
                                {detection.allProbabilities.map((prob, probIndex) => {
                                  const className = prob.className.toLowerCase();
                                  const threshold = THRESHOLDS[className] || 0.5;
                                  const meetsThreshold = prob.probability >= threshold;

                                  return (
                                    <div key={probIndex} className="flex justify-between items-center text-sm">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-800">{prob.className}:</span>
                                        <span className="text-xs text-gray-500">(threshold: {(threshold * 100).toFixed(0)}%)</span>
                                        {meetsThreshold && (
                                          <span className="text-green-600 text-xs">✓ Above threshold</span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-20 bg-gray-200 rounded-full h-2 relative">
                                          <div
                                            className={`h-2 rounded-full ${meetsThreshold ? 'bg-green-600' : 'bg-blue-600'}`}
                                            style={{ width: `${prob.probability * 100}%` }}
                                          ></div>
                                          {/* Threshold line */}
                                          <div
                                            className="absolute top-0 w-0.5 h-2 bg-red-400"
                                            style={{ left: `${threshold * 100}%` }}
                                          ></div>
                                        </div>
                                        <span className={`w-12 text-right ${meetsThreshold ? 'text-green-800 font-medium' : 'text-gray-800'}`}>
                                          {(prob.probability * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}



                       {/* Symptom-Based Prediction */}
{detection.symptomPrediction && detection.symptomPrediction[0] && (
  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
    <h4 className="font-medium text-sm text-black mb-3 flex items-center">
      <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Symptom-Based Analysis:
    </h4>
    
    <div className="space-y-3">
      {/* Main Prediction */}
      <div className="bg-white rounded-lg p-3 border border-purple-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Primary Prediction:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            detection.symptomPrediction[0].Prediction?.toLowerCase() === 'normal' 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : detection.symptomPrediction[0].Prediction?.toLowerCase() === 'pneumonia'
              ? 'bg-orange-100 text-orange-800 border border-orange-200'
              : detection.symptomPrediction[0].Prediction?.toLowerCase() === 'tuberculosis'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            {detection.symptomPrediction[0].Prediction?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
      </div>

      {/* Confidence Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pneumonia Confidence */}
        {detection.symptomPrediction[0].pneumoniaConfidenceSymptom !== undefined && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Pneumonia Risk:</span>
              <span className="text-sm font-bold text-orange-600">
                {typeof detection.symptomPrediction[0].pneumoniaConfidenceSymptom === 'number' 
                  ? `${detection.symptomPrediction[0].pneumoniaConfidenceSymptom}%`
                  : detection.symptomPrediction[0].pneumoniaConfidenceSymptom
                }
              </span>
            </div>
            {typeof detection.symptomPrediction[0].pneumoniaConfidenceSymptom === 'number' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${detection.symptomPrediction[0].pneumoniaConfidenceSymptom}%` 
                  }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Tuberculosis Confidence */}
        {detection.symptomPrediction[0].tubercluosisConfidenceSymptom !== undefined && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Tuberculosis Risk:</span>
              <span className="text-sm font-bold text-red-600">
                {typeof detection.symptomPrediction[0].tubercluosisConfidenceSymptom === 'number' 
                  ? `${detection.symptomPrediction[0].tubercluosisConfidenceSymptom}%`
                  : detection.symptomPrediction[0].tubercluosisConfidenceSymptom
                }
              </span>
            </div>
            {typeof detection.symptomPrediction[0].tubercluosisConfidenceSymptom === 'number' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${detection.symptomPrediction[0].tubercluosisConfidenceSymptom}%` 
                  }}
                ></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional Info Note */}
      <div className="bg-purple-25 border-l-4 border-purple-400 p-2">
        <p className="text-xs text-purple-700">
          <span className="font-medium">Note:</span> This analysis is based on reported symptoms and should be considered alongside imaging results.
        </p>
      </div>
    </div>
  </div>
)}

                          {/* Clinical Findings */}
                          {hasDetailedFindings(detection) && (
                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <h4 className="font-medium text-sm text-black mb-2">Clinical Findings:</h4>
                              <div className="text-sm space-y-1">
                                {formatFindings(detection.detailed_findings?.primary_findings) && (
                                  <div className="text-gray-800">
                                    <span className="font-medium text-black">Primary: </span>
                                    {formatFindings(detection.detailed_findings.primary_findings).join(', ')}
                                  </div>
                                )}
                                {formatFindings(detection.detailed_findings?.secondary_findings) && (
                                  <div className="text-gray-800">
                                    <span className="font-medium text-black">Secondary: </span>
                                    {formatFindings(detection.detailed_findings.secondary_findings).join(', ')}
                                  </div>
                                )}
                                {detection.detailed_findings?.severity && detection.detailed_findings.severity !== 'unknown' && (
                                  <div className="text-gray-800">
                                    <span className="font-medium text-black">Severity: </span>
                                    {detection.detailed_findings.severity}
                                  </div>
                                )}
                                {detection.detailed_findings?.locations_affected?.bilateral &&
                                  detection.detailed_findings.locations_affected.bilateral !== 'unknown' && (
                                    <div className="text-gray-800">
                                      <span className="font-medium text-black">Bilateral: </span>
                                      {detection.detailed_findings.locations_affected.bilateral}
                                    </div>
                                  )}
                                {detection.detailed_findings?.locations_affected?.cavitation_present &&
                                  detection.detailed_findings.locations_affected.cavitation_present !== 'unknown' && (
                                    <div className="text-gray-800">
                                      <span className="font-medium text-black">Cavitation: </span>
                                      {detection.detailed_findings.locations_affected.cavitation_present}
                                    </div>
                                  )}
                                {detection.detailed_findings?.gemini_confidence && (
                                  <div className="text-gray-800">
                                    <span className="font-medium text-black">Analysis Confidence: </span>
                                    {detection.detailed_findings.gemini_confidence}
                                  </div>
                                )}
                                {detection.detailed_findings?.locations_affected?.note && (
                                  <div className="text-yellow-800 bg-yellow-50 p-2 rounded mt-2">
                                    <span className="font-medium">Note: </span>
                                    {detection.detailed_findings.locations_affected.note}
                                  </div>
                                )}

                                {!hasValidFindings(detection) && (
                                  <div className="text-gray-600 italic">
                                    Clinical findings analysis in progress or unavailable
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {detection.recommendations && detection.recommendations.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                              <h4 className="font-medium text-sm text-black mb-2">Recommendations:</h4>
                              <ul className="text-sm space-y-1">
                                {detection.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex} className="flex items-start text-gray-800">
                                    <span className="text-blue-600 mr-2">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Full Gemini Analysis Recommendations */}
                          {detection.full_gemini_analysis?.findings?.recommendations &&
                            detection.full_gemini_analysis.findings.recommendations.length > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                                <h4 className="font-medium text-sm text-black mb-2">AI Recommendations:</h4>
                                <ul className="text-sm space-y-1">
                                  {detection.full_gemini_analysis.findings.recommendations.map((rec, recIndex) => (
                                    <li key={recIndex} className="flex items-start text-gray-800">
                                      <span className="text-blue-600 mr-2">•</span>
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {/* Error Message if present */}
                          {detection.error && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                              <p className="text-yellow-800 text-sm">
                                <span className="font-medium">Note: </span>
                                {detection.error}
                              </p>
                            </div>
                          )}

                          {/* Show if Gemini analysis failed */}
                          {detection.detailed_findings?.gemini_success === false && (
                            <div className="bg-orange-50 border border-orange-200 rounded p-3">
                              <p className="text-orange-800 text-sm">
                                <span className="font-medium">Analysis Status: </span>
                                Advanced analysis unavailable - showing AI prediction only
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No detection results found.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No data available.</p>
        )}
      </div>
    </div>
  );
}