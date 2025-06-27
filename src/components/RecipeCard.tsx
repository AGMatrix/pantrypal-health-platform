// src/components/RecipeCard.tsx

'use client';

import React, { useState } from 'react';
import { Recipe } from '@/types/recipe';
import { formatCookingTime, formatPrice, formatRating, getDifficultyColor } from '@/lib/utils';
import DeliveryOptionsModal from './DeliveryOptionsModal';
import MarkdownText from './MarkdownText';
import { 
  Clock, 
  Users, 
  DollarSign, 
  Heart, 
  ChefHat,
  Zap,
  Eye,
  ShoppingCart,
  Truck,
  Star,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onViewDetails?: (recipe: Recipe) => void;
  onAddToCart?: (recipe: Recipe) => void;
  onToggleFavorite?: (recipeId: string) => void;
  isFavorite?: boolean;
  isLoading?: boolean;
  userIngredients?: string[];
}

// Fallback images for different cuisine types
const cuisineFallbacks: Record<string, string> = {
  'Asian': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80',
  'Italian': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80',
  'Mexican': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&auto=format&q=80',
  'American': 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=400&h=300&fit=crop&auto=format&q=80',
  'Mediterranean': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format&q=80',
  'French': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&auto=format&q=80',
  'Indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&auto=format&q=80',
  'Thai': 'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400&h=300&fit=crop&auto=format&q=80',
  'Chinese': 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=300&fit=crop&auto=format&q=80',
  'Japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&auto=format&q=80',
  'Other': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format&q=80'
};

const genericFallback = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format&q=80';

