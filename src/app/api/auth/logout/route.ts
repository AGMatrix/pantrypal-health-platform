// src/app/api/auth/logout/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('👋 Logging out user...');
    
    // Create response
    const response = Response.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    // Clear the auth cookie
    response.headers.set(
      'Set-Cookie',
      'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    );
    
    console.log('✅ Logout successful');
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}