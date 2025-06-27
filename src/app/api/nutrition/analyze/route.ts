// src/app/api/nutrition/analyze/route.ts
// Advanced nutrition analysis with health insights

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ingredients, servings } = await request.json();
    
    // Validate input
    if (!ingredients || !Array.isArray(ingredients)) {
      return Response.json({ 
        success: false, 
        error: 'Ingredients array is required' 
      }, { status: 400 });
    }

    if (!servings || servings <= 0) {
      return Response.json({ 
        success: false, 
        error: 'Valid servings number is required' 
      }, { status: 400 });
    }
    
    const nutritionAnalysis = await analyzeNutrition(ingredients, servings);
    const healthInsights = generateHealthInsights(nutritionAnalysis);
    
    return Response.json({
      success: true,
      nutrition: nutritionAnalysis,
      healthInsights,
      servings
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Nutrition analysis error:', errorMessage);
    return Response.json({ 
      success: false, 
      error: 'Analysis failed' 
    }, { status: 500 });
  }
}

async function analyzeNutrition(ingredients: any[], servings: number) {
  let totalNutrition = {
    calories: 0, 
    protein: 0, 
    carbs: 0, 
    fat: 0, 
    fiber: 0, 
    sodium: 0,
    sugar: 0,
    saturatedFat: 0,
    cholesterol: 0,
    potassium: 0,
    calcium: 0,
    iron: 0,
    vitaminC: 0,
    vitaminA: 0
  };
  
  for (const ingredient of ingredients) {
    const nutrition = calculateIngredientNutrition(ingredient);
    totalNutrition.calories += nutrition.calories;
    totalNutrition.protein += nutrition.protein;
    totalNutrition.carbs += nutrition.carbs;
    totalNutrition.fat += nutrition.fat;
    totalNutrition.fiber += nutrition.fiber;
    totalNutrition.sodium += nutrition.sodium;
    totalNutrition.sugar += nutrition.sugar;
    totalNutrition.saturatedFat += nutrition.saturatedFat;
    totalNutrition.cholesterol += nutrition.cholesterol;
    totalNutrition.potassium += nutrition.potassium;
    totalNutrition.calcium += nutrition.calcium;
    totalNutrition.iron += nutrition.iron;
    totalNutrition.vitaminC += nutrition.vitaminC;
    totalNutrition.vitaminA += nutrition.vitaminA;
  }
  
  // Return both total and per serving
  return {
    total: totalNutrition,
    perServing: {
      calories: Math.round(totalNutrition.calories / servings),
      protein: Math.round((totalNutrition.protein / servings) * 10) / 10,
      carbs: Math.round((totalNutrition.carbs / servings) * 10) / 10,
      fat: Math.round((totalNutrition.fat / servings) * 10) / 10,
      fiber: Math.round((totalNutrition.fiber / servings) * 10) / 10,
      sodium: Math.round(totalNutrition.sodium / servings),
      sugar: Math.round((totalNutrition.sugar / servings) * 10) / 10,
      saturatedFat: Math.round((totalNutrition.saturatedFat / servings) * 10) / 10,
      cholesterol: Math.round(totalNutrition.cholesterol / servings),
      potassium: Math.round(totalNutrition.potassium / servings),
      calcium: Math.round(totalNutrition.calcium / servings),
      iron: Math.round((totalNutrition.iron / servings) * 10) / 10,
      vitaminC: Math.round((totalNutrition.vitaminC / servings) * 10) / 10,
      vitaminA: Math.round(totalNutrition.vitaminA / servings)
    }
  };
}

