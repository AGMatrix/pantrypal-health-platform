import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { recipeIngredients } = await request.json();

    // Use the database function to check safety
    const { data, error } = await supabase.rpc('check_recipe_rare_condition_safety', {
      user_uuid: authUser.userId,
      recipe_ingredients: recipeIngredients
    });

    if (error) {
      console.error('Rare condition safety check error:', error);
      return Response.json({ success: false, error: 'Safety check failed' }, { status: 500 });
    }

    return Response.json({
      success: true,
      isSafe: data[0]?.is_safe || true,
      warnings: data[0]?.warnings || [],
      recommendations: data[0]?.recommendations || [],
      confidenceLevel: data[0]?.confidence_level || 'medium'
    });

  } catch (error) {
    console.error('Safety check error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}