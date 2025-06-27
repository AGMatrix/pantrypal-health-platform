// src/hooks/useFavorites.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchFavorites, 
  addToFavorites, 
  removeFromFavorites, 
  toggleFavorite,
  isRecipeFavorited,
  type Recipe, 
  type Favorite 
} from '@/lib/favorites';

interface UseFavoritesReturn {
  favorites: Favorite[];
  isLoading: boolean;
  error: string | null;
  favoritesCount: number;
  isRecipeFavorited: (recipeId: string) => boolean;
  addFavorite: (recipe: Recipe) => Promise<boolean>;
  removeFavorite: (recipeId: string) => Promise<boolean>;
  toggleFavoriteStatus: (recipe: Recipe) => Promise<'added' | 'removed' | 'error'>;
  refreshFavorites: () => Promise<void>;
  clearError: () => void;
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFavorites();
      
      if (result.success) {
        setFavorites(result.favorites);
      } else {
        setError(result.error || 'Failed to load favorites');
      }
    } catch (err) {
      setError('Network error while loading favorites');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addFavorite = useCallback(async (recipe: Recipe): Promise<boolean> => {
    try {
      const result = await addToFavorites(recipe);
      
      if (result.success && result.favorite) {
        setFavorites(prev => [...prev, result.favorite!]);
        return true;
      } else {
        setError(result.error || 'Failed to add favorite');
        return false;
      }
    } catch (err) {
      setError('Network error while adding favorite');
      return false;
    }
  }, []);

  const removeFavorite = useCallback(async (recipeId: string): Promise<boolean> => {
    try {
      const result = await removeFromFavorites(recipeId);
      
      if (result.success) {
        setFavorites(prev => prev.filter(fav => fav.recipeId !== recipeId));
        return true;
      } else {
        setError(result.error || 'Failed to remove favorite');
        return false;
      }
    } catch (err) {
      setError('Network error while removing favorite');
      return false;
    }
  }, []);

  const toggleFavoriteStatus = useCallback(async (recipe: Recipe): Promise<'added' | 'removed' | 'error'> => {
    try {
      const result = await toggleFavorite(recipe, favorites);
      
      if (result.success) {
        setFavorites(result.updatedFavorites);
        return result.action;
      } else {
        setError(result.error || `Failed to ${result.action} favorite`);
        return 'error';
      }
    } catch (err) {
      setError('Network error while updating favorite');
      return 'error';
    }
  }, [favorites]);

  const isRecipeFavoritedMemo = useCallback((recipeId: string): boolean => {
    return isRecipeFavorited(recipeId, favorites);
  }, [favorites]);

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    favorites,
    isLoading,
    error,
    favoritesCount: favorites.length,
    isRecipeFavorited: isRecipeFavoritedMemo,
    addFavorite,
    removeFavorite,
    toggleFavoriteStatus,
    refreshFavorites,
    clearError
  };
}