import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error || !recipe) {
      return Response.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    return Response.json({
      success: true,
      recipe
    });
    
  } catch (error) {
    console.error('Get recipe error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}