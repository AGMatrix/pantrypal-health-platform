// src/app/api/recipes/advanced-search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, createSuccessResponse, validateRequired } from '@/lib/error-handler';
import { parseRecipeResponse } from '@/lib/recipeParser';

interface AdvancedSearchParams {
  ingredients?: string[];
  dietary?: string[];
  cuisine?: string;
  maxTime?: number;
  difficulty?: string;
  budget?: number;
  servings?: number;
}

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const params: AdvancedSearchParams = body;
    
    console.log('🔍 Advanced recipe search request:', params);

    // Build search prompt from parameters
    const prompt = buildSearchPrompt(params);
    console.log('🔍 Generated search prompt:', prompt);

    // Check if Perplexity API is available
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log('⚠️ No Perplexity API key, returning mock recipes');
      return createSuccessResponse({
        recipes: generateMockRecipes(params),
        rawResponse: 'Mock response - no API key configured',
        success: true
      });
    }

    // Call Perplexity API
    const aiResponse = await callPerplexityAPI(prompt);
    
    if (!aiResponse) {
      throw new Error('No response from Perplexity API');
    }

    // Parse the AI response into recipes
    const recipes = parseRecipeResponse(aiResponse);
    
    if (recipes.length === 0) {
      console.log('⚠️ No recipes parsed from AI response, returning mock recipes');
      return createSuccessResponse({
        recipes: generateMockRecipes(params),
        rawResponse: aiResponse,
        success: true
      });
    }

    console.log('✅ Advanced search successful:', recipes.length, 'recipes');
    
    return createSuccessResponse({
      recipes,
      rawResponse: aiResponse,
      success: true
    });

  } catch (error) {
    console.error('❌ Advanced search error:', error);
    
    // Fallback to mock recipes on error
    const body = await request.json().catch(() => ({}));
    const mockRecipes = generateMockRecipes(body);
    
    return createSuccessResponse({
      recipes: mockRecipes,
      rawResponse: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: true
    });
  }
}

function buildSearchPrompt(params: AdvancedSearchParams): string {
  const parts = ['Find recipes'];
  
  if (params.ingredients && params.ingredients.length > 0) {
    parts.push(`using ingredients: ${params.ingredients.join(', ')}`);
  }
  
  if (params.cuisine) {
    parts.push(`from ${params.cuisine} cuisine`);
  }
  
  if (params.dietary && params.dietary.length > 0) {
    parts.push(`that are ${params.dietary.join(' and ')}`);
  }
  
  if (params.difficulty) {
    parts.push(`with ${params.difficulty.toLowerCase()} difficulty`);
  }
  
  if (params.maxTime) {
    parts.push(`that take no more than ${params.maxTime} minutes to cook`);
  }
  
  if (params.servings) {
    parts.push(`serving ${params.servings} people`);
  }
  
  if (params.budget) {
    parts.push(`under $${params.budget} per serving`);
  }
  
  const prompt = parts.join(' ') + '. Provide 3-5 complete recipes with ingredients, instructions, cooking time, and nutritional information.';
  
  return prompt;
}

async function callPerplexityAPI(prompt: string): Promise<string | null> {
  try {
    console.log('🚀 Calling Perplexity API for advanced search...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful recipe assistant. Provide complete recipes with ingredients lists, step-by-step instructions, cooking times, serving sizes, and difficulty levels. Format recipes clearly and include realistic nutritional information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
        top_p: 1,
        return_citations: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from Perplexity API');
    }
    
    console.log('✅ Perplexity API response received');
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('❌ Perplexity API call failed:', error);
    throw error;
  }
}

function generateMockRecipes(params: AdvancedSearchParams): any[] {
  const mockRecipes = [
    {
      id: 'mock-advanced-1',
      title: 'Quick Vegetable Stir Fry',
      description: 'A healthy and delicious stir fry perfect for weeknight dinners',
      ingredients: [
        { name: 'mixed vegetables', amount: 2, unit: 'cups', estimatedPrice: 3.50 },
        { name: 'soy sauce', amount: 3, unit: 'tbsp', estimatedPrice: 0.50 },
        { name: 'garlic', amount: 2, unit: 'cloves', estimatedPrice: 0.25 },
        { name: 'ginger', amount: 1, unit: 'tsp', estimatedPrice: 0.15 },
        { name: 'oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.30 }
      ],
      instructions: [
        'Heat oil in a large wok or skillet over high heat',
        'Add garlic and ginger, stir-fry for 30 seconds',
        'Add vegetables and stir-fry for 3-4 minutes',
        'Add soy sauce and toss to combine',
        'Serve immediately over rice'
      ],
      cookingTime: 15,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'Asian',
      dietary: ['vegetarian'],
      nutrition: {
        calories: 180,
        protein: 6,
        carbs: 20,
        fat: 8,
        fiber: 4
      },
      costPerServing: 2.35,
      estimatedCost: 4.70,
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80',
      rating: 4.3,
      reviews: 89
    },
    {
      id: 'mock-advanced-2',
      title: 'Mediterranean Quinoa Bowl',
      description: 'A nutritious grain bowl packed with Mediterranean flavors',
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
    }
  ];

  // Filter mock recipes based on parameters
  return mockRecipes.filter(recipe => {
    if (params.cuisine && recipe.cuisine.toLowerCase() !== params.cuisine.toLowerCase()) {
      return false;
    }
    
    if (params.maxTime && recipe.cookingTime > params.maxTime) {
      return false;
    }
    
    if (params.difficulty && recipe.difficulty.toLowerCase() !== params.difficulty.toLowerCase()) {
      return false;
    }
    
    if (params.dietary && params.dietary.length > 0) {
      const hasAllDietary = params.dietary.every(diet => 
        recipe.dietary.some(recipeDiet => recipeDiet.toLowerCase().includes(diet.toLowerCase()))
      );
      if (!hasAllDietary) {
        return false;
      }
    }
    
    if (params.budget && recipe.costPerServing > params.budget) {
      return false;
    }
    
    if (params.servings && recipe.servings < params.servings) {
      return false;
    }
    
    return true;
  });
}

export const POST = withErrorHandler(handler);