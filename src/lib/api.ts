// src/lib/api.ts

import { Recipe, SearchRequest } from '@/types/recipe';
import { parseRecipeResponse } from './recipeParser';

export interface SonarSearchResponse {
  recipes: Recipe[];
  rawResponse: string;
  success: boolean;
  usage?: any;
  error?: string;
}

// Advanced search parameters interface
export interface AdvancedSearchParams {
  ingredients?: string[];
  dietary?: string[];
  cuisine?: string;
  maxTime?: number;
  difficulty?: string;
  budget?: number;
  servings?: number;
}

// Check if we're on the client side and API key is available
function getApiKey(): string | null {
  // In client-side, we can't access process.env directly for security
  // The API calls should be made through your API routes
  return null;
}

export async function searchRecipesWithParsing(req: { 
  prompt: string;
  maxResults?: number;
}): Promise<SonarSearchResponse> {
  try {
    console.log('🚀 Searching recipes via API route:', req.prompt);
    
    // Call our API route instead of directly calling Perplexity
    const response = await fetch('/api/recipes/ai-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: req.prompt,
        maxResults: req.maxResults || 5
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ AI search successful, got', data.recipes.length, 'recipes');
      return {
        recipes: data.recipes,
        rawResponse: data.rawResponse || '',
        success: true
      };
    } else {
      throw new Error(data.error || 'AI search failed');
    }
    
  } catch (error) {
    console.error('❌ AI search error:', error);
    
    return {
      recipes: [],
      rawResponse: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// ADDED: Missing searchRecipesAdvanced function
export async function searchRecipesAdvanced(params: AdvancedSearchParams): Promise<SonarSearchResponse> {
  try {
    console.log('🔍 Advanced recipe search with params:', params);
    
    // Call our advanced search API route
    const response = await fetch('/api/recipes/advanced-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Advanced search successful, got', data.recipes.length, 'recipes');
      return {
        recipes: data.recipes,
        rawResponse: data.rawResponse || '',
        success: true
      };
    } else {
      throw new Error(data.error || 'Advanced search failed');
    }
    
  } catch (error) {
    console.error('❌ Advanced search error:', error);
    
    return {
      recipes: [],
      rawResponse: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function checkAPIConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    console.log('🔍 Checking API connection via health endpoint...');
    
    const response = await fetch('/api/health/check', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        connected: data.apiConnected || false,
        message: data.message || 'API connection checked'
      };
    } else {
      return {
        connected: false,
        message: data.message || 'API health check failed'
      };
    }
  } catch (error) {
    console.error('❌ API connection check failed:', error);
    return {
      connected: false,
      message: `Connection check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}