export default function RecipeCard({ 
  recipe, 
  onViewDetails,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  isLoading = false,
  userIngredients = []
}: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(
    recipe.image || cuisineFallbacks[recipe.cuisine || 'Other'] || genericFallback
  );
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Safe access to ingredients array
  const recipeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  
  // Enhanced button handlers with better error handling and user feedback
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onViewDetails) {
      onViewDetails(recipe);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart(recipe);
    }
  };

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (toggling || !onToggleFavorite) {
      return;
    }

    setToggling(true);
    
    try {
      await onToggleFavorite(recipe.id);
    } catch (error) {
      console.error('Heart click error:', error);
    } finally {
      setToggling(false);
    }
  };

  const handleDeliveryOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeliveryOptions(true);
  };

  // Enhanced image error handling with cascading fallbacks
  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      
      const cuisineFallback = cuisineFallbacks[recipe.cuisine || 'Other'];
      if (currentImageSrc !== cuisineFallback && cuisineFallback) {
        setCurrentImageSrc(cuisineFallback);
        return;
      }
      
      if (currentImageSrc !== genericFallback) {
        setCurrentImageSrc(genericFallback);
        return;
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Get matching ingredients count
  const getMatchingIngredientsCount = () => {
    return recipeIngredients.filter(ingredient =>
      userIngredients.some(userIng =>
        ingredient.name && (
          ingredient.name.toLowerCase().includes(userIng.toLowerCase()) ||
          userIng.toLowerCase().includes(ingredient.name.toLowerCase())
        )
      )
    ).length;
  };

  const matchingIngredients = getMatchingIngredientsCount();
  const totalIngredients = recipeIngredients.length;
  const matchPercentage = totalIngredients > 0 ? Math.round((matchingIngredients / totalIngredients) * 100) : 0;

  // Generate emoji based on cuisine for fallback
  const getCuisineEmoji = (cuisine: string) => {
    const emojis: Record<string, string> = {
      'Asian': '🥢',
      'Italian': '🍝',
      'Mexican': '🌮',
      'American': '🍔',
      'Mediterranean': '🫒',
      'French': '🥖',
      'Indian': '🍛',
      'Thai': '🌶️',
      'Chinese': '🥡',
      'Japanese': '🍱',
      'Other': '🍽️'
    };
    return emojis[cuisine] || '🍽️';
  };

  return (
    <>
      <div className="group relative bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:scale-[1.02] sm:hover:scale-105 hover:-translate-y-1">
        
        {/* Image Section - Responsive Heights */}
        <div className="relative h-36 sm:h-44 md:h-48 lg:h-56 xl:h-60 overflow-hidden bg-gray-100">
          
          {/* Recipe Image */}
          {!imageError && currentImageSrc ? (
            <>
              <img
                src={currentImageSrc}
                alt={recipe.title}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </>
          ) : (
            // Enhanced fallback with cuisine theming
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2">{getCuisineEmoji(recipe.cuisine || 'Other')}</div>
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-300 mb-2" />
              <span className="text-xs sm:text-sm text-gray-500 text-center px-2">
                {recipe.cuisine || 'Delicious'} Cuisine
              </span>
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 flex gap-1 sm:gap-1.5 md:gap-2">
            
            <button
              onClick={handleHeartClick}
              disabled={toggling || isLoading}
              className={`p-1.5 sm:p-2 md:p-2.5 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm transform hover:scale-110 active:scale-95 z-10 touch-manipulation ${
                toggling || isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'opacity-90 hover:opacity-100'
              } ${
                isFavorite 
                  ? 'bg-red-500 text-white shadow-red-200' 
                  : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {toggling ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Heart className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isFavorite ? 'fill-current' : ''}`} />
              )}
            </button>

            {/* Add to Cart Button */}
            {onAddToCart && (
              <button
                onClick={handleAddToCart}
                className="p-1.5 sm:p-2 md:p-2.5 bg-white/90 hover:bg-green-500 text-gray-600 hover:text-white rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm transform hover:scale-110 active:scale-95 touch-manipulation"
                aria-label="Add to shopping list"
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>

          {/* Rating badge - Top Left */}
          {recipe.rating && (
            <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 bg-black/70 text-white px-2 py-1 sm:px-2.5 sm:py-1.5 rounded text-xs sm:text-sm flex items-center gap-1 backdrop-blur-sm">
              <Star className="w-3 h-3 fill-current text-yellow-400" />
              <span className="hidden sm:inline">{formatRating(recipe.rating)}</span>
              <span className="sm:hidden">{formatRating(recipe.rating)}</span>
            </div>
          )}

          {/* Ingredient Match Badge - Enhanced */}
          {userIngredients.length > 0 && totalIngredients > 0 && matchingIngredients > 0 && (
            <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 right-2 sm:right-3 md:right-4">
              <div className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg backdrop-blur-sm ${
                matchPercentage >= 80 ? 'bg-green-500 text-white' :
                matchPercentage >= 50 ? 'bg-yellow-500 text-white' :
                'bg-orange-500 text-white'
              }`}>
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{matchingIngredients}/{totalIngredients}</span>
                <span className="sm:hidden">{matchPercentage}%</span>
              </div>
            </div>
          )}

          {/* Difficulty Badge - Bottom Left */}
          <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4">
            <span className={`px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg backdrop-blur-sm ${getDifficultyColor(recipe.difficulty || 'Easy')}`}>
              <span className="hidden sm:inline">{recipe.difficulty || 'Easy'}</span>
              <span className="sm:hidden">{(recipe.difficulty || 'Easy').charAt(0)}</span>
            </span>
          </div>

          {/* Quick View Button - Desktop Only */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden lg:flex">
            <button
              onClick={handleViewDetails}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl font-medium shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-105 flex items-center gap-2 touch-manipulation"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Quick View</span>
            </button>
          </div>
        </div>

        {/* Content Section - Enhanced Mobile Layout */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3">
          
          {/* Title and Description */}
          <div className="space-y-1 sm:space-y-2">
            <h3 
              className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer"
              onClick={handleViewDetails}
            >
              {recipe.title}
            </h3>
            
            {recipe.description && (
              <div className="relative">
                <MarkdownText className={`text-xs sm:text-sm text-gray-600 leading-relaxed transition-all duration-200 ${
                  showFullDescription ? '' : 'line-clamp-2'
                }`}>
                  {recipe.description}
                </MarkdownText>
                
                {/* Show more/less button for long descriptions */}
                {recipe.description.length > 100 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullDescription(!showFullDescription);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium mt-1 transition-colors touch-manipulation"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* Rating and Reviews */}
            {recipe.rating && (recipe as any).reviews && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                  <span className="font-medium text-gray-900">
                    {formatRating(recipe.rating)}
                  </span>
                </div>
                <span className="text-gray-500">
                  ({(recipe as any).reviews} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Recipe Details Grid - Responsive */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
            
            {/* Cooking Time */}
            {recipe.cookingTime && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                <span className="font-medium truncate">{formatCookingTime(recipe.cookingTime)}</span>
              </div>
            )}

            {/* Servings */}
            {recipe.servings && (
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="font-medium truncate">{recipe.servings} serves</span>
              </div>
            )}

            {/* Cost */}
            {(recipe as any).costPerServing && (
              <div className="flex items-center gap-1 text-gray-600">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                <span className="font-medium truncate">{formatPrice((recipe as any).costPerServing)}</span>
              </div>
            )}
          </div>

          {/* Nutrition Info - Compact for Mobile */}
          {(recipe as any).nutrition && (
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
              <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm text-center">
                <div>
                  <div className="font-medium text-gray-900">{(recipe as any).nutrition.calories}</div>
                  <div className="text-gray-600 text-xs">cal</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{(recipe as any).nutrition.protein}g</div>
                  <div className="text-gray-600 text-xs">protein</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{(recipe as any).nutrition.carbs}g</div>
                  <div className="text-gray-600 text-xs">carbs</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{(recipe as any).nutrition.fat}g</div>
                  <div className="text-gray-600 text-xs">fat</div>
                </div>
              </div>
            </div>
          )}

          {/* Cuisine and Dietary Tags - Responsive */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {recipe.cuisine && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                {recipe.cuisine}
              </span>
            )}
            
            {(recipe as any).dietary && (recipe as any).dietary.slice(0, 2).map((diet: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                {diet}
              </span>
            ))}
            
            {(recipe as any).dietary && (recipe as any).dietary.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                +{(recipe as any).dietary.length - 2}
              </span>
            )}
          </div>

          {/* Ingredient Match Summary */}
          {userIngredients.length > 0 && matchingIngredients > 0 && totalIngredients > 0 && (
            <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl">
              <div className="text-xs sm:text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>
                  <span className="font-medium">Great match!</span> You have {matchingIngredients} of {totalIngredients} ingredients
                </span>
              </div>
            </div>
          )}

          {/* Health Warnings/Benefits - Mobile Friendly */}
          {(recipe as any).healthWarnings && (recipe as any).healthWarnings.length > 0 && (
            <div className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-yellow-800">
                  <div className="font-medium mb-1">Health Note:</div>
                  <div>{(recipe as any).healthWarnings[0]}</div>
                  {(recipe as any).healthWarnings.length > 1 && (
                    <div className="text-yellow-600 mt-1">+{(recipe as any).healthWarnings.length - 1} more</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(recipe as any).healthBenefits && (recipe as any).healthBenefits.length > 0 && (
            <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-green-800">
                  <div className="font-medium mb-1">Health Benefit:</div>
                  <div>{(recipe as any).healthBenefits[0]}</div>
                  {(recipe as any).healthBenefits.length > 1 && (
                    <div className="text-green-600 mt-1">+{(recipe as any).healthBenefits.length - 1} more</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Enhanced Mobile Layout */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
            <button
              type="button"
              onClick={handleViewDetails}
              className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>View Recipe</span>
            </button>
            
            <div className="flex gap-2 sm:gap-3">
              {onAddToCart && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 sm:flex-none px-3 py-2.5 sm:px-4 sm:py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation"
                >
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">Add to Cart</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDeliveryOptions}
                className="flex-1 sm:flex-none px-3 py-2.5 sm:px-4 sm:py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="sm:hidden">Delivery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-transparent group-hover:border-purple-200 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Delivery Options Modal */}
      <DeliveryOptionsModal
        isOpen={showDeliveryOptions}
        onClose={() => setShowDeliveryOptions(false)}
        recipe={recipe}
        userIngredients={userIngredients}
      />

      {/* Custom styles for enhanced mobile experience */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Better touch targets on mobile */
        @media (max-width: 768px) {
          button {
            min-height: 44px; /* iOS recommended touch target size */
          }
        }
        
        /* Smooth scrolling for any overflow */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Enhanced hover states for touch devices */
        @media (hover: none) {
          .group:hover .scale-110 {
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
}