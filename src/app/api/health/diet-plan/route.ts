// src/app/api/health/diet-plan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateDietPlanWithAI } from '@/lib/ai-diet-generator';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/database';

// Get user session using the correct auth function
async function getUserSession(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    return authUser;
  } catch (error) {
    console.log('Auth check failed, using anonymous session');
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/health/diet-plan - Health check');
    
    // Get user session (optional for GET)
    const authUser = await getUserSession(request);
    const userId = authUser?.userId || request.headers.get('x-user-id') || 'anonymous';

    // For test requests, return immediately
    const isTest = request.headers.get('x-test-request') === 'true';
    if (isTest) {
      return NextResponse.json({ 
        success: true, 
        message: 'API endpoint is working',
        test: true
      });
    }

    // Check if database is accessible first
    let dbAvailable = false;
    try {
      const { error: dbError } = await supabase
        .from('diet_plans')
        .select('id')
        .limit(1);

      dbAvailable = !dbError;
    } catch (dbCheckError) {
      console.warn('Database check failed:', dbCheckError);
    }

    if (!dbAvailable) {
      return NextResponse.json({ 
        success: true, 
        message: 'API endpoint is working, database not connected',
        data: null
      });
    }

    // Fetch the most recent active diet plan
    const { data: dietPlan, error } = await supabase
      .from('diet_plans')
      .select(`
        *,
        meal_plan_days (
          day_number,
          breakfast,
          lunch,
          dinner,
          snacks
        ),
        shopping_list_categories (
          id,
          name,
          order_index,
          shopping_list_items (
            name,
            order_index
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching diet plan:', error);
      return NextResponse.json({ 
        success: true, 
        message: 'No diet plan found',
        data: null
      });
    }

    if (!dietPlan) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active diet plan found',
        data: null
      });
    }

    // Transform the data into the expected format
    const transformedPlan = transformDietPlanData(dietPlan);

    return NextResponse.json({ 
      success: true, 
      data: transformedPlan 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('GET diet plan error:', errorMessage);
    return NextResponse.json({ 
      success: true, 
      message: 'API endpoint is working',
      data: null
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/health/diet-plan - Starting diet plan generation');
    
    const body = await request.json();
    console.log('📋 Request body received:', {
      healthConditions: body.healthConditions?.length || 0,
      allergens: body.allergens?.length || 0,
      goalType: body.goalType
    });
    
    // Get user session
    const authUser = await getUserSession(request);
    const userId = authUser?.userId || request.headers.get('x-user-id') || 'anonymous';

    // Validate required fields
    if (!body.goalType) {
      return NextResponse.json({ 
        success: false, 
        error: 'Goal type is required' 
      }, { status: 400 });
    }

    // Add userId to params with proper defaults
    const params = {
      healthConditions: Array.isArray(body.healthConditions) ? body.healthConditions : [],
      severityLevels: body.severityLevels || {},
      currentMedications: Array.isArray(body.currentMedications) ? body.currentMedications : [],
      allergens: Array.isArray(body.allergens) ? body.allergens : [],
      dietaryPreferences: Array.isArray(body.dietaryPreferences) ? body.dietaryPreferences : [],
      goalType: body.goalType,
      rareConditionAnalysis: body.rareConditionAnalysis || null,
      preferences: {
        cookingSkillLevel: body.preferences?.cookingSkillLevel || 'Intermediate',
        budgetRange: {
          min: body.preferences?.budgetRange?.min || 5,
          max: body.preferences?.budgetRange?.max || 15
        },
        cuisinePreferences: body.preferences?.cuisinePreferences || [],
        mealPrepTime: body.preferences?.mealPrepTime || 30
      },
      userId
    };

    console.log('🔍 Processing diet plan for user:', userId, 'with', params.healthConditions.length, 'conditions');
    
    // Generate the diet plan using AI
    const result = await generateDietPlanWithAI(params);
    console.log('🤖 AI generation result:', { success: result.success, hasData: !!result.data });
    
    if (!result.success || !result.data) {
      console.error('❌ AI generation failed:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to generate diet plan' 
      }, { status: 500 });
    }

    console.log('✅ Diet plan generated successfully, saving to database...');

    // Check if database is available before saving
    let dbAvailable = false;
    try {
      const { error: dbTestError } = await supabase
        .from('diet_plans')
        .select('id')
        .limit(1);
      dbAvailable = !dbTestError;
    } catch (dbError) {
      console.warn('Database not available, returning generated plan without saving:', dbError);
    }

    if (!dbAvailable) {
      // Return the generated plan without saving to database
      const completePlan = {
        ...result.data,
        id: `temp-${Date.now()}`,
        overview: `Personalized ${body.goalType || 'maintenance'} diet plan created for your health profile.`,
        metadata: {
          ...result.data.metadata,
          timestamp: new Date().toISOString(),
          confidenceScore: 0.9,
          generationMethod: 'ai'
        }
      };

      console.log('✅ Returning generated plan (database unavailable)');
      return NextResponse.json({ 
        success: true, 
        data: completePlan 
      });
    }

    // Save to database if available
    let savedPlan = null;
    try {
      // Deactivate any existing active plans
      await supabase
        .from('diet_plans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Save the diet plan to database
      const { data: planData, error: saveError } = await supabase
        .from('diet_plans')
        .insert({
          user_id: userId,
          health_conditions: params.healthConditions,
          severity_levels: params.severityLevels,
          current_medications: params.currentMedications,
          allergens: params.allergens,
          dietary_preferences: params.dietaryPreferences,
          goal_type: params.goalType,
          rare_condition_analysis: params.rareConditionAnalysis,
          preferences: params.preferences,
          restrictions: result.data.restrictions || [],
          recommendations: result.data.recommendations || [],
          special_notes: result.data.specialNotes || [],
          meal_prep_tips: result.data.mealPrepTips || [],
          nutrition_guidelines: result.data.nutritionGuidelines || '',
          emergency_substitutions: result.data.emergencySubstitutions || [],
          progress_tracking: result.data.progressTracking || '',
          is_active: true
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving diet plan:', saveError);
        // Don't throw error, just log it and continue without database save
        console.log('⚠️ Continuing without database save due to error');
      } else {
        savedPlan = planData;
        console.log('💾 Diet plan saved successfully, ID:', savedPlan.id);

        // Save meal plan days if database save was successful
        if (result.data.mealPlan?.dailyMeals && savedPlan) {
          try {
            const mealPlanDays = [];
            
            const dayMapping: Record<string, number> = {
              'day1': 1, 'Day 1': 1,
              'day2': 2, 'Day 2': 2,
              'day3': 3, 'Day 3': 3,
              'day4': 4, 'Day 4': 4,
              'day5': 5, 'Day 5': 5,
              'day6': 6, 'Day 6': 6,
              'day7': 7, 'Day 7': 7
            };

            for (const [dayKey, meals] of Object.entries(result.data.mealPlan.dailyMeals)) {
              const dayNumber = dayMapping[dayKey] || parseInt(dayKey.replace(/\D/g, '')) || 1;
              
              mealPlanDays.push({
                diet_plan_id: savedPlan.id,
                day_number: dayNumber,
                breakfast: typeof meals.breakfast === 'string' ? meals.breakfast : JSON.stringify(meals.breakfast),
                lunch: typeof meals.lunch === 'string' ? meals.lunch : JSON.stringify(meals.lunch),
                dinner: typeof meals.dinner === 'string' ? meals.dinner : JSON.stringify(meals.dinner),
                snacks: typeof meals.snacks === 'string' ? meals.snacks : JSON.stringify(meals.snacks)
              });
            }

            const { error: mealError } = await supabase
              .from('meal_plan_days')
              .insert(mealPlanDays);

            if (mealError) {
              console.error('❌ Error saving meal plan days:', mealError);
            } else {
              console.log('✅ Saved', mealPlanDays.length, 'meal plan days');
            }
          } catch (mealSaveError) {
            const errorMessage = mealSaveError instanceof Error ? mealSaveError.message : 'Unknown error';
            console.error('❌ Failed to save meal plan days:', errorMessage);
          }
        }

        // Save shopping list if database save was successful
        if (result.data.shoppingList && result.data.shoppingList.length > 0 && savedPlan) {
          try {
            for (let catIndex = 0; catIndex < result.data.shoppingList.length; catIndex++) {
              const category = result.data.shoppingList[catIndex];
              
              const { data: savedCategory, error: catError } = await supabase
                .from('shopping_list_categories')
                .insert({
                  diet_plan_id: savedPlan.id,
                  name: category.category,
                  order_index: catIndex
                })
                .select()
                .single();

              if (!catError && savedCategory && category.items) {
                const items = category.items.map((item: string, itemIndex: number) => ({
                  category_id: savedCategory.id,
                  name: item,
                  order_index: itemIndex
                }));

                await supabase
                  .from('shopping_list_items')
                  .insert(items);
              }
            }
            console.log('✅ Saved shopping list categories');
          } catch (shoppingSaveError) {
            const errorMessage = shoppingSaveError instanceof Error ? shoppingSaveError.message : 'Unknown error';
            console.error('❌ Failed to save shopping list:', errorMessage);
          }
        }
      }
    } catch (dbSaveError) {
      const errorMessage = dbSaveError instanceof Error ? dbSaveError.message : 'Unknown database error';
      console.error('❌ Database save failed:', errorMessage);
      // Continue and return the generated plan anyway
    }

    // Return the complete diet plan
    const completePlan = {
      ...result.data,
      id: savedPlan?.id || `temp-${Date.now()}`,
      overview: `Personalized ${params.goalType} diet plan created for your health profile with ${params.healthConditions.length} health condition(s) and ${params.allergens.length} allergen(s) considered.`,
      metadata: {
        ...result.data.metadata,
        timestamp: new Date().toISOString(),
        confidenceScore: 0.9,
        generationMethod: result.data.metadata?.generationMethod || 'ai'
      }
    };

    console.log('🎉 Diet plan generation complete!');

    return NextResponse.json({ 
      success: true, 
      data: completePlan 
    });

  } catch (error) {
    console.error('❌ POST diet plan error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper function to transform database data to expected format
function transformDietPlanData(dbData: any) {
  // Reconstruct meal plan with proper formatting
  const mealPlan: any = { dailyMeals: {} };
  
  if (dbData.meal_plan_days) {
    dbData.meal_plan_days
      .sort((a: any, b: any) => a.day_number - b.day_number)
      .forEach((day: any) => {
        // Parse meal data if it's JSON string
        const parseMeal = (meal: string) => {
          try {
            if (meal && meal.startsWith('{')) {
              return JSON.parse(meal);
            }
            return meal;
          } catch {
            return meal;
          }
        };

        mealPlan.dailyMeals[`Day ${day.day_number}`] = {
          breakfast: parseMeal(day.breakfast),
          lunch: parseMeal(day.lunch),
          dinner: parseMeal(day.dinner),
          snacks: parseMeal(day.snacks)
        };
      });
  }

  // Reconstruct shopping list
  const shoppingList: any[] = [];
  
  if (dbData.shopping_list_categories) {
    dbData.shopping_list_categories
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .forEach((category: any) => {
        const items = category.shopping_list_items
          ?.sort((a: any, b: any) => a.order_index - b.order_index)
          .map((item: any) => item.name) || [];
        
        shoppingList.push({
          category: category.name,
          items
        });
      });
  }

  // Create a comprehensive overview
  const healthConditions = dbData.health_conditions || [];
  const dietaryPrefs = dbData.dietary_preferences || [];
  const goalType = dbData.goal_type || 'maintenance';
  
  const overview = `Your personalized ${goalType} diet plan has been carefully crafted${
    healthConditions.length > 0 ? ` for your health conditions (${healthConditions.join(', ')})` : ''
  }${
    dietaryPrefs.length > 0 ? ` following ${dietaryPrefs.join(', ')} preferences` : ''
  }. This 7-day plan provides balanced nutrition while respecting your dietary needs and health goals.`;

  return {
    id: dbData.id,
    overview,
    restrictions: dbData.restrictions || [],
    recommendations: dbData.recommendations || [],
    specialNotes: dbData.special_notes || [],
    mealPlan,
    shoppingList,
    mealPrepTips: dbData.meal_prep_tips || [],
    nutritionalGuidelines: dbData.nutrition_guidelines || '',
    emergencySubstitutions: dbData.emergency_substitutions || [],
    progressTracking: dbData.progress_tracking || '',
    substitutions: dbData.emergency_substitutions || [],
    metadata: {
      timestamp: dbData.created_at,
      generationMethod: 'ai',
      confidenceScore: 0.9,
      healthConditions: healthConditions.length,
      restrictions: dbData.restrictions?.length || 0
    }
  };
}