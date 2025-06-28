// src/app/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Recipe, SearchFilters } from '@/types/recipe';
import { searchRecipesWithParsing, searchRecipesAdvanced, checkAPIConnection } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import TopNavigation from '@/components/TopNavigation';
import IngredientInput from '@/components/IngredientInput';
import QuickFilters from '@/components/QuickFilters';
import RecipeCard from '@/components/RecipeCard';
import AdvancedSearch from '@/components/AdvancedSearch';
import RecipeDetailsModal from '@/components/RecipeDetailsModal';
import SmartShoppingList from '@/components/SmartShoppingList';
import FavoritesModal from '@/components/FavoritesModal';
import HealthProfileModal from '@/components/HealthProfileModal';
import DietPlanViewer from '@/components/DietPlanViewer';
import AuthModal from '@/components/AuthModal';
import { Search, Loader2, AlertCircle, Sparkles, Filter, Heart, Brain, ChefHat, Star, Utensils } from 'lucide-react';
import UserGuide, { QuickTips } from '@/components/UserGuide';

// Mock recipe data
const mockRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    title: 'Quick Chicken Stir Fry',
    description: 'A delicious and healthy stir fry ready in 20 minutes with vibrant vegetables and tender chicken',
    ingredients: [
      { name: 'chicken breast', amount: 1, unit: 'lb', estimatedPrice: 6.99 },
      { name: 'mixed vegetables', amount: 2, unit: 'cups', estimatedPrice: 3.50 },
      { name: 'soy sauce', amount: 3, unit: 'tbsp', estimatedPrice: 0.50 },
      { name: 'garlic', amount: 2, unit: 'cloves', estimatedPrice: 0.25 },
      { name: 'ginger', amount: 1, unit: 'tsp', estimatedPrice: 0.15 },
      { name: 'oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.30 }
    ],
    instructions: [
      'Cut chicken into bite-sized pieces and season with salt and pepper',
      'Heat oil in a large skillet or wok over medium-high heat',
      'Add chicken and cook for 5-7 minutes until golden brown',
      'Add garlic and ginger, cook for 30 seconds until fragrant',
      'Add mixed vegetables and stir-fry for 3-4 minutes',
      'Pour in soy sauce and stir everything together',
      'Cook for 1-2 more minutes until vegetables are tender-crisp',
      'Serve immediately over rice or noodles'
    ],
    cookingTime: 20,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'Asian',
    dietary: ['high-protein'],
    nutrition: {
      calories: 285,
      protein: 28,
      carbs: 12,
      fat: 14,
      fiber: 3
    },
    costPerServing: 2.75,
    estimatedCost: 11.00,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.5,
    reviews: 128
  },
  {
    id: 'recipe-2',
    title: 'Budget Rice and Beans',
    description: 'Nutritious and affordable rice bowl with protein-packed black beans and aromatic spices',
    ingredients: [
      { name: 'rice', amount: 1, unit: 'cup', estimatedPrice: 0.50 },
      { name: 'black beans', amount: 1, unit: 'can', estimatedPrice: 1.00 },
      { name: 'onion', amount: 0.5, unit: 'medium', estimatedPrice: 0.25 },
      { name: 'garlic', amount: 2, unit: 'cloves', estimatedPrice: 0.25 },
      { name: 'cumin', amount: 1, unit: 'tsp', estimatedPrice: 0.10 },
      { name: 'oil', amount: 1, unit: 'tbsp', estimatedPrice: 0.15 }
    ],
    instructions: [
      'Cook rice according to package directions',
      'Heat oil in a pan, sauté diced onion until translucent',
      'Add garlic and cumin, cook for 1 minute',
      'Add drained black beans and heat through',
      'Season with salt and pepper',
      'Serve beans over rice'
    ],
    cookingTime: 25,
    servings: 3,
    difficulty: 'Easy',
    cuisine: 'Mexican',
    dietary: ['vegetarian', 'high-protein'],
    nutrition: {
      calories: 320,
      protein: 12,
      carbs: 58,
      fat: 4,
      fiber: 8
    },
    costPerServing: 0.75,
    estimatedCost: 2.25,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.2,
    reviews: 89
  },
  {
    id: 'recipe-3',
    title: 'Quick Pasta Aglio e Olio',
    description: 'Simple Italian pasta with garlic and olive oil - a classic comfort dish in under 15 minutes',
    ingredients: [
      { name: 'spaghetti', amount: 8, unit: 'oz', estimatedPrice: 1.00 },
      { name: 'olive oil', amount: 0.25, unit: 'cup', estimatedPrice: 1.50 },
      { name: 'garlic', amount: 4, unit: 'cloves', estimatedPrice: 0.50 },
      { name: 'red pepper flakes', amount: 0.5, unit: 'tsp', estimatedPrice: 0.10 },
      { name: 'parsley', amount: 0.25, unit: 'cup', estimatedPrice: 0.75 },
      { name: 'parmesan cheese', amount: 0.5, unit: 'cup', estimatedPrice: 2.00 }
    ],
    instructions: [
      'Cook spaghetti according to package directions until al dente',
      'While pasta cooks, heat olive oil in large skillet',
      'Add sliced garlic and red pepper flakes to oil',
      'Cook until garlic is golden, about 2 minutes',
      'Drain pasta, reserving 1/2 cup pasta water',
      'Add pasta to skillet with garlic oil',
      'Toss with pasta water and parsley',
      'Serve with grated parmesan'
    ],
    cookingTime: 15,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Italian',
    dietary: ['vegetarian'],
    nutrition: {
      calories: 420,
      protein: 14,
      carbs: 58,
      fat: 16,
      fiber: 4
    },
    costPerServing: 2.95,
    estimatedCost: 5.90,
    image: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.6,
    reviews: 156
  },
  {
    id: 'recipe-4',
    title: 'Fancy Salmon Fillet',
    description: 'Gourmet pan-seared salmon with herbs and lemon butter sauce - restaurant quality at home',
    ingredients: [
      { name: 'salmon fillet', amount: 1, unit: 'lb', estimatedPrice: 16.00 },
      { name: 'lemon', amount: 1, unit: 'whole', estimatedPrice: 0.75 },
      { name: 'fresh dill', amount: 2, unit: 'tbsp', estimatedPrice: 2.00 },
      { name: 'butter', amount: 2, unit: 'tbsp', estimatedPrice: 0.50 },
      { name: 'olive oil', amount: 1, unit: 'tbsp', estimatedPrice: 0.25 }
    ],
    instructions: [
      'Season salmon with salt and pepper',
      'Heat olive oil in skillet over medium-high heat',
      'Cook salmon skin-side down for 4 minutes',
      'Flip and cook 3-4 minutes more',
      'Add butter, lemon juice, and dill to pan',
      'Baste salmon with herb butter',
      'Serve immediately'
    ],
    cookingTime: 15,
    servings: 2,
    difficulty: 'Medium',
    cuisine: 'American',
    dietary: ['high-protein', 'low-carb'],
    nutrition: {
      calories: 340,
      protein: 35,
      carbs: 2,
      fat: 20,
      fiber: 0
    },
    costPerServing: 9.75,
    estimatedCost: 19.50,
    image: 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.8,
    reviews: 203
  },
  {
    id: 'recipe-5',
    title: 'Mediterranean Bowl',
    description: 'Fresh and healthy Mediterranean-inspired quinoa bowl with feta, olives, and vibrant vegetables',
    ingredients: [
      { name: 'quinoa', amount: 1, unit: 'cup', estimatedPrice: 2.00 },
      { name: 'cucumber', amount: 1, unit: 'medium', estimatedPrice: 1.00 },
      { name: 'cherry tomatoes', amount: 1, unit: 'cup', estimatedPrice: 2.50 },
      { name: 'feta cheese', amount: 0.5, unit: 'cup', estimatedPrice: 3.00 },
      { name: 'olives', amount: 0.25, unit: 'cup', estimatedPrice: 1.50 },
      { name: 'olive oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.50 }
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Dice cucumber and halve cherry tomatoes',
      'Crumble feta cheese',
      'Arrange quinoa in bowls',
      'Top with vegetables, feta, and olives',
      'Drizzle with olive oil and season'
    ],
    cookingTime: 20,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Mediterranean',
    dietary: ['vegetarian', 'healthy'],
    nutrition: {
      calories: 380,
      protein: 15,
      carbs: 45,
      fat: 18,
      fiber: 8
    },
    costPerServing: 5.25,
    estimatedCost: 10.50,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.4,
    reviews: 92
  },
  {
    id: 'recipe-6',
    title: 'Classic Pancakes',
    description: 'Fluffy breakfast pancakes that everyone loves - perfect for weekend mornings and special occasions',
    ingredients: [
      { name: 'flour', amount: 2, unit: 'cups', estimatedPrice: 0.50 },
      { name: 'milk', amount: 1.5, unit: 'cups', estimatedPrice: 1.00 },
      { name: 'eggs', amount: 2, unit: 'large', estimatedPrice: 0.50 },
      { name: 'sugar', amount: 2, unit: 'tbsp', estimatedPrice: 0.10 },
      { name: 'baking powder', amount: 2, unit: 'tsp', estimatedPrice: 0.05 },
      { name: 'butter', amount: 2, unit: 'tbsp', estimatedPrice: 0.50 }
    ],
    instructions: [
      'Mix dry ingredients in a large bowl',
      'Whisk together milk, eggs, and melted butter',
      'Combine wet and dry ingredients until just mixed',
      'Heat griddle or non-stick pan over medium heat',
      'Pour batter to form pancakes',
      'Cook until bubbles form, then flip',
      'Serve hot with syrup'
    ],
    cookingTime: 15,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'American',
    dietary: ['vegetarian'],
    nutrition: {
      calories: 220,
      protein: 8,
      carbs: 35,
      fat: 6,
      fiber: 2
    },
    costPerServing: 0.66,
    estimatedCost: 2.65,
    image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.7,
    reviews: 245
  }
];

