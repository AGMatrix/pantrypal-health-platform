// src/app/api/auth/reset-password/route.ts

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing password reset...');
    
    const { token, email, password } = await request.json();
    
    // Basic validation
    if (!token || !email || !password) {
      return Response.json(
        { success: false, error: 'Token, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('🔍 Validating reset token for:', email);

    // Check if reset token exists and is valid
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email.toLowerCase())
      .single();

    if (tokenError || !resetToken) {
      console.log('❌ Invalid or expired reset token');
      return Response.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired (1 hour expiry)
    const tokenAge = Date.now() - new Date(resetToken.created_at).getTime();
    const oneHour = 60 * 60 * 1000;
    
    if (tokenAge > oneHour) {
      console.log('❌ Reset token has expired');
      
      // Delete expired token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token);
      
      return Response.json(
        { success: false, error: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      console.log('❌ User not found');
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('🔐 Hashing new password...');
    
    // Hash the new password
    const passwordHash = await hashPassword(password);

    console.log('💾 Updating user password...');
    
    // Update user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Failed to update password:', updateError);
      return Response.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    console.log('🗑️ Deleting used reset token...');
    
    // Delete the used reset token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token);

    console.log('✅ Password reset completed for:', email);

    return Response.json({
      success: true,
      message: 'Password reset successfully'
    });
    
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}