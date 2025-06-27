// src/components/IngredientSubstitutions.tsx
// Shows alternative ingredients when you're missing something

'use client';

import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient } from '@/types/recipe';
import { getIngredientSubstitutions, IngredientSubstitution } from '@/lib/api';
import { RefreshCw, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

interface IngredientSubstitutionsProps {
  recipe: Recipe;
  userIngredients: string[];
  onSubstitutionApply?: (originalIngredient: string, substitute: string) => void;
}

interface SubstitutionSuggestion {
  original: Ingredient;
  substitutes: IngredientSubstitution[];
  isAvailable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function IngredientSubstitutions({ 
  recipe, 
  userIngredients, 
  onSubstitutionApply 
}: IngredientSubstitutionsProps) {
  const [substitutions, setSubstitutions] = useState<SubstitutionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Check which ingredients user is missing
  const missingIngredients = recipe.ingredients.filter(ingredient =>
    !userIngredients.some(userIng => 
      ingredient.name.toLowerCase().includes(userIng.toLowerCase()) ||
      userIng.toLowerCase().includes(ingredient.name.toLowerCase())
    )
  );

  // Load substitutions for missing ingredients
  useEffect(() => {
    const loadSubstitutions = async () => {
      if (missingIngredients.length === 0) return;
      
      setLoading(true);
      
      try {
        // Get substitutions for all missing ingredients at once
        const ingredientNames = missingIngredients.map(ing => ing.name);
        const response = await getIngredientSubstitutions(ingredientNames);
        
        if (response.success) {
          const suggestions: SubstitutionSuggestion[] = [];

          for (const ingredient of missingIngredients) {
            // Find substitutions for this specific ingredient
            const ingredientSubs = response.substitutions.filter(sub => 
              sub.original.toLowerCase() === ingredient.name.toLowerCase() ||
              ingredient.name.toLowerCase().includes(sub.original.toLowerCase())
            );
            
            // Check if user has any of the substitutes
            const availableSubstitutes = ingredientSubs.filter(sub =>
              userIngredients.some(userIng => 
                sub.substitute.toLowerCase().includes(userIng.toLowerCase()) ||
                userIng.toLowerCase().includes(sub.substitute.toLowerCase())
              )
            );

            // Determine priority based on ingredient importance and availability
            let priority: 'high' | 'medium' | 'low' = 'medium';
            if (ingredient.optional) {
              priority = 'low';
            } else if (availableSubstitutes.length > 0) {
              priority = 'high';
            }

            suggestions.push({
              original: ingredient,
              substitutes: ingredientSubs,
              isAvailable: availableSubstitutes.length > 0,
              priority
            });
          }

          // Sort by priority (high first)
          suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });

          setSubstitutions(suggestions);
        } else {
          console.error('Failed to get substitutions:', response.error);
          // Fallback: create suggestions with empty substitutes
          const fallbackSuggestions: SubstitutionSuggestion[] = missingIngredients.map(ingredient => ({
            original: ingredient,
            substitutes: [],
            isAvailable: false,
            priority: ingredient.optional ? 'low' : 'medium'
          }));
          setSubstitutions(fallbackSuggestions);
        }
      } catch (error) {
        console.error('Error loading substitutions:', error);
        // Fallback: create suggestions with empty substitutes
        const fallbackSuggestions: SubstitutionSuggestion[] = missingIngredients.map(ingredient => ({
          original: ingredient,
          substitutes: [],
          isAvailable: false,
          priority: ingredient.optional ? 'low' : 'medium'
        }));
        setSubstitutions(fallbackSuggestions);
      } finally {
        setLoading(false);
      }
    };

    loadSubstitutions();
  }, [missingIngredients, userIngredients]);

  const toggleExpanded = (ingredientName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(ingredientName)) {
      newExpanded.delete(ingredientName);
    } else {
      newExpanded.add(ingredientName);
    }
    setExpandedItems(newExpanded);
  };

  const handleApplySubstitution = (original: string, substitute: string) => {
    if (onSubstitutionApply) {
      onSubstitutionApply(original, substitute);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-green-100 border-green-300 text-green-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Lightbulb className="w-4 h-4 text-gray-500" />;
    }
  };

  if (missingIngredients.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">You have all ingredients!</span>
        </div>
        <p className="text-green-700 text-sm mt-1">
          No substitutions needed - you're ready to cook this recipe.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Ingredient Substitutions
        </h3>
        {loading && (
          <div className="animate-spin">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {substitutions.map((suggestion) => (
          <div
            key={suggestion.original.name}
            className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPriorityIcon(suggestion.priority)}
                <div>
                  <div className="font-medium">
                    Missing: {suggestion.original.amount} {suggestion.original.unit} {suggestion.original.name}
                    {suggestion.original.optional && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Optional
                      </span>
                    )}
                  </div>
                  {suggestion.isAvailable && (
                    <div className="text-sm mt-1 font-medium text-green-700">
                      ✓ You have substitutes available!
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleExpanded(suggestion.original.name)}
                className="text-sm px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {expandedItems.has(suggestion.original.name) ? 'Hide' : 'Show'} Options
              </button>
            </div>

            {expandedItems.has(suggestion.original.name) && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-sm">Substitution Options:</h4>
                
                {suggestion.substitutes.length === 0 ? (
                  <p className="text-sm text-gray-600 italic">
                    No common substitutions found for this ingredient.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestion.substitutes.map((substitution, index) => {
                      const userHasIt = userIngredients.some(userIng => 
                        substitution.substitute.toLowerCase().includes(userIng.toLowerCase()) ||
                        userIng.toLowerCase().includes(substitution.substitute.toLowerCase())
                      );

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded border text-sm ${
                            userHasIt 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {userHasIt && '✓ '}
                                {substitution.substitute}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Ratio: {substitution.ratio}
                                {substitution.availability && (
                                  <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                                    substitution.availability === 'common' ? 'bg-green-100 text-green-700' :
                                    substitution.availability === 'specialty' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {substitution.availability}
                                  </span>
                                )}
                              </div>
                              {substitution.notes && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {substitution.notes}
                                </div>
                              )}
                            </div>
                            {userHasIt && (
                              <button
                                onClick={() => handleApplySubstitution(suggestion.original.name, substitution.substitute)}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors ml-2 flex-shrink-0"
                              >
                                Use This
                              </button>
                            )}
                          </div>
                          {userHasIt && (
                            <div className="text-xs text-green-600 mt-1">
                              You have this ingredient!
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Usage tips */}
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <div className="font-medium text-blue-800 mb-1">💡 Substitution Tips:</div>
                  <div className="text-blue-700">
                    {getSubstitutionTips(suggestion.original.name)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm space-y-2">
          <div className="font-medium text-gray-800">Substitution Summary:</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              {substitutions.filter(s => s.priority === 'high').length} High Priority
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              {substitutions.filter(s => s.priority === 'medium').length} Medium Priority
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              {substitutions.filter(s => s.priority === 'low').length} Optional
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to provide substitution tips
function getSubstitutionTips(ingredient: string): string {
  const tips: Record<string, string> = {
    'butter': 'Use equal amounts of substitutes. Oil will make texture slightly different.',
    'milk': 'Plant-based milks work 1:1. Coconut milk adds richness.',
    'eggs': 'For binding: 1 egg = 1 tbsp ground flax + 3 tbsp water (let sit 5 min)',
    'flour': 'Almond flour: use 1:1 but add binding agent. Reduces carbs significantly.',
    'sugar': 'Honey/maple syrup: use ¾ amount and reduce other liquids slightly.',
    'cheese': 'Nutritional yeast adds umami. Cashew cream provides creaminess.',
    'cream': 'Coconut cream from refrigerated can works best for whipping.',
    'yogurt': 'Greek yogurt substitutes work 1:1 and add protein.',
  };

  // Find matching tip
  for (const [key, tip] of Object.entries(tips)) {
    if (ingredient.toLowerCase().includes(key)) {
      return tip;
    }
  }

  return 'Start with small amounts when substituting and adjust to taste.';
}