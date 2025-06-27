// src/app/api/health/profile/route.ts
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Get user's health profile
    const { data: profile, error: profileError } = await supabase
      .from('user_health_profiles')
      .select('*')
      .eq('user_id', authUser.userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching health profile:', profileError);
      return Response.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Get rare condition analyses
    const { data: rareConditions, error: rareError } = await supabase
      .from('rare_condition_analyses')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false });

    if (rareError) {
      console.error('Error fetching rare conditions:', rareError);
    }

    // Format the response
    const healthProfile = {
      conditions: profile?.health_conditions || [],
      rareConditions: rareConditions?.map(condition => ({
        conditionName: condition.condition_name,
        confidenceLevel: condition.confidence_level,
        restrictions: condition.ai_analysis?.restrictions || [],
        recommendations: condition.ai_analysis?.recommendations || [],
        createdAt: condition.created_at
      })) || [],
      restrictions: profile?.dietary_restrictions || [],
      allergens: profile?.food_allergies || [],
      medications: profile?.current_medications || [],
      goal: profile?.health_goal || 'Health Maintenance',
      severity: profile?.severity_levels || {},
      lastUpdated: profile?.updated_at || profile?.created_at || new Date().toISOString()
    };

    return Response.json({
      success: true,
      profile: healthProfile
    });

  } catch (error) {
    console.error('Health profile API error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const profileData = await request.json();

    // Upsert user health profile
    const { data, error } = await supabase
      .from('user_health_profiles')
      .upsert([
        {
          user_id: authUser.userId,
          health_conditions: profileData.conditions || [],
          dietary_restrictions: profileData.restrictions || [],
          food_allergies: profileData.allergens || [],
          current_medications: profileData.medications || [],
          health_goal: profileData.goal || 'Health Maintenance',
          severity_levels: profileData.severity || {},
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving health profile:', error);
      return Response.json({ success: false, error: 'Failed to save profile' }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Health profile updated successfully'
    });

  } catch (error) {
    console.error('Health profile save error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}