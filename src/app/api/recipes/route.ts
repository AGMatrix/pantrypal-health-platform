import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

// GET recipes (search, filter, etc.)
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const cuisine = searchParams.get('cuisine');
    const difficulty = searchParams.get('difficulty');
    const maxTime = searchParams.get('maxTime');
    
    let supabaseQuery = supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    
    // Add filters
    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }
    
    if (cuisine) {
      supabaseQuery = supabaseQuery.eq('cuisine', cuisine);
    }
    
    if (difficulty) {
      supabaseQuery = supabaseQuery.eq('difficulty', difficulty);
    }
    
    if (maxTime) {
      supabaseQuery = supabaseQuery.lte('cooking_time', parseInt(maxTime));
    }
    
    const { data: recipes, error } = await supabaseQuery.limit(20);
    
    if (error) {
      console.error('Get recipes error:', error);
      return Response.json(
        { success: false, error: 'Failed to get recipes' },
        { status: 500 }
      );
    }
    
    return Response.json({
      success: true,
      recipes: recipes || [],
      total: recipes?.length || 0
    });
    
  } catch (error) {
    console.error('Recipes GET error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST new recipe (save AI-generated recipes)
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
    
    const recipeData = await request.json();
    
    // Validate required fields
    const required = ['title', 'ingredients', 'instructions', 'cookingTime', 'servings'];
    for (const field of required) {
      if (!recipeData[field]) {
        return Response.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Prepare recipe for database
    const recipe = {
      title: recipeData.title,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      cooking_time: recipeData.cookingTime,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty || 'Medium',
      cuisine: recipeData.cuisine,
      dietary: recipeData.dietary || [],
      nutrition: recipeData.nutrition,
      cost_per_serving: recipeData.costPerServing,
      estimated_cost: recipeData.estimatedCost,
      image_url: recipeData.image,
      rating: recipeData.rating || 4.0,
      reviews: recipeData.reviews || 0,
      created_by: authUser.userId,
      is_public: recipeData.isPublic !== false // Default to public
    };
    
    const { data: savedRecipe, error } = await supabase
      .from('recipes')
      .insert([recipe])
      .select()
      .single();
    
    if (error) {
      console.error('Save recipe error:', error);
      return Response.json(
        { success: false, error: 'Failed to save recipe' },
        { status: 500 }
      );
    }
    
    return Response.json({
      success: true,
      message: 'Recipe saved successfully',
      recipe: savedRecipe
    });
    
  } catch (error) {
    console.error('Recipe POST error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}