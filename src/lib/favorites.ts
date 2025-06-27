// src/lib/favorites.ts

export interface Recipe {
    id: string;
    title: string;
    description?: string;
    cookingTime?: number;
    servings?: number;
    difficulty?: string;
    cuisine?: string;
    image_url?: string;
    image?: string;
    instructions?: string[];
    ingredients?: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
    nutrition?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    rating?: number;
    reviews?: number;
    costPerServing?: number;
  }
  
  export interface Favorite {
    id: string;
    recipeId: string;
    recipe?: Recipe;
    createdAt: string;
  }
  
  function getCurrentUser(): { userId: string | null; userEmail: string | null } {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userSession');
      const userEmail = localStorage.getItem('userEmail');
      
      console.log('🔍 getCurrentUser from localStorage:', { userId, userEmail });
      
      return {
        userId: userId || userEmail, 
        userEmail: userEmail
      };
    }
    return { userId: null, userEmail: null };
  }
  
  function getUserHeaders(): HeadersInit {
    const { userId, userEmail } = getCurrentUser();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo', // Add authorization header
    };
  
    if (userId) {
      headers['X-User-ID'] = userId;
    }
    
    if (userEmail) {
      headers['X-User-Email'] = userEmail;
    }
  
    console.log('📡 Creating headers:', { userId, userEmail, hasAuth: !!headers['Authorization'] });
    
    return headers;
  }
  
  export async function fetchFavorites(): Promise<{
    success: boolean;
    favorites: Favorite[];
    error?: string;
  }> {
    try {
      const { userId } = getCurrentUser();
      
      if (!userId) {
        console.log('⚠️ No user logged in for fetchFavorites');
        return {
          success: false,
          favorites: [],
          error: 'User not authenticated'
        };
      }
  
      console.log('🔍 Fetching favorites for user:', userId);
  
      const response = await fetch('/api/favorites', {
        method: 'GET',
        headers: getUserHeaders(),
        credentials: 'include',
      });
  
      console.log('📡 Fetch favorites response status:', response.status);
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('❌ Fetch favorites failed:', errorData);
        return {
          success: false,
          favorites: [],
          error: errorData.error || `HTTP ${response.status}`
        };
      }
  
      const data = await response.json();
      console.log('📡 Fetch favorites response:', data);
  
      return {
        success: data.success || false,
        favorites: data.favorites || [],
        error: data.error
      };
      
    } catch (error) {
      console.error('❌ fetchFavorites network error:', error);
      return {
        success: false,
        favorites: [],
        error: 'Network error'
      };
    }
  }
  
  export async function addToFavorites(recipe: Recipe): Promise<{
    success: boolean;
    favorite?: Favorite;
    error?: string;
  }> {
    try {
      const { userId } = getCurrentUser();
      
      if (!userId) {
        console.log('⚠️ No user logged in for addToFavorites');
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
  
      console.log('➕ Adding to favorites for user:', userId, 'Recipe:', recipe.title);
  
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: getUserHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeData: recipe
        }),
      });
  
      console.log('📡 Add to favorites response status:', response.status);
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('❌ Add to favorites failed:', errorData);
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
  
      const data = await response.json();
      console.log('📡 Add to favorites response:', data);
  
      return {
        success: data.success || false,
        favorite: data.favorite,
        error: data.error
      };
      
    } catch (error) {
      console.error('❌ addToFavorites network error:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }
  
  export async function removeFromFavorites(recipeId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { userId } = getCurrentUser();
      
      if (!userId) {
        console.log('⚠️ No user logged in for removeFromFavorites');
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
  
      console.log('🗑️ Removing from favorites for user:', userId, 'Recipe:', recipeId);
  
      const response = await fetch(`/api/favorites?recipeId=${encodeURIComponent(recipeId)}`, {
        method: 'DELETE',
        headers: getUserHeaders(),
        credentials: 'include',
      });
  
      console.log('📡 Remove from favorites response status:', response.status);
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('❌ Remove from favorites failed:', errorData);
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
  
      const data = await response.json();
      console.log('📡 Remove from favorites response:', data);
  
      return {
        success: data.success || false,
        error: data.error
      };
      
    } catch (error) {
      console.error('❌ removeFromFavorites network error:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }
  
  export function isRecipeFavorited(recipeId: string, favorites: Favorite[]): boolean {
    const result = favorites.some(fav => fav.recipeId === recipeId);
    console.log(`🔍 isRecipeFavorited(${recipeId}):`, result, 'from', favorites.length, 'favorites');
    return result;
  }
  
  export async function toggleFavorite(recipe: Recipe, favorites: Favorite[]): Promise<{
    success: boolean;
    action: 'added' | 'removed';
    updatedFavorites: Favorite[];
    error?: string;
  }> {
    const isFavorited = isRecipeFavorited(recipe.id, favorites);
    
    console.log('🔄 toggleFavorite for recipe:', recipe.title, 'Current state:', isFavorited);
    
    if (isFavorited) {
      const result = await removeFromFavorites(recipe.id);
      return {
        success: result.success,
        action: 'removed',
        updatedFavorites: result.success 
          ? favorites.filter(fav => fav.recipeId !== recipe.id)
          : favorites,
        error: result.error
      };
    } else {
      const result = await addToFavorites(recipe);
      return {
        success: result.success,
        action: 'added',
        updatedFavorites: result.success && result.favorite
          ? [...favorites, result.favorite]
          : favorites,
        error: result.error
      };
    }
  }
  
  // FIXED: Better session management
  export function setUserSession(userId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userSession', userId);
      console.log('✅ Set user session:', userId);
    }
  }
  
  export function setUserEmail(email: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userEmail', email);
      console.log('✅ Set user email:', email);
    }
  }
  
  export function getCurrentUserId(): string | null {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userSession') || 
                    localStorage.getItem('userEmail') || 
                    null;
      console.log('🔍 getCurrentUserId:', userId);
      return userId;
    }
    return null;
  }
  
  export function clearUserSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userSession');
      localStorage.removeItem('userEmail');
      console.log('🧹 Cleared user session');
    }
  }