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

// Ingredient substitution interface
export interface IngredientSubstitution {
  original: string;
  substitute: string;
  ratio: string;
  notes?: string;
  availability?: 'common' | 'specialty' | 'rare';
}

export interface SubstitutionResponse {
  substitutions: IngredientSubstitution[];
  success: boolean;
  error?: string;
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

// ADDED: Missing getIngredientSubstitutions function
export async function getIngredientSubstitutions(ingredients: string[]): Promise<SubstitutionResponse> {
  try {
    console.log('🔄 Getting ingredient substitutions for:', ingredients);
    
    // Call the ingredient substitutions API route
    const response = await fetch('/api/ingredients/substitutions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ingredients })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Substitutions found for', data.substitutions.length, 'ingredients');
      return {
        substitutions: data.substitutions,
        success: true
      };
    } else {
      throw new Error(data.error || 'Failed to get substitutions');
    }
    
  } catch (error) {
    console.error('❌ Ingredient substitutions error:', error);
    
    // Return mock substitutions as fallback
    const mockSubstitutions: IngredientSubstitution[] = ingredients.map(ingredient => ({
      original: ingredient,
      substitute: getMockSubstitute(ingredient),
      ratio: '1:1',
      notes: 'Common substitute available in most stores',
      availability: 'common' as const
    }));
    
    return {
      substitutions: mockSubstitutions,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper function to provide mock substitutions
function getMockSubstitute(ingredient: string): string {
  const substitutes: Record<string, string> = {
    'butter': 'margarine or coconut oil',
    'milk': 'almond milk or oat milk',
    'eggs': 'flax eggs or applesauce',
    'flour': 'almond flour or coconut flour',
    'sugar': 'honey or maple syrup',
    'cream': 'coconut cream or cashew cream',
    'cheese': 'nutritional yeast or vegan cheese',
    'chicken': 'tofu or tempeh',
    'beef': 'mushrooms or lentils',
    'fish': 'banana peel or jackfruit',
    'onion': 'shallots or garlic',
    'garlic': 'garlic powder or onion powder',
    'lemon': 'lime or vinegar',
    'tomato': 'red bell pepper or paprika',
    'yogurt': 'sour cream or applesauce'
  };
  
  const lowerIngredient = ingredient.toLowerCase();
  
  // Find a substitute based on partial matches
  for (const [key, value] of Object.entries(substitutes)) {
    if (lowerIngredient.includes(key)) {
      return value;
    }
  }
  
  return `Alternative for ${ingredient}`;
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