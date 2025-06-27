// src/lib/auth.ts
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-change-in-production';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role?: string;
  createdAt: string;
}

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password using bcrypt
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(payload: { userId: string; email: string }): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Extract user from request using cookies
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get token from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      console.log('❌ No cookies found');
      return null;
    }

    // Parse auth-token from cookies
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(cookie => {
        const [name, value] = cookie.split('=');
        return [name, decodeURIComponent(value)];
      })
    );

    const token = cookies['auth-token'];
    if (!token) {
      console.log('❌ No auth token found in cookies');
      return null;
    }

    // Verify token
    const tokenData = verifyToken(token);
    if (!tokenData) {
      console.log('❌ Invalid token');
      return null;
    }
    return {
      userId: tokenData.userId,
      email: tokenData.email,
      name: 'User', 
      role: 'user',
      createdAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Auth error:', error);
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const user = await getAuthUser(request);
  return user !== null;
}

// Get user ID from request
export async function getUserId(request: NextRequest): Promise<string | null> {
  const user = await getAuthUser(request);
  return user?.userId || null;
}

// Require authentication middleware
export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<any>) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return handler(request, user);
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}