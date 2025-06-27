// src/app/api/search-recipes/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();
        
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
        console.log('📝 Recipe search prompt:', prompt);

        // Enhanced prompt for better recipe responses
        const enhancedPrompt = `You are a professional chef and recipe expert. Based on this request: "${prompt}"

Please provide 3-4 specific, detailed recipes in this EXACT format:

**Recipe 1: [Recipe Name]**
- Main ingredients: [list with amounts like "2 cups flour, 1 tsp salt"]
- Cooking time: [X minutes]
- Difficulty: [Easy/Medium/Hard]
- Servings: [number]
- Instructions:
  1. [Detailed step 1]
  2. [Detailed step 2]
  3. [Detailed step 3]
  [continue with all steps]

**Recipe 2: [Recipe Name]**
- Main ingredients: [list with amounts]
- Cooking time: [X minutes]
- Difficulty: [Easy/Medium/Hard]
- Servings: [number]
- Instructions:
  1. [Detailed step 1]
  2. [Detailed step 2]
  [etc.]

**Recipe 3: [Recipe Name]**
[same format]

IMPORTANT: 
- Be very specific about ingredient amounts (cups, teaspoons, pounds, etc.)
- Provide complete step-by-step cooking instructions
- Make recipes that are actually cookable at home
- If the request mentions specific ingredients, use those ingredients prominently
- Focus on practical, achievable recipes`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful cooking assistant and recipe expert. Provide practical, detailed recipe suggestions with specific ingredients and cooking instructions. Always format your response with clear recipe names and structured information.'
                    },
                    {
                        role: 'user',
                        content: enhancedPrompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7,
                top_p: 0.9,
                return_citations: false,
                search_domain_filter: ["youtube.com"],
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

        return NextResponse.json(data);
        
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

// Add a GET endpoint for debugging
export async function GET() {
    return NextResponse.json({
        message: 'Recipe search API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasApiKey: !!process.env.PERPLEXITY_API_KEY,
        hasPublicApiKey: !!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY
    });
}