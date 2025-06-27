// src/app/api/debug-env/route.ts
// Debug endpoint to check environment variables

import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const perplexityKey = process.env.PERPLEXITY_API_KEY;
        const publicKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
        
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            hasPerplexityKey: !!perplexityKey,
            hasPublicKey: !!publicKey,
            keyPreview: perplexityKey ? `${perplexityKey.substring(0, 10)}...` : 'Not found',
            publicKeyPreview: publicKey ? `${publicKey.substring(0, 10)}...` : 'Not found',
            availableEnvVars: Object.keys(process.env)
                .filter(key => key.includes('PERPLEXITY') || key.includes('API'))
                .reduce((acc, key) => {
                    acc[key] = process.env[key] ? `${process.env[key]?.substring(0, 10)}...` : 'undefined';
                    return acc;
                }, {} as Record<string, string>)
        });
    } catch (error) {
        return NextResponse.json(
            { 
                error: 'Failed to check environment',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 
            { status: 500 }
        );
    }
}