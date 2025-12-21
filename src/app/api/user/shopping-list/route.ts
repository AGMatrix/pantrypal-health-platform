import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

// GET shopping list
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return Response.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('shopping_list')
      .eq('user_id', authUser.userId)
      .single();
    
    if (error) {
      console.error('Get shopping list error:', error);
      return Response.json(
        { success: false, error: 'Failed to get shopping list' },
        { status: 500 }
      );
    }
    
    return Response.json({
      success: true,
      shopping_list: userData?.shopping_list || []
    });
    
  } catch (error) {
    console.error('Shopping list GET error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST to add recipe to shopping list
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return Response.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { recipeId, ingredients } = await request.json();
    
    if (!recipeId || !ingredients) {
      return Response.json(
        { success: false, error: 'Recipe ID and ingredients required' },
        { status: 400 }
      );
    }
    
    // Get current shopping list
    const { data: userData, error: getUserError } = await supabase
      .from('user_data')
      .select('shopping_list')
      .eq('user_id', authUser.userId)
      .single();
    
    if (getUserError) {
      console.error('Get shopping list error:', getUserError);
      return Response.json(
        { success: false, error: 'Failed to get shopping list' },
        { status: 500 }
      );
    }
    
    let currentList = userData?.shopping_list || [];
    
    // Add ingredients to shopping list
    const newItems = ingredients.map((ingredient: any) => ({
      id: `${recipeId}-${ingredient.name}-${Date.now()}`,
      recipeId,
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      estimatedPrice: ingredient.estimatedPrice,
      checked: false,
      isAlreadyOwned: false
    }));
    
    currentList = [...currentList, ...newItems];
    
    // Update in database
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ 
        shopping_list: currentList,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authUser.userId);
    
    if (updateError) {
      console.error('Update shopping list error:', updateError);
      return Response.json(
        { success: false, error: 'Failed to update shopping list' },
        { status: 500 }
      );
    }
    
    return Response.json({
      success: true,
      message: 'Recipe added to shopping list',
      shopping_list: currentList
    });
    
  } catch (error) {
    console.error('Shopping list POST error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT to update entire shopping list
export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return Response.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { shopping_list } = await request.json();
    
    if (!Array.isArray(shopping_list)) {
      return Response.json(
        { success: false, error: 'shopping_list must be an array' },
        { status: 400 }
      );
    }
    
    console.log('📝 Updating entire shopping list for user:', authUser.userId, 'Items:', shopping_list.length);
    
    // Update the entire shopping list in database
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ 
        shopping_list: shopping_list,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authUser.userId);
    
    if (updateError) {
      console.error('Update shopping list error:', updateError);
      return Response.json(
        { success: false, error: 'Failed to update shopping list' },
        { status: 500 }
      );
    }
    
    console.log('✅ Shopping list updated successfully for user:', authUser.userId);
    
    return Response.json({
      success: true,
      shopping_list: shopping_list
    });
    
  } catch (error) {
    console.error('Shopping list PUT error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}