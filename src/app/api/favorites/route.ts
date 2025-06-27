// src/app/api/favorites/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get user from request (same as shopping list)
function getUserFromRequest(request: NextRequest): { userId: string | null; userEmail: string | null } {
  const userId = request.headers.get('X-User-ID');
  const userEmail = request.headers.get('X-User-Email');
  
  console.log('🔍 getUserFromRequest - Headers:', {
    userId,
    userEmail,
    authHeader: request.headers.get('Authorization'),
  });
  
  return {
    userId: userId || userEmail,
    userEmail: userEmail
  };
}

// GET - Retrieve user's favorites
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/favorites - Retrieving user favorites');

    const { userId } = getUserFromRequest(request);
    
    if (!userId) {
      console.log('❌ No user ID found in request');
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated',
        favorites: []
      }, { status: 401 });
    }

    console.log('👤 Getting favorites for user:', userId);

    // Query favorites using the user identifier
    const { data: favoritesResult, error: favoritesError } = await supabase
      .from('favorites')
      .select(`
        id,
        recipe_id,
        user_id,
        recipe_data,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      console.error('❌ Database error:', favoritesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error',
        favorites: []
      }, { status: 500 });
    }

    console.log(`✅ Found ${favoritesResult?.length || 0} favorites for user:`, userId);

    // Transform the result to match your interface
    const transformedFavorites = (favoritesResult || []).map(fav => ({
      id: fav.id,
      recipeId: fav.recipe_id,
      recipe: fav.recipe_data,
      createdAt: fav.created_at
    }));

    return NextResponse.json({ 
      success: true, 
      favorites: transformedFavorites
    });

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/favorites:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      favorites: []
    }, { status: 500 });
  }
}

// POST - Add recipe to favorites
export async function POST(request: NextRequest) {
  try {
    console.log('➕ POST /api/favorites - Adding recipe to favorites');

    const { userId } = getUserFromRequest(request);
    
    if (!userId) {
      console.log('❌ No user ID found in request');
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('❌ Invalid JSON in request body:', parseError);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { recipeId, recipeData } = requestBody;

    if (!recipeId) {
      console.log('❌ No recipe ID provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Recipe ID is required' 
      }, { status: 400 });
    }

    console.log('👤 Adding favorite for user:', userId, 'Recipe:', recipeId);

    // Check if already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing favorite:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error' 
      }, { status: 500 });
    }

    if (existingFavorite) {
      console.log('ℹ️ Recipe already favorited by user');
      return NextResponse.json({ 
        success: false, 
        error: 'Recipe already in favorites' 
      }, { status: 409 });
    }

    // Add to favorites
    const { data: newFavoriteResult, error: insertError } = await supabase
      .from('favorites')
      .insert([{
        user_id: userId,
        recipe_id: recipeId,
        recipe_data: recipeData || {},
        created_at: new Date().toISOString()
      }])
      .select(`
        id,
        recipe_id,
        user_id,
        recipe_data,
        created_at
      `)
      .single();

    if (insertError) {
      console.error('❌ Error inserting favorite:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to add favorite' 
      }, { status: 500 });
    }

    console.log('✅ Successfully added favorite:', newFavoriteResult.id);

    // Transform the response
    const transformedFavorite = {
      id: newFavoriteResult.id,
      recipeId: newFavoriteResult.recipe_id,
      recipe: newFavoriteResult.recipe_data,
      createdAt: newFavoriteResult.created_at
    };

    return NextResponse.json({ 
      success: true, 
      favorite: transformedFavorite
    });

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/favorites:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Remove recipe from favorites
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE /api/favorites - Removing recipe from favorites');

    const { userId } = getUserFromRequest(request);
    
    if (!userId) {
      console.log('❌ No user ID found in request');
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 });
    }

    // Get recipe ID from URL params
    const url = new URL(request.url);
    const recipeId = url.searchParams.get('recipeId');

    if (!recipeId) {
      console.log('❌ No recipe ID provided in URL params');
      return NextResponse.json({ 
        success: false, 
        error: 'Recipe ID is required' 
      }, { status: 400 });
    }

    console.log('👤 Removing favorite for user:', userId, 'Recipe:', recipeId);

    // Remove the favorite
    const { data: deletedFavoriteResult, error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .select('id')
      .single();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        console.log('ℹ️ Favorite not found - may already be removed');
        return NextResponse.json({ 
          success: true, 
          message: 'Favorite removed (was not found)' 
        });
      }
      
      console.error('❌ Error deleting favorite:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to remove favorite' 
      }, { status: 500 });
    }

    console.log('✅ Successfully removed favorite:', deletedFavoriteResult?.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Favorite removed successfully' 
    });

  } catch (error) {
    console.error('❌ Unexpected error in DELETE /api/favorites:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}