// src/contexts/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken?: string;
}

interface UserData {
  favorites: string[];
  shoppingList: ShoppingListItem[];
  searchHistory: string[];
  preferences: {
    favoriteRecipes: string[];
    allergies: string[];
    preferredCuisines: string[];
    budgetRange: { min: number; max: number };
    householdSize: number;
    cookingSkillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  };
}

interface ShoppingListItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  recipeId?: string;
  recipeTitle?: string;
  checked: boolean;
  estimatedPrice?: number;
  isAlreadyOwned: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserData: (updates: Partial<UserData>) => Promise<boolean>;
  refreshShoppingList: () => Promise<void>;
  isLoading: boolean;
  isHydrated: boolean;
}

const defaultUserData: UserData = {
  favorites: [],
  shoppingList: [],
  searchHistory: [],
  preferences: {
    favoriteRecipes: [],
    allergies: [],
    preferredCuisines: [],
    budgetRange: { min: 1, max: 15 },
    householdSize: 2,
    cookingSkillLevel: 'Intermediate'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    setIsHydrated(true);
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const sessionData = await response.json();
        if (sessionData.success) {
          setUser(sessionData.user);
          
          // Store session info for favorites system
          if (typeof window !== 'undefined') {
            localStorage.setItem('userSession', sessionData.user.id);
            localStorage.setItem('userEmail', sessionData.user.email);
            localStorage.setItem('userName', sessionData.user.name);
          }
          
          await loadUserData();
          console.log('✅ Session restored for:', sessionData.user.email);
        }
      }
    } catch (error) {
      console.error('❌ Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadShoppingList = async (): Promise<ShoppingListItem[]> => {
    if (!user) return [];
    
    try {
      console.log('🛒 Loading shopping list for:', user.email);
      
      const response = await fetch('/api/user/shopping-list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.accessToken || 'demo'}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const shoppingResponse = await response.json();
        if (shoppingResponse.success) {
          console.log('✅ Shopping list loaded:', shoppingResponse.shopping_list?.length || 0, 'items');
          return shoppingResponse.shopping_list || [];
        }
      }
      console.warn('⚠️ Could not load shopping list, using empty array');
      return [];
    } catch (error) {
      console.error('❌ Failed to load shopping list:', error);
      return [];
    }
  };

  const loadUserData = async () => {
    try {
      let favorites = [];
      try {
        const favoritesResponse = await fetch('/api/favorites', {
          credentials: 'include',
        });
        
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          if (favoritesData.success) {
            favorites = favoritesData.favorites || [];
            console.log('✅ Favorites loaded:', favorites.length, 'items');
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load favorites:', error);
      }

      let basicUserData = {
        searchHistory: [],
        preferences: defaultUserData.preferences
      };
      
      try {
        const response = await fetch('/api/user/data', {
          headers: {
            'Authorization': `Bearer ${user?.accessToken || 'demo'}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          const userDataResponse = await response.json();
          if (userDataResponse.success) {
            basicUserData = {
              searchHistory: userDataResponse.search_history || [],
              preferences: userDataResponse.preferences || defaultUserData.preferences
            };
            console.log('✅ Basic user data loaded');
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load user data:', error);
      }

      const shoppingList = await loadShoppingList();

      setUserData({
        ...defaultUserData,
        ...basicUserData,
        favorites,
        shoppingList
      });

    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      setUserData(defaultUserData);
    }
  };

  const refreshShoppingList = async () => {
    const shoppingList = await loadShoppingList();
    setUserData(prev => ({
      ...prev,
      shoppingList
    }));
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginResponse = await response.json();

      if (response.ok && loginResponse.success) {
        console.log('✅ Login successful');
        setUser(loginResponse.user);
        
        // Store session info for favorites system
        if (typeof window !== 'undefined') {
          localStorage.setItem('userSession', loginResponse.user.id);
          localStorage.setItem('userEmail', loginResponse.user.email);
          localStorage.setItem('userName', loginResponse.user.name);
        }
        
        await loadUserData();
        return { success: true };
      } else {
        console.log('❌ Login failed:', loginResponse.error);
        return { success: false, error: loginResponse.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 Attempting registration for:', email);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const registerResponse = await response.json();

      if (response.ok && registerResponse.success) {
        console.log('✅ Registration successful');
        return await login(email, password);
      } else {
        console.log('❌ Registration failed:', registerResponse.error);
        return { success: false, error: registerResponse.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const updateUserData = async (updates: Partial<UserData>): Promise<boolean> => {
    setUserData(prev => {
      const updated = { ...prev, ...updates };
      console.log('📝 Updated user data locally:', Object.keys(updates));
      return updated;
    });

    if (user) {
      try {
        let success = true;

        if (updates.shoppingList !== undefined) {
          console.log('🛒 Updating shopping list:', updates.shoppingList.length, 'items');
          
          const shoppingResponse = await fetch('/api/user/shopping-list', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${user.accessToken || 'demo'}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              shopping_list: updates.shoppingList
            }),
            credentials: 'include',
          });

          if (!shoppingResponse.ok) {
            console.error('❌ Failed to save shopping list');
            success = false;
          } else {
            console.log('✅ Shopping list saved to database');
          }
        }

        if (updates.favorites !== undefined) {
          console.log('⭐ Updating favorites:', updates.favorites.length, 'items');
          
          const favoritesResponse = await fetch('/api/favorites', {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              favorites: updates.favorites
            }),
            credentials: 'include',
          });

          if (!favoritesResponse.ok) {
            console.error('❌ Failed to save favorites');
            success = false;
          } else {
            console.log('✅ Favorites saved to database');
          }
        }

        const otherUpdates = { ...updates };
        delete otherUpdates.shoppingList;
        delete otherUpdates.favorites;

        if (Object.keys(otherUpdates).length > 0) {
          console.log('📝 Updating other user data:', Object.keys(otherUpdates));
          
          const response = await fetch('/api/user/data', {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${user.accessToken || 'demo'}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify(otherUpdates),
            credentials: 'include',
          });

          if (!response.ok) {
            console.error('❌ Failed to save user data to database');
            success = false;
          } else {
            console.log('✅ User data saved to database');
          }
        }

        return success;
      } catch (error) {
        console.error('❌ Error saving user data:', error);
        return false;
      }
    }
    
    return false;
  };

  const logout = async (): Promise<void> => {
      try {
      await fetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
  
  // Clear user state
  setUser(null);
  setUserData(defaultUserData);
  
  // Clear localStorage for favorites system
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userSession');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
  }
  
  // Dispatch event to notify other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }
  
  console.log('✅ Logout complete - localStorage cleared, userData reset to defaults');
};

useEffect(() => {
  // Safety check: if user is null but userData has favorites, reset userData
  if (!user && userData && userData.favorites && userData.favorites.length > 0) {
    console.log('🧹 Safety check: No user but favorites exist, resetting userData');
    setUserData(defaultUserData);
  }
}, [user, userData?.favorites]);

  const refreshFavoritesCount = async () => {
    try {
      console.log('🔄 Refreshing favorites count from API...');
      
      const response = await fetch('/api/favorites', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const favoritesData = await response.json();
        const actualCount = favoritesData.favorites?.length || 0;
        
        console.log('✅ Actual favorites count from API:', actualCount);
        
        setUserData(prev => ({
          ...prev,
          favorites: favoritesData.favorites || []
        }));
        
        return actualCount;
      } else {
        console.error('Failed to fetch favorites:', response.status);
        return 0;
      }
    } catch (error) {
      console.error('Error refreshing favorites count:', error);
      return 0;
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    login,
    register,
    logout,
    updateUserData,
    refreshShoppingList,
    isLoading,
    isHydrated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}