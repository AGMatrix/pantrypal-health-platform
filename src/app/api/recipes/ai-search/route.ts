import { NextRequest, NextResponse } from 'next/server';
import { parseRecipeResponse } from '@/lib/recipeParser';

export async function POST(request: NextRequest) {
  try {
    const { prompt, maxResults = 5 } = await request.json();
    
    console.log('🤖 AI Recipe Search API called with prompt:', prompt);
    
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

    const enhancedPrompt = `You are a professional chef and recipe expert. Based on this request: "${prompt}"

Please provide ${maxResults} specific, detailed recipes in this EXACT format:

**Recipe 1: [Descriptive Recipe Name]**
**Description:** [Brief description of the dish]
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

REQUIREMENTS:
- Be very specific about ingredient amounts (cups, teaspoons, pounds, etc.)
- Provide complete step-by-step cooking instructions
- Make recipes that are actually cookable at home
- Include cooking times, servings, and difficulty levels
- Specify cuisine type when relevant`;

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
            content: 'You are a professional chef and recipe expert. Create detailed, practical recipes with specific measurements and clear instructions.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
        top_p: 1,
        return_citations: true,
        search_domain_filter: ["allrecipes.com", "foodnetwork.com", "epicurious.com"]
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
      count: recipes.length
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