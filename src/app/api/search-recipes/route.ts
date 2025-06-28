// src/app/api/search-recipes/route.ts

import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { prompt, ingredients, filters } = await request.json();
        
        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' }, 
                { status: 400 }
            );
        }

        // Check for API key with better debugging
        const apiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
        
        console.log('🔍 Environment check:', {
            hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
            hasPublicKey: !!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY,
            nodeEnv: process.env.NODE_ENV
        });
        
        if (!apiKey) {
            console.error('❌ No API key found in environment variables');
            console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('PERPLEXITY')));
            return NextResponse.json(
                { 
                    error: 'API key not configured',
                    debug: 'Check your .env.local file for PERPLEXITY_API_KEY',
                    availableKeys: Object.keys(process.env).filter(key => key.includes('PERPLEXITY'))
                }, 
                { status: 500 }
            );
        }

        console.log('🔑 API Key found:', apiKey.substring(0, 15) + '...');
        console.log('📝 Recipe search request:', { prompt, ingredients, filters });

        // Create smart enhanced prompt based on search context
        const enhancedPrompt = createSmartRecipePrompt(prompt, ingredients, filters);
        console.log('📝 Generated enhanced prompt:', enhancedPrompt.substring(0, 200) + '...');

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online', // Using larger model for better results
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional chef and recipe expert. Create detailed, practical recipes with specific measurements and clear instructions. Focus on recipes that can be made at home with commonly available ingredients and equipment.'
                    },
                    {
                        role: 'user',
                        content: enhancedPrompt
                    }
                ],
                max_tokens: 3000, // Increased for more detailed responses
                temperature: 0.2, // Lower for more consistent results
                top_p: 0.9,
                return_citations: true,
                search_domain_filter: ["allrecipes.com", "foodnetwork.com", "epicurious.com", "tasty.co", "simplyrecipes.com"],
                return_images: false,
                return_related_questions: false,
                search_recency_filter: "month",
                top_k: 0,
                stream: false,
                presence_penalty: 0,
                frequency_penalty: 1
            })
        });

        console.log('🌐 Perplexity API Response Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Perplexity API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            
            return NextResponse.json(
                { 
                    error: `Perplexity API request failed: ${response.status}`,
                    details: errorText,
                    debugInfo: {
                        url: 'https://api.perplexity.ai/chat/completions',
                        method: 'POST',
                        status: response.status,
                        statusText: response.statusText
                    }
                }, 
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('✅ Perplexity API Success:', {
            model: data.model,
            usage: data.usage,
            responseLength: data.choices?.[0]?.message?.content?.length || 0,
            hasChoices: !!data.choices?.length
        });

        // Validate response structure
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ Invalid response structure:', data);
            return NextResponse.json(
                { 
                    error: 'Invalid response from Perplexity API',
                    receivedData: data
                }, 
                { status: 500 }
            );
        }

        return NextResponse.json({
            ...data,
            searchContext: {
                originalPrompt: prompt,
                ingredients: ingredients || [],
                filters: filters || {},
                searchType: determineSearchType(prompt, ingredients)
            }
        });
        
    } catch (error) {
        console.error('❌ API route error:', error);
        
        return NextResponse.json(
            { 
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            }, 
            { status: 500 }
        );
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

function createSmartRecipePrompt(prompt: string, ingredients?: string[], filters?: any): string {
    const searchType = determineSearchType(prompt, ingredients);
    console.log('🔍 Detected search type:', searchType);
    
    let baseContext = '';
    let requirements = [];
    let searchFocus = '';
    
    // Build context based on search type
    switch (searchType) {
        case 'ingredient-based':
            if (ingredients && ingredients.length > 0) {
                baseContext = `I have these ingredients available: ${ingredients.join(', ')}. ${prompt}`;
                requirements.push(`MUST use at least 2-3 of these available ingredients: ${ingredients.join(', ')}`);
                requirements.push('Prioritize recipes that use the most of these ingredients');
                requirements.push('Include substitute suggestions if needed');
            } else {
                baseContext = prompt;
                requirements.push('Focus on recipes using common pantry ingredients');
            }
            break;
            
        case 'dish-specific':
            baseContext = prompt;
            requirements.push('Provide authentic variations of the requested dish');
            requirements.push('Include different cooking methods and techniques');
            requirements.push('Make recipes detailed and accurate');
            break;
            
        case 'dietary-preference':
            baseContext = prompt;
            requirements.push('Strictly adhere to dietary requirements mentioned');
            requirements.push('Provide nutritional highlights');
            requirements.push('Suggest ingredient swaps for dietary compliance');
            break;
            
        case 'mood-based':
            baseContext = prompt;
            requirements.push('Match the mood/occasion specified');
            requirements.push('Consider appropriate cooking time and complexity');
            requirements.push('Include timing and preparation tips');
            break;
            
        default:
            baseContext = prompt;
            requirements.push('Provide diverse, approachable recipes');
            requirements.push('Include various cooking methods and cuisines');
    }
    
    // Add filter-specific requirements
    if (filters) {
        if (filters.maxTime) {
            requirements.push(`ALL recipes must take ${filters.maxTime} minutes or less`);
        }
        if (filters.difficulty) {
            requirements.push(`Make recipes ${filters.difficulty} difficulty level`);
        }
        if (filters.cuisine) {
            requirements.push(`Focus on ${filters.cuisine} cuisine recipes`);
        }
        if (filters.dietary && filters.dietary.length > 0) {
            requirements.push(`Recipes must be ${filters.dietary.join(' and ')} compliant`);
        }
    }

    return `You are a professional chef and recipe expert. Based on this request: "${baseContext}"

Please provide 3-4 specific, detailed recipes in this EXACT format:

**Recipe 1: [Descriptive Recipe Name]**
**Description:** [Brief appealing description explaining why this recipe fits the request]
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

**Recipe 2: [Descriptive Recipe Name]**
[Same format as Recipe 1]

**Recipe 3: [Descriptive Recipe Name]**
[Same format as Recipe 1]

**Recipe 4: [Descriptive Recipe Name]**
[Same format as Recipe 1]

CRITICAL REQUIREMENTS:
${requirements.length > 0 ? requirements.map(req => `- ${req}`).join('\n') : '- Provide practical, home-cookable recipes'}
- Be very specific about ingredient amounts (cups, teaspoons, pounds, etc.)
- Provide complete step-by-step cooking instructions
- Make recipes that are actually cookable at home with standard equipment
- Include accurate cooking times, servings, and difficulty levels
- Specify cuisine type when relevant
- Each recipe should be unique and interesting
- Make sure descriptions explain why each recipe fits the request

FORMATTING RULES:
- Use the exact format shown above
- Start each recipe with "**Recipe [number]: [name]**"
- Include all sections for each recipe
- Be detailed but concise
- Make instructions clear for home cooks

Focus on creating recipes that genuinely satisfy the user's request and will be enjoyable to cook and eat.`;
}

// Add a GET endpoint for debugging
export async function GET() {
    return NextResponse.json({
        message: 'Enhanced recipe search API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasApiKey: !!process.env.PERPLEXITY_API_KEY,
        hasPublicApiKey: !!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY,
        features: [
            'Smart search type detection',
            'Context-aware prompt building',
            'Ingredient-based searching',
            'Dietary preference filtering',
            'Enhanced recipe formatting'
        ]
    });
}