// src/components/HealthProfileModal.tsx

'use client';

import React, { useState } from 'react';
import { X, Heart, Plus, Trash2, AlertTriangle, CheckCircle, Loader2, Brain } from 'lucide-react';
import RareDiseaseModal from './RareDiseaseModal';

interface HealthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (dietPlan: any) => void;
}

interface HealthCondition {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface RareConditionAnalysis {
  conditionName: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  restrictions: string[];
  recommendations: string[];
  dietaryRecommendations: {
    avoidFoods: string[];
    recommendedFoods: string[];
    keyNutrients: string[];
  };
  fullAnalysis: any;
}

const commonConditions = [
  'Diabetes Type 1', 'Diabetes Type 2', 'Hypertension', 'Heart Disease',
  'High Cholesterol', 'Kidney Disease', 'Liver Disease', 'Celiac Disease',
  'Crohn\'s Disease', 'IBS', 'GERD', 'Arthritis', 'Osteoporosis',
  'Thyroid Disorder', 'Anemia', 'Food Allergies'
];

const commonAllergens = [
  'Dairy/Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts',
  'Wheat/Gluten', 'Soy', 'Sesame', 'Sulfites'
];

const dietaryPreferences = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Mediterranean',
  'Low-carb', 'Low-fat', 'Gluten-free', 'Dairy-free', 'Kosher', 'Halal'
];

