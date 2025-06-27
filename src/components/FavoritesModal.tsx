// src/components/FavoritesModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Heart, Clock, Users, ChefHat, Trash2, Star, Search, Eye, ShoppingCart, Filter } from 'lucide-react';
import { Recipe } from '@/types/recipe';
import { fetchFavorites, removeFromFavorites, type Favorite } from '@/lib/favorites';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewRecipe?: (recipe: Recipe) => void;
  onAddToShoppingList?: (recipe: Recipe) => void;
  onFavoritesChange?: (favorites: Favorite[]) => void;
}

export default function FavoritesModal({ 
  isOpen, 
  onClose, 
  onViewRecipe, 
  onAddToShoppingList,
  onFavoritesChange
}: FavoritesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load favorites when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  const loadFavorites = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading favorites from database...');
      const result = await fetchFavorites();
      
      if (result.success && result.favorites) {
        setFavorites(result.favorites);
        console.log(`✅ Loaded ${result.favorites.length} favorites`);
        
        if (onFavoritesChange) {
          onFavoritesChange(result.favorites);
        }
      } else {
        setError(result.error || 'Failed to load favorites');
        console.error('❌ Failed to load favorites:', result.error);
      }
    } catch (err) {
      const errorMessage = 'Failed to load favorites';
      setError(errorMessage);
      console.error('❌ Error loading favorites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRecipe = (favorite: Favorite) => {
    if (onViewRecipe && favorite.recipe) {
      console.log('👀 FavoritesModal: Viewing recipe:', favorite.recipe.title);
      // Convert the favorite.recipe to match the expected Recipe type
      const recipeData: Recipe = {
        id: favorite.recipe.id || favorite.recipeId,
        title: favorite.recipe.title || '',
        description: favorite.recipe.description || '',
        ingredients: favorite.recipe.ingredients || [],
        instructions: favorite.recipe.instructions || [],
        cookingTime: favorite.recipe.cookingTime || 0,
        servings: favorite.recipe.servings || 1,
        difficulty: (favorite.recipe.difficulty as any) || 'Easy',
        cuisine: (favorite.recipe.cuisine as any) || 'International',
        rating: favorite.recipe.rating || 0,
        image_url: favorite.recipe.image_url || favorite.recipe.image || '',
        image: favorite.recipe.image || favorite.recipe.image_url || '',
        ...(favorite.recipe.dietary && { dietary: favorite.recipe.dietary }),
      };
      onViewRecipe(recipeData);
      onClose();
    } else {
      console.warn('⚠️ FavoritesModal: No recipe data or onViewRecipe handler');
    }
  };

  const handleAddToShoppingList = (favorite: Favorite) => {
    if (onAddToShoppingList && favorite.recipe) {
      console.log('🛒 FavoritesModal: Adding to shopping list:', favorite.recipe.title);
      // Convert the favorite.recipe to match the expected Recipe type
      const recipeData: Recipe = {
        id: favorite.recipe.id || favorite.recipeId,
        title: favorite.recipe.title || '',
        description: favorite.recipe.description || '',
        ingredients: favorite.recipe.ingredients || [],
        instructions: favorite.recipe.instructions || [],
        cookingTime: favorite.recipe.cookingTime || 0,
        servings: favorite.recipe.servings || 1,
        difficulty: (favorite.recipe.difficulty as any) || 'Easy',
        cuisine: (favorite.recipe.cuisine as any) || 'International',
        rating: favorite.recipe.rating || 0,
        image_url: favorite.recipe.image_url || favorite.recipe.image || '',
        image: favorite.recipe.image || favorite.recipe.image_url || '',
        ...(favorite.recipe.dietary && { dietary: favorite.recipe.dietary }),
      };
      onAddToShoppingList(recipeData);
    } else {
      console.warn('⚠️ FavoritesModal: No recipe data or onAddToShoppingList handler');
    }
  };

  const handleRemoveFavorite = async (recipeId: string) => {
    try {
      console.log('🗑️ FavoritesModal: Removing favorite:', recipeId);
      
      const result = await removeFromFavorites(recipeId);
      
      if (result.success) {
        const updatedFavorites = favorites.filter(fav => fav.recipeId !== recipeId);
        setFavorites(updatedFavorites);
        
        if (onFavoritesChange) {
          onFavoritesChange(updatedFavorites);
        }
        
        console.log('✅ Favorite removed successfully');
      } else {
        setError(result.error || 'Failed to remove favorite');
        console.error('❌ Failed to remove favorite:', result.error);
      }
    } catch (err) {
      setError('Failed to remove favorite');
      console.error('❌ Error removing favorite:', err);
    }
  };

  // Get unique cuisines and difficulties for filters
  const availableCuisines = Array.from(new Set(
    favorites
      .map(fav => fav.recipe?.cuisine)
      .filter(Boolean)
  )).sort();

  const availableDifficulties = Array.from(new Set(
    favorites
      .map(fav => fav.recipe?.difficulty)
      .filter(Boolean)
  )).sort();

  // Filter favorites based on search and filters
  const filteredFavorites = favorites.filter(favorite => {
    const recipe = favorite.recipe;
    if (!recipe) return false;

    // Text search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        recipe.title?.toLowerCase().includes(searchLower) ||
        recipe.description?.toLowerCase().includes(searchLower) ||
        recipe.cuisine?.toLowerCase().includes(searchLower) ||
        (Array.isArray(recipe.dietary) && recipe.dietary.some(diet => 
          diet.toLowerCase().includes(searchLower)
        ));
      
      if (!matchesSearch) return false;
    }

    // Cuisine filter
    if (selectedCuisine && recipe.cuisine !== selectedCuisine) return false;

    // Difficulty filter
    if (selectedDifficulty && recipe.difficulty !== selectedDifficulty) return false;

    return true;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCuisine('');
    setSelectedDifficulty('');
    setShowFilters(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-6xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center py-3 bg-gradient-to-r from-pink-500 via-red-500 to-rose-500">
          <div className="w-8 h-1 bg-white/50 rounded-full"></div>
        </div>

        {/* Header - Responsive */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-rose-500"></div>
          
          <div className="relative flex items-center justify-between p-4 sm:p-6 text-white">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">My Favorite Recipes</h2>
                <p className="text-pink-100 text-sm sm:text-base">
                  {isLoading ? 'Loading...' : `${favorites.length} saved recipe${favorites.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-pink-200 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Search and Filters - Mobile Optimized */}
        {favorites.length > 0 && !isLoading && (
          <div className="border-b bg-gray-50 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search your favorites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base touch-manipulation"
                />
              </div>

              {/* Filter Toggle and Filters */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {(selectedCuisine || selectedDifficulty) && (
                    <span className="ml-1 px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs">
                      {(selectedCuisine ? 1 : 0) + (selectedDifficulty ? 1 : 0)}
                    </span>
                  )}
                </button>

                {(searchTerm || selectedCuisine || selectedDifficulty) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                    <select
                      value={selectedCuisine}
                      onChange={(e) => setSelectedCuisine(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm sm:text-base touch-manipulation"
                    >
                      <option value="">All Cuisines</option>
                      {availableCuisines.map(cuisine => (
                        <option key={cuisine} value={cuisine}>{cuisine}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm sm:text-base touch-manipulation"
                    >
                      <option value="">All Levels</option>
                      {availableDifficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          
          {/* Error State */}
          {error && (
            <div className="mb-4 sm:mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <p className="text-red-700 mt-1 text-sm sm:text-base">{error}</p>
              <button
                onClick={loadFavorites}
                className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium touch-manipulation"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12 sm:py-16">
              <div className="inline-block animate-spin rounded-full h-8 h-8 sm:h-12 sm:w-12 border-b-2 border-pink-600 mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Loading your favorites from database...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredFavorites.length === 0 && favorites.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-300" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No favorites yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                  Start adding recipes to your favorites by clicking the heart icon on recipe cards. Your favorites will be saved to your account.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl hover:from-pink-600 hover:to-red-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base touch-manipulation"
                >
                  Explore Recipes
                </button>
              </div>
            </div>
          )}

          {/* Search No Results */}
          {!isLoading && !error && filteredFavorites.length === 0 && favorites.length > 0 && (searchTerm || selectedCuisine || selectedDifficulty) && (
            <div className="text-center py-12 sm:py-16">
              <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No matching favorites</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="px-4 sm:px-6 py-2 text-pink-600 hover:text-pink-800 font-medium hover:bg-pink-50 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
              >
                Clear search and filters
              </button>
            </div>
          )}

          {/* Favorites Grid - Responsive */}
          {!isLoading && !error && filteredFavorites.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Showing {filteredFavorites.length} of {favorites.length} favorites
                </h3>
                <div className="text-xs sm:text-sm text-gray-500">
                  Synced with database
                </div>
              </div>
              
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFavorites.map((favorite) => {
                  const recipe = favorite.recipe;
                  const imageUrl = recipe?.image_url || recipe?.image;
                  
                  return (
                    <div
                      key={favorite.id}
                      className="group bg-white border border-gray-200 rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      {/* Recipe Image */}
                      <div className="relative h-40 sm:h-48 md:h-52 bg-gradient-to-br from-purple-100 to-pink-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={recipe?.title || 'Recipe'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="w-12 h-12 sm:w-16 sm:h-16 text-purple-300" />
                          </div>
                        )}
                        
                        {/* Remove button */}
                        <button
                          onClick={() => handleRemoveFavorite(favorite.recipeId)}
                          className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 touch-manipulation"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                        </button>

                        {/* Favorite indicator */}
                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                          <div className="p-1.5 sm:p-2 bg-red-500 rounded-full shadow-lg">
                            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-current" />
                          </div>
                        </div>
                      </div>

                      {/* Recipe Details */}
                      <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2">
                          {recipe?.title || `Recipe ${favorite.recipeId}`}
                        </h3>
                        
                        {recipe?.description && (
                          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                            {recipe.description}
                          </p>
                        )}

                        {/* Recipe Meta - Responsive */}
                        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          {recipe?.cookingTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              {recipe.cookingTime}m
                            </div>
                          )}
                          {recipe?.servings && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                              {recipe.servings}
                            </div>
                          )}
                          {recipe?.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                              {recipe.rating}
                            </div>
                          )}
                        </div>

                        {/* Cuisine & Difficulty Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {recipe?.cuisine && (
                            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                              {recipe.cuisine}
                            </span>
                          )}
                          {recipe?.difficulty && (
                            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {recipe.difficulty}
                            </span>
                          )}
                          {recipe?.dietary && Array.isArray(recipe.dietary) && recipe.dietary.length > 0 && (
                            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              {recipe.dietary[0]}
                              {recipe.dietary.length > 1 && ` +${recipe.dietary.length - 1}`}
                            </span>
                          )}
                        </div>

                        {/* Actions - Responsive Stack */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                          <button
                            onClick={() => handleViewRecipe(favorite)}
                            className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            View Recipe
                          </button>
                          
                          {onAddToShoppingList && (
                            <button
                              onClick={() => handleAddToShoppingList(favorite)}
                              className="sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation"
                              title="Add to shopping list"
                            >
                              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="sm:hidden">Add to Cart</span>
                            </button>
                          )}
                        </div>

                        {/* Added date */}
                        <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
                          Saved {new Date(favorite.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Responsive */}
        <div className="border-t bg-gray-50 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              💡 Your favorites are automatically saved to your account
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {!isLoading && error && (
                <button
                  onClick={loadFavorites}
                  className="order-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                >
                  Retry
                </button>
              )}
              <button
                onClick={onClose}
                className="order-2 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-600 text-white rounded-lg sm:rounded-xl hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom styles for better mobile experience */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Touch-friendly scrolling */
        @media (max-width: 768px) {
          .overflow-y-auto {
            -webkit-overflow-scrolling: touch;
          }
        }
        
        /* Better hover states for touch devices */
        @media (hover: none) {
          .group:hover .opacity-0 {
            opacity: 1;
          }
          .group:hover .translate-y-2 {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}