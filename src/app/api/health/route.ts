// src/app/api/health/route.ts
// Comprehensive health monitoring

import { supabase } from '@/lib/database';

export async function GET() {
  try {
    const checks = await Promise.all([
      checkDatabase(),
      checkCache(),
      checkExternalAPIs()
    ]);
    
    const healthy = checks.every(check => check.status === 'healthy');
    
    return Response.json({
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }, { 
      status: healthy ? 200 : 503 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Health check error:', errorMessage);
    
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }, { 
      status: 503 
    });
  }
}

async function checkDatabase() {
  const startTime = Date.now();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    return { 
      name: 'database', 
      status: error ? 'unhealthy' : 'healthy',
      responseTime,
      details: error ? { error: error.message } : { connected: true }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return { 
      name: 'database', 
      status: 'unhealthy', 
      responseTime: Date.now() - startTime,
      error: errorMessage 
    };
  }
}

async function checkCache() {
  const startTime = Date.now();
  try {
    // Simple memory cache check - you can expand this based on your caching solution
    const testKey = 'health-check-' + Date.now();
    const testValue = 'test';
    
    // If you're using a caching solution like Redis, check it here
    // For now, we'll just simulate a cache check
    const cacheAvailable = true; // Replace with actual cache check
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'cache',
      status: cacheAvailable ? 'healthy' : 'unhealthy',
      responseTime,
      details: { available: cacheAvailable }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown cache error';
    return {
      name: 'cache',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: errorMessage
    };
  }
}

async function checkExternalAPIs() {
  const startTime = Date.now();
  try {
    const apiChecks = [];
    
    // Check AI APIs if configured
    if (process.env.OPENAI_API_KEY) {
      try {
        // Simple connectivity check to OpenAI
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        apiChecks.push({
          name: 'openai',
          status: response.ok ? 'healthy' : 'unhealthy',
          statusCode: response.status
        });
      } catch (error) {
        apiChecks.push({
          name: 'openai',
          status: 'unhealthy',
          error: 'Connection failed'
        });
      }
    }
    
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        // Simple connectivity check to Perplexity
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        apiChecks.push({
          name: 'perplexity',
          status: response.ok ? 'healthy' : 'unhealthy',
          statusCode: response.status
        });
      } catch (error) {
        apiChecks.push({
          name: 'perplexity',
          status: 'unhealthy',
          error: 'Connection failed'
        });
      }
    }
    
    // If no external APIs are configured
    if (apiChecks.length === 0) {
      apiChecks.push({
        name: 'external-apis',
        status: 'healthy',
        message: 'No external APIs configured'
      });
    }
    
    const responseTime = Date.now() - startTime;
    const allHealthy = apiChecks.every(check => check.status === 'healthy');
    
    return {
      name: 'external-apis',
      status: allHealthy ? 'healthy' : 'degraded',
      responseTime,
      details: apiChecks
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
    return {
      name: 'external-apis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: errorMessage
    };
  }
}