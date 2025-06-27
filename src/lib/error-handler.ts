// src/lib/error-handler.ts
// Comprehensive error handling utility for the application

import { NextRequest, NextResponse } from 'next/server';

export class APIError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(statusCode: number, message: string, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Success response interface
interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main error handler wrapper
export function withErrorHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    try {
      console.log(`🚀 [${requestId}] ${request.method} ${request.url}`);
      
      const response = await handler(request, ...args);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [${requestId}] Completed in ${duration}ms`);
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${requestId}] Error after ${duration}ms:`, error);
      
      return handleError(error, requestId);
    }
  };
}

// Handle different types of errors
export function handleError(error: unknown, requestId?: string): NextResponse {
  const timestamp = new Date().toISOString();
  
  // Handle APIError instances
  if (error instanceof APIError) {
    const response: ErrorResponse = {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp,
      requestId
    };
    
    return NextResponse.json(response, { status: error.statusCode });
  }
  
  // Handle validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    const response: ErrorResponse = {
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
      timestamp,
      requestId
    };
    
    return NextResponse.json(response, { status: 400 });
  }
  
  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    const response: ErrorResponse = {
      success: false,
      error: 'Invalid JSON in request body',
      code: 'JSON_PARSE_ERROR',
      timestamp,
      requestId
    };
    
    return NextResponse.json(response, { status: 400 });
  }
  
  // Handle network/fetch errors
  if (error instanceof Error && (
    error.message.includes('fetch') || 
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED')
  )) {
    const response: ErrorResponse = {
      success: false,
      error: 'External service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp,
      requestId
    };
    
    return NextResponse.json(response, { status: 503 });
  }
  
  // Handle database errors
  if (error instanceof Error && (
    error.message.includes('database') ||
    error.message.includes('PGRST') ||
    error.message.includes('supabase')
  )) {
    const response: ErrorResponse = {
      success: false,
      error: 'Database operation failed',
      code: 'DATABASE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp,
      requestId
    };
    
    return NextResponse.json(response, { status: 500 });
  }
  
  // Handle rate limiting errors
  if (error instanceof Error && error.message.includes('rate limit')) {
    const response: ErrorResponse = {
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp,
      requestId
    };
    
    return NextResponse.json(response, { status: 429 });
  }
  
  // Handle authentication errors
  if (error instanceof Error && (
    error.message.includes('unauthorized') ||
    error.message.includes('authentication') ||
    error.message.includes('token')
  )) {
    const response: ErrorResponse = {
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
      timestamp,
      requestId
    };
    
    return NextResponse.json(response, { status: 401 });
  }
  
  // Handle generic Error instances
  if (error instanceof Error) {
    const response: ErrorResponse = {
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined,
      timestamp,
      requestId
    };
    
    return NextResponse.json(response, { status: 500 });
  }
  
  // Handle unknown errors
  const response: ErrorResponse = {
    success: false,
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    timestamp,
    requestId
  };
  
  return NextResponse.json(response, { status: 500 });
}

// Create success response
export function createSuccessResponse<T>(
  data?: T, 
  message?: string, 
  requestId?: string
): NextResponse {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId
  };
  
  return NextResponse.json(response);
}

// Validation helper
export function validateRequired(
  data: Record<string, any>, 
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new APIError(
      400, 
      `Missing required fields: ${missing.join(', ')}`,
      'MISSING_REQUIRED_FIELDS',
      { missingFields: missing }
    );
  }
}

// Type validation helper
export function validateTypes(
  data: Record<string, any>,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'>
): void {
  const errors: string[] = [];
  
  Object.entries(schema).forEach(([field, expectedType]) => {
    const value = data[field];
    
    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      
      if (actualType !== expectedType) {
        errors.push(`${field} must be of type ${expectedType}, got ${actualType}`);
      }
    }
  });
  
  if (errors.length > 0) {
    throw new APIError(
      400,
      `Type validation failed: ${errors.join(', ')}`,
      'TYPE_VALIDATION_ERROR',
      { validationErrors: errors }
    );
  }
}

// Array validation helper
export function validateArrays(
  data: Record<string, any>,
  arrayFields: Record<string, { minLength?: number; maxLength?: number; itemType?: string }>
): void {
  const errors: string[] = [];
  
  Object.entries(arrayFields).forEach(([field, constraints]) => {
    const value = data[field];
    
    if (value !== undefined && value !== null) {
      if (!Array.isArray(value)) {
        errors.push(`${field} must be an array`);
        return;
      }
      
      if (constraints.minLength !== undefined && value.length < constraints.minLength) {
        errors.push(`${field} must have at least ${constraints.minLength} items`);
      }
      
      if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
        errors.push(`${field} must have at most ${constraints.maxLength} items`);
      }
      
      if (constraints.itemType) {
        const invalidItems = value.filter(item => typeof item !== constraints.itemType);
        if (invalidItems.length > 0) {
          errors.push(`${field} items must be of type ${constraints.itemType}`);
        }
      }
    }
  });
  
  if (errors.length > 0) {
    throw new APIError(
      400,
      `Array validation failed: ${errors.join(', ')}`,
      'ARRAY_VALIDATION_ERROR',
      { validationErrors: errors }
    );
  }
}

// Email validation helper
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password strength validation
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// Rate limiting helper (simple in-memory implementation)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async isAllowed(identifier: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Export rate limiters for different endpoints
export const searchLimiter = new RateLimiter(30, 60 * 1000); // 30 requests per minute
export const authLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
export const dietPlanLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 requests per hour

// Async wrapper with timeout
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new APIError(408, errorMessage, 'TIMEOUT')), timeoutMs);
  });
  
  return Promise.race([promise, timeout]);
}

// Retry wrapper for external API calls
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delayMs}ms...`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  
  throw lastError!;
}