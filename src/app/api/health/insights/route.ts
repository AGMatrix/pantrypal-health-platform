// src/app/api/health/insights/route.ts
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Get existing insights
    const { data: insights, error } = await supabase
      .from('health_insights')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      console.error('Error fetching insights:', errorMessage);
      return Response.json({ success: false, error: 'Failed to fetch insights' }, { status: 500 });
    }

    // If no recent insights, generate new ones
    if (!insights || insights.length === 0) {
      const generatedInsights = await generateHealthInsights(authUser.userId);
      return Response.json({
        success: true,
        insights: generatedInsights
      });
    }

    // Format existing insights
    const formattedInsights = insights.map(insight => ({
      id: insight.id,
      type: insight.insight_type,
      title: insight.title,
      message: insight.message,
      actions: insight.recommended_actions || [],
      priority: insight.priority,
      date: insight.created_at,
      isRead: insight.is_read || false,
      isActioned: insight.is_actioned || false
    }));

    return Response.json({
      success: true,
      insights: formattedInsights
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Health insights API error:', errorMessage);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Generate new insights
    const insights = await generateHealthInsights(authUser.userId);

    return Response.json({
      success: true,
      insights,
      message: 'New health insights generated successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Generate insights error:', errorMessage);
    return Response.json({ success: false, error: 'Failed to generate insights' }, { status: 500 });
  }
}

async function generateHealthInsights(userId: string) {
  try {
    const supabase = createSupabaseServerClient();

    // Get user's health profile
    const { data: profile } = await supabase
      .from('user_health_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get recent recipe interactions
    const { data: recentRecipes } = await supabase
      .from('user_recipe_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get rare condition analyses
    const { data: rareConditions } = await supabase
      .from('rare_condition_analyses')
      .select('*')
      .eq('user_id', userId);

    // Generate insights based on user data
    const insights = [];

    // Nutrition optimization insights
    if (profile?.health_conditions?.includes('diabetes') && recentRecipes) {
      const highCarbRecipes = recentRecipes.filter(r => 
        r.recipe_data?.nutrition?.carbs > 45
      ).length;
      
      if (highCarbRecipes > 3) {
        insights.push({
          type: 'warning',
          title: 'Carbohydrate Management Alert',
          message: 'Recent recipe choices show higher carbohydrate intake than recommended for diabetes management.',
          actions: [
            'Choose whole grain alternatives',
            'Focus on non-starchy vegetables',
            'Consider portion size adjustments',
            'Review with healthcare provider'
          ],
          priority: 'high'
        });
      }
    }

    // Rare condition specific insights
    if (rareConditions && rareConditions.length > 0) {
      rareConditions.forEach(condition => {
        if (condition.analysis_result?.restrictions?.includes('anti-inflammatory-focus')) {
          insights.push({
            type: 'recommendation',
            title: `${condition.condition_name} Nutrition Optimization`,
            message: `Based on your ${condition.condition_name} analysis, focus on anti-inflammatory foods to help manage symptoms.`,
            actions: [
              'Include fatty fish 2-3 times weekly',
              'Add turmeric and ginger to meals',
              'Choose colorful vegetables and berries',
              'Limit processed foods'
            ],
            priority: 'medium'
          });
        }
      });
    }

    // Medication interaction insights
    if (profile?.current_medications?.length > 0) {
      const hasBloodThinners = profile.current_medications.some((med: string) => 
        med.toLowerCase().includes('warfarin') || med.toLowerCase().includes('coumadin')
      );
      
      if (hasBloodThinners) {
        insights.push({
          type: 'warning',
          title: 'Medication-Food Interaction Alert',
          message: 'Blood thinning medications require consistent vitamin K intake. Monitor leafy green consumption.',
          actions: [
            'Maintain consistent vitamin K intake',
            'Track leafy green vegetables',
            'Consult pharmacist about food interactions',
            'Regular INR monitoring'
          ],
          priority: 'high'
        });
      }
    }

    // Positive reinforcement insights
    if (recentRecipes && recentRecipes.length > 5) {
      const healthyChoices = recentRecipes.filter(r => 
        r.recipe_data?.dietary?.includes('healthy') ||
        r.recipe_data?.dietary?.includes('heart-healthy') ||
        r.recipe_data?.dietary?.includes('anti-inflammatory')
      ).length;
      
      if (healthyChoices >= recentRecipes.length * 0.7) {
        insights.push({
          type: 'success',
          title: 'Excellent Food Choices!',
          message: 'You\'ve been consistently choosing health-supportive recipes this week.',
          actions: [
            'Keep up the great work',
            'Share progress with healthcare provider',
            'Consider trying new healthy recipes'
          ],
          priority: 'low'
        });
      }
    }

    // Default insights if none generated
    if (insights.length === 0) {
      insights.push({
        type: 'recommendation',
        title: 'Health Monitoring Reminder',
        message: 'Keep tracking your nutrition choices to get personalized insights.',
        actions: [
          'Continue using health-conscious recipes',
          'Update your health profile if conditions change',
          'Track symptoms and food responses'
        ],
        priority: 'low'
      });
    }

    // Save insights to database
    const insightRecords = insights.map(insight => ({
      user_id: userId,
      insight_type: insight.type,
      title: insight.title,
      message: insight.message,
      recommended_actions: insight.actions,
      priority: insight.priority,
      created_at: new Date().toISOString()
    }));

    const { data: savedInsights, error } = await supabase
      .from('health_insights')
      .insert(insightRecords)
      .select();

    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      console.error('Error saving insights:', errorMessage);
      return insights; // Return generated insights even if save fails
    }

    // Return formatted insights
    return savedInsights.map(insight => ({
      id: insight.id,
      type: insight.insight_type,
      title: insight.title,
      message: insight.message,
      actions: insight.recommended_actions || [],
      priority: insight.priority,
      date: insight.created_at,
      isRead: false,
      isActioned: false
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating insights:', errorMessage);
    return [];
  }
}