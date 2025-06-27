// src/app/api/recommendations/route.ts
// Smart recommendation system based on user behavior

import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🔍 Getting recommendations for user:', authUser.userId);

    // Get user preferences and history
    const { data: userData } = await supabase
      .from('user_data')
      .select('favorites, search_history, preferences')
      .eq('user_id', authUser.userId)
      .single();

    // Get user's recent recipe interactions
    const { data: recentInteractions } = await supabase
      .from('user_recipe_interactions')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get user's health profile for health-based recommendations
    const { data: healthProfile } = await supabase
      .from('user_health_profiles')
      .select('*')
      .eq('user_id', authUser.userId)
      .single();

    // Analyze user preferences - ensure arrays are not null
    const preferences = analyzeUserPreferences(
      userData, 
      recentInteractions || [], 
      healthProfile
    );
    
    // Get personalized recommendations
    const recommendations = await generateRecommendations(preferences, authUser.userId);

    return Response.json({
      success: true,
      recommendations,
      preferences,
      count: recommendations.length
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Recommendations error:', errorMessage);
    return Response.json({ 
      success: false, 
      error: 'Failed to get recommendations' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { ingredient } = await request.json();

    if (!ingredient) {
      return Response.json({ 
        success: false, 
        error: 'Ingredient is required' 
      }, { status: 400 });
    }

    // Find substitutions for the ingredient
    const substitutions = findSubstitutions(ingredient.toLowerCase());

    return Response.json({
      success: true,
      ingredient,
      substitutions,
      count: substitutions.length
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Substitutions error:', errorMessage);
    return Response.json({ 
      success: false, 
      error: 'Failed to find substitutions' 
    }, { status: 500 });
  }
}

function analyzeUserPreferences(userData: any, recentInteractions: any[], healthProfile: any) {
  console.log('📊 Analyzing user preferences...');
  
  // Ensure recentInteractions is always an array
  const interactions = Array.isArray(recentInteractions) ? recentInteractions : [];
  
  const preferences = {
    favoriteCuisines: [] as string[],
    dietaryRestrictions: [] as string[],
    preferredDifficulty: 'medium' as string,
    averageCookingTime: 30,
    budgetRange: 'medium' as string,
    healthConditions: [] as string[],
    allergens: [] as string[],
    nutritionalGoals: [] as string[],
    ingredientPreferences: [] as string[],
    mealTypes: [] as string[]
  };

  // Analyze user data preferences
  if (userData?.preferences) {
    preferences.dietaryRestrictions = Array.isArray(userData.preferences.dietary) ? userData.preferences.dietary : [];
    preferences.preferredDifficulty = userData.preferences.difficulty || 'medium';
    preferences.averageCookingTime = userData.preferences.maxCookingTime || 30;
    preferences.budgetRange = userData.preferences.budget || 'medium';
  }

  // Analyze health profile
  if (healthProfile) {
    preferences.healthConditions = Array.isArray(healthProfile.health_conditions) ? healthProfile.health_conditions : [];
    preferences.allergens = Array.isArray(healthProfile.allergens) ? healthProfile.allergens : [];
    preferences.nutritionalGoals = Array.isArray(healthProfile.goals) ? healthProfile.goals : [];
  }

  // Analyze recent interactions
  if (interactions.length > 0) {
    const cuisines = new Map<string, number>();
    const difficulties = new Map<string, number>();
    const ingredients = new Map<string, number>();
    const mealTypes = new Map<string, number>();
    let totalCookingTime = 0;
    let cookingTimeCount = 0;

    interactions.forEach(interaction => {
      const recipe = interaction.recipe_data;
      if (!recipe) return;

      // Track cuisines
      if (recipe.cuisine) {
        cuisines.set(recipe.cuisine, (cuisines.get(recipe.cuisine) || 0) + 1);
      }

      // Track difficulty preferences
      if (recipe.difficulty) {
        difficulties.set(recipe.difficulty, (difficulties.get(recipe.difficulty) || 0) + 1);
      }

      // Track cooking time
      if (recipe.cookingTime) {
        totalCookingTime += recipe.cookingTime;
        cookingTimeCount++;
      }

      // Track ingredients
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((ing: any) => {
          const ingredientName = typeof ing === 'string' ? ing : ing.name;
          if (ingredientName) {
            ingredients.set(ingredientName, (ingredients.get(ingredientName) || 0) + 1);
          }
        });
      }

      // Track meal types (inferred from recipe characteristics)
      if (recipe.cookingTime <= 15) {
        mealTypes.set('quick', (mealTypes.get('quick') || 0) + 1);
      }
      if (recipe.dietary?.includes('healthy')) {
        mealTypes.set('healthy', (mealTypes.get('healthy') || 0) + 1);
      }
      if (recipe.difficulty === 'Easy') {
        mealTypes.set('simple', (mealTypes.get('simple') || 0) + 1);
      }
    });

    // Extract top preferences
    preferences.favoriteCuisines = Array.from(cuisines.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cuisine]) => cuisine);

    preferences.ingredientPreferences = Array.from(ingredients.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ingredient]) => ingredient);

    preferences.mealTypes = Array.from(mealTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);

    // Calculate average cooking time
    if (cookingTimeCount > 0) {
      preferences.averageCookingTime = Math.round(totalCookingTime / cookingTimeCount);
    }

    // Determine preferred difficulty
    const topDifficulty = Array.from(difficulties.entries())
      .sort((a, b) => b[1] - a[1])[0];
    if (topDifficulty) {
      preferences.preferredDifficulty = topDifficulty[0].toLowerCase();
    }
  }

  console.log('✅ User preferences analyzed:', preferences);
  return preferences;
}