function calculateIngredientNutrition(ingredient: any) {
  // Basic nutrition database - you can expand this or integrate with a real nutrition API
  const nutritionDatabase: Record<string, any> = {
    // Proteins
    'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74, sugar: 0, saturatedFat: 1.0, cholesterol: 85, potassium: 256, calcium: 15, iron: 0.9, vitaminC: 0, vitaminA: 21 },
    'beef': { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sodium: 72, sugar: 0, saturatedFat: 6.0, cholesterol: 90, potassium: 318, calcium: 18, iron: 2.6, vitaminC: 0, vitaminA: 0 },
    'salmon': { calories: 208, protein: 28, carbs: 0, fat: 12, fiber: 0, sodium: 59, sugar: 0, saturatedFat: 3.1, cholesterol: 66, potassium: 628, calcium: 12, iron: 0.8, vitaminC: 0, vitaminA: 25 },
    'eggs': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sodium: 124, sugar: 1.1, saturatedFat: 3.3, cholesterol: 373, potassium: 138, calcium: 56, iron: 1.8, vitaminC: 0, vitaminA: 540 },
    'tofu': { calories: 144, protein: 17, carbs: 3, fat: 9, fiber: 2, sodium: 14, sugar: 0.6, saturatedFat: 1.3, cholesterol: 0, potassium: 237, calcium: 683, iron: 2.7, vitaminC: 0, vitaminA: 0 },
    
    // Carbohydrates
    'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sodium: 1, sugar: 0.1, saturatedFat: 0.1, cholesterol: 0, potassium: 55, calcium: 10, iron: 0.8, vitaminC: 0, vitaminA: 0 },
    'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sodium: 491, sugar: 5.7, saturatedFat: 0.6, cholesterol: 0, potassium: 115, calcium: 34, iron: 3.6, vitaminC: 0, vitaminA: 0 },
    'pasta': { calories: 220, protein: 8, carbs: 44, fat: 1.3, fiber: 2.5, sodium: 1, sugar: 1.7, saturatedFat: 0.3, cholesterol: 0, potassium: 44, calcium: 21, iron: 1.8, vitaminC: 0, vitaminA: 0 },
    'quinoa': { calories: 222, protein: 8, carbs: 39, fat: 3.6, fiber: 5, sodium: 13, sugar: 0.9, saturatedFat: 0.4, cholesterol: 0, potassium: 563, calcium: 47, iron: 4.6, vitaminC: 0, vitaminA: 5 },
    'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, sodium: 2, sugar: 0.9, saturatedFat: 1.2, cholesterol: 0, potassium: 429, calcium: 54, iron: 4.7, vitaminC: 0, vitaminA: 0 },
    
    // Vegetables
    'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sodium: 33, sugar: 1.5, saturatedFat: 0.1, cholesterol: 0, potassium: 316, calcium: 47, iron: 0.7, vitaminC: 89.2, vitaminA: 623 },
    'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sodium: 79, sugar: 0.4, saturatedFat: 0.1, cholesterol: 0, potassium: 558, calcium: 99, iron: 2.7, vitaminC: 28.1, vitaminA: 9377 },
    'carrots': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sodium: 69, sugar: 4.7, saturatedFat: 0.0, cholesterol: 0, potassium: 320, calcium: 33, iron: 0.3, vitaminC: 5.9, vitaminA: 16706 },
    'tomatoes': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sodium: 5, sugar: 2.6, saturatedFat: 0.0, cholesterol: 0, potassium: 237, calcium: 10, iron: 0.3, vitaminC: 13.7, vitaminA: 833 },
    'onions': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sodium: 4, sugar: 4.2, saturatedFat: 0.0, cholesterol: 0, potassium: 146, calcium: 23, iron: 0.2, vitaminC: 7.4, vitaminA: 2 },
    
    // Fruits
    'apples': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sodium: 1, sugar: 10.4, saturatedFat: 0.0, cholesterol: 0, potassium: 107, calcium: 6, iron: 0.1, vitaminC: 4.6, vitaminA: 54 },
    'bananas': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sodium: 1, sugar: 12.2, saturatedFat: 0.1, cholesterol: 0, potassium: 358, calcium: 5, iron: 0.3, vitaminC: 8.7, vitaminA: 64 },
    'berries': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, sodium: 1, sugar: 10, saturatedFat: 0.0, cholesterol: 0, potassium: 77, calcium: 16, iron: 0.6, vitaminC: 58.8, vitaminA: 54 },
    
    // Dairy
    'milk': { calories: 61, protein: 3.2, carbs: 4.5, fat: 3.2, fiber: 0, sodium: 44, sugar: 4.5, saturatedFat: 1.9, cholesterol: 10, potassium: 150, calcium: 113, iron: 0.0, vitaminC: 0, vitaminA: 126 },
    'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, sodium: 621, sugar: 0.5, saturatedFat: 21, cholesterol: 105, potassium: 98, calcium: 721, iron: 0.7, vitaminC: 0, vitaminA: 1242 },
    'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sodium: 36, sugar: 3.2, saturatedFat: 0.1, cholesterol: 5, potassium: 141, calcium: 110, iron: 0.1, vitaminC: 0.5, vitaminA: 27 },
    
    // Fats and oils
    'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sodium: 2, sugar: 0, saturatedFat: 13.8, cholesterol: 0, potassium: 1, calcium: 1, iron: 0.6, vitaminC: 0, vitaminA: 0 },
    'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sodium: 11, sugar: 0.1, saturatedFat: 51, cholesterol: 215, potassium: 24, calcium: 24, iron: 0.0, vitaminC: 0, vitaminA: 2499 },
    'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sodium: 7, sugar: 0.7, saturatedFat: 2.1, cholesterol: 0, potassium: 485, calcium: 12, iron: 0.6, vitaminC: 10, vitaminA: 146 },
    
    // Nuts and seeds
    'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sodium: 1, sugar: 4.4, saturatedFat: 3.8, cholesterol: 0, potassium: 733, calcium: 269, iron: 3.7, vitaminC: 0, vitaminA: 1 },
    'walnuts': { calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 7, sodium: 2, sugar: 2.6, saturatedFat: 6.1, cholesterol: 0, potassium: 441, calcium: 98, iron: 2.9, vitaminC: 1.3, vitaminA: 20 }
  };

  const ingredientName = ingredient.name?.toLowerCase() || '';
  const amount = ingredient.amount || 1;
  const unit = ingredient.unit?.toLowerCase() || 'cup';
  
  // Find the best match in our database
  let nutritionData = null;
  
  // Direct match
  if (nutritionDatabase[ingredientName]) {
    nutritionData = nutritionDatabase[ingredientName];
  } else {
    // Partial match - find ingredients that contain the search term
    const matchingKey = Object.keys(nutritionDatabase).find(key => 
      key.includes(ingredientName) || ingredientName.includes(key)
    );
    
    if (matchingKey) {
      nutritionData = nutritionDatabase[matchingKey];
    }
  }
  
  // Default nutrition if not found
  if (!nutritionData) {
    console.log(`⚠️ Nutrition data not found for: ${ingredientName}, using defaults`);
    nutritionData = {
      calories: 50, protein: 1, carbs: 10, fat: 1, fiber: 1, sodium: 10,
      sugar: 2, saturatedFat: 0.5, cholesterol: 0, potassium: 50,
      calcium: 10, iron: 0.5, vitaminC: 1, vitaminA: 10
    };
  }
  
  // Apply unit conversions (basic conversion factors)
  let conversionFactor = 1;
  
  switch (unit) {
    case 'cup':
    case 'cups':
      conversionFactor = 1;
      break;
    case 'tbsp':
    case 'tablespoon':
    case 'tablespoons':
      conversionFactor = 0.0625; // 1 tbsp = 1/16 cup
      break;
    case 'tsp':
    case 'teaspoon':
    case 'teaspoons':
      conversionFactor = 0.0208; // 1 tsp = 1/48 cup
      break;
    case 'oz':
    case 'ounce':
    case 'ounces':
      conversionFactor = 0.125; // 1 oz = 1/8 cup (approximate)
      break;
    case 'lb':
    case 'pound':
    case 'pounds':
      conversionFactor = 2; // 1 lb ≈ 2 cups (approximate)
      break;
    case 'g':
    case 'gram':
    case 'grams':
      conversionFactor = 0.004; // 1g ≈ 0.004 cups (very approximate)
      break;
    case 'kg':
    case 'kilogram':
    case 'kilograms':
      conversionFactor = 4; // 1kg ≈ 4 cups (very approximate)
      break;
    case 'piece':
    case 'pieces':
    case 'whole':
    case 'medium':
    case 'large':
    case 'small':
      conversionFactor = 0.5; // Assume 1 piece ≈ 0.5 cups
      break;
    case 'clove':
    case 'cloves':
      conversionFactor = 0.01; // 1 clove ≈ 0.01 cups
      break;
    default:
      conversionFactor = 1;
  }
  
  const adjustedAmount = amount * conversionFactor;
  
  // Scale nutrition values by adjusted amount
  return {
    calories: nutritionData.calories * adjustedAmount,
    protein: nutritionData.protein * adjustedAmount,
    carbs: nutritionData.carbs * adjustedAmount,
    fat: nutritionData.fat * adjustedAmount,
    fiber: nutritionData.fiber * adjustedAmount,
    sodium: nutritionData.sodium * adjustedAmount,
    sugar: nutritionData.sugar * adjustedAmount,
    saturatedFat: nutritionData.saturatedFat * adjustedAmount,
    cholesterol: nutritionData.cholesterol * adjustedAmount,
    potassium: nutritionData.potassium * adjustedAmount,
    calcium: nutritionData.calcium * adjustedAmount,
    iron: nutritionData.iron * adjustedAmount,
    vitaminC: nutritionData.vitaminC * adjustedAmount,
    vitaminA: nutritionData.vitaminA * adjustedAmount
  };
}