export default function RecipeSearchPage() {
  const { user, userData, updateUserData } = useAuth();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({ dietary: [] });
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Favorites state management 
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  
  // Diet Plan Integration
  const [showHealthProfile, setShowHealthProfile] = useState(false);
  const [showDietPlan, setShowDietPlan] = useState(false);
  const [currentDietPlan, setCurrentDietPlan] = useState<any>(null);
  const [hasDietPlan, setHasDietPlan] = useState(false);
  
  // Authentication modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  
  // Shopping recipes state
  const [shoppingRecipes, setShoppingRecipes] = useState<Recipe[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [apiStatus, setApiStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [lastSearchPrompt, setLastSearchPrompt] = useState<string>('');

  // SAFETY CHECK: Safe favorites count that always returns 0 when no user
  const safeFavoritesCount = user && userData ? (userData.favorites?.length || 0) : 0;

  // Helper function to properly handle the guide showing
  const handleShowGuide = () => {
    setShowUserGuide(true);
  };

  // Event listeners for favorites sync
  useEffect(() => {
    const handleFavoritesUpdated = () => {
      console.log('🔄 Favorites updated from modal, reloading...');
      loadFavorites();
    };
  
    window.addEventListener('favoritesUpdated', handleFavoritesUpdated);
  
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdated);
    };
  }, []);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('pantrypal_guide_seen');
    const isFirstVisit = !hasSeenGuide;
    
    if (isFirstVisit) {
      setIsNewUser(true);
      // Show guide after a short delay for better UX
      setTimeout(() => {
        setShowUserGuide(true);
      }, 1000);
    }
  }, []);

  // user login/logout handling
  useEffect(() => {
    console.log('🔍 User or userData changed');
    console.log('User:', user?.email || 'Not logged in');
    console.log('UserData.favorites:', userData?.favorites?.length || 0);
    
    if (user && userData?.favorites) {
      console.log('✅ Syncing page favorites with AuthContext favorites');
      setFavorites(userData.favorites);
    } else {
      console.log('🧹 Clearing page favorites - no user or no userData.favorites');
      setFavorites([]);
      setFavoritesError(null);
      setIsLoadingFavorites(false);
    }
  }, [user, userData?.favorites]); // Watch both user AND userData.favorites

  // IMMEDIATE CLEANUP: Clear favorites on mount if no user
  useEffect(() => {
    if (!user) {
      console.log('🧹 No user on mount - clearing favorites');
      setFavorites([]);
      setFavoritesError(null);
      setIsLoadingFavorites(false);
    }
  }, []); // Run once on mount

  // STORAGE CLEANUP: Handle logout in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userEmail' || e.key === 'userSession') {
        if (!e.newValue && e.oldValue) {
          // User logged out in another tab
          console.log('🧹 User logged out in another tab, clearing favorites');
          setFavorites([]);
          setFavoritesError(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleUserLoggedOut = () => {
      console.log('🧹 User logged out - clearing favorites state');
      setFavorites([]);
      setFavoritesError(null);
      setIsLoadingFavorites(false);
    };

    window.addEventListener('userLoggedOut', handleUserLoggedOut);

    return () => {
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  // API Headers helper
  const getApiHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo',
    };

    // Add user identification headers
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('userEmail');
      const userSession = localStorage.getItem('userSession');
      
      if (userEmail) {
        headers['X-User-Email'] = userEmail;
      }
      if (userSession) {
        headers['X-User-ID'] = userSession;
      }
    }

    return headers;
  }, []);

  const isFavorite = (recipeId: string): boolean => {
    console.log('🔍 isFavorite called with:', recipeId);
    console.log('🔍 Current user:', user?.email || 'Not logged in');
    console.log('🔍 Current favorites state:', favorites);
    
  
    if (!user) {
      console.log('🔍 No user logged in, returning false');
      return false;
    }
    
    if (!Array.isArray(favorites)) {
      console.warn('⚠️ Favorites is not an array:', favorites);
      return false;
    }
    
    const result = favorites.some((fav: any) => {
      const favRecipeId = fav.recipeId || fav.recipe_id || fav.id;
      return favRecipeId === recipeId;
    });
    
    console.log(`🔍 isFavorite(${recipeId}):`, result);
    return result;
  };

  const loadFavorites = useCallback(async () => {
    console.log('🔍 MainPage: Loading favorites...');
    
    if (!user) {
      console.log('ℹ️ No user logged in, clearing favorites');
      setFavorites([]);
      setIsLoadingFavorites(false);
      setFavoritesError(null);
      return [];
    }
    
    if (userData?.favorites && userData.favorites.length > 0) {
      console.log('✅ Using favorites from AuthContext userData');
      setFavorites(userData.favorites);
      return userData.favorites;
    }
    
    setIsLoadingFavorites(true);
    setFavoritesError(null);
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'GET',
        headers: getApiHeaders(),
        credentials: 'include',
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔐 User not authenticated, clearing favorites');
          setFavorites([]);
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }
  
      const favoritesResponse = await response.json();
  
      if (favoritesResponse.success) {
        const favoritesArray = Array.isArray(favoritesResponse.favorites) ? favoritesResponse.favorites : [];
        console.log('✅ Loaded favorites from API:', favoritesArray.length, 'items');
        
        setFavorites(favoritesArray);
        
        if (updateUserData) {
          await updateUserData({ favorites: favoritesArray });
        }
        
        return favoritesArray;
      } else {
        throw new Error(favoritesResponse.error || 'Failed to load favorites');
      }
  
    } catch (error) {
      console.error('❌ Failed to load favorites:', error);
      setFavoritesError(error instanceof Error ? error.message : 'Failed to load favorites');
      setFavorites([]);
      return [];
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [user, userData?.favorites, getApiHeaders, updateUserData]);
  
  const handleToggleFavorite = async (recipe: Recipe): Promise<void> => {
    if (!user) {
      console.log('❌ No user logged in, cannot toggle favorite');
      return;
    }
  
    const recipeId = recipe.id;
    const currentlyFavorite = isFavorite(recipeId);
    
    console.log('💖 Toggling favorite for:', recipe.title, 'Currently favorite:', currentlyFavorite);
  
    try {
      if (currentlyFavorite) {
        // REMOVE from favorites
        const response = await fetch(`/api/favorites?recipeId=${encodeURIComponent(recipeId)}`, {
          method: 'DELETE',
          headers: getApiHeaders(),
          credentials: 'include',
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
  
        const removeResponse = await response.json();
  
        if (removeResponse.success) {
          setFavorites((prev) => {
            const updated = prev.filter((fav: any) => {
              const favRecipeId = fav.recipeId || fav.recipe_id || fav.id;
              return favRecipeId !== recipeId;
            });
            
            if (updateUserData) {
              updateUserData({ favorites: updated });
            }
            
            return updated;
          });
        }
      } else {
        // ADD to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: getApiHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            recipeId: recipeId,
            recipeData: {
              ...recipe,
              ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
              instructions: Array.isArray(recipe.instructions) ? recipe.instructions : []
            }
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
  
        const addResponse = await response.json();
  
        if (addResponse.success && addResponse.favorite) {
          setFavorites((prev) => {
            const updated = [...prev, addResponse.favorite];
            
            if (updateUserData) {
              updateUserData({ favorites: updated });
            }
            
            return updated;
          });
        }
      }
  
    } catch (error) {
      console.error('❌ Failed to toggle favorite:', error);
      // Reload to sync state
      await loadFavorites();
    }
  };

  // Enhanced favorite toggle with health tracking
  const handleToggleFavoriteWithTracking = async (recipeId: string): Promise<void> => {
    if (!user) return;
    
    const recipe = recipes.find((r: Recipe) => r.id === recipeId);
    if (recipe) {
      // Track recipe interaction
      try {
        await fetch('/api/health/recent-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeId: recipe.id,
            recipeData: recipe,
            interactionType: 'favorited'
          })
        });
      } catch (error) {
        console.error('Failed to track favorite:', error);
      }

      // Toggle favorite using the fixed function
      await handleToggleFavorite(recipe);
    }
  };

  // Remove favorite function
  const removeFavorite = async (recipeId: string) => {
    try {
      console.log('➖ Removing from favorites:', recipeId);
      
      const response = await fetch(`/api/favorites?recipeId=${encodeURIComponent(recipeId)}`, {
        method: 'DELETE',
        headers: getApiHeaders(),
        credentials: 'include',
      });

      console.log('🔍 DELETE response status:', response.status);

      if (!response.ok) {
        const errorResponse = await response.json();
        console.log('❌ DELETE error response:', errorResponse);
        throw new Error(errorResponse.error || `HTTP ${response.status}`);
      }

      const deleteResponse = await response.json();
      console.log('✅ Remove favorite response:', deleteResponse);

      if (deleteResponse.success) {
        console.log('✅ Successfully removed from favorites');
        
        // Reload favorites to sync state
        console.log('🔄 Reloading favorites to sync state...');
        const updatedFavorites = await loadFavorites();
        
        return true;
      } else {
        throw new Error(deleteResponse.error || 'Failed to remove favorite');
      }

    } catch (error) {
      console.error('❌ Failed to remove favorite:', error);
      
      // Still try to reload favorites to sync state
      console.log('🔄 Reloading favorites to sync state...');
      await loadFavorites();
      
      return false;
    }
  };

  // Handle remove favorite from modal
  const handleRemoveFavoriteFromModal = async (recipeId: string): Promise<void> => {
    console.log('🗑️ Main page: Removing favorite:', recipeId);

    try {
      const response = await fetch(`/api/favorites?recipeId=${encodeURIComponent(recipeId)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove from local state
        setFavorites((prev: any[]) => prev.filter((fav: any) => fav.recipeId !== recipeId));
        console.log('✅ Main page: Removed from favorites successfully');
      } else {
        console.error('❌ Main page: Failed to remove favorite');
      }
    } catch (error) {
      console.error('❌ Main page: Error removing favorite:', error);
    }
  };

  const handleGuideComplete = () => {
    localStorage.setItem('pantrypal_guide_seen', 'true');
    setIsNewUser(false);
    setShowUserGuide(false);
  };
  
  const handleStepComplete = (stepId: string) => {
    console.log('✅ Step completed:', stepId);
  };
  
  useEffect(() => {
    console.log('🚀 MainPage: Component mounted');
    
    // Only load favorites if user is logged in
    if (user) {
      console.log('🚀 User is logged in, loading favorites...');
      loadFavorites();
    } else {
      console.log('🚀 No user on mount, ensuring favorites are cleared');
      setFavorites([]);
    }
  }, [user]); // Only depend on user

  // Clear shopping recipes when user changes
  useEffect(() => {
    if (user?.id !== currentUserId) {
      console.log('🔄 User changed - clearing shopping recipes');
      setShoppingRecipes([]);
      setCurrentUserId(user?.id || null);
    }
  }, [user?.id, currentUserId]);

  // Load existing diet plan on component mount
  useEffect(() => {
    if (user) {
      loadExistingDietPlan();
    }
  }, [user]);
  
  // Check API status on component mount
  useEffect(() => {
    checkAPIStatus();
  }, []);

  // Handle AI natural language search from AdvancedSearch component
  const handleNaturalLanguageSearch = useCallback(async (query: string): Promise<Recipe[]> => {
    setLoading(true);
    setHasSearched(true);
    setLastSearchPrompt(query);

    try {
      console.log('🤖 AI Natural Language Search:', query);
      
      const result = await searchRecipesWithParsing({ 
        prompt: query,
        maxResults: 5
      });

      if (result.success && result.recipes.length > 0) {
        console.log('✅ AI search returned', result.recipes.length, 'recipes');
        setRecipes(result.recipes);
        setSearchError(null);
        return result.recipes;
      } else {
        console.log('⚠️ AI search found no results, showing filtered mock data');
        const filteredMock = filterMockRecipes(mockRecipes, currentFilters, ingredients);
        setRecipes(filteredMock);
        setSearchError(filteredMock.length === 0 ? 'No recipes found for your query. Try rephrasing or being more specific.' : null);
        return filteredMock;
      }
    } catch (error) {
      console.error('❌ AI search error:', error);
      setSearchError('AI search failed. Please try again.');
      const filteredMock = filterMockRecipes(mockRecipes, currentFilters, ingredients);
      setRecipes(filteredMock);
      return filteredMock;
    } finally {
      setLoading(false);
    }
  }, [currentFilters, ingredients]);

  // Listen for recipe search events from diet plan
  useEffect(() => {
    const handleSearchRecipes = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { query, mealType, targetCalories } = customEvent.detail;
      console.log('🍽️ Searching recipes for meal:', mealType, 'Query:', query);
      
      // Close diet plan modal and search for recipes
      setShowDietPlan(false);
      
      // Set up search with calorie filter
      if (targetCalories) {
        const calorieRange = 50; // +/- 50 calories
        setLastSearchPrompt(`${query} (${targetCalories - calorieRange} to ${targetCalories + calorieRange} calories)`);
      } else {
        setLastSearchPrompt(query);
      }
      
      // Perform the search
      handleNaturalLanguageSearch(query);
    };

    window.addEventListener('searchRecipes', handleSearchRecipes);
    return () => {
      window.removeEventListener('searchRecipes', handleSearchRecipes);
    };
  }, [handleNaturalLanguageSearch]);

  // Auto-search when filters change
  useEffect(() => {
    if (hasActiveFilters() || ingredients.length > 0) {
      console.log('🔍 Auto-searching due to filter/ingredient change');
      handleSearch();
    }
  }, [currentFilters, ingredients]);

  // Handle authentication
  const handleLogin = () => {
    console.log('Opening login modal...');
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    console.log('Opening register modal...');
    setAuthModalMode('register');
    setShowAuthModal(true);
  };

  const loadExistingDietPlan = async () => {
    try {
      const response = await fetch('/api/health/diet-plan');
      const data = await response.json();
      
      if (data.success && data.data) {
        setCurrentDietPlan(data.data);
        setHasDietPlan(true);
        console.log('✅ Existing diet plan loaded');
      } else {
        setHasDietPlan(false);
        console.log('ℹ️ No existing diet plan found');
      }
    } catch (error) {
      console.error('Failed to load existing diet plan:', error);
      setHasDietPlan(false);
    }
  };

  const checkAPIStatus = async () => {
    try {
      const status = await checkAPIConnection();
      setApiStatus(status);
    } catch (error) {
      setApiStatus({
        connected: false,
        message: 'Failed to check API status'
      });
    }
  };

  useEffect(() => {
    const debugAPI = async () => {
      console.log('🔍 Debugging API setup...');
      
      // Check environment variables
      const hasPerplexityKey = !!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || !!process.env.PERPLEXITY_API_KEY;
      console.log('Environment check:', {
        hasPerplexityKey,
        nodeEnv: process.env.NODE_ENV,
      });
      
      // Test API connection
      try {
        const status = await checkAPIConnection();
        console.log('API Connection Status:', status);
        setApiStatus(status);
        
        if (!status.connected) {
          console.error('❌ API not connected:', status.message);
          // Show user-friendly error
          setSearchError(`API Configuration Issue: ${status.message}`);
        }
      } catch (error) {
        console.error('❌ Failed to check API status:', error);
        setApiStatus({
          connected: false,
          message: 'Failed to check API status'
        });
      }
    };
    
    debugAPI();
  }, []);

  const handleDietPlanComplete = (dietPlan: any) => {
    console.log('✅ Diet plan completed:', dietPlan);
    setCurrentDietPlan(dietPlan);
    setHasDietPlan(true);
    setShowHealthProfile(false);
    setShowDietPlan(true);
  };

  const handleViewDietPlan = () => {
    if (!user) {
      console.log('User not logged in, showing auth modal');
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }
    
    if (currentDietPlan) {
      console.log('Opening existing diet plan viewer');
      setShowDietPlan(true);
    } else {
      console.log('No diet plan exists, opening health profile modal');
      setShowHealthProfile(true);
    }
  };

  const handleCreateNewDietPlan = () => {
    if (!user) {
      console.log('User not logged in, showing auth modal');
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }
    console.log('Opening health profile modal for diet plan creation');
    setShowHealthProfile(true);
  };

  const searchDatabaseRecipes = async (filters: SearchFilters, userIngredients: string[]): Promise<Recipe[]> => {
    try {
      const params = new URLSearchParams();
      
      if (userIngredients.length > 0) {
        params.set('ingredients', userIngredients.join(','));
      }
      
      if (filters.cuisine) params.set('cuisine', filters.cuisine);
      if (filters.difficulty) params.set('difficulty', filters.difficulty);
      if (filters.maxCookingTime) params.set('maxTime', filters.maxCookingTime.toString());
      if (filters.maxCost) params.set('maxCost', filters.maxCost.toString());
      if (filters.dietary.length > 0) params.set('dietary', filters.dietary.join(','));
      
      const response = await fetch(`/api/recipes/search?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        return data.recipes;
      } else {
        console.error('Database search failed:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Database search error:', error);
      return [];
    }
  };

  const handleFiltersChange = (filters: SearchFilters) => {
    console.log('🔍 Filters changed:', filters);
    setCurrentFilters(filters);
  };

  const handleAutoSearch = () => {
    console.log('🔍 Auto-search triggered from QuickFilters');
    handleSearch();
  };

  const getUserHealthProfile = async (): Promise<any> => {
    try {
      const response = await fetch('/api/health/profile');
      const data = await response.json();
      return data.success ? data.profile : null;
    } catch (error) {
      console.error('Failed to get health profile:', error);
      return null;
    }
  };

  const getHealthWarnings = (recipe: Recipe, healthProfile: any): string[] => {
    const warnings: string[] = [];
    
    if (!healthProfile) return warnings;
    
    // Check for allergen warnings
    if (healthProfile.allergens && Array.isArray(healthProfile.allergens)) {
      healthProfile.allergens.forEach((allergen: string) => {
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          const hasAllergen = recipe.ingredients.some(ingredient =>
            ingredient?.name?.toLowerCase().includes(allergen.toLowerCase())
          );
          if (hasAllergen) {
            warnings.push(`Contains ${allergen} - potential allergen`);
          }
        }
      });
    }
    
    // Check for condition-specific warnings
    if (healthProfile.conditions && Array.isArray(healthProfile.conditions)) {
      healthProfile.conditions.forEach((condition: string) => {
        if (condition.toLowerCase().includes('diabetes') && recipe.nutrition?.carbs && recipe.nutrition.carbs > 45) {
          warnings.push('High carbohydrate content - monitor blood sugar');
        }
        if (condition.toLowerCase().includes('hypertension') && recipe.nutrition?.sodium && recipe.nutrition.sodium > 600) {
          warnings.push('High sodium content - may affect blood pressure');
        }
      });
    }
    
    return warnings;
  };

  const getHealthBenefits = (recipe: Recipe, healthProfile: any): string[] => {
    const benefits: string[] = [];
    
    if (!healthProfile) return benefits;
    
    // Check for condition-specific benefits
    if (healthProfile.conditions && Array.isArray(healthProfile.conditions)) {
      healthProfile.conditions.forEach((condition: string) => {
        if (condition.toLowerCase().includes('diabetes') && recipe.dietary && Array.isArray(recipe.dietary)) {
          const hasDiabeticFriendly = recipe.dietary.some((diet: string) => 
            diet.toLowerCase().includes('diabetic') || diet.toLowerCase().includes('low-sugar')
          );
          if (hasDiabeticFriendly) {
            benefits.push('Diabetes-friendly recipe');
          }
        }
        if (condition.toLowerCase().includes('heart') && recipe.dietary && Array.isArray(recipe.dietary)) {
          const hasHeartHealthy = recipe.dietary.some((diet: string) => 
            diet.toLowerCase().includes('heart') || diet.toLowerCase().includes('low-fat')
          );
          if (hasHeartHealthy) {
            benefits.push('Heart-healthy choice');
          }
        }
      });
    }
    
    // General health benefits
    if (recipe.nutrition?.fiber && recipe.nutrition.fiber > 5) {
      benefits.push('High fiber content');
    }
    if (recipe.nutrition?.protein && recipe.nutrition.protein > 20) {
      benefits.push('Excellent protein source');
    }
    
    return benefits;
  };

  const filterRecipesByHealth = async (recipesToFilter: Recipe[], healthProfile: any): Promise<Recipe[]> => {
    return recipesToFilter.map(recipe => ({
      ...recipe,
      healthWarnings: getHealthWarnings(recipe, healthProfile),
      healthBenefits: getHealthBenefits(recipe, healthProfile)
    }));
  };

  const handleSearch = useCallback(async () => {
    console.log('🔍 Starting search with:', { ingredients, filters: currentFilters });
    
    setLoading(true);
    setSearchError(null);
    setHasSearched(true);
  
    try {
      let allRecipes: Recipe[] = [];
      
      // 1. Search database first for existing recipes
      const dbRecipes = await searchDatabaseRecipes(currentFilters, ingredients);
      console.log('💾 Found', dbRecipes.length, 'recipes in database');
      
      // 2. If we need more recipes, get AI recipes
      if (dbRecipes.length < 5 && (ingredients.length > 0 || hasActiveFilters())) {
        if (apiStatus?.connected) {
          try {
            const result = await searchRecipesAdvanced({
              ingredients: ingredients.length > 0 ? ingredients : undefined,
              dietary: currentFilters.dietary.length > 0 ? currentFilters.dietary : undefined,
              cuisine: currentFilters.cuisine || undefined,
              maxTime: currentFilters.maxCookingTime || undefined,
              difficulty: currentFilters.difficulty || undefined,
              budget: currentFilters.maxCost || undefined,
              servings: currentFilters.servings || undefined
            });
  
            if (result.success && result.recipes.length > 0) {
              console.log('🤖 Got', result.recipes.length, 'new AI recipes');
              allRecipes = [...dbRecipes, ...result.recipes];
            } else {
              allRecipes = dbRecipes;
            }
          } catch (apiError) {
            console.log('⚠️ AI API failed, using database recipes only');
            allRecipes = dbRecipes;
          }
        } else {
          allRecipes = dbRecipes;
        }
      } else {
        allRecipes = dbRecipes;
      }
      
      // 3. Fall back to mock data if nothing found
      if (allRecipes.length === 0) {
        const filteredMock = filterMockRecipes(mockRecipes, currentFilters, ingredients);
        allRecipes = filteredMock;
      }
      
      // 4. Apply health filtering if user is logged in
      if (user) {
        const healthProfile = await getUserHealthProfile();
        if (healthProfile) {
          allRecipes = await filterRecipesByHealth(allRecipes, healthProfile);
        }
      }
      
      setRecipes(allRecipes);
      
      if (allRecipes.length === 0) {
        setSearchError('No recipes found matching your criteria. Try adjusting your filters.');
      }
      
    } catch (err) {
      console.error('❌ Search error:', err);
      setSearchError('Search failed. Please check your connection and try again.');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [ingredients, currentFilters, apiStatus, user]);

  // Filter mock recipes based on current criteria
  const filterMockRecipes = (recipes: Recipe[], filters: SearchFilters, userIngredients: string[]): Recipe[] => {
    console.log('🔍 Filtering recipes with filters:', filters);
    
    return recipes.filter(recipe => {
      if (filters.maxCookingTime && recipe.cookingTime && recipe.cookingTime > filters.maxCookingTime) {
        return false;
      }
      
      if (filters.difficulty && recipe.difficulty !== filters.difficulty) {
        return false;
      }
      
      if (filters.dietary && filters.dietary.length > 0 && recipe.dietary && Array.isArray(recipe.dietary)) {
        const hasAllDietary = filters.dietary.every(diet => 
          recipe.dietary.some((recipeDiet: string) => recipeDiet.toLowerCase().includes(diet.toLowerCase()))
        );
        if (!hasAllDietary) {
          return false;
        }
      }
      
      if (filters.cuisine && recipe.cuisine !== filters.cuisine) {
        return false;
      }
      
      if (filters.maxCost && recipe.costPerServing && recipe.costPerServing > filters.maxCost) {
        return false;
      }
      
      if (filters.servings && recipe.servings && recipe.servings < filters.servings) {
        return false;
      }
      
      if (userIngredients.length > 0 && recipe.ingredients && Array.isArray(recipe.ingredients)) {
        const hasMatchingIngredients = userIngredients.some(userIng =>
          recipe.ingredients.some(recipeIng =>
            recipeIng?.name?.toLowerCase().includes(userIng.toLowerCase()) ||
            userIng.toLowerCase().includes(recipeIng?.name?.toLowerCase() || '')
          )
        );
        if (!hasMatchingIngredients) {
          return false;
        }
      }
      
      return true;
    });
  };

  const hasActiveFilters = useCallback((): boolean => {
    return !!(
      currentFilters.cuisine || 
      currentFilters.dietary && currentFilters.dietary.length > 0 ||
      currentFilters.maxCookingTime ||
      currentFilters.difficulty ||
      currentFilters.maxCost ||
      currentFilters.servings
    );
  }, [currentFilters]);

  // Enhanced recipe card with health tracking
  const handleViewDetails = async (recipe: Recipe) => {
    // Track recipe interaction
    if (user) {
      try {
        await fetch('/api/health/recent-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeId: recipe.id,
            recipeData: recipe,
            interactionType: 'viewed'
          })
        });
      } catch (error) {
        console.error('Failed to track recipe view:', error);
      }
    }

    setSelectedRecipe(recipe);
  };

  // Handle viewing recipe details with type normalization
  const handleViewRecipeDetails = async (recipe: any) => {
    // Normalize the recipe to ensure it has all required properties
    const normalizedRecipe: Recipe = {
      ...recipe,
      dietary: recipe.dietary || [], // Ensure dietary property exists
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      nutrition: recipe.nutrition || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      costPerServing: recipe.costPerServing || 0,
      estimatedCost: recipe.estimatedCost || 0,
      rating: recipe.rating || 0,
      reviews: recipe.reviews || 0
    };

    await handleViewDetails(normalizedRecipe);
  };

  // Enhanced add to cart with health tracking
  const handleAddToShoppingListWithTracking = async (recipe: Recipe | any) => {
    if (!user) {
      console.log('❌ No user logged in, cannot add to shopping list');
      return;
    }

    // Normalize the recipe to ensure it has all required properties
    const normalizedRecipe: Recipe = {
      ...recipe,
      dietary: recipe.dietary || [],
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      nutrition: recipe.nutrition || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      costPerServing: recipe.costPerServing || 0,
      estimatedCost: recipe.estimatedCost || 0,
      rating: recipe.rating || 0,
      reviews: recipe.reviews || 0
    };

    // Track recipe interaction
    try {
      await fetch('/api/health/recent-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: normalizedRecipe.id,
          recipeData: normalizedRecipe,
          interactionType: 'added_to_cart'
        })
      });
    } catch (error) {
      console.error('Failed to track shopping list addition:', error);
    }

    // Add to shopping list
    handleAddToShoppingList(normalizedRecipe);
  };
  
  const handleAddToShoppingList = (recipe: Recipe) => {
    if (!user) {
      console.log('❌ No user logged in, cannot add to shopping list');
      return;
    }

    console.log('🛒 Adding recipe to shopping list for user:', user.email, 'Recipe:', recipe.title);
    
    setShoppingRecipes(prev => {
      const isAlreadyAdded = prev.some(r => r.id === recipe.id);
      if (isAlreadyAdded) {
        console.log('ℹ️ Recipe already in shopping list for user:', user.email);
        return prev;
      }
      const updated = [...prev, recipe];
      console.log('✅ Added recipe to shopping list for user:', user.email, 'Total recipes:', updated.length);
      return updated;
    });
    setShowShoppingList(true);
  };

  const handleShowFavorites = () => {
    if (!user) {
      console.log('🚫 No user logged in, not showing favorites modal');
      return;
    }
    
    console.log('💖 Opening favorites modal for user:', user.email);
    console.log('Current favorites count:', favorites.length);
    
    setShowFavorites(true);
  };

  const clearSearch = () => {
    setIngredients([]);
    setCurrentFilters({ dietary: [] });
    setRecipes(mockRecipes);
    setHasSearched(false);
    setSearchError(null);
    setLastSearchPrompt('');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50">
      {/* Top Navigation with gradient */}
      <TopNavigation
        onShowFavorites={handleShowFavorites} // Use safe function
        onShowShoppingList={() => setShowShoppingList(true)}
        onShowDietPlan={handleViewDietPlan}
        onShowAuthModal={handleLogin}
        favoritesCount={safeFavoritesCount} // Use safe count
        onShowGuide={handleShowGuide} 
        shoppingListCount={shoppingRecipes.length}
      />

      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Hero Header with glassmorphism effect */}
        <div className="text-center py-12 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Pantry Pal
              </h1>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl">
                <ChefHat className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover amazing recipes using AI-powered search with your ingredients and preferences. 
              Get personalized recommendations and create your perfect meal plan.
            </p>
            
            {/* Diet Plan CTA Section */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6 diet-plan-cta">
              {user ? (
                <>
                  {hasDietPlan ? (
                    <button
                      onClick={handleViewDietPlan}
                      className="group px-8 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3"
                    >
                      <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      View My Diet Plan
                      <div className="flex -space-x-1">
                        <Star className="w-4 h-4 text-yellow-300" />
                        <Star className="w-4 h-4 text-yellow-300" />
                        <Star className="w-4 h-4 text-yellow-300" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateNewDietPlan}
                      className="group px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3"
                    >
                      <Brain className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      Create Personalized Diet Plan
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    </button>
                  )}
                  
                  {hasDietPlan && (
                    <button
                      onClick={handleCreateNewDietPlan}
                      className="px-6 py-4 border-2 border-purple-300 text-purple-600 rounded-2xl hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 font-medium backdrop-blur-sm bg-white/50"
                    >
                      Create New Plan
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => {
                    console.log('Not logged in, showing auth modal');
                    setAuthModalMode('register');
                    setShowAuthModal(true);
                  }}
                  className="group px-8 py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white rounded-2xl hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3"
                >
                  <Brain className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Sign Up for Diet Plan
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-300 text-sm">FREE</span>
                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  </div>
                </button>
              )}
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                AI Powered
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                <Heart className="w-3 h-3" />
                {safeFavoritesCount} Favorites {/* SAFETY CHECK */}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                <Utensils className="w-3 h-3" />
                {recipes.length} Recipes
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Section with glassmorphism */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ingredients Input */}
          <div className="group relative ingredient-input">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">What's in your pantry?</h3>
              </div>
              <IngredientInput
                ingredients={ingredients}
                onIngredientsChange={setIngredients}
                placeholder="Add ingredients you have..."
              />
            </div>
          </div>

          {/* Quick Filters with enhanced styling */}
          <div className="group relative quick-filters">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
              <QuickFilters
                onApplyFilter={handleFiltersChange}
                currentFilters={currentFilters}
                onAutoSearch={handleAutoSearch}
              />
            </div>
          </div>
        </div>

        {/* Advanced Search with beautiful styling */}
        <div className="group relative ai-search">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">AI Recipe Search</h3>
                <p className="text-gray-600 text-sm">Describe what you want and let AI find the perfect recipe</p>
              </div>
            </div>
            <AdvancedSearch
              onSearch={(query, filters) => {
                if (filters) handleFiltersChange(filters);
                handleSearch();
              }}
              onNaturalLanguageQuery={handleNaturalLanguageSearch}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Enhanced Manual Search Button */}
        <div className="text-center space-y-6">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="manual-search-btn group relative px-16 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-3xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 mx-auto overflow-hidden"
          >
            {/* Background animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-pink-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            
            <div className="relative flex items-center gap-4">
              {loading ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                    Searching with AI Magic...
                  </span>
                </>
              ) : (
                <>
                  <Search className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  <span>Search Recipes Manually</span>
                  <Sparkles className="w-5 h-5 text-yellow-300 group-hover:animate-pulse" />
                </>
              )}
            </div>
          </button>

          {(hasSearched || ingredients.length > 0 || hasActiveFilters()) && (
            <button
              onClick={clearSearch}
              className="px-8 py-3 text-gray-600 hover:text-gray-800 transition-colors bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 hover:bg-white/80 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Clear All & Reset
            </button>
          )}
        </div>

        {/* Enhanced Status Cards */}
        {lastSearchPrompt && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-blue-900">AI Search Query:</span>
              </div>
              <p className="text-blue-800 font-medium">{lastSearchPrompt}</p>
            </div>
          </div>
        )}

        {hasActiveFilters() && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-green-900">Active Filters Applied</span>
              </div>
              <p className="text-green-800">
                Showing recipes that match your selected criteria. Results update automatically as you change filters.
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Error Message */}
        {searchError && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 text-lg">Search Error</h3>
                  <p className="text-red-700 mt-1">{searchError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Favorites Error */}
        {favoritesError && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-orange-50/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900 text-lg">Favorites Error</h3>
                    <p className="text-orange-700 mt-1">{favoritesError}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setFavoritesError(null);
                    loadFavorites();
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="relative inline-flex items-center gap-4 px-8 py-6 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl animate-pulse"></div>
              <div className="relative flex items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="text-xl font-semibold text-gray-900">
                  AI is finding perfect recipes for you...
                </span>
                <div className="flex -space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {!loading && (
          <div className="space-y-8 recipe-results">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {hasSearched ? 'Search Results' : 'Featured Recipes'}
                </h2>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                  <Star className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-purple-800">{recipes.length} recipes</span>
                </div>
              </div>
              
              {shoppingRecipes.length > 0 && (
                <button
                  onClick={() => setShowShoppingList(true)}
                  className="group px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3"
                >
                  <div className="p-1 bg-white/20 rounded-lg">
                    <Utensils className="w-4 h-4" />
                  </div>
                  Shopping List ({shoppingRecipes.length})
                </button>
              )}
            </div>

            {recipes.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-12">
                    <div className="text-8xl mb-6">🔍</div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">No recipes found</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Try adjusting your ingredients or filters to discover more delicious recipes
                    </p>
                    <button
                      onClick={clearSearch}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Reset Search
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recipes.map((recipe, index) => (
                  <div 
                    key={recipe.id} 
                    className="group relative recipe-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-2xl blur-xl transition-all duration-300"></div>
                    <RecipeCard
                      recipe={recipe}
                      userIngredients={ingredients}
                      onViewDetails={handleViewDetails}
                      onAddToCart={handleAddToShoppingListWithTracking}
                      isFavorite={isFavorite(recipe.id)}
                      onToggleFavorite={(recipeId: string) => {
                        const foundRecipe = recipes.find(r => r.id === recipeId);
                        if (foundRecipe) handleToggleFavorite(foundRecipe);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modals */}
      
      {/* Recipe Details Modal */}
      <RecipeDetailsModal
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        recipe={selectedRecipe}
        userIngredients={ingredients}
        onToggleFavorite={(recipeId: string) => {
          const recipe = recipes.find(r => r.id === recipeId);
          if (recipe) handleToggleFavorite(recipe);
        }}
        onAddToShoppingList={handleAddToShoppingListWithTracking}
        isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false}
      />

      {/* Shopping List Modal */}
      <SmartShoppingList
        isOpen={showShoppingList}
        onClose={() => setShowShoppingList(false)}
        recipes={shoppingRecipes}
        userIngredients={ingredients}
        onCartUpdate={() => {
          // Handle cart updates if needed
        }}
      />

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onViewRecipe={handleViewRecipeDetails}
        onAddToShoppingList={handleAddToShoppingListWithTracking}
        onFavoritesChange={(updatedFavorites) => {
          console.log('🔄 FavoritesModal updated favorites, syncing to page state');
          setFavorites(updatedFavorites);
          
          // Sync to AuthContext too
          if (updateUserData) {
            updateUserData({ favorites: updatedFavorites });
          }
        }}
      />

      {/* Health Profile Modal */}
      <HealthProfileModal
        isOpen={showHealthProfile}
        onClose={() => setShowHealthProfile(false)}
        onComplete={handleDietPlanComplete}
      />

      {/* Diet Plan Viewer */}
      <DietPlanViewer
        isOpen={showDietPlan}
        onClose={() => setShowDietPlan(false)}
        onEdit={() => {
          setShowDietPlan(false);
          setShowHealthProfile(true);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* User Guide System */}
      <UserGuide
        isOpen={showUserGuide}
        onClose={handleGuideComplete} 
        onStepComplete={handleStepComplete} 
      />

      {/* Quick Tips for ongoing help */}
      <QuickTips />

      {/* New User Welcome Banner */}
      {isNewUser && !showUserGuide && (
        <div className="fixed top-20 right-4 z-40">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl p-4 shadow-2xl max-w-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-full">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Welcome to Pantry Pal!</h3>
            </div>
            <p className="text-white/90 text-sm mb-3">
              New here? Take a quick tour to learn how to find amazing recipes!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUserGuide(true)}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Take Tour
              </button>
              <button
                onClick={() => setIsNewUser(false)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating action button for quick access */}
      {user && (
        <div className="fixed bottom-8 right-8 z-40">
          <div className="flex flex-col gap-4">
            {/* Diet Plan Quick Access */}
            <button
              onClick={handleViewDietPlan}
              className="group p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
              title="Quick Diet Plan Access"
            >
              <Brain className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            
            {/* Favorites Quick Access */}
            <button
              onClick={handleShowFavorites}
              className="group relative p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
              title="Quick Favorites Access"
            >
              <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
              {safeFavoritesCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {safeFavoritesCount}
                </div>
              )}
            </button>
            
            {/* Shopping List Quick Access */}
            {shoppingRecipes.length > 0 && (
              <button
                onClick={() => setShowShoppingList(true)}
                className="group relative p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
                title="Quick Shopping List Access"
              >
                <Utensils className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-2 -right-2 bg-orange-400 text-orange-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {shoppingRecipes.length}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-300/5 to-purple-300/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-pink-300/5 to-orange-300/5 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-gradient-to-br from-green-300/5 to-cyan-300/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}