// Enhanced forgot-password route with detailed debugging

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/database';
import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing forgot password request...');
    
    const { email } = await request.json();
    
    if (!email || !email.includes('@')) {
      return Response.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking if user exists:', email);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      console.log('⚠ User not found:', email);
      return Response.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent password reset instructions.'
      });
    }

    console.log('👤 User found:', user.email);

    // Generate secure reset token
    const resetToken = crypto.randomUUID();
    console.log('🔑 Generated token:', resetToken.substring(0, 10) + '...');
    
    // Delete any existing reset tokens for this email
    const { error: deleteError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email.toLowerCase());
    
    console.log('🗑️ Deleted old tokens:', deleteError ? 'error' : 'success');

    // Store the reset token in database
    const tokenData = {
      email: email.toLowerCase(),
      token: resetToken,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    };
    
    console.log('💾 Storing token in database...');

    const { data: insertedToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert([tokenData])
      .select()
      .single();

    if (tokenError) {
      console.error('⚠ Failed to store reset token:', tokenError);
      return Response.json(
        { success: false, error: 'Failed to process request. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Token stored successfully with ID:', insertedToken.id);

    // DEBUG: Check environment variables
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log('🌐 Environment check:', {
      baseUrl,
      hasBaseUrl: !!baseUrl,
      nodeEnv: process.env.NODE_ENV
    });

    // Fallback for local development
    const resetBaseUrl = baseUrl || (
      process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://your-production-domain.com'
    );

    // Create reset link with debugging
    const resetLink = `${resetBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log('🔗 Generated reset link:', resetLink);
    console.log('🔗 Link length:', resetLink.length);
    console.log('🔗 Token in URL:', resetLink.includes(resetToken) ? 'Present' : 'Missing');

    console.log('📧 Sending reset email to:', email);

    // Initialize Resend client
    let resend: Resend;
    try {
      resend = getResendClient();
    } catch (error) {
      console.error('⚠ Failed to initialize Resend client:', error);
      return Response.json(
        { success: false, error: 'Email service unavailable. Please try again later.' },
        { status: 500 }
      );
    }

    // SIMPLIFIED EMAIL WITH PLAIN TEXT LINK
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email],
      subject: 'Reset Your Recipe App Password',
      html: `
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          
          <p>Hello${user.name ? ` ${user.name}` : ''},</p>
          
          <p>You requested a password reset for your Recipe App account.</p>
          
          <p><strong>Click this link to reset your password:</strong></p>
          
          <!-- SIMPLE TEXT LINK - NO STYLING -->
          <p style="margin: 20px 0;">
            <a href="${resetLink}" style="color: blue; text-decoration: underline;">
              ${resetLink}
            </a>
          </p>
          
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; font-family: monospace;">
            ${resetLink}
          </p>
          
          <p><strong>This link expires in 1 hour.</strong></p>
          
          <p>If you didn't request this reset, ignore this email.</p>
          
          <hr>
          <p><small>Recipe App</small></p>
        </body>
        </html>
      `,
      // ALSO SEND PLAIN TEXT VERSION
      text: `
Password Reset Request

Hello${user.name ? ` ${user.name}` : ''},

You requested a password reset for your Recipe App account.

Click this link to reset your password:
${resetLink}

This link expires in 1 hour.

If you didn't request this reset, ignore this email.

Recipe App
      `
    });

    if (error) {
      console.error('⚠ Resend error:', error);
      return Response.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Password reset email sent successfully:', data?.id);
    console.log('📬 Email data:', JSON.stringify(data, null, 2));
    
    return Response.json({
      success: true,
      message: 'Password reset instructions have been sent to your email',
      // DEBUG: Return the link in development mode
      ...(process.env.NODE_ENV === 'development' && { 
        debugLink: resetLink 
      })
    });
    
  } catch (error) {
    console.error('⚠ Forgot password error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}// Fix deployment Mon Aug 25 19:16:08 EDT 2025
