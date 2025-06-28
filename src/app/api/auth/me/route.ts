// src/app/api/auth/me/route.ts - Check current user session
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/database';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking user session...');
    
    const user = await getAuthUser(request);
    
    if (!user) {
      return Response.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Optionally fetch full user data from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', user.userId)
      .single();

    if (error || !userData) {
      console.error('User not found in database:', error);
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Session valid for:', userData.email);
    
    return Response.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      }
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    return Response.json(
      { success: false, error: 'Session check failed' },
      { status: 500 }
    );
  }
}