// src/lib/realisticEstimator.ts
// Realistic price and nutrition estimation for recipes

import { Ingredient, NutritionInfo } from '@/types/recipe';

// More realistic ingredient pricing (per typical serving/unit)
const ingredientPrices: Record<string, { price: number; unit: string; serving: number }> = {
  // Proteins (price per pound, but calculated per typical serving)
  'chicken breast': { price: 0.75, unit: 'oz', serving: 4 }, // $6/lb = $0.375/oz, but 4oz serving = $1.50
  'chicken': { price: 0.75, unit: 'oz', serving: 4 },
  'ground beef': { price: 0.80, unit: 'oz', serving: 4 },
  'beef': { price: 1.20, unit: 'oz', serving: 4 },
  'salmon': { price: 1.50, unit: 'oz', serving: 4 },
  'fish': { price: 1.00, unit: 'oz', serving: 4 },
  'shrimp': { price: 1.25, unit: 'oz', serving: 3 },
  'pork': { price: 0.60, unit: 'oz', serving: 4 },
  'eggs': { price: 0.25, unit: 'each', serving: 1 },
  'egg': { price: 0.25, unit: 'each', serving: 1 },
  
  // Dairy
  'milk': { price: 0.25, unit: 'cup', serving: 1 },
  'cheese': { price: 0.50, unit: 'oz', serving: 1 },
  'butter': { price: 0.15, unit: 'tbsp', serving: 1 },
  'cream': { price: 0.30, unit: 'cup', serving: 0.25 },
  'yogurt': { price: 0.75, unit: 'cup', serving: 1 },
  
  // Vegetables (price per typical use)
  'onion': { price: 0.15, unit: 'medium', serving: 0.5 },
  'garlic': { price: 0.05, unit: 'clove', serving: 1 },
  'tomato': { price: 0.50, unit: 'medium', serving: 1 },
  'potato': { price: 0.25, unit: 'medium', serving: 1 },
  'carrot': { price: 0.20, unit: 'medium', serving: 1 },
  'bell pepper': { price: 0.75, unit: 'medium', serving: 1 },
  'broccoli': { price: 0.50, unit: 'cup', serving: 1 },
  'spinach': { price: 0.25, unit: 'cup', serving: 1 },
  'lettuce': { price: 0.30, unit: 'cup', serving: 1 },
  'cucumber': { price: 0.40, unit: 'medium', serving: 1 },
  'mushrooms': { price: 0.40, unit: 'cup', serving: 1 },
  
  // Pantry staples
  'rice': { price: 0.25, unit: 'cup', serving: 1 },
  'pasta': { price: 0.20, unit: 'oz', serving: 2 },
  'bread': { price: 0.25, unit: 'slice', serving: 1 },
  'flour': { price: 0.10, unit: 'cup', serving: 1 },
  'sugar': { price: 0.05, unit: 'tbsp', serving: 1 },
  'olive oil': { price: 0.15, unit: 'tbsp', serving: 1 },
  'oil': { price: 0.10, unit: 'tbsp', serving: 1 },
  'salt': { price: 0.01, unit: 'tsp', serving: 1 },
  'pepper': { price: 0.02, unit: 'tsp', serving: 1 },
  'soy sauce': { price: 0.05, unit: 'tbsp', serving: 1 },
  
  // Herbs and spices (small amounts)
  'basil': { price: 0.15, unit: 'tbsp', serving: 1 },
  'oregano': { price: 0.05, unit: 'tsp', serving: 1 },
  'thyme': { price: 0.05, unit: 'tsp', serving: 1 },
  'parsley': { price: 0.10, unit: 'tbsp', serving: 1 },
  'cilantro': { price: 0.10, unit: 'tbsp', serving: 1 },
  'ginger': { price: 0.05, unit: 'tsp', serving: 1 },
  'cumin': { price: 0.03, unit: 'tsp', serving: 1 },
  'paprika': { price: 0.03, unit: 'tsp', serving: 1 },
  
  // Beans and grains
  'black beans': { price: 0.50, unit: 'cup', serving: 1 },
  'kidney beans': { price: 0.50, unit: 'cup', serving: 1 },
  'chickpeas': { price: 0.50, unit: 'cup', serving: 1 },
  'quinoa': { price: 0.60, unit: 'cup', serving: 1 },
  'lentils': { price: 0.40, unit: 'cup', serving: 1 },
  
  // Fruits
  'lemon': { price: 0.50, unit: 'whole', serving: 1 },
  'lime': { price: 0.25, unit: 'whole', serving: 1 },
  'apple': { price: 0.75, unit: 'medium', serving: 1 },
  'banana': { price: 0.30, unit: 'medium', serving: 1 },
};

