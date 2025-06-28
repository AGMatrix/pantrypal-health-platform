// src/app/api/recipes/advanced-search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, createSuccessResponse, validateRequired } from '@/lib/error-handler';
import { parseRecipeResponse } from '@/lib/recipeParser';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface AdvancedSearchParams {
  ingredients?: string[];
  dietary?: string[];
  cuisine?: string;
  maxTime?: number;
  difficulty?: string;
  budget?: number;
  servings?: number;
  prompt?: string;
}

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const params: AdvancedSearchParams = body;
    
    console.log('🔍 Advanced recipe search request:', params);

    // Build enhanced search prompt from parameters
    const prompt = buildEnhancedSearchPrompt(params);
    console.log('🔍 Generated enhanced search prompt:', prompt.substring(0, 200) + '...');

    // Check if Perplexity API is available
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log('⚠️ No Perplexity API key, returning filtered mock recipes');
      return createSuccessResponse({
        recipes: generateMockRecipes(params),
        rawResponse: 'Mock response - no API key configured',
        success: true
      });
    }

    // Call Perplexity API with enhanced prompt
    const aiResponse = await callPerplexityAPI(prompt);
    
    if (!aiResponse) {
      throw new Error('No response from Perplexity API');
    }

    // Parse the AI response into recipes
    const recipes = parseRecipeResponse(aiResponse);
    
    if (recipes.length === 0) {
      console.log('⚠️ No recipes parsed from AI response, returning filtered mock recipes');
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
      success: true,
      searchParams: params
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

function buildEnhancedSearchPrompt(params: AdvancedSearchParams): string {
  let searchContext = '';
  let requirements = [];
  let searchFocus = '';

  // Determine the type of search and build context
  if (params.ingredients && params.ingredients.length > 0) {
    searchContext = `I have these ingredients available: ${params.ingredients.join(', ')}.`;
    searchFocus = 'ingredient-based search';
    requirements.push(`MUST use at least 2-3 of these ingredients: ${params.ingredients.join(', ')}`);
    requirements.push('Prioritize recipes that use the most available ingredients');
  }

  if (params.prompt) {
    searchContext += ` ${params.prompt}`;
  } else {
    searchContext += ' Find me some great recipes to make.';
  }

  // Add dietary requirements
  if (params.dietary && params.dietary.length > 0) {
    requirements.push(`ALL recipes must be ${params.dietary.join(' and ')} compliant`);
    searchFocus = searchFocus ? `${searchFocus} with dietary restrictions` : 'dietary-focused search';
  }

  // Add cuisine preference
  if (params.cuisine) {
    requirements.push(`Focus on ${params.cuisine} cuisine recipes`);
    searchFocus = searchFocus ? `${searchFocus} for ${params.cuisine} food` : `${params.cuisine} cuisine search`;
  }

  // Add time constraints
  if (params.maxTime) {
    requirements.push(`ALL recipes must take ${params.maxTime} minutes or less total time (prep + cook)`);
    if (params.maxTime <= 20) {
      requirements.push('Focus on quick, simple techniques like stir-frying, sautéing, or no-cook options');
    } else if (params.maxTime <= 45) {
      requirements.push('Include one-pot meals, sheet pan recipes, or simple stovetop dishes');
    }
  }

  // Add difficulty level
  if (params.difficulty) {
    requirements.push(`Make all recipes ${params.difficulty} difficulty level`);
    if (params.difficulty.toLowerCase() === 'easy') {
      requirements.push('Use simple techniques, minimal prep work, and common ingredients');
    } else if (params.difficulty.toLowerCase() === 'medium') {
      requirements.push('Include some cooking techniques but keep instructions clear');
    } else if (params.difficulty.toLowerCase() === 'hard') {
      requirements.push('Include advanced techniques and detailed instructions');
    }
  }

  // Add budget constraints
  if (params.budget) {
    requirements.push(`Keep cost per serving under $${params.budget}`);
    if (params.budget <= 3) {
      requirements.push('Focus on budget-friendly ingredients like rice, beans, pasta, eggs, and seasonal vegetables');
    }
  }

  // Add serving size
  if (params.servings) {
    requirements.push(`Scale recipes to serve ${params.servings} people`);
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

function generateMockRecipes(params: AdvancedSearchParams): any[] {
  const allMockRecipes = [
    {
      id: 'mock-advanced-1',
      title: 'Quick Vegetable Stir Fry',
      description: 'A healthy and delicious stir fry perfect for weeknight dinners using whatever vegetables you have',
      ingredients: [
        { name: 'mixed vegetables', amount: 2, unit: 'cups', estimatedPrice: 3.50 },
        { name: 'soy sauce', amount: 3, unit: 'tbsp', estimatedPrice: 0.50 },
        { name: 'garlic', amount: 2, unit: 'cloves', estimatedPrice: 0.25 },
        { name: 'ginger', amount: 1, unit: 'tsp', estimatedPrice: 0.15 },
        { name: 'oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.30 }
      ],
      instructions: [
        'Heat oil in a large wok or skillet over high heat',
        'Add garlic and ginger, stir-fry for 30 seconds until fragrant',
        'Add vegetables and stir-fry for 3-4 minutes until tender-crisp',
        'Add soy sauce and toss to combine',
        'Serve immediately over rice or noodles'
      ],
      cookingTime: 15,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'Asian',
      dietary: ['vegetarian', 'vegan'],
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
      description: 'A nutritious grain bowl packed with Mediterranean flavors and fresh ingredients',
      ingredients: [
        { name: 'quinoa', amount: 1, unit: 'cup', estimatedPrice: 2.00 },
        { name: 'cucumber', amount: 1, unit: 'medium', estimatedPrice: 1.00 },
        { name: 'cherry tomatoes', amount: 1, unit: 'cup', estimatedPrice: 2.50 },
        { name: 'feta cheese', amount: 0.5, unit: 'cup', estimatedPrice: 3.00 },
        { name: 'olives', amount: 0.25, unit: 'cup', estimatedPrice: 1.50 },
        { name: 'olive oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.50 }
      ],
      instructions: [
        'Cook quinoa according to package directions (about 15 minutes)',
        'While quinoa cooks, dice cucumber and halve cherry tomatoes',
        'Crumble feta cheese into small pieces',
        'Fluff cooked quinoa and arrange in serving bowls',
        'Top with vegetables, feta, and olives',
        'Drizzle with olive oil and season with salt and pepper'
      ],
      cookingTime: 20,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'Mediterranean',
      dietary: ['vegetarian', 'healthy', 'high-protein'],
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
      id: 'mock-advanced-3',
      title: 'Simple Chicken Rice Bowl',
      description: 'A protein-packed, budget-friendly meal that uses common pantry ingredients',
      ingredients: [
        { name: 'chicken breast', amount: 1, unit: 'lb', estimatedPrice: 6.99 },
        { name: 'rice', amount: 1, unit: 'cup', estimatedPrice: 0.50 },
        { name: 'onion', amount: 1, unit: 'medium', estimatedPrice: 0.50 },
        { name: 'garlic', amount: 2, unit: 'cloves', estimatedPrice: 0.25 },
        { name: 'soy sauce', amount: 3, unit: 'tbsp', estimatedPrice: 0.50 }
      ],
      instructions: [
        'Cook rice according to package directions',
        'Season and cook chicken breast in a skillet until done (165°F internal temp)',
        'Remove chicken and slice when cool enough to handle',
        'Sauté onion and garlic in the same pan',
        'Return sliced chicken to pan with soy sauce',
        'Serve over rice'
      ],
      cookingTime: 25,
      servings: 3,
      difficulty: 'Easy',
      cuisine: 'Asian',
      dietary: ['high-protein'],
      nutrition: {
        calories: 320,
        protein: 28,
        carbs: 35,
        fat: 8,
        fiber: 2
      },
      costPerServing: 2.75,
      estimatedCost: 8.25,
      image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=300&fit=crop&auto=format&q=80',
      rating: 4.1,
      reviews: 156
    },
    {
      id: 'mock-advanced-4',
      title: 'Creamy Pasta Primavera',
      description: 'A comforting vegetarian pasta dish loaded with seasonal vegetables',
      ingredients: [
        { name: 'pasta', amount: 8, unit: 'oz', estimatedPrice: 1.00 },
        { name: 'heavy cream', amount: 0.5, unit: 'cup', estimatedPrice: 1.50 },
        { name: 'mixed vegetables', amount: 2, unit: 'cups', estimatedPrice: 3.00 },
        { name: 'parmesan cheese', amount: 0.5, unit: 'cup', estimatedPrice: 2.00 },
        { name: 'garlic', amount: 3, unit: 'cloves', estimatedPrice: 0.25 }
      ],
      instructions: [
        'Cook pasta according to package directions until al dente',
        'While pasta cooks, sauté vegetables and garlic until tender',
        'Add cream to vegetables and simmer for 2 minutes',
        'Drain pasta and add to the cream sauce',
        'Toss with parmesan cheese and serve immediately'
      ],
      cookingTime: 18,
      servings: 4,
      difficulty: 'Easy',
      cuisine: 'Italian',
      dietary: ['vegetarian'],
      nutrition: {
        calories: 420,
        protein: 14,
        carbs: 52,
        fat: 18,
        fiber: 4
      },
      costPerServing: 1.94,
      estimatedCost: 7.75,
      image: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80',
      rating: 4.6,
      reviews: 203
    },
    {
      id: 'mock-advanced-5',
      title: 'Budget Lentil Curry',
      description: 'A hearty, protein-rich vegan curry that\'s incredibly budget-friendly',
      ingredients: [
        { name: 'red lentils', amount: 1, unit: 'cup', estimatedPrice: 1.50 },
        { name: 'coconut milk', amount: 1, unit: 'can', estimatedPrice: 2.00 },
        { name: 'onion', amount: 1, unit: 'medium', estimatedPrice: 0.50 },
        { name: 'curry powder', amount: 2, unit: 'tbsp', estimatedPrice: 0.30 },
        { name: 'garlic', amount: 3, unit: 'cloves', estimatedPrice: 0.25 }
      ],
      instructions: [
        'Sauté onion and garlic until softened',
        'Add curry powder and cook for 1 minute until fragrant',
        'Add lentils and coconut milk, bring to a boil',
        'Simmer for 15-20 minutes until lentils are tender',
        'Season with salt and serve over rice'
      ],
      cookingTime: 25,
      servings: 4,
      difficulty: 'Easy',
      cuisine: 'Indian',
      dietary: ['vegan', 'vegetarian', 'high-protein'],
      nutrition: {
        calories: 280,
        protein: 12,
        carbs: 32,
        fat: 12,
        fiber: 8
      },
      costPerServing: 1.14,
      estimatedCost: 4.55,
      image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=300&fit=crop&auto=format&q=80',
      rating: 4.5,
      reviews: 167
    }
  ];

  // Smart filtering based on parameters
  let filteredRecipes = allMockRecipes.filter(recipe => {
    // Check cuisine
    if (params.cuisine && recipe.cuisine.toLowerCase() !== params.cuisine.toLowerCase()) {
      return false;
    }
    
    // Check cooking time
    if (params.maxTime && recipe.cookingTime > params.maxTime) {
      return false;
    }
    
    // Check difficulty
    if (params.difficulty && recipe.difficulty.toLowerCase() !== params.difficulty.toLowerCase()) {
      return false;
    }
    
    // Check dietary requirements - recipe must have ALL specified dietary tags
    if (params.dietary && params.dietary.length > 0) {
      const hasAllDietary = params.dietary.every(diet => 
        recipe.dietary.some(recipeDiet => recipeDiet.toLowerCase().includes(diet.toLowerCase()))
      );
      if (!hasAllDietary) {
        return false;
      }
    }
    
    // Check budget
    if (params.budget && recipe.costPerServing > params.budget) {
      return false;
    }
    
    // Check servings (recipe should serve at least the requested amount)
    if (params.servings && recipe.servings < params.servings) {
      return false;
    }
    
    // Check ingredient matching
    if (params.ingredients && params.ingredients.length > 0) {
      const hasMatchingIngredients = params.ingredients.some(userIngredient =>
        recipe.ingredients.some(recipeIngredient =>
          recipeIngredient.name.toLowerCase().includes(userIngredient.toLowerCase()) ||
          userIngredient.toLowerCase().includes(recipeIngredient.name.toLowerCase())
        )
      );
      if (!hasMatchingIngredients) {
        return false;
      }
    }
    
    return true;
  });

  // If no recipes match the filters, return a few general ones
  if (filteredRecipes.length === 0) {
    console.log('⚠️ No mock recipes matched filters, returning top 2 general recipes');
    filteredRecipes = allMockRecipes.slice(0, 2);
  }

  console.log(`📊 Returning ${filteredRecipes.length} filtered mock recipes`);
  return filteredRecipes;
}

export const POST = withErrorHandler(handler);