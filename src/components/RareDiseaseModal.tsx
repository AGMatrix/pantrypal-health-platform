// src/components/RareDiseaseModal.tsx

'use client';

import React, { useState } from 'react';
import { X, Brain, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface DietaryRecommendations {
  avoidFoods: string[];
  recommendedFoods: string[];
  keyNutrients: string[];
  mealPlanningTips?: string[];
}

interface AnalysisResult {
  conditionName: string;
  definition?: string;
  overview?: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  dietaryRecommendations: DietaryRecommendations;
  warningSigns?: string[];
  specialNotes?: string[];
  medicationInteractions?: string[];
  restrictions?: string[];
  recommendations?: string[];
  medicalDisclaimer?: string;
}

interface RareConditionAnalysis {
  conditionName: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  restrictions: string[];
  recommendations: string[];
  dietaryRecommendations: DietaryRecommendations;
  fullAnalysis: AnalysisResult;
}

interface RareDiseaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysis: RareConditionAnalysis) => void;
}

type SeverityLevel = 'mild' | 'moderate' | 'severe';

export default function RareDiseaseModal({ 
  isOpen, 
  onClose, 
  onAnalysisComplete 
}: RareDiseaseModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [conditionName, setConditionName] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [medications, setMedications] = useState<string>('');
  const [doctorRecommendations, setDoctorRecommendations] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('moderate');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = (): void => {
    setStep(1);
    setConditionName('');
    setSymptoms('');
    setMedications('');
    setDoctorRecommendations('');
    setSeverity('moderate');
    setAdditionalInfo('');
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setError(null);
  };

  const handleClose = (): void => {
    resetForm();
    onClose();
  };

  const handleAnalyze = async (): Promise<void> => {
    if (!conditionName.trim()) {
      setError('Please enter a condition name');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🔍 Starting rare condition analysis for:', conditionName);

      const response = await fetch('/api/health/analyze-rare-condition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conditionName: conditionName.trim(),
          symptoms: symptoms.trim(),
          currentMedications: medications.trim(),
          doctorRecommendations: doctorRecommendations.trim(),
          severity,
          additionalInfo: additionalInfo.trim()
        }),
      });

      console.log('📥 Analysis response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      console.log('✅ Analysis result received:', result);

      if (result.success && result.analysis) {
        setAnalysisResult(result.analysis);
        setStep(3);
      } else {
        throw new Error('Analysis failed - no result returned');
      }

    } catch (error) {
      console.error('❌ Rare condition analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseAnalysis = (): void => {
    if (analysisResult) {
      const analysisForDietPlan: RareConditionAnalysis = {
        conditionName,
        confidenceLevel: analysisResult.confidenceLevel || 'medium',
        restrictions: analysisResult.restrictions || [],
        recommendations: analysisResult.recommendations || [],
        dietaryRecommendations: analysisResult.dietaryRecommendations || {
          avoidFoods: [],
          recommendedFoods: [],
          keyNutrients: []
        },
        fullAnalysis: analysisResult
      };

      console.log('✅ Sending analysis to diet plan:', analysisForDietPlan);
      onAnalysisComplete(analysisForDietPlan);
      handleClose();
    }
  };

  const handleConditionNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setConditionName(e.target.value);
  };

  const handleSymptomsChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setSymptoms(e.target.value);
  };

  const handleMedicationsChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMedications(e.target.value);
  };

  const handleDoctorRecommendationsChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setDoctorRecommendations(e.target.value);
  };

  const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSeverity(e.target.value as SeverityLevel);
  };

  const handleAdditionalInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setAdditionalInfo(e.target.value);
  };

  const handleAnalyzeClick = (): void => {
    setStep(2);
    handleAnalyze();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-600" />
            AI Condition Analysis
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Tell us about your condition
              </h3>
              <p className="text-gray-600 mb-6">
                Our AI will research your condition and provide personalized dietary guidance.
              </p>

              <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="conditionName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Condition Name *
                  </label>
                  <input
                    id="conditionName"
                    type="text"
                    value={conditionName}
                    onChange={handleConditionNameChange}
                    placeholder="e.g., Ehlers-Danlos Syndrome, POTS, Fibromyalgia"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label 
                    htmlFor="symptoms"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Main Symptoms
                  </label>
                  <textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={handleSymptomsChange}
                    placeholder="Describe your main symptoms and how they affect you"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="medications"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Current Medications
                  </label>
                  <textarea
                    id="medications"
                    value={medications}
                    onChange={handleMedicationsChange}
                    placeholder="List any medications you're taking for this condition"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="severity"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Severity Level
                  </label>
                  <select
                    id="severity"
                    value={severity}
                    onChange={handleSeverityChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="mild">Mild - Minor impact on daily life</option>
                    <option value="moderate">Moderate - Some lifestyle adjustments needed</option>
                    <option value="severe">Severe - Significant impact on daily activities</option>
                  </select>
                </div>

                <div>
                  <label 
                    htmlFor="doctorRecommendations"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Doctor&apos;s Dietary Recommendations
                  </label>
                  <textarea
                    id="doctorRecommendations"
                    value={doctorRecommendations}
                    onChange={handleDoctorRecommendationsChange}
                    placeholder="Any specific dietary advice from your healthcare provider"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="additionalInfo"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Additional Information
                  </label>
                  <textarea
                    id="additionalInfo"
                    value={additionalInfo}
                    onChange={handleAdditionalInfoChange}
                    placeholder="Any other relevant information about your condition"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Error</span>
                  </div>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>How it works:</strong> Our AI will research medical literature and 
                    databases to understand your condition and provide evidence-based dietary 
                    recommendations tailored to your specific needs.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <Brain className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    🧠 AI is Analyzing Your Condition
                  </h3>
                  <p className="text-gray-600">
                    Researching medical literature for {conditionName}...
                  </p>
                  <div className="text-sm text-purple-600">
                    This may take 30-90 seconds
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && analysisResult && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Analysis Complete
              </h3>

              <div className="space-y-4">
                {/* Condition Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">
                    Condition: {conditionName}
                  </h4>
                  <p className="text-green-800 text-sm">
                    {analysisResult.definition || analysisResult.overview || 'AI analysis completed successfully.'}
                  </p>
                  <div className="mt-2 text-xs text-green-600">
                    Confidence Level: {analysisResult.confidenceLevel || 'Medium'}
                  </div>
                </div>

                {/* Key Dietary Restrictions */}
                {analysisResult.dietaryRecommendations?.avoidFoods && 
                 analysisResult.dietaryRecommendations.avoidFoods.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Foods to Avoid ({analysisResult.dietaryRecommendations.avoidFoods.length})
                    </h4>
                    <div className="space-y-1">
                      {analysisResult.dietaryRecommendations.avoidFoods.slice(0, 3).map((food: string, index: number) => (
                        <div key={`avoid-${index}`} className="text-sm text-red-800">
                          • {food}
                        </div>
                      ))}
                      {analysisResult.dietaryRecommendations.avoidFoods.length > 3 && (
                        <div className="text-xs text-red-600">
                          +{analysisResult.dietaryRecommendations.avoidFoods.length - 3} more restrictions
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recommended Foods */}
                {analysisResult.dietaryRecommendations?.recommendedFoods && 
                 analysisResult.dietaryRecommendations.recommendedFoods.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Recommended Foods ({analysisResult.dietaryRecommendations.recommendedFoods.length})
                    </h4>
                    <div className="space-y-1">
                      {analysisResult.dietaryRecommendations.recommendedFoods.slice(0, 3).map((food: string, index: number) => (
                        <div key={`recommend-${index}`} className="text-sm text-blue-800">
                          • {food}
                        </div>
                      ))}
                      {analysisResult.dietaryRecommendations.recommendedFoods.length > 3 && (
                        <div className="text-xs text-blue-600">
                          +{analysisResult.dietaryRecommendations.recommendedFoods.length - 3} more recommendations
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Nutrients */}
                {analysisResult.dietaryRecommendations?.keyNutrients && 
                 analysisResult.dietaryRecommendations.keyNutrients.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Important Nutrients</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.dietaryRecommendations.keyNutrients.slice(0, 4).map((nutrient: string, index: number) => (
                        <span 
                          key={`nutrient-${index}`} 
                          className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                        >
                          {nutrient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning Signs */}
                {analysisResult.warningSigns && analysisResult.warningSigns.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Important Warnings
                    </h4>
                    <div className="space-y-1">
                      {analysisResult.warningSigns.slice(0, 2).map((warning: string, index: number) => (
                        <div key={`warning-${index}`} className="text-sm text-yellow-800">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <strong>Medical Disclaimer:</strong> This AI analysis is for educational purposes only. 
                    Always consult your healthcare provider before making significant dietary changes, 
                    especially for rare or complex conditions.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            type="button"
          >
            Cancel
          </button>

          <div className="flex gap-3">
            {step === 1 && (
              <button
                onClick={handleAnalyzeClick}
                disabled={!conditionName.trim() || isAnalyzing}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  conditionName.trim() && !isAnalyzing
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                type="button"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyze Condition
                  </>
                )}
              </button>
            )}

            {step === 3 && analysisResult && (
              <button
                onClick={handleUseAnalysis}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                type="button"
              >
                <CheckCircle className="w-4 h-4" />
                Use This Analysis
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}