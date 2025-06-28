// src/app/api/recipes/search-with-parsing/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler';
import { parseRecipeResponse } from '@/lib/recipeParser';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface SearchRequest {
  prompt: string;
  maxResults?: number;
  ingredients?: string[];
  filters?: any;
}

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, maxResults = 5, ingredients = [], filters = {} }: SearchRequest = body;
    
    console.log('🔍 Recipe search with parsing request:', { prompt, maxResults, ingredients, filters });

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Valid prompt is required',
          received: { prompt, type: typeof prompt }
        }, 
        { status: 400 }
      );
    }

    // Build enhanced search prompt
    const enhancedPrompt = buildSearchPrompt(prompt, ingredients, filters);
    console.log('🔍 Generated enhanced search prompt:', enhancedPrompt.substring(0, 200) + '...');

    // Check if Perplexity API is available
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.log('⚠️ No Perplexity API key, returning mock recipes');
      return createSuccessResponse({
        recipes: generateMockRecipesForPrompt(prompt, ingredients, filters),
        rawResponse: 'Mock response - no API key configured',
        success: true,
        searchContext: { prompt, ingredients, filters }
      });
    }

    // Call Perplexity API
    const aiResponse = await callPerplexityAPI(enhancedPrompt, apiKey);
    
    if (!aiResponse) {
      throw new Error('No response from Perplexity API');
    }

    // Parse the AI response into recipes
    const recipes = parseRecipeResponse(aiResponse);
    
    if (recipes.length === 0) {
      console.log('⚠️ No recipes parsed from AI response, returning mock recipes');
      return createSuccessResponse({
        recipes: generateMockRecipesForPrompt(prompt, ingredients, filters),
        rawResponse: aiResponse,
        success: true,
        searchContext: { prompt, ingredients, filters }
      });
    }

    console.log('✅ Search with parsing successful:', recipes.length, 'recipes');
    
    return createSuccessResponse({
      recipes: recipes.slice(0, maxResults),
      rawResponse: aiResponse,
      success: true,
      searchContext: { prompt, ingredients, filters }
    });

  } catch (error) {
    console.error('❌ Search with parsing error:', error);
    
    // Fallback to mock recipes on error
    const mockRecipes = generateMockRecipesForPrompt('fallback search', [], {});
    
    return createSuccessResponse({
      recipes: mockRecipes,
      rawResponse: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function buildSearchPrompt(prompt: string, ingredients: string[], filters: any): string {
  let searchContext = '';
  let requirements = [];

  // Build context based on ingredients
  if (ingredients && ingredients.length > 0) {
    searchContext = `I have these ingredients available: ${ingredients.join(', ')}. ${prompt}`;
    requirements.push(`MUST use at least 2-3 of these available ingredients: ${ingredients.join(', ')}`);
    requirements.push('Prioritize recipes that use the most available ingredients');
  } else {
    searchContext = prompt;
  }

  // Add filter requirements
  if (filters.dietary && filters.dietary.length > 0) {
    requirements.push(`ALL recipes must be ${filters.dietary.join(' and ')} compliant`);
  }
  if (filters.cuisine) {
    requirements.push(`Focus on ${filters.cuisine} cuisine recipes`);
  }
  if (filters.maxTime) {
    requirements.push(`ALL recipes must take ${filters.maxTime} minutes or less total time`);
  }
  if (filters.difficulty) {
    requirements.push(`Make all recipes ${filters.difficulty} difficulty level`);
  }
  if (filters.maxCost) {
    requirements.push(`Keep cost per serving under $${filters.maxCost}`);
  }

  const enhancedPrompt = `You are a professional chef and recipe expert. ${searchContext}

Please provide 3-5 specific, detailed recipes in this EXACT format:

**Recipe 1: [Descriptive Recipe Name]**
**Description:** [Brief appealing description that explains why this recipe fits the request]
**Ingredients:**
- [amount] [unit] [ingredient name]
- [amount] [unit] [ingredient name]
- [continue for all ingredients]

**Instructions:**
1. [Detailed step-by-step instruction]
2. [Next instruction]
3. [Continue with all steps]

**Cooking Time:** [X] minutes
**Servings:** [number]
**Difficulty:** [Easy/Medium/Hard]
**Cuisine:** [cuisine type]

CRITICAL REQUIREMENTS:
${requirements.length > 0 ? requirements.map(req => `- ${req}`).join('\n') : '- Provide practical, home-cookable recipes'}
- Be very specific about ingredient amounts (cups, teaspoons, pounds, etc.)
- Provide complete step-by-step cooking instructions
- Make recipes that are actually cookable at home with standard equipment
- Include accurate cooking times, servings, and difficulty levels
- Specify cuisine type when relevant
- Each recipe should be unique and interesting

FORMATTING RULES:
- Use the exact format shown above
- Start each recipe with "**Recipe [number]: [name]**"
- Include all sections for each recipe
- Be detailed but concise
- Make instructions clear for home cooks

Focus on creating recipes that genuinely match the search criteria and will be enjoyable to cook and eat.`;

  return enhancedPrompt;
}

async function callPerplexityAPI(prompt: string, apiKey: string): Promise<string | null> {
  try {
    console.log('🚀 Calling Perplexity API for search with parsing...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a professional chef and recipe expert. Create detailed, practical recipes with specific measurements and clear instructions. Focus on recipes that can be made at home with commonly available ingredients and equipment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2,
        top_p: 1,
        return_citations: true,
        search_domain_filter: ["allrecipes.com", "foodnetwork.com", "epicurious.com", "tasty.co", "simplyrecipes.com"]
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

function generateMockRecipesForPrompt(prompt: string, ingredients: string[], filters: any): any[] {
  const allMockRecipes = [
    {
      id: 'mock-search-1',
      title: 'Quick Chicken Stir Fry',
      description: 'A delicious and healthy stir fry ready in 20 minutes with vibrant vegetables and tender chicken',
      ingredients: [
        { name: 'chicken breast', amount: 1, unit: 'lb', estimatedPrice: 6.99 },
        { name: 'mixed vegetables', amount: 2, unit: 'cups', estimatedPrice: 3.50 },
        { name: 'soy sauce', amount: 3, unit: 'tbsp', estimatedPrice: 0.50 },
        { name: 'garlic', amount: 2, unit: 'cloves', estimatedPrice: 0.25 },
        { name: 'oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.30 }
      ],
      instructions: [
        'Cut chicken into bite-sized pieces and season with salt and pepper',
        'Heat oil in a large skillet or wok over medium-high heat',
        'Add chicken and cook for 5-7 minutes until golden brown',
        'Add garlic and cook for 30 seconds until fragrant',
        'Add mixed vegetables and stir-fry for 3-4 minutes',
        'Pour in soy sauce and stir everything together',
        'Cook for 1-2 more minutes until vegetables are tender-crisp'
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
      costPerServing: 2.89,
      estimatedCost: 11.54,
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80',
      rating: 4.5,
      reviews: 128
    },
    {
      id: 'mock-search-2',
      title: 'Mediterranean Quinoa Bowl',
      description: 'A nutritious grain bowl packed with Mediterranean flavors and fresh ingredients',
      ingredients: [
        { name: 'quinoa', amount: 1, unit: 'cup', estimatedPrice: 2.00 },
        { name: 'cucumber', amount: 1, unit: 'medium', estimatedPrice: 1.00 },
        { name: 'cherry tomatoes', amount: 1, unit: 'cup', estimatedPrice: 2.50 },
        { name: 'feta cheese', amount: 0.5, unit: 'cup', estimatedPrice: 3.00 },
        { name: 'olive oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.50 }
      ],
      instructions: [
        'Cook quinoa according to package directions',
        'While quinoa cooks, dice cucumber and halve cherry tomatoes',
        'Crumble feta cheese into small pieces',
        'Fluff cooked quinoa and arrange in serving bowls',
        'Top with vegetables and feta',
        'Drizzle with olive oil and season with salt and pepper'
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
      costPerServing: 4.50,
      estimatedCost: 9.00,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format&q=80',
      rating: 4.4,
      reviews: 92
    },
    {
      id: 'mock-search-3',
      title: 'Simple Pasta Aglio e Olio',
      description: 'Classic Italian pasta with garlic and olive oil - ready in 15 minutes',
      ingredients: [
        { name: 'spaghetti', amount: 8, unit: 'oz', estimatedPrice: 1.00 },
        { name: 'olive oil', amount: 0.25, unit: 'cup', estimatedPrice: 1.50 },
        { name: 'garlic', amount: 4, unit: 'cloves', estimatedPrice: 0.50 },
        { name: 'red pepper flakes', amount: 0.5, unit: 'tsp', estimatedPrice: 0.10 },
        { name: 'parmesan cheese', amount: 0.5, unit: 'cup', estimatedPrice: 2.00 }
      ],
      instructions: [
        'Cook spaghetti according to package directions until al dente',
        'While pasta cooks, heat olive oil in large skillet',
        'Add sliced garlic and red pepper flakes to oil',
        'Cook until garlic is golden, about 2 minutes',
        'Drain pasta, reserving pasta water',
        'Add pasta to skillet with garlic oil',
        'Toss with pasta water and serve with parmesan'
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
      costPerServing: 2.55,
      estimatedCost: 5.10,
      image: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80',
      rating: 4.6,
      reviews: 156
    }
  ];

  // Filter based on criteria
  let filteredRecipes = allMockRecipes.filter(recipe => {
    // Check if matches ingredients
    if (ingredients && ingredients.length > 0) {
      const hasMatchingIngredients = ingredients.some(userIng =>
        recipe.ingredients.some(recipeIng =>
          recipeIng.name.toLowerCase().includes(userIng.toLowerCase()) ||
          userIng.toLowerCase().includes(recipeIng.name.toLowerCase())
        )
      );
      if (!hasMatchingIngredients) {
        return false;
      }
    }

    // Check filters
    if (filters.cuisine && recipe.cuisine.toLowerCase() !== filters.cuisine.toLowerCase()) {
      return false;
    }
    if (filters.maxTime && recipe.cookingTime > filters.maxTime) {
      return false;
    }
    if (filters.difficulty && recipe.difficulty.toLowerCase() !== filters.difficulty.toLowerCase()) {
      return false;
    }
    if (filters.dietary && filters.dietary.length > 0) {
      const hasAllDietary = filters.dietary.every((diet: string) => 
        recipe.dietary.some(recipeDiet => recipeDiet.toLowerCase().includes(diet.toLowerCase()))
      );
      if (!hasAllDietary) {
        return false;
      }
    }

    return true;
  });

  // If no matches, return all recipes
  if (filteredRecipes.length === 0) {
    filteredRecipes = allMockRecipes;
  }

  console.log(`📊 Returning ${filteredRecipes.length} mock recipes for search`);
  return filteredRecipes;
}

export const POST = withErrorHandler(handler);