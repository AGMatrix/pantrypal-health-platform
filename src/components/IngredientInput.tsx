// src/components/IngredientInput.tsx

'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X, Plus, Sparkles, ChefHat, Search } from 'lucide-react';

interface IngredientInputProps {
  ingredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  placeholder?: string;
}

export default function IngredientInput({ 
  ingredients, 
  onIngredientsChange, 
  placeholder = "Enter an ingredient..." 
}: IngredientInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Vegetable emojis for decoration
  const veggieEmojis = ['🥕', '🥬', '🍅', '🥒', '🌽', '🥔', '🧄', '🧅', '🥦', '🫑', '🍆', '🥑'];
  
  // Generate random positions for floating vegetables (fewer on mobile)
  const generateFloatingVeggies = () => {
    const count = window.innerWidth < 768 ? 6 : 12; // Fewer on mobile for performance
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: veggieEmojis[i % veggieEmojis.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.7 + Math.random() * 0.4, // Smaller on mobile
      rotation: Math.random() * 360,
      delay: Math.random() * 2
    }));
  };

  const [floatingVeggies] = useState(generateFloatingVeggies());

  const addIngredient = () => {
    const trimmedValue = inputValue.trim().toLowerCase();
    
    if (!trimmedValue || ingredients.includes(trimmedValue)) {
      return;
    }

    onIngredientsChange([...ingredients, trimmedValue]);
    setInputValue('');
  };

  const removeIngredient = (ingredientToRemove: string) => {
    const updatedIngredients = ingredients.filter(
      ingredient => ingredient !== ingredientToRemove
    );
    onIngredientsChange(updatedIngredients);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addIngredient();
    }
  };

  const quickAddIngredient = (ingredient: string) => {
    if (!ingredients.includes(ingredient)) {
      onIngredientsChange([...ingredients, ingredient]);
    }
  };

  const popularIngredients = [
    'chicken', 'rice', 'onion', 'garlic', 'tomato', 'pasta', 
    'cheese', 'eggs', 'potato', 'carrot', 'broccoli', 'bell pepper',
    'flour', 'butter', 'milk', 'beef', 'fish', 'spinach',
    'olive oil', 'salt', 'pepper', 'lemon', 'ginger', 'mushrooms'
  ];

  // Filter out already selected ingredients
  const availableIngredients = popularIngredients.filter(
    ingredient => !ingredients.includes(ingredient)
  );

  // Show limited suggestions on mobile, more on larger screens
  const getSuggestionsToShow = () => {
    const maxMobile = 12;
    const maxTablet = 18;
    const maxDesktop = 24;
    
    if (window.innerWidth < 768) {
      return showAllSuggestions ? availableIngredients : availableIngredients.slice(0, maxMobile);
    } else if (window.innerWidth < 1024) {
      return showAllSuggestions ? availableIngredients : availableIngredients.slice(0, maxTablet);
    } else {
      return showAllSuggestions ? availableIngredients : availableIngredients.slice(0, maxDesktop);
    }
  };

  const suggestionsToShow = getSuggestionsToShow();
  const hasMoreSuggestions = availableIngredients.length > suggestionsToShow.length;

  return (
    <div className="w-full">
      {/* Main Input Container - Responsive */}
      <div className={`
        relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50
        ${isInputFocused 
          ? 'border-blue-400 shadow-lg scale-[1.02] sm:scale-105' 
          : ingredients.length > 0 
          ? 'border-green-300 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
        }
      `}>
        {/* Floating Vegetables Background - Responsive */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingVeggies.map((veggie) => (
            <div
              key={veggie.id}
              className="absolute opacity-60 sm:opacity-100 transition-all duration-1000"
              style={{
                left: `${veggie.x}%`,
                top: `${veggie.y}%`,
                transform: `rotate(${veggie.rotation}deg) scale(${veggie.size})`,
                animationDelay: `${veggie.delay}s`
              }}
            >
              <div className="text-lg sm:text-2xl animate-pulse">
                {veggie.emoji}
              </div>
            </div>
          ))}
        </div>

        {/* Header Section - Responsive */}
        <div className="relative z-10 p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Pantry Pal
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 truncate">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                What's cooking in your kitchen?
              </p>
            </div>
          </div>

          {/* Input Section - Responsive */}
          <div className="relative">
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={ingredients.length === 0 ? "Tell me what's in your pantry..." : "Add another ingredient..."}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 md:py-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-500 text-sm sm:text-base touch-manipulation"
                />
                {inputValue && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <button
                onClick={addIngredient}
                disabled={!inputValue.trim()}
                className="px-4 sm:px-6 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm sm:text-base touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/*Only show when ingredients exist */}
        {ingredients.length > 0 && (
          <div className="relative z-10 px-4 sm:px-6 pb-3 sm:pb-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-base sm:text-lg">🧺</span>
                  Your Pantry ({ingredients.length} items)
                </h4>
                <div className="text-xs sm:text-sm text-green-600 font-medium">
                  {ingredients.length >= 3 ? '🎉 Great selection!' : 'Add more for better matches'}
                </div>
              </div>
              
              {/* Ingredient Tags - Responsive Grid */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 rounded-full text-xs sm:text-sm font-medium border border-green-200 hover:shadow-md transition-all"
                  >
                    <span className="capitalize truncate max-w-[100px] sm:max-w-none">{ingredient}</span>
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center group-hover:scale-110 touch-manipulation"
                      aria-label={`Remove ${ingredient}`}
                    >
                      <X className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Recipe matching power</span>
                  <span>{Math.min(ingredients.length * 20, 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(ingredients.length * 20, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {ingredients.length < 3 
                    ? `Add ${3 - ingredients.length} more for optimal results` 
                    : 'Perfect! You\'re ready to find amazing recipes 🚀'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Popular Ingredients Section - Always show if there are available ingredients */}
        {availableIngredients.length > 0 && (
          <div className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50">
              {ingredients.length === 0 ? (
                /* Empty State with Welcome Message */
                <div className="text-center mb-3 sm:mb-4">
                  <div className="text-2xl sm:text-3xl md:text-4xl mb-2">🥗</div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Your Virtual Pantry Awaits!</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Add ingredients to discover amazing recipes you can make right now
                  </p>
                </div>
              ) : (
                /* Compact header for when ingredients exist */
                <div className="mb-3 sm:mb-4">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2 text-sm sm:text-base">
                    <span className="text-base sm:text-lg">✨</span>
                    Quick Add More
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Select from popular ingredients to expand your pantry
                  </p>
                </div>
              )}

              {/* Quick Add Popular Ingredients - Responsive Grid */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
                  {suggestionsToShow.map((ingredient) => (
                    <button
                      key={ingredient}
                      onClick={() => quickAddIngredient(ingredient)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-green-100 to-blue-100 text-gray-700 rounded-lg hover:from-green-200 hover:to-blue-200 transition-all border border-green-200 hover:shadow-md transform hover:scale-105 active:scale-95 capitalize truncate touch-manipulation"
                    >
                      {ingredient}
                    </button>
                  ))}
                </div>

                {/* Show More/Less Button */}
                {hasMoreSuggestions && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors font-medium touch-manipulation"
                    >
                      {showAllSuggestions ? 'Show Less' : `Show ${availableIngredients.length - suggestionsToShow.length} More`}
                    </button>
                  </div>
                )}
              </div>

              {/* Fun Tips - Context Aware */}
              {ingredients.length === 0 && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <p className="text-xs sm:text-sm text-yellow-800 flex items-start gap-2">
                    <span className="text-sm sm:text-base">💡</span>
                    <span>
                      <strong>Pro Tip:</strong> The more ingredients you add, the better recipe matches I can find!
                    </span>
                  </p>
                </div>
              )}

              {/* Quick tip for existing ingredients */}
              {ingredients.length > 0 && availableIngredients.length <= 6 && (
                <div className="mt-3 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-sm">🎯</span>
                    <span>
                      <strong>Almost there!</strong> You've selected most popular ingredients. Try typing custom ones!
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All ingredients selected state */}
        {availableIngredients.length === 0 && ingredients.length > 0 && (
          <div className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 text-center">
              <div className="text-xl sm:text-2xl mb-2">🌟</div>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Fantastic Selection!</h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                You've added all our popular ingredients. Keep going by typing custom ingredients above!
              </p>
              <div className="text-xs sm:text-sm text-green-600 font-medium">
                Ready to discover amazing recipes? 🚀
              </div>
            </div>
          </div>
        )}

        {/* Border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400"></div>
      </div>

      {/* Additional Quick Actions - Mobile Optimized */}
      {ingredients.length > 0 && (
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 justify-center">
          <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 px-3 py-1.5 bg-white/80 rounded-full border border-gray-200">
            <Sparkles className="w-3 h-3" />
            Ready to cook? Search for recipes above! 
          </div>
        </div>
      )}

      {/* Floating Action Hints - Only for completely empty state */}
      {ingredients.length === 0 && availableIngredients.length > 0 && (
        <div className="mt-3 sm:mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs sm:text-sm border border-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">Start by clicking ingredients below or typing your own</span>
            <span className="sm:hidden">Tap ingredients below or type above</span>
          </div>
        </div>
      )}

      {/* Custom mobile styles */}
      <style jsx>{`
        /* Ensure proper touch targets on mobile */
        @media (max-width: 768px) {
          .touch-manipulation {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
        }
        
        /* Smooth animations for all devices */
        .animate-pulse {
          animation-duration: 2s;
        }
        
        /* Better text truncation on mobile */
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}