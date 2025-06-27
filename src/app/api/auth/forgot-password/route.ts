// src/app/api/auth/forgot-password/route.ts

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/database';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing forgot password request...');
    
    const { email } = await request.json();
    
    if (!email) {
      return Response.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return Response.json(
        { success: false, error: 'Please enter a valid email address' },
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
      console.log('❌ User not found:', email);
      // For security, always return success even if user doesn't exist
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
      console.error('❌ Failed to store reset token:', tokenError);
      return Response.json(
        { success: false, error: 'Failed to process request. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Token stored successfully with ID:', insertedToken.id);

    // Create reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log('📧 Sending reset email to:', email);

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Recipe App <onboarding@resend.dev>',
      to: [email],
      subject: '🔐 Reset Your Recipe App Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">🍳</span>
              </div>
              <h1 style="color: #2d3748; margin: 0; font-size: 28px; font-weight: 700;">Password Reset Request</h1>
            </div>

            <!-- Main Content -->
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Hello ${user.name}!</h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You requested a password reset for your Recipe App account associated with <strong>${email}</strong>.
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Click the button below to create a new password:
              </p>

              <!-- Reset Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 16px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block; 
                          font-weight: 600;
                          font-size: 16px;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Reset My Password
                </a>
              </div>

              <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
              </p>

              <!-- Security Info -->
              <div style="background: #edf2f7; border-radius: 8px; padding: 20px; margin: 30px 0 0 0;">
                <p style="color: #4a5568; font-size: 14px; line-height: 1.5; margin: 0;">
                  <strong>🔒 Security Note:</strong> This link will expire in 1 hour for your security. 
                  If you didn't request this password reset, you can safely ignore this email.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #a0aec0; font-size: 14px; margin: 0;">
                Recipe App | AI-Powered Cooking Assistant
              </p>
              <p style="color: #a0aec0; font-size: 12px; margin: 10px 0 0 0;">
                This email was sent to ${email}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return Response.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Password reset email sent successfully:', data?.id);
    
    return Response.json({
      success: true,
      message: 'Password reset instructions have been sent to your email'
    });
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}