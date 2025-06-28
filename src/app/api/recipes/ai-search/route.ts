import { NextRequest, NextResponse } from 'next/server';
import { parseRecipeResponse } from '@/lib/recipeParser';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { prompt, maxResults = 5, ingredients, filters } = await request.json();
    
    console.log('🤖 AI Recipe Search API called with:', { prompt, ingredients, filters });
    
    // Check if API key is available
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.error('❌ PERPLEXITY_API_KEY not found in environment');
      return NextResponse.json({
        success: false,
        error: 'API key not configured. Please add PERPLEXITY_API_KEY to your environment variables.',
        recipes: []
      }, { status: 500 });
    }

    console.log('✅ API key found, making request to Perplexity...');

    // Create a smart prompt based on the type of search
    const enhancedPrompt = createSmartPrompt(prompt, ingredients, filters, maxResults);
    console.log('📝 Generated prompt:', enhancedPrompt.substring(0, 200) + '...');

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
            content: 'You are a professional chef and recipe expert. Create detailed, practical recipes with specific measurements and clear instructions. Focus on recipes that can be made at home with commonly available ingredients.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2, // Slightly higher for more creativity
        top_p: 1,
        return_citations: true,
        search_domain_filter: ["allrecipes.com", "foodnetwork.com", "epicurious.com", "tasty.co", "simplyrecipes.com"]
      }),
    });

    console.log('📡 Perplexity response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity API error:', errorText);
      
      let errorMessage = 'Perplexity API request failed';
      if (response.status === 401) {
        errorMessage = 'Invalid Perplexity API key. Please check your PERPLEXITY_API_KEY environment variable.';
      } else if (response.status === 429) {
        errorMessage = 'Perplexity API rate limit exceeded. Please try again later.';
      } else if (response.status === 402) {
        errorMessage = 'Perplexity API credits exhausted. Please check your account balance.';
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        recipes: []
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Perplexity API success');
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json({
        success: false,
        error: 'Invalid response format from Perplexity API',
        recipes: []
      }, { status: 500 });
    }
    
    const rawResponse = data.choices[0].message.content;
    console.log('📝 Raw response received, parsing recipes...');
    
    // Parse the response into structured recipes
    const recipes = parseRecipeResponse(rawResponse);
    console.log('🍳 Parsed', recipes.length, 'recipes successfully');
    
    // Save recipes to database if needed
    for (const recipe of recipes) {
      try {
        await saveRecipeToDatabase(recipe);
      } catch (error) {
        console.log('⚠️ Failed to save recipe to database:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      recipes,
      rawResponse,
      count: recipes.length,
      searchType: determineSearchType(prompt, ingredients)
    });
    
  } catch (error) {
    console.error('❌ AI search API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      recipes: []
    }, { status: 500 });
  }
}

function determineSearchType(prompt: string, ingredients?: string[]): string {
  if (ingredients && ingredients.length > 0) {
    return 'ingredient-based';
  }
  
  const promptLower = prompt.toLowerCase();
  
  // Check if it's a specific dish name
  const dishIndicators = ['recipe for', 'how to make', 'cook', 'prepare'];
  if (dishIndicators.some(indicator => promptLower.includes(indicator))) {
    return 'dish-specific';
  }
  
  // Check if it's ingredient-based
  const ingredientIndicators = ['with', 'using', 'have', 'pantry', 'ingredients'];
  if (ingredientIndicators.some(indicator => promptLower.includes(indicator))) {
    return 'ingredient-based';
  }
  
  // Check if it's dietary/style-based
  const dietaryIndicators = ['healthy', 'vegan', 'vegetarian', 'keto', 'low-carb', 'gluten-free'];
  if (dietaryIndicators.some(indicator => promptLower.includes(indicator))) {
    return 'dietary-preference';
  }
  
  // Check if it's mood/occasion-based
  const moodIndicators = ['quick', 'easy', 'comfort', 'fancy', 'simple', 'dinner', 'breakfast', 'lunch'];
  if (moodIndicators.some(indicator => promptLower.includes(indicator))) {
    return 'mood-based';
  }
  
  return 'general';
}