// Realistic nutrition data per 100g
const nutritionData: Record<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number }> = {
  // Proteins
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  'ground beef': { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
  'beef': { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
  'salmon': { calories: 208, protein: 25, carbs: 0, fat: 12, fiber: 0 },
  'fish': { calories: 200, protein: 24, carbs: 0, fat: 10, fiber: 0 },
  'eggs': { calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0 },
  'egg': { calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0 },
  
  // Dairy
  'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0 },
  'cheese': { calories: 113, protein: 7, carbs: 1, fat: 9, fiber: 0 },
  'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0 },
  'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 },
  
  // Vegetables
  'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  'garlic': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2 },
  'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  'bell pepper': { calories: 31, protein: 1, carbs: 7, fat: 0.3, fiber: 2.5 },
  
  // Grains and starches
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
  'quinoa': { calories: 120, protein: 4.4, carbs: 22, fat: 1.9, fiber: 2.8 },
  
  // Beans
  'black beans': { calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7 },
  'chickpeas': { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 8 },
  'lentils': { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  
  // Fats
  'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  'oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
};

// Common measurement conversions to grams
const measurementToGrams: Record<string, number> = {
  'cup': 240, // varies by ingredient, this is for liquids
  'tbsp': 15,
  'tsp': 5,
  'oz': 28.35,
  'lb': 453.6,
  'gram': 1,
  'kg': 1000,
  'ml': 1,
  'liter': 1000,
  'slice': 25, // average bread slice
  'medium': 150, // average medium vegetable/fruit
  'large': 200,
  'small': 100,
  'clove': 3, // garlic clove
  'whole': 150, // average whole item
  'each': 50, // average single item
  'piece': 50,
  'can': 400, // standard can
  'bottle': 250,
  'bunch': 100,
};

// Ingredient-specific weight adjustments
const ingredientWeights: Record<string, Record<string, number>> = {
  'flour': { 'cup': 125 },
  'sugar': { 'cup': 200, 'tbsp': 12 },
  'rice': { 'cup': 185 }, // cooked rice
  'pasta': { 'cup': 140 }, // cooked pasta
  'cheese': { 'cup': 110 }, // grated
  'onion': { 'medium': 110, 'large': 150, 'small': 70 },
  'potato': { 'medium': 150, 'large': 200, 'small': 100 },
  'chicken': { 'lb': 453, 'oz': 28 }, // raw weight
  'beef': { 'lb': 453, 'oz': 28 },
};

export function estimateRealisticPrice(ingredientName: string, amount: number, unit: string): number {
  const name = ingredientName.toLowerCase().trim();
  
  // Find matching ingredient by checking if name contains key
  let matchedIngredient: string | null = null;
  let bestMatchLength = 0;
  
  for (const key of Object.keys(ingredientPrices)) {
    if (name.includes(key) && key.length > bestMatchLength) {
      matchedIngredient = key;
      bestMatchLength = key.length;
    }
  }
  
  if (!matchedIngredient) {
    // Default pricing for unknown ingredients
    return Math.max(0.50, amount * 0.25); // minimum 50 cents, or 25 cents per unit
  }
  
  const priceData = ingredientPrices[matchedIngredient];
  
  // Convert to standard pricing unit
  let adjustedAmount = amount;
  
  // Handle unit conversions
  if (unit.toLowerCase() !== priceData.unit.toLowerCase()) {
    adjustedAmount = convertUnits(amount, unit, priceData.unit, matchedIngredient);
  }
  
  // Calculate price based on actual usage
  const totalPrice = (adjustedAmount / priceData.serving) * priceData.price;
  
  // Round to reasonable cents
  return Math.round(totalPrice * 100) / 100;
}

export function estimateRealisticNutrition(ingredients: Ingredient[], servings: number): NutritionInfo {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  
  for (const ingredient of ingredients) {
    const name = ingredient.name.toLowerCase().trim();
    
    // Find matching nutrition data
    let matchedNutrition: string | null = null;
    let bestMatchLength = 0;
    
    for (const key of Object.keys(nutritionData)) {
      if (name.includes(key) && key.length > bestMatchLength) {
        matchedNutrition = key;
        bestMatchLength = key.length;
      }
    }
    
    if (!matchedNutrition) {
      // Default for unknown ingredients (assume vegetable-like)
      const defaultGrams = convertToGrams(ingredient.amount, ingredient.unit, name);
      totalCalories += defaultGrams * 0.3; // 30 cal per 100g
      totalProtein += defaultGrams * 0.02; // 2g protein per 100g
      totalCarbs += defaultGrams * 0.07; // 7g carbs per 100g
      totalFat += defaultGrams * 0.002; // 0.2g fat per 100g
      totalFiber += defaultGrams * 0.02; // 2g fiber per 100g
      continue;
    }
    
    const nutrition = nutritionData[matchedNutrition];
    const weightInGrams = convertToGrams(ingredient.amount, ingredient.unit, name);
    const factor = weightInGrams / 100; // nutrition data is per 100g
    
    totalCalories += nutrition.calories * factor;
    totalProtein += nutrition.protein * factor;
    totalCarbs += nutrition.carbs * factor;
    totalFat += nutrition.fat * factor;
    totalFiber += nutrition.fiber * factor;
  }
  
  // Return per serving
  return {
    calories: Math.round(totalCalories / servings),
    protein: Math.round(totalProtein / servings),
    carbs: Math.round(totalCarbs / servings),
    fat: Math.round(totalFat / servings),
    fiber: Math.round(totalFiber / servings)
  };
}

function convertToGrams(amount: number, unit: string, ingredientName: string): number {
  const unitLower = unit.toLowerCase();
  
  // Check for ingredient-specific weights first
  if (ingredientWeights[ingredientName] && ingredientWeights[ingredientName][unitLower]) {
    return amount * ingredientWeights[ingredientName][unitLower];
  }
  
  // Use general conversion
  const conversionFactor = measurementToGrams[unitLower];
  if (conversionFactor) {
    return amount * conversionFactor;
  }
  
  // Default fallback
  return amount * 50; // assume 50g per unit
}

function convertUnits(amount: number, fromUnit: string, toUnit: string, ingredientName: string): number {
  // This is a simplified conversion - in practice you'd need more complex logic
  const fromGrams = convertToGrams(amount, fromUnit, ingredientName);
  const toGrams = convertToGrams(1, toUnit, ingredientName);
  
  return fromGrams / toGrams;
}

// Helper function to update existing recipes with realistic estimates
export function updateRecipeEstimates(recipe: any): any {
  const updatedIngredients = recipe.ingredients.map((ingredient: Ingredient) => ({
    ...ingredient,
    estimatedPrice: estimateRealisticPrice(ingredient.name, ingredient.amount, ingredient.unit)
  }));
  
  const totalCost = updatedIngredients.reduce((sum: number, ing: Ingredient) => 
    sum + (ing.estimatedPrice || 0), 0
  );
  
  const realisticNutrition = estimateRealisticNutrition(updatedIngredients, recipe.servings);
  
  return {
    ...recipe,
    ingredients: updatedIngredients,
    nutrition: realisticNutrition,
    costPerServing: Math.round((totalCost / recipe.servings) * 100) / 100,
    estimatedCost: Math.round(totalCost * 100) / 100
  };
}