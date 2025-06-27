// src/lib/rate-limit.ts
// Production-level rate limiting with Redis-like behavior using in-memory store

interface RateLimitOptions {
    window: string; // e.g., '1h', '15m', '60s'
    max: number;    // maximum requests
  }
  
  interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number; // timestamp when limit resets
    retryAfter?: number; // seconds to wait before retrying
  }
  
  // In-memory store for rate limiting (use Redis in production)
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  
  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  
  export async function rateLimit(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const windowMs = parseWindow(options.window);
    const now = Date.now();
    const resetTime = now + windowMs;
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
    const current = rateLimitStore.get(key) || { count: 0, resetTime };
    
    if (current.count >= options.max) {
      return {
        success: false,
        limit: options.max,
        remaining: 0,
        reset: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      };
    }
  
    current.count++;
    current.resetTime = resetTime;
    rateLimitStore.set(key, current);
  
    return {
      success: true,
      limit: options.max,
      remaining: options.max - current.count,
      reset: current.resetTime
    };
  }
  
  function parseWindow(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid window format: ${window}`);
    }
  
    const value = parseInt(match[1]);
    const unit = match[2];
  
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: throw new Error(`Unknown time unit: ${unit}`);
    }
  }
  
  // Advanced rate limiting with different tiers
  export async function tieredRateLimit(
    identifier: string,
    tier: 'free' | 'premium' | 'enterprise'
  ): Promise<RateLimitResult> {
    const limits = {
      free: { window: '1h', max: 10 },
      premium: { window: '1h', max: 100 },
      enterprise: { window: '1h', max: 1000 }
    };
  
    return rateLimit(identifier, limits[tier]);
  }
  
  // Rate limit by IP with sliding window
  export async function slidingWindowRateLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    const requests = rateLimitStore.get(identifier) || { count: 0, resetTime: now + windowMs };
    
    if (requests.resetTime < now) {
      requests.count = 0;
      requests.resetTime = now + windowMs;
    }
    
    if (requests.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: requests.resetTime,
        retryAfter: Math.ceil((requests.resetTime - now) / 1000)
      };
    }
    
    requests.count++;
    rateLimitStore.set(identifier, requests);
    
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - requests.count,
      reset: requests.resetTime
    };
  }