function createSmartPrompt(prompt: string, ingredients?: string[], filters?: any, maxResults: number = 5): string {
  const searchType = determineSearchType(prompt, ingredients);
  console.log('🔍 Detected search type:', searchType);
  
  let basePrompt = '';
  let contextualRequirements = '';
  
  switch (searchType) {
    case 'ingredient-based':
      if (ingredients && ingredients.length > 0) {
        basePrompt = `I have these ingredients: ${ingredients.join(', ')}. ${prompt}`;
        contextualRequirements = `
- MUST use at least 2-3 of these available ingredients: ${ingredients.join(', ')}
- Prioritize recipes that use the most of these ingredients
- Include substitute suggestions if an ingredient is missing
- Make recipes that feel like "clean out the fridge" meals`;
      } else {
        basePrompt = prompt;
        contextualRequirements = `
- Focus on recipes using common pantry ingredients
- Provide ingredient substitution options
- Make recipes accessible with everyday items`;
      }
      break;
      
    case 'dish-specific':
      basePrompt = prompt;
      contextualRequirements = `
- Provide authentic variations of the requested dish
- Include different cooking methods (oven, stovetop, etc.)
- Offer both traditional and modern interpretations
- Make sure recipes are detailed and accurate`;
      break;
      
    case 'dietary-preference':
      basePrompt = prompt;
      contextualRequirements = `
- Strictly adhere to the dietary requirements mentioned
- Provide nutritional highlights
- Suggest ingredient swaps for dietary compliance
- Make recipes satisfying despite restrictions`;
      break;
      
    case 'mood-based':
      basePrompt = prompt;
      contextualRequirements = `
- Match the mood/occasion specified in the request
- Consider cooking time and complexity for the context
- Provide recipes that fit the energy level implied
- Include timing and preparation tips`;
      break;
      
    default:
      basePrompt = prompt;
      contextualRequirements = `
- Provide diverse, approachable recipes
- Include various cooking methods and cuisines
- Make recipes suitable for home cooking
- Consider different skill levels`;
  }
  
  // Add filter-specific requirements
  if (filters) {
    if (filters.maxTime) {
      contextualRequirements += `\n- ALL recipes must take ${filters.maxTime} minutes or less to cook`;
    }
    if (filters.difficulty) {
      contextualRequirements += `\n- Make recipes ${filters.difficulty} difficulty level`;
    }
    if (filters.cuisine) {
      contextualRequirements += `\n- Focus on ${filters.cuisine} cuisine recipes`;
    }
    if (filters.dietary && filters.dietary.length > 0) {
      contextualRequirements += `\n- Recipes must be ${filters.dietary.join(', ')} compliant`;
    }
  }

  return `You are a professional chef and recipe expert. Based on this request: "${basePrompt}"

Please provide ${maxResults} specific, detailed recipes in this EXACT format:

**Recipe 1: [Descriptive Recipe Name]**
**Description:** [Brief appealing description of the dish and why it's perfect for this request]
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
- Be very specific about ingredient amounts (cups, teaspoons, pounds, etc.)
- Provide complete step-by-step cooking instructions
- Make recipes that are actually cookable at home with common equipment
- Include accurate cooking times, servings, and difficulty levels
- Specify cuisine type when relevant
- Make each recipe unique and interesting
${contextualRequirements}

FORMATTING RULES:
- Use the exact format shown above
- Start each recipe with "**Recipe [number]: [name]**"
- Include all sections for each recipe
- Be detailed but concise
- Make instructions clear for home cooks

Focus on creating recipes that will genuinely satisfy the user's request and be enjoyable to cook and eat.`;
}

async function saveRecipeToDatabase(recipe: any) {
  try {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save recipe:', error);
    return false;
  }
}