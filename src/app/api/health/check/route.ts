import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Health check API called');
    
    // Check if Perplexity API key is configured
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    const hasPerplexityKey = !!perplexityKey && perplexityKey.length > 10;
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasSupabase = !!supabaseUrl && !!supabaseKey;
    
    console.log('Environment check:', {
      hasPerplexityKey,
      hasSupabase,
      nodeEnv: process.env.NODE_ENV
    });
    
    let apiConnected = false;
    let apiMessage = 'API not configured';
    
    if (hasPerplexityKey) {
      try {
        // Test Perplexity API connection
        const testResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5
          }),
        });
        
        if (testResponse.ok) {
          apiConnected = true;
          apiMessage = 'Perplexity API connected successfully';
        } else {
          const errorText = await testResponse.text();
          apiMessage = `Perplexity API error: ${testResponse.status} - ${errorText}`;
        }
      } catch (error) {
        apiMessage = `Perplexity API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      apiMessage = 'Perplexity API key not configured. Add PERPLEXITY_API_KEY to environment variables.';
    }
    
    return NextResponse.json({
      status: 'healthy',
      apiConnected,
      message: apiMessage,
      environment: {
        hasPerplexityKey,
        hasSupabase,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    return NextResponse.json({
      status: 'error',
      apiConnected: false,
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}