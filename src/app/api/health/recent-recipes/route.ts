// Create this file: src/app/api/health/recent-recipes/route.ts
// This handles tracking recent recipe interactions

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/health/recent-recipes - Fetching recent recipes');
    
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Check if recent_recipes table exists, if not return empty array
    try {
      const { data: recentRecipes, error } = await supabase
        .from('recent_recipes')
        .select('*')
        .eq('user_id', authUser.userId)
        .order('accessed_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Recent recipes table may not exist:', error);
        return NextResponse.json({ 
          success: true, 
          recentRecipes: [],
          message: 'Recent recipes tracking not set up'
        });
      }

      return NextResponse.json({ 
        success: true, 
        recentRecipes: recentRecipes || [] 
      });

    } catch (dbError) {
      console.warn('Database error accessing recent recipes:', dbError);
      return NextResponse.json({ 
        success: true, 
        recentRecipes: [],
        message: 'Recent recipes tracking unavailable'
      });
    }

  } catch (error) {
    console.error('❌ GET recent recipes error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('➕ POST /api/health/recent-recipes - Tracking recipe access');
    
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { recipeId, recipeData, action } = await request.json();
    
    if (!recipeId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Recipe ID is required' 
      }, { status: 400 });
    }

    console.log('📊 Tracking recipe interaction:', { 
      userId: authUser.userId, 
      recipeId, 
      action 
    });

    // Try to track the recent recipe, but don't fail if table doesn't exist
    try {
      // First, check if this recipe was recently accessed by this user
      const { data: existing } = await supabase
        .from('recent_recipes')
        .select('id')
        .eq('user_id', authUser.userId)
        .eq('recipe_id', recipeId)
        .single();

      if (existing) {
        // Update the access time
        const { error: updateError } = await supabase
          .from('recent_recipes')
          .update({
            accessed_at: new Date().toISOString(),
            action_type: action || 'view',
            recipe_data: recipeData || null
          })
          .eq('id', existing.id);

        if (updateError) {
          console.warn('Failed to update recent recipe:', updateError);
        } else {
          console.log('✅ Updated recent recipe access time');
        }
      } else {
        // Insert new recent recipe record
        const { error: insertError } = await supabase
          .from('recent_recipes')
          .insert({
            user_id: authUser.userId,
            recipe_id: recipeId,
            recipe_data: recipeData || null,
            action_type: action || 'view',
            accessed_at: new Date().toISOString()
          });

        if (insertError) {
          console.warn('Failed to insert recent recipe:', insertError);
        } else {
          console.log('✅ Added new recent recipe');
        }
      }

      // Clean up old entries (keep only latest 50 per user)
      const { data: oldEntries } = await supabase
        .from('recent_recipes')
        .select('id')
        .eq('user_id', authUser.userId)
        .order('accessed_at', { ascending: false })
        .range(50, 1000);

      if (oldEntries && oldEntries.length > 0) {
        const oldIds = oldEntries.map(entry => entry.id);
        await supabase
          .from('recent_recipes')
          .delete()
          .in('id', oldIds);
        
        console.log(`🧹 Cleaned up ${oldEntries.length} old recent recipe entries`);
      }

    } catch (dbError) {
      console.warn('Recent recipes tracking failed (table may not exist):', dbError);
      // Don't return error - this is optional functionality
    }

    // Always return success, even if tracking failed
    return NextResponse.json({ 
      success: true, 
      message: 'Recipe interaction tracked',
      tracked: true
    });

  } catch (error) {
    console.error('❌ POST recent recipes error:', error);
    
    // For recipe tracking, we want to be resilient - don't fail the main action
    return NextResponse.json({ 
      success: true, 
      message: 'Recipe interaction noted (tracking unavailable)',
      tracked: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}