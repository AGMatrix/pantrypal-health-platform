// src/app/api/user/data/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to validate user data
function validateUserData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { isValid: false, errors };
  }

  // Validate shoppingList if present
  if (data.shoppingList !== undefined) {
    if (!Array.isArray(data.shoppingList)) {
      errors.push('shoppingList must be an array');
    } else {
      // Validate each shopping list item
      data.shoppingList.forEach((item: any, index: number) => {
        if (!item || typeof item !== 'object') {
          errors.push(`shoppingList item at index ${index} must be an object`);
          return;
        }
        
        if (!item.id || typeof item.id !== 'string') {
          errors.push(`shoppingList item at index ${index} must have a valid id`);
        }
        
        if (!item.name || typeof item.name !== 'string') {
          errors.push(`shoppingList item at index ${index} must have a valid name`);
        }

        if (item.amount !== undefined && (typeof item.amount !== 'number' || item.amount < 0)) {
          errors.push(`shoppingList item at index ${index} amount must be a positive number`);
        }

        if (item.unit !== undefined && typeof item.unit !== 'string') {
          errors.push(`shoppingList item at index ${index} unit must be a string`);
        }

        if (item.checked !== undefined && typeof item.checked !== 'boolean') {
          errors.push(`shoppingList item at index ${index} checked must be a boolean`);
        }

        if (item.estimatedPrice !== undefined && (typeof item.estimatedPrice !== 'number' || item.estimatedPrice < 0)) {
          errors.push(`shoppingList item at index ${index} estimatedPrice must be a positive number`);
        }
      });
    }
  }

  // Validate healthProfile if present
  if (data.healthProfile !== undefined) {
    if (data.healthProfile !== null && typeof data.healthProfile !== 'object') {
      errors.push('healthProfile must be an object or null');
    }
  }

  // Validate dietPlan if present
  if (data.dietPlan !== undefined) {
    if (data.dietPlan !== null && typeof data.dietPlan !== 'object') {
      errors.push('dietPlan must be an object or null');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// GET - Retrieve user data
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/user/data - Retrieving user data');

    // Get user from headers or session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ No authorization header found');
      return NextResponse.json({ 
        success: false, 
        error: 'No authorization header' 
      }, { status: 401 });
    }

    // Extract user email from auth header or implement proper session management
    // For now, assuming you have a way to get the user ID
    const userEmail = request.headers.get('X-User-Email');
    if (!userEmail) {
      console.log('❌ No user email in headers');
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 });
    }

    console.log('👤 Getting data for user:', userEmail);

    const { data: userData, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('❌ Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error' 
      }, { status: 500 });
    }

    if (!userData) {
      console.log('ℹ️ No user data found, returning empty data');
      return NextResponse.json({ 
        success: true, 
        data: {
          email: userEmail,
          shoppingList: [],
          healthProfile: null,
          dietPlan: null
        }
      });
    }

    console.log('✅ User data retrieved successfully');
    return NextResponse.json({ 
      success: true, 
      data: userData 
    });

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/user/data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Update user data
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 PUT /api/user/data - Updating user data');

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('📝 Request data received:', Object.keys(requestData));
    } catch (parseError) {
      console.error('❌ Invalid JSON in request body:', parseError);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    // Validate request data
    const validation = validateUserData(requestData);
    if (!validation.isValid) {
      console.error('❌ Validation errors:', validation.errors);
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    // Get user authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ No authorization header found');
      return NextResponse.json({ 
        success: false, 
        error: 'No authorization header' 
      }, { status: 401 });
    }

    // For now, get user email from headers (implement proper auth later)
    const userEmail = request.headers.get('X-User-Email');
    if (!userEmail) {
      console.log('❌ No user email in headers');
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 });
    }

    console.log('👤 Updating data for user:', userEmail);

    // Prepare data for update
    const updateData = {
      email: userEmail,
      ...requestData,
      updated_at: new Date().toISOString()
    };

    console.log('💾 Updating with data:', Object.keys(updateData));

    // First try to update existing record
    const { data: updateResult, error: updateError } = await supabase
      .from('user_data')
      .update(updateData)
      .eq('email', userEmail)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      
      // If update failed because record doesn't exist, try insert
      if (updateError.code === 'PGRST116') {
        console.log('🆕 User data not found, creating new record');
        
        const { data: insertResult, error: insertError } = await supabase
          .from('user_data')
          .insert([{
            ...updateData,
            created_at: new Date().toISOString()
          }])
          .select();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to create user data',
            details: insertError.message
          }, { status: 500 });
        }

        console.log('✅ User data created successfully');
        return NextResponse.json({ 
          success: true, 
          data: insertResult[0]
        });
      }

      // Other update errors
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update user data',
        details: updateError.message
      }, { status: 500 });
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('🆕 No rows updated, creating new record');
      
      const { data: insertResult, error: insertError } = await supabase
        .from('user_data')
        .insert([{
          ...updateData,
          created_at: new Date().toISOString()
        }])
        .select();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create user data',
          details: insertError.message
        }, { status: 500 });
      }

      console.log('✅ User data created successfully');
      return NextResponse.json({ 
        success: true, 
        data: insertResult[0]
      });
    }

    console.log('✅ User data updated successfully');
    return NextResponse.json({ 
      success: true, 
      data: updateResult[0]
    });

  } catch (error) {
    console.error('❌ Unexpected error in PUT /api/user/data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create user data (alias for PUT for convenience)
export async function POST(request: NextRequest) {
  return PUT(request);
}