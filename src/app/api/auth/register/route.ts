import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    // Get data from the request
    const { email, password, name } = await request.json();
    
    // Basic validation
    if (!email || !password || !name) {
      return Response.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return Response.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingUser) {
      return Response.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Create the user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email: email.toLowerCase(),
          name: name,
          password_hash: passwordHash,
        },
      ])
      .select()
      .single();
    
    if (userError) {
      console.error('User creation error:', userError);
      return Response.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Create user_data record with default preferences
    const { error: userDataError } = await supabase
      .from('user_data')
      .insert([
        {
          user_id: newUser.id,
          favorites: [],
          shopping_list: [],
          search_history: [],
        },
      ]);
    
    if (userDataError) {
      console.error('User data creation error:', userDataError);
      // Don't fail the registration, user data can be created later
    }
    
    return Response.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}