function generateHealthInsights(nutrition: any) {
  const insights = [];
  const perServing = nutrition.perServing;
  
  // Positive insights
  if (perServing.protein > 25) {
    insights.push({ 
      type: 'positive', 
      message: 'High protein content - excellent for muscle building and satiety',
      icon: '💪'
    });
  }
  
  if (perServing.fiber > 8) {
    insights.push({ 
      type: 'positive', 
      message: 'High fiber content - great for digestive health and blood sugar control',
      icon: '🌾'
    });
  }
  
  if (perServing.vitaminC > 30) {
    insights.push({ 
      type: 'positive', 
      message: 'Rich in Vitamin C - supports immune system and collagen production',
      icon: '🍊'
    });
  }
  
  if (perServing.calcium > 200) {
    insights.push({ 
      type: 'positive', 
      message: 'High calcium content - essential for bone health',
      icon: '🦴'
    });
  }
  
  if (perServing.iron > 3) {
    insights.push({ 
      type: 'positive', 
      message: 'Good iron source - important for blood health and energy',
      icon: '🩸'
    });
  }
  
  // Warning insights
  if (perServing.sodium > 800) {
    insights.push({ 
      type: 'warning', 
      message: 'High sodium content - consider reducing salt for heart health',
      icon: '🧂'
    });
  }
  
  if (perServing.saturatedFat > 10) {
    insights.push({ 
      type: 'warning', 
      message: 'High saturated fat - may affect cardiovascular health',
      icon: '🫀'
    });
  }
  
  if (perServing.sugar > 15) {
    insights.push({ 
      type: 'warning', 
      message: 'High sugar content - may cause blood sugar spikes',
      icon: '🍯'
    });
  }
  
  if (perServing.cholesterol > 200) {
    insights.push({ 
      type: 'warning', 
      message: 'High cholesterol content - monitor if you have heart conditions',
      icon: '💓'
    });
  }
  
  // Informational insights
  if (perServing.calories > 600) {
    insights.push({ 
      type: 'info', 
      message: 'High calorie content - great for active individuals or bulking',
      icon: '🔥'
    });
  } else if (perServing.calories < 200) {
    insights.push({ 
      type: 'info', 
      message: 'Low calorie option - suitable for weight management',
      icon: '⚖️'
    });
  }
  
  if (perServing.potassium > 400) {
    insights.push({ 
      type: 'info', 
      message: 'Good potassium source - helps regulate blood pressure',
      icon: '💓'
    });
  }
  
  // Macronutrient balance insights
  const totalMacros = perServing.protein + perServing.carbs + perServing.fat;
  if (totalMacros > 0) {
    const proteinPercent = (perServing.protein * 4 / perServing.calories) * 100;
    const carbPercent = (perServing.carbs * 4 / perServing.calories) * 100;
    const fatPercent = (perServing.fat * 9 / perServing.calories) * 100;
    
    if (proteinPercent > 30) {
      insights.push({ 
        type: 'info', 
        message: 'High protein ratio - excellent for muscle maintenance',
        icon: '🏋️'
      });
    }
    
    if (fatPercent > 50) {
      insights.push({ 
        type: 'info', 
        message: 'High fat content - provides sustained energy',
        icon: '🥑'
      });
    }
    
    if (carbPercent > 60) {
      insights.push({ 
        type: 'info', 
        message: 'High carbohydrate content - good for energy and recovery',
        icon: '⚡'
      });
    }
  }
  
  return insights;
}