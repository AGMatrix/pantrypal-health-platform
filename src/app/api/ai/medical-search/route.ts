// src/app/api/ai/medical-search/route.ts
// AI endpoint for medical condition research using multiple providers 

import { NextRequest } from 'next/server';

const AI_PROVIDERS = {
  PERPLEXITY: {
    url: 'https://api.perplexity.ai/chat/completions',
    key: process.env.PERPLEXITY_API_KEY,
    model: 'sonar'
  },
  OPENAI: {
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview'
  },
  ANTHROPIC: {
    url: 'https://api.anthropic.com/v1/messages',
    key: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-sonnet-20240229'
  }
};

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, provider = 'PERPLEXITY' } = await request.json();

    if (!prompt) {
      return Response.json({ 
        success: false, 
        error: 'Prompt is required' 
      }, { status: 400 });
    }

    console.log('🤖 Starting AI medical search with provider:', provider);
    console.log('📝 Prompt length:', prompt.length);

    // Try multiple providers in order of preference
    const providers = ['PERPLEXITY', 'OPENAI', 'ANTHROPIC'];
    let lastError: unknown = null;

    for (const providerName of providers) {
      try {
        console.log(`🔄 Trying provider: ${providerName}`);
        const result = await callAIProvider(providerName, prompt, model);
        
        if (result.success) {
          console.log(`✅ Success with provider: ${providerName}`);
          return Response.json({
            success: true,
            choices: [{ message: { content: result.content } }],
            provider: providerName,
            model: result.model
          });
        }
      } catch (error) {
        console.log(`❌ Provider ${providerName} failed:`, getErrorMessage(error));
        lastError = error;
        continue;
      }
    }

    // If all providers fail, return error
    console.error('🚨 All AI providers failed');
    return Response.json({
      success: false,
      error: 'All AI providers failed',
      lastError: getErrorMessage(lastError)
    }, { status: 500 });

  } catch (error) {
    console.error('🚨 AI search endpoint error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

async function callAIProvider(providerName: string, prompt: string, requestedModel?: string) {
  const provider = AI_PROVIDERS[providerName as keyof typeof AI_PROVIDERS];
  
  if (!provider?.key) {
    throw new Error(`${providerName} API key not configured`);
  }

  const model = requestedModel || provider.model;

  switch (providerName) {
    case 'PERPLEXITY':
      return await callPerplexity(provider, prompt, model);
    case 'OPENAI':
      return await callOpenAI(provider, prompt, model);
    case 'ANTHROPIC':
      return await callAnthropic(provider, prompt, model);
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

async function callPerplexity(provider: any, prompt: string, model: string) {
  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a medical nutrition expert providing evidence-based dietary recommendations for specific health conditions. Always provide detailed, condition-specific advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.1,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return {
      success: true,
      content: data.choices[0].message.content,
      model: model
    };
  }

  throw new Error('Invalid response format from Perplexity');
}

async function callOpenAI(provider: any, prompt: string, model: string) {
  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a medical nutrition expert providing evidence-based dietary recommendations for specific health conditions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return {
      success: true,
      content: data.choices[0].message.content,
      model: model
    };
  }

  throw new Error('Invalid response format from OpenAI');
}

async function callAnthropic(provider: any, prompt: string, model: string) {
  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'x-api-key': provider.key,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      temperature: 0.1,
      system: 'You are a medical nutrition expert providing evidence-based dietary recommendations for specific health conditions.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.content && data.content[0] && data.content[0].text) {
    return {
      success: true,
      content: data.content[0].text,
      model: model
    };
  }

  throw new Error('Invalid response format from Anthropic');
}