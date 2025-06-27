// src/components/RecipeDetailsModal.tsx
'use client';

import React, { useState } from 'react';
import { Recipe } from '@/types/recipe';
import { formatCookingTime, formatPrice, getDifficultyColor } from '@/lib/utils';
import CookingAssistant from './CookingAssistant';
import CompletionCelebration from './CompletionCelebration';
import MarkdownText from './MarkdownText';
import { 
  X, 
  Clock, 
  Users, 
  ChefHat, 
  DollarSign, 
  Heart,
  Share2,
  Printer,
  ShoppingCart,
  CheckCircle,
  Minus,
  Plus
} from 'lucide-react';

interface RecipeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  userIngredients?: string[];
  onToggleFavorite?: (recipeId: string) => void;
  onAddToShoppingList?: (recipe: Recipe) => void;
  isFavorite?: boolean;
}

export default function RecipeDetailsModal({
  isOpen,
  onClose,
  recipe,
  userIngredients = [],
  onToggleFavorite,
  onAddToShoppingList,
  isFavorite = false
}: RecipeDetailsModalProps) {
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showCookingAssistant, setShowCookingAssistant] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  if (!isOpen || !recipe) return null;

  const recipeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const recipeInstructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const scalingFactor = servings / (recipe.servings || 1);

  const scaledIngredients = recipeIngredients
    .filter((ingredient) => ingredient && ingredient.name)
    .map(ingredient => ({
      ...ingredient,
      amount: typeof ingredient.amount === 'number' 
        ? Math.round((ingredient.amount * scalingFactor) * 100) / 100 
        : ingredient.amount || 0,
      estimatedPrice: (ingredient as any).estimatedPrice ? (ingredient as any).estimatedPrice * scalingFactor : undefined
    }));

  const totalCost = scaledIngredients.reduce((sum, ing) => sum + ((ing as any).estimatedPrice || 0), 0);

  const missingIngredients = scaledIngredients.filter(ingredient => {
    if (!ingredient?.name) return false;
    
    const hasIngredient = userIngredients.some(userIng =>
      ingredient.name.toLowerCase().includes(userIng.toLowerCase()) ||
      userIng.toLowerCase().includes(ingredient.name.toLowerCase())
    );
    return !hasIngredient;
  });

  const adjustServings = (increment: boolean) => {
    if (increment) {
      setServings(Math.min(servings + 1, 12));
    } else {
      setServings(Math.max(servings - 1, 1));
    }
  };

  const toggleStep = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Recipe link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleAddToShoppingList = () => {
    if (onAddToShoppingList) {
      const scaledRecipe: Recipe = {
        ...recipe,
        servings: servings,
        ingredients: scaledIngredients
      };
      onAddToShoppingList(scaledRecipe);
    }
  };

  const handleAddSingleIngredient = (ingredient: typeof scaledIngredients[0]) => {
    if (onAddToShoppingList) {
      const singleIngredientRecipe: Recipe = {
        ...recipe,
        servings: servings,
        ingredients: [ingredient]
      };
      onAddToShoppingList(singleIngredientRecipe);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-xs sm:max-w-lg md:max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[90vh] sm:h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative flex-shrink-0">
          {recipe.image && (
            <div className="h-20 sm:h-24 md:h-28 bg-gray-200 overflow-hidden">
              <img 
                src={recipe.image} 
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex gap-1">
            <button
              onClick={() => onToggleFavorite?.(recipe.id)}
              className={`p-1 sm:p-1.5 rounded-full backdrop-blur-sm transition-colors ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-1 sm:p-1.5 rounded-full bg-white/80 text-gray-600 hover:bg-white backdrop-blur-sm transition-colors"
              aria-label="Share recipe"
            >
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-full bg-white/80 text-gray-600 hover:bg-white backdrop-blur-sm transition-colors"
              aria-label="Close modal"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Recipe Info */}
        <div className="flex-shrink-0 p-2 sm:p-3 md:p-4 border-b border-gray-200">
          <div className="flex flex-col space-y-2">
            <div className="flex-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1">
                {recipe.title || 'Untitled Recipe'}
              </h1>
              
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>{formatCookingTime(recipe.cookingTime || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChefHat className="w-3 h-3 text-purple-600" />
                  <span className={`px-1 py-0.5 rounded text-xs ${getDifficultyColor(recipe.difficulty || 'Easy')}`}>
                    {recipe.difficulty || 'Easy'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span>{formatPrice((recipe as any).costPerServing || 0)}/serving</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                    {recipe.cuisine || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1.5 sm:p-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                <span className="text-xs font-medium">Servings:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustServings(false)}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label="Decrease servings"
                  >
                    <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                  <span className="w-5 sm:w-6 text-center font-medium text-xs sm:text-sm">{servings}</span>
                  <button
                    onClick={() => adjustServings(true)}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label="Increase servings"
                  >
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {servings !== recipe.servings && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              📏 Recipe scaled from {recipe.servings} to {servings} servings
            </div>
          )}

          {missingIngredients.length > 0 && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-orange-900">
                    🛒 Missing {missingIngredients.length} ingredient{missingIngredients.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-orange-700 truncate">
                    {missingIngredients.slice(0, 2).map(ing => ing.name || 'Unknown').join(', ')}
                    {missingIngredients.length > 2 && ` +${missingIngredients.length - 2} more`}
                  </p>
                </div>
                <button
                  onClick={handleAddToShoppingList}
                  className="ml-2 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors flex-shrink-0"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content*/}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Instructions Section */}
            <div className="lg:col-span-2 order-1">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                🍳 Instructions ({recipeInstructions.length})
              </h3>
              
              {recipeInstructions.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-xs">
                    ⚠️ No cooking instructions available for this recipe.
                  </p>
                </div>
              ) : (
                <div className="bg-white border-2 border-blue-100 rounded-lg overflow-hidden">
                  <div className="p-3 space-y-3">
                    {recipeInstructions.map((instruction, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 p-3 rounded-lg border transition-all ${
                          completedSteps.has(index)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <button
                          onClick={() => toggleStep(index)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                            completedSteps.has(index)
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          aria-label={`Toggle step ${index + 1} completion`}
                        >
                          {completedSteps.has(index) ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </button>
                        <div className={`${completedSteps.has(index) ? 'line-through text-gray-500' : ''} flex-1`}>
                          <MarkdownText className="markdown-content text-sm leading-relaxed">
                            {instruction || 'No instruction provided'}
                          </MarkdownText>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-blue-50 border-t border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900 text-sm">Cooking Progress</span>
                      <span className="text-blue-700 text-sm">
                        {completedSteps.size} of {recipeInstructions.length} completed
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(completedSteps.size / recipeInstructions.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ingredients Section */}
            <div className="lg:col-span-1 order-2">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                🥘 Ingredients ({scaledIngredients.length})
                {scalingFactor !== 1 && (
                  <span className="text-xs text-blue-600">
                    (×{scalingFactor.toFixed(1)})
                  </span>
                )}
              </h3>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {scaledIngredients.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-xs">
                      ⚠️ No ingredients data available for this recipe.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 space-y-2">
                      {scaledIngredients.map((ingredient, index) => {
                        const hasIngredient = userIngredients.some(userIng =>
                          ingredient.name && (
                            ingredient.name.toLowerCase().includes(userIng.toLowerCase()) ||
                            userIng.toLowerCase().includes(ingredient.name.toLowerCase())
                          )
                        );

                        return (
                          <div
                            key={index}
                            className={`p-2 rounded border text-xs ${
                              hasIngredient 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <span className={hasIngredient ? 'font-medium' : ''}>
                                  {hasIngredient && '✓ '}
                                  {ingredient.amount || 0} {ingredient.unit || ''} {ingredient.name || 'Unknown ingredient'}
                                </span>
                                {(ingredient as any).optional && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded ml-1">
                                    Optional
                                  </span>
                                )}
                              </div>
                              
                              {!hasIngredient && (
                                <button
                                  onClick={() => handleAddSingleIngredient(ingredient)}
                                  className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1 flex-shrink-0"
                                  aria-label={`Add ${ingredient.name} to shopping list`}
                                >
                                  <ShoppingCart className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            {(ingredient as any).estimatedPrice && (
                              <div className="text-xs text-gray-600 mt-0.5">
                                ~{formatPrice((ingredient as any).estimatedPrice)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-2">
                      {missingIngredients.length > 0 && (
                        <button
                          onClick={handleAddToShoppingList}
                          className="w-full bg-orange-600 text-white py-2 px-3 rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-xs"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Add All {missingIngredients.length} Missing Items
                        </button>
                      )}

                      {scaledIngredients.length > 0 && missingIngredients.length === 0 && (
                        <div className="flex items-center justify-center gap-2 text-green-800 text-xs p-2 bg-green-100 rounded">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">All ingredients available!</span>
                        </div>
                      )}

                      {scaledIngredients.length > 0 && (
                        <div className="bg-gray-100 rounded p-2 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">Total Cost:</span>
                            <span className="font-bold text-green-600">
                              {formatPrice(totalCost)}
                            </span>
                          </div>
                          <div className="text-gray-600 text-center">
                            {formatPrice(totalCost / servings)} per serving
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Nutrition Info*/}
          {(recipe as any).nutrition && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3 text-sm">Nutrition Information</h4>
              <div className="grid grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round(((recipe as any).nutrition.calories || 0) * scalingFactor)}
                  </div>
                  <div className="text-xs text-gray-600">Calories</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(((recipe as any).nutrition.protein || 0) * scalingFactor)}g
                  </div>
                  <div className="text-xs text-gray-600">Protein</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(((recipe as any).nutrition.carbs || 0) * scalingFactor)}g
                  </div>
                  <div className="text-xs text-gray-600">Carbs</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(((recipe as any).nutrition.fat || 0) * scalingFactor)}g
                  </div>
                  <div className="text-xs text-gray-600">Fat</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(((recipe as any).nutrition.fiber || 0) * scalingFactor)}g
                  </div>
                  <div className="text-xs text-gray-600">Fiber</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-2 sm:p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs text-gray-600 text-center sm:text-left">
              💡 Tip: Tap ingredients to add them individually
            </div>
            
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-3 h-3" />
                Print
              </button>
              
              <button
                onClick={() => setShowCookingAssistant(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
              >
                <ChefHat className="w-3 h-3" />
                Start Cooking
              </button>
              
              {missingIngredients.length > 0 ? (
                <button
                  onClick={handleAddToShoppingList}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span className="truncate">
                    Add {missingIngredients.length}
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-1.5 bg-green-100 text-green-600 rounded text-xs cursor-not-allowed"
                >
                  <CheckCircle className="w-3 h-3" />
                  All Set
                </button>
              )}
              
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <CookingAssistant
        recipe={recipe}
        isActive={showCookingAssistant}
        onComplete={() => {
          setShowCookingAssistant(false);
          setShowCelebration(true);
        }}
        onExit={() => setShowCookingAssistant(false)}
      />

      <CompletionCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        recipe={recipe}
        cookingTimeMinutes={25}
        onRate={(rating) => {
          console.log('Recipe rated:', rating, 'stars');
        }}
        onShare={() => {
          if (navigator.share) {
            navigator.share({
              title: `I just cooked ${recipe.title}!`,
              text: `Just finished making ${recipe.title} using AI Recipe Finder! 🍳👨‍🍳`,
              url: window.location.href
            }).catch(console.error);
          } else {
            alert('🎉 Share your cooking success on social media!');
          }
        }}
        onSaveToFavorites={() => {
          if (onToggleFavorite) {
            onToggleFavorite(recipe.id);
          }
        }}
      />
    </div>
  );
}