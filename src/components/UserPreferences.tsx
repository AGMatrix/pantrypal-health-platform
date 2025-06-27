// src/components/UserPreferences.tsx
// User settings for allergies, favorite cuisines, and dietary preferences

'use client';

import React, { useState, useEffect } from 'react';
import { UserPreferences as UserPreferencesType, CuisineType, DietaryRestriction } from '@/types/recipe';
import { Settings, Save, RotateCcw, User, Heart, AlertTriangle, DollarSign } from 'lucide-react';

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: UserPreferencesType) => void;
  initialPreferences?: UserPreferencesType;
}

const DEFAULT_PREFERENCES: UserPreferencesType = {
  favoriteRecipes: [],
  allergies: [],
  preferredCuisines: [],
  budgetRange: { min: 1, max: 15 },
  householdSize: 2,
  cookingSkillLevel: 'Intermediate'
};

export default function UserPreferences({ 
  isOpen, 
  onClose, 
  onSave, 
  initialPreferences = DEFAULT_PREFERENCES 
}: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferencesType>(initialPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  const cuisineOptions: CuisineType[] = [
    'Italian', 'Mexican', 'Asian', 'Indian', 'American',
    'Mediterranean', 'French', 'Thai', 'Chinese', 'Japanese'
  ];

  const dietaryOptions: DietaryRestriction[] = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
    'nut-free', 'low-carb', 'keto'
  ];

  const commonAllergies = [
    'peanuts', 'tree nuts', 'dairy', 'eggs', 'soy',
    'wheat', 'fish', 'shellfish', 'sesame'
  ];

  useEffect(() => {
    setPreferences(initialPreferences);
    setHasChanges(false);
  }, [initialPreferences, isOpen]);

  const updatePreferences = (updates: Partial<UserPreferencesType>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const toggleCuisine = (cuisine: CuisineType) => {
    const current = preferences.preferredCuisines;
    const updated = current.includes(cuisine)
      ? current.filter(c => c !== cuisine)
      : [...current, cuisine];
    updatePreferences({ preferredCuisines: updated });
  };

  const toggleAllergy = (allergy: string) => {
    const current = preferences.allergies;
    const updated = current.includes(allergy)
      ? current.filter(a => a !== allergy)
      : [...current, allergy];
    updatePreferences({ allergies: updated });
  };

  const handleSave = () => {
    onSave(preferences);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Preferences</h2>
              <p className="text-sm text-gray-600">Customize your cooking experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Personal Info */}
            <section>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Household Size
                  </label>
                  <select
                    value={preferences.householdSize}
                    onChange={(e) => updatePreferences({ householdSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                      <option key={size} value={size}>
                        {size} {size === 1 ? 'person' : 'people'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cooking Skill Level
                  </label>
                  <select
                    value={preferences.cookingSkillLevel}
                    onChange={(e) => updatePreferences({ 
                      cookingSkillLevel: e.target.value as UserPreferencesType['cookingSkillLevel'] 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Budget Range */}
            <section>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                Budget Preferences
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred cost per serving: ${preferences.budgetRange.min} - ${preferences.budgetRange.max}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                      <input
                        type="range"
                        min="1"
                        max="25"
                        value={preferences.budgetRange.min}
                        onChange={(e) => updatePreferences({
                          budgetRange: { ...preferences.budgetRange, min: parseInt(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-600">${preferences.budgetRange.min}</span>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={preferences.budgetRange.max}
                        onChange={(e) => updatePreferences({
                          budgetRange: { ...preferences.budgetRange, max: parseInt(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-600">${preferences.budgetRange.max}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Favorite Cuisines */}
            <section>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <Heart className="w-5 h-5 text-red-600" />
                Favorite Cuisines
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select cuisines you enjoy. We'll prioritize these in recommendations.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {cuisineOptions.map(cuisine => (
                  <button
                    key={cuisine}
                    onClick={() => toggleCuisine(cuisine)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      preferences.preferredCuisines.includes(cuisine)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </section>

            {/* Allergies & Restrictions */}
            <section>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Allergies & Food Restrictions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select any allergies or dietary restrictions. We'll filter out recipes with these ingredients.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Common Allergies</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {commonAllergies.map(allergy => (
                      <button
                        key={allergy}
                        onClick={() => toggleAllergy(allergy)}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          preferences.allergies.includes(allergy)
                            ? 'bg-red-100 border-red-300 text-red-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {allergy.charAt(0).toUpperCase() + allergy.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Custom Allergies</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom allergy..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = e.currentTarget.value.trim();
                          if (value && !preferences.allergies.includes(value)) {
                            updatePreferences({ 
                              allergies: [...preferences.allergies, value] 
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {/* Display custom allergies */}
                  {preferences.allergies.filter(a => !commonAllergies.includes(a)).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {preferences.allergies
                        .filter(a => !commonAllergies.includes(a))
                        .map(allergy => (
                          <span
                            key={allergy}
                            className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                          >
                            {allergy}
                            <button
                              onClick={() => toggleAllergy(allergy)}
                              className="hover:bg-red-200 rounded-full p-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Dietary Preferences */}
            <section>
              <h3 className="font-semibold text-gray-900 mb-4">Dietary Preferences</h3>
              <p className="text-sm text-gray-600 mb-4">
                These are preferences, not restrictions. We'll show recipes that match when possible.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {dietaryOptions.map(dietary => {
                  const isSelected = preferences.allergies.includes(dietary); // Using allergies for dietary restrictions
                  return (
                    <button
                      key={dietary}
                      onClick={() => toggleAllergy(dietary)} // Reusing allergy toggle
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        isSelected
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {dietary.charAt(0).toUpperCase() + dietary.slice(1)}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Preferences Summary */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Preferences Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Household:</span>
                  <span className="ml-2 font-medium">{preferences.householdSize} people</span>
                </div>
                <div>
                  <span className="text-gray-600">Skill Level:</span>
                  <span className="ml-2 font-medium">{preferences.cookingSkillLevel}</span>
                </div>
                <div>
                  <span className="text-gray-600">Budget:</span>
                  <span className="ml-2 font-medium">
                    ${preferences.budgetRange.min} - ${preferences.budgetRange.max} per serving
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Favorite Cuisines:</span>
                  <span className="ml-2 font-medium">
                    {preferences.preferredCuisines.length || 'None selected'}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">Allergies/Restrictions:</span>
                  <span className="ml-2 font-medium">
                    {preferences.allergies.length ? preferences.allergies.join(', ') : 'None'}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}