async function generateRecommendations(preferences: any, userId: string) {
  console.log('🎯 Generating recommendations...');
  
  const recommendations = [];

  try {
    // 1. Cuisine-based recommendations
    if (preferences.favoriteCuisines.length > 0) {
      const cuisineRecs = await getCuisineRecommendations(preferences.favoriteCuisines);
      recommendations.push({
        type: 'cuisine',
        title: 'Based on Your Favorite Cuisines',
        description: `You seem to love ${preferences.favoriteCuisines.join(', ')} cuisine`,
        recipes: cuisineRecs,
        priority: 'high'
      });
    }

    // 2. Health-based recommendations
    if (preferences.healthConditions.length > 0 || preferences.nutritionalGoals.length > 0) {
      const healthRecs = await getHealthBasedRecommendations(preferences);
      recommendations.push({
        type: 'health',
        title: 'Healthy Choices for You',
        description: 'Recipes that support your health goals',
        recipes: healthRecs,
        priority: 'high'
      });
    }

    // 3. Quick meal recommendations
    if (preferences.averageCookingTime <= 20 || preferences.mealTypes.includes('quick')) {
      const quickRecs = await getQuickMealRecommendations();
      recommendations.push({
        type: 'quick',
        title: 'Quick & Easy Meals',
        description: 'Ready in 20 minutes or less',
        recipes: quickRecs,
        priority: 'medium'
      });
    }

    // 4. Ingredient-based recommendations
    if (preferences.ingredientPreferences.length > 0) {
      const ingredientRecs = await getIngredientBasedRecommendations(preferences.ingredientPreferences);
      recommendations.push({
        type: 'ingredients',
        title: 'Using Your Favorite Ingredients',
        description: `Featuring ${preferences.ingredientPreferences.slice(0, 3).join(', ')}`,
        recipes: ingredientRecs,
        priority: 'medium'
      });
    }

    // 5. Trending recipes
    const trendingRecs = await getTrendingRecommendations();
    recommendations.push({
      type: 'trending',
      title: 'Trending Recipes',
      description: 'Popular recipes other users love',
      recipes: trendingRecs,
      priority: 'low'
    });

    // 6. Seasonal recommendations
    const seasonalRecs = await getSeasonalRecommendations();
    recommendations.push({
      type: 'seasonal',
      title: 'Seasonal Favorites',
      description: 'Perfect for this time of year',
      recipes: seasonalRecs,
      priority: 'low'
    });

  } catch (error) {
    console.error('Error generating specific recommendations:', error);
  }

  // Filter out empty recommendations
  const validRecommendations = recommendations.filter(rec => rec.recipes && rec.recipes.length > 0);

  console.log(`✅ Generated ${validRecommendations.length} recommendation categories`);
  return validRecommendations;
}

async function getCuisineRecommendations(cuisines: string[]) {
  try {
    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')
      .in('cuisine', cuisines)
      .order('rating', { ascending: false })
      .limit(6);

    return recipes || [];
  } catch (error) {
    console.error('Error fetching cuisine recommendations:', error);
    return [];
  }
}

async function getHealthBasedRecommendations(preferences: any) {
  try {
    const healthyDietary = ['healthy', 'heart-healthy', 'anti-inflammatory', 'diabetic-friendly', 'low-sodium'];
    
    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')
      .overlaps('dietary', healthyDietary)
      .order('rating', { ascending: false })
      .limit(6);

    return recipes || [];
  } catch (error) {
    console.error('Error fetching health-based recommendations:', error);
    return [];
  }
}

async function getQuickMealRecommendations() {
  try {
    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')
      .lte('cooking_time', 20)
      .order('rating', { ascending: false })
      .limit(6);

    return recipes || [];
  } catch (error) {
    console.error('Error fetching quick meal recommendations:', error);
    return [];
  }
}

async function getIngredientBasedRecommendations(ingredients: string[]) {
  try {
    // This is a simplified version - in a real app, you'd do more sophisticated ingredient matching
    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')
      .order('rating', { ascending: false })
      .limit(6);

    return recipes || [];
  } catch (error) {
    console.error('Error fetching ingredient-based recommendations:', error);
    return [];
  }
}

async function getTrendingRecommendations() {
  try {
    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')
      .order('reviews', { ascending: false })
      .limit(6);

    return recipes || [];
  } catch (error) {
    console.error('Error fetching trending recommendations:', error);
    return [];
  }
}