export default function HealthProfileModal({ isOpen, onClose, onComplete }: HealthProfileModalProps) {
  const [step, setStep] = useState(1);
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([]);
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [selectedDietaryPreferences, setSelectedDietaryPreferences] = useState<string[]>([]);
  const [goalType, setGoalType] = useState<'maintenance' | 'improvement' | 'weight-loss' | 'weight-gain' | 'athletic' | 'heart-healthy' | 'anti-inflammatory'>('maintenance');
  const [cookingSkill, setCookingSkill] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [budgetMin, setBudgetMin] = useState(5);
  const [budgetMax, setBudgetMax] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRareConditionModal, setShowRareConditionModal] = useState(false);
  const [rareConditionAnalysis, setRareConditionAnalysis] = useState<RareConditionAnalysis | null>(null);

  const resetForm = () => {
    setStep(1);
    setHealthConditions([]);
    setCurrentMedications([]);
    setAllergens([]);
    setSelectedDietaryPreferences([]);
    setGoalType('maintenance');
    setCookingSkill('Intermediate');
    setBudgetMin(5);
    setBudgetMax(15);
    setIsGenerating(false);
    setError(null);
    setRareConditionAnalysis(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addHealthCondition = (conditionName: string) => {
    if (!healthConditions.find(c => c.name === conditionName)) {
      setHealthConditions([...healthConditions, { name: conditionName, severity: 'moderate' }]);
    }
  };

  const removeHealthCondition = (conditionName: string) => {
    setHealthConditions(healthConditions.filter(c => c.name !== conditionName));
    if (rareConditionAnalysis?.conditionName === conditionName) {
      setRareConditionAnalysis(null);
    }
  };

  const updateConditionSeverity = (conditionName: string, severity: 'mild' | 'moderate' | 'severe') => {
    setHealthConditions(healthConditions.map(c => 
      c.name === conditionName ? { ...c, severity } : c
    ));
  };

  const addMedication = (medication: string) => {
    if (medication.trim() && !currentMedications.includes(medication.trim())) {
      setCurrentMedications([...currentMedications, medication.trim()]);
    }
  };

  const removeMedication = (medication: string) => {
    setCurrentMedications(currentMedications.filter(m => m !== medication));
  };

  const toggleAllergen = (allergen: string) => {
    setAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const toggleDietaryPreference = (preference: string) => {
    setSelectedDietaryPreferences(prev => 
      prev.includes(preference) 
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const handleRareConditionAnalysis = (analysis: RareConditionAnalysis) => {
    console.log('✅ Received rare condition analysis:', analysis);
    setRareConditionAnalysis(analysis);
    
    if (!healthConditions.find(c => c.name === analysis.conditionName)) {
      addHealthCondition(analysis.conditionName);
    }
    
    setShowRareConditionModal(false);
  };

  const generateDietPlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🚀 Starting diet plan generation...');

      const severityLevels = healthConditions.reduce((acc, condition) => {
        acc[condition.name] = condition.severity;
        return acc;
      }, {} as Record<string, string>);

      let formattedRareAnalysis: any[] = [];
      if (rareConditionAnalysis) {
        formattedRareAnalysis = [{
          conditionName: rareConditionAnalysis.conditionName,
          definition: `AI-analyzed rare condition: ${rareConditionAnalysis.conditionName}`,
          overview: `Comprehensive analysis of ${rareConditionAnalysis.conditionName} with dietary considerations`,
          confidenceLevel: rareConditionAnalysis.confidenceLevel,
          dietaryRecommendations: {
            avoidFoods: rareConditionAnalysis.dietaryRecommendations.avoidFoods || [],
            recommendedFoods: rareConditionAnalysis.dietaryRecommendations.recommendedFoods || [],
            keyNutrients: rareConditionAnalysis.dietaryRecommendations.keyNutrients || [],
            mealPlanningTips: [`Consider ${rareConditionAnalysis.conditionName}-specific dietary needs`]
          },
          warningSigns: ['Monitor for condition-specific symptoms', 'Watch for unusual reactions to foods'],
          specialNotes: [
            `This analysis includes AI-researched information for ${rareConditionAnalysis.conditionName}`,
            'Regular medical monitoring recommended',
            'Work with healthcare providers familiar with this condition'
          ],
          medicationInteractions: [],
          restrictions: ['rare-condition-monitored', 'medical-supervision-required'],
          recommendations: ['nutrient-dense', 'anti-inflammatory', 'individualized-approach'],
          medicalDisclaimer: 'This analysis includes AI-researched information for a rare condition. Always consult your healthcare provider for personalized medical advice.'
        }];
      }
      // Always send an array, even if empty

      const requestData = {
        healthConditions: healthConditions.map(c => c.name),
        severityLevels,
        currentMedications,
        allergens,
        dietaryPreferences: selectedDietaryPreferences,
        goalType,
        rareConditionAnalysis: formattedRareAnalysis, // Always send array, even if empty
        preferences: {
          cookingSkillLevel: cookingSkill,
          budgetRange: {
            min: budgetMin,
            max: budgetMax
          }
        },
        userId: 'user-' + Date.now()
      };

      const response = await fetch('/api/health/diet-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        
        let errorMessage = 'Failed to generate diet plan';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.data) {
        onComplete(result.data);
        handleClose();
      } else {
        throw new Error(result.error || 'No diet plan data received');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate diet plan');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="w-7 h-7 text-red-600" />
              Create Health Profile
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Health Conditions</span>
              <span>Medications & Allergies</span>
              <span>Dietary Preferences</span>
              <span>Goals & Budget</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Health Conditions */}
            {step === 1 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Health Conditions</h3>
                <p className="text-gray-600 mb-6">
                  Select any health conditions you have. This helps us create a safe, personalized diet plan.
                </p>

                {/* Rare Condition Analysis Result */}
                {rareConditionAnalysis && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI Analysis Complete: {rareConditionAnalysis.conditionName}
                    </h4>
                    <div className="text-sm text-purple-800 space-y-1">
                      <div>Confidence: {rareConditionAnalysis.confidenceLevel}</div>
                      <div>Dietary Restrictions: {rareConditionAnalysis.dietaryRecommendations.avoidFoods.length} identified</div>
                      <div>Recommendations: {rareConditionAnalysis.dietaryRecommendations.recommendedFoods.length} foods suggested</div>
                    </div>
                  </div>
                )}

                {/* Common Conditions */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Common Conditions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {commonConditions.map((condition) => (
                      <button
                        key={condition}
                        onClick={() => addHealthCondition(condition)}
                        disabled={!!healthConditions.find(c => c.name === condition)}
                        className={`p-3 text-left text-sm border rounded-lg transition-colors ${
                          healthConditions.find(c => c.name === condition)
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rare Condition Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowRareConditionModal(true)}
                    className="w-full p-4 border-2 border-dashed border-purple-300 rounded-lg text-purple-700 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Brain className="w-5 h-5" />
                    Have a rare/unlisted condition? Get AI analysis
                  </button>
                </div>

                {/* Selected Conditions */}
                {healthConditions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Selected Conditions</h4>
                    <div className="space-y-3">
                      {healthConditions.map((condition) => (
                        <div key={condition.name} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium text-blue-900">{condition.name}</span>
                            {rareConditionAnalysis?.conditionName === condition.name && (
                              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                AI Analyzed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={condition.severity}
                              onChange={(e) => updateConditionSeverity(condition.name, e.target.value as any)}
                              className="text-sm border border-blue-300 rounded px-2 py-1"
                            >
                              <option value="mild">Mild</option>
                              <option value="moderate">Moderate</option>
                              <option value="severe">Severe</option>
                            </select>
                            <button
                              onClick={() => removeHealthCondition(condition.name)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Medications & Allergies */}
            {step === 2 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Medications & Allergies</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Current Medications</h4>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Enter medication name"
                      className="flex-1 p-3 border border-gray-300 rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addMedication(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addMedication(input.value);
                        input.value = '';
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {currentMedications.length > 0 && (
                    <div className="space-y-2">
                      {currentMedications.map((medication) => (
                        <div key={medication} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <span>{medication}</span>
                          <button
                            onClick={() => removeMedication(medication)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Food Allergies & Intolerances</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {commonAllergens.map((allergen) => (
                      <button
                        key={allergen}
                        onClick={() => toggleAllergen(allergen)}
                        className={`p-3 text-left text-sm border rounded-lg transition-colors ${
                          allergens.includes(allergen)
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                        }`}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Dietary Preferences */}
            {step === 3 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Dietary Preferences</h3>
                <p className="text-gray-600 mb-6">
                  Select any dietary preferences or restrictions you follow.
                </p>

                {rareConditionAnalysis && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">
                      {rareConditionAnalysis.conditionName} Dietary Considerations
                    </h4>
                    <div className="text-sm text-purple-800">
                      <div className="mb-2">
                        <strong>Recommended:</strong> {rareConditionAnalysis.dietaryRecommendations.recommendedFoods.slice(0, 3).join(', ')}
                        {rareConditionAnalysis.dietaryRecommendations.recommendedFoods.length > 3 && '...'}
                      </div>
                      <div>
                        <strong>Avoid:</strong> {rareConditionAnalysis.dietaryRecommendations.avoidFoods.slice(0, 3).join(', ')}
                        {rareConditionAnalysis.dietaryRecommendations.avoidFoods.length > 3 && '...'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {dietaryPreferences.map((preference) => (
                    <button
                      key={preference}
                      onClick={() => toggleDietaryPreference(preference)}
                      className={`p-3 text-left text-sm border rounded-lg transition-colors ${
                        selectedDietaryPreferences.includes(preference)
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'border-gray-300 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      {preference}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Goals & Budget */}
            {step === 4 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Goals & Preferences</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Primary Health Goal</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'maintenance', label: 'Maintain current health', desc: 'Keep current weight and health status' },
                      { value: 'improvement', label: 'Improve health condition', desc: 'Focus on managing health conditions' },
                      { value: 'weight-loss', label: 'Weight loss', desc: 'Lose weight in a healthy way' },
                      { value: 'weight-gain', label: 'Weight gain', desc: 'Gain weight or build muscle' },
                      { value: 'athletic', label: 'Athletic performance', desc: 'Optimize nutrition for sports/fitness' },
                      { value: 'heart-healthy', label: 'Heart health', desc: 'Cardiovascular wellness focus' },
                      { value: 'anti-inflammatory', label: 'Anti-inflammatory', desc: 'Reduce inflammation through diet' }
                    ].map((goal) => (
                      <label key={goal.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="goalType"
                          value={goal.value}
                          checked={goalType === goal.value}
                          onChange={(e) => setGoalType(e.target.value as any)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{goal.label}</div>
                          <div className="text-sm text-gray-600">{goal.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Cooking Skill Level</h4>
                  <div className="flex gap-3">
                    {['Beginner', 'Intermediate', 'Advanced'].map((skill) => (
                      <button
                        key={skill}
                        onClick={() => setCookingSkill(skill as any)}
                        className={`flex-1 p-3 text-center border rounded-lg transition-colors ${
                          cookingSkill === skill
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Budget per Meal</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Min: ${budgetMin}</label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Max: ${budgetMax}</label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Profile Summary</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Conditions: {healthConditions.length} selected</div>
                    <div>Allergies: {allergens.length} selected</div>
                    <div>Dietary preferences: {selectedDietaryPreferences.length} selected</div>
                    <div>Goal: {goalType}</div>
                    <div>Budget: ${budgetMin}-${budgetMax} per meal</div>
                    {rareConditionAnalysis && (
                      <div className="text-purple-700">Rare condition analysis: {rareConditionAnalysis.conditionName}</div>
                    )}
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
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <button
              onClick={step === 1 ? handleClose : () => setStep(step - 1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex gap-3">
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <>
                  <button
                    onClick={generateDietPlan}
                    disabled={isGenerating}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      isGenerating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Generate Diet Plan
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rare Disease Modal */}
      <RareDiseaseModal
        isOpen={showRareConditionModal}
        onClose={() => setShowRareConditionModal(false)}
        onAnalysisComplete={handleRareConditionAnalysis}
      />
    </>
  );
}