async function getSeasonalRecommendations() {
  try {
    const currentMonth = new Date().getMonth();
    let seasonalKeywords = [];

    // Determine seasonal keywords based on month
    if (currentMonth >= 2 && currentMonth <= 4) { // Spring
      seasonalKeywords = ['fresh', 'salad', 'light', 'vegetables'];
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
      seasonalKeywords = ['grilled', 'cold', 'refreshing', 'berries'];
    } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall
      seasonalKeywords = ['pumpkin', 'apple', 'warm', 'comfort'];
    } else { // Winter
      seasonalKeywords = ['soup', 'stew', 'hearty', 'warm'];
    }

    const { data: recipes } = await supabase
      .from('recipes')
      .select('*')
      .order('rating', { ascending: false })
      .limit(6);

    return recipes || [];
  } catch (error) {
    console.error('Error fetching seasonal recommendations:', error);
    return [];
  }
}

// Ingredient substitution database
const substitutionDatabase: Record<string, string[]> = {
  // Dairy substitutions
  'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk', 'rice milk'],
  'butter': ['coconut oil', 'olive oil', 'vegan butter', 'applesauce', 'mashed banana'],
  'cheese': ['nutritional yeast', 'cashew cheese', 'vegan cheese', 'tofu ricotta'],
  'yogurt': ['coconut yogurt', 'almond yogurt', 'soy yogurt', 'cashew cream'],
  'cream': ['coconut cream', 'cashew cream', 'silken tofu', 'oat cream'],
  
  // Egg substitutions
  'eggs': ['flax eggs', 'chia eggs', 'applesauce', 'mashed banana', 'aquafaba', 'commercial egg replacer'],
  'egg': ['flax egg', 'chia egg', '1/4 cup applesauce', '1/4 cup mashed banana', '3 tbsp aquafaba'],
  
  // Gluten substitutions
  'flour': ['almond flour', 'coconut flour', 'rice flour', 'oat flour', 'gluten-free flour blend'],
  'wheat flour': ['rice flour', 'almond flour', 'coconut flour', 'gluten-free flour'],
  'bread': ['gluten-free bread', 'lettuce wraps', 'portobello mushrooms', 'cauliflower bread'],
  'pasta': ['zucchini noodles', 'shirataki noodles', 'rice noodles', 'chickpea pasta', 'lentil pasta'],
  
  // Sugar substitutions
  'sugar': ['stevia', 'monk fruit', 'erythritol', 'xylitol', 'maple syrup', 'honey', 'dates'],
  'honey': ['maple syrup', 'agave nectar', 'date syrup', 'stevia', 'brown rice syrup'],
  
  // Meat substitutions
  'chicken': ['tofu', 'tempeh', 'seitan', 'jackfruit', 'mushrooms', 'cauliflower'],
  'beef': ['lentils', 'black beans', 'mushrooms', 'tempeh', 'beyond meat', 'jackfruit'],
  'pork': ['jackfruit', 'mushrooms', 'tempeh', 'eggplant', 'cauliflower'],
  'fish': ['tofu', 'tempeh', 'hearts of palm', 'mushrooms', 'banana peels'],
  
  // Vegetable substitutions
  'onions': ['shallots', 'leeks', 'garlic', 'celery', 'fennel bulb'],
  'garlic': ['garlic powder', 'shallots', 'ginger', 'asafoetida'],
  'tomatoes': ['red bell peppers', 'sun-dried tomatoes', 'tomato paste', 'roasted red peppers'],
  
  // Spice substitutions
  'cumin': ['chili powder', 'coriander', 'paprika', 'curry powder'],
  'paprika': ['chili powder', 'cayenne pepper', 'chipotle powder'],
  'oregano': ['basil', 'thyme', 'marjoram', 'italian seasoning'],
  'basil': ['oregano', 'thyme', 'spinach', 'arugula'],
  
  // Liquid substitutions
  'wine': ['grape juice', 'broth', 'vinegar', 'lemon juice'],
  'soy sauce': ['tamari', 'coconut aminos', 'liquid aminos', 'worcestershire sauce'],
  'vinegar': ['lemon juice', 'lime juice', 'wine', 'citric acid'],
  
  // Nut substitutions
  'almonds': ['cashews', 'walnuts', 'sunflower seeds', 'pumpkin seeds'],
  'peanuts': ['sunflower seeds', 'soy nuts', 'chickpeas', 'tree nuts'],
  'walnuts': ['pecans', 'almonds', 'cashews', 'sunflower seeds']
};

function findSubstitutions(ingredient: string) {
  console.log('🔍 Finding substitutions for:', ingredient);
  
  // Direct match
  if (substitutionDatabase[ingredient]) {
    return substitutionDatabase[ingredient];
  }
  
  // Partial match - find ingredients that contain the search term
  for (const [key, subs] of Object.entries(substitutionDatabase)) {
    if (ingredient.includes(key) || key.includes(ingredient)) {
      console.log(`✅ Found partial match: ${key}`);
      return subs;
    }
  }
  
  console.log('❌ No substitutions found for:', ingredient);
  return [];
}