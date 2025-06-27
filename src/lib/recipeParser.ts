// src/lib/recipeParser.ts

import { Recipe, Ingredient, NutritionInfo } from '@/types/recipe';
import { estimateRealisticPrice, estimateRealisticNutrition } from './realisticEstimator';

export interface ParsedRecipeData {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  cookingTime?: number;
  servings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  cuisine?: string;
  dietary?: string[];
}

// High-quality food images from Unsplash with proper parameters
const qualityImageUrls = [
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80', // Stir fry
  'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80', // Pasta
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&auto=format&q=80', // Rice bowl
  'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=400&h=300&fit=crop&auto=format&q=80', // Salmon
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format&q=80', // Mediterranean bowl
  'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&h=300&fit=crop&auto=format&q=80', // Pancakes
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&auto=format&q=80', // Soup
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&auto=format&q=80', // Indian curry
  'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400&h=300&fit=crop&auto=format&q=80', // Thai food
  'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=300&fit=crop&auto=format&q=80', // Chinese food
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&auto=format&q=80', // Japanese food
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format&q=80', // Generic food
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format&q=80', // Pizza
  'https://images.unsplash.com/photo-1572441713132-6cf4c02cc05d?w=400&h=300&fit=crop&auto=format&q=80', // Salad
  'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format&q=80', // Tacos
];

// Cuisine-specific image mapping
const cuisineImageMap: Record<string, string> = {
  'italian': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80',
  'asian': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80',
  'chinese': 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=300&fit=crop&auto=format&q=80',
  'japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&auto=format&q=80',
  'thai': 'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400&h=300&fit=crop&auto=format&q=80',
  'indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&auto=format&q=80',
  'mexican': 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format&q=80',
  'mediterranean': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format&q=80',
  'american': 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=400&h=300&fit=crop&auto=format&q=80',
  'french': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&auto=format&q=80'
};

// Dish-specific image mapping
const dishImageMap: Record<string, string> = {
  'pasta': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80',
  'spaghetti': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80',
  'stir fry': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80',
  'salmon': 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=400&h=300&fit=crop&auto=format&q=80',
  'fish': 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=400&h=300&fit=crop&auto=format&q=80',
  'chicken': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80',
  'rice': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&auto=format&q=80',
  'bowl': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format&q=80',
  'pancake': 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&h=300&fit=crop&auto=format&q=80',
  'soup': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&auto=format&q=80',
  'salad': 'https://images.unsplash.com/photo-1572441713132-6cf4c02cc05d?w=400&h=300&fit=crop&auto=format&q=80',
  'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format&q=80',
  'taco': 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format&q=80',
  'burger': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop&auto=format&q=80',
  'curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&auto=format&q=80'
};

export function parseRecipeResponse(aiResponse: string): Recipe[] {
  console.log('🔍 Parsing AI response:', aiResponse.substring(0, 200) + '...');
  
  try {
    const recipes: Recipe[] = [];
    
    // Split response into individual recipes
    const recipeBlocks = splitIntoRecipeBlocks(aiResponse);
    
    recipeBlocks.forEach((block, index) => {
      try {
        const parsedData = parseRecipeBlock(block);
        if (parsedData && parsedData.title && parsedData.ingredients.length > 0) {
          const recipe = convertToRecipeObject(parsedData, index);
          recipes.push(recipe);
        }
      } catch (error) {
        console.warn(`Failed to parse recipe block ${index}:`, error);
      }
    });
    
    console.log('✅ Successfully parsed', recipes.length, 'recipes with realistic pricing');
    return recipes;
    
  } catch (error) {
    console.error('❌ Failed to parse recipe response:', error);
    return [];
  }
}

function splitIntoRecipeBlocks(response: string): string[] {
  // Split by common recipe separators
  const separators = [
    /\*\*Recipe \d+:/gi,
    /Recipe \d+:/gi,
    /\d+\.\s*\*\*[^*]+\*\*/gi,
    /#{1,3}\s*Recipe/gi,
    /#{1,3}\s*\d+\./gi
  ];
  
  let blocks: string[] = [];
  
  // Try different splitting patterns
  for (const separator of separators) {
    const splits = response.split(separator);
    if (splits.length > 1) {
      // Remove empty first element and add back separators
      blocks = splits.slice(1).map((block, index) => {
        const match = response.match(separator);
        const prefix = match ? match[index] || '' : '';
        return prefix + block;
      });
      break;
    }
  }
  
  // Fallback: split by double newlines if no clear separators
  if (blocks.length === 0) {
    blocks = response.split(/\n\s*\n/).filter(block => 
      block.trim().length > 50 && 
      (block.includes('ingredient') || block.includes('recipe') || block.includes('cook'))
    );
  }
  
  return blocks.filter(block => block.trim().length > 0);
}

function parseRecipeBlock(block: string): ParsedRecipeData | null {
  const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const data: ParsedRecipeData = {
    title: '',
    ingredients: [],
    instructions: [],
    dietary: []
  };
  
  let currentSection = 'title';
  let instructionCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Extract title
    if (!data.title && (line.includes('**') || line.includes('#') || i === 0)) {
      data.title = extractTitle(line);
      continue;
    }
    
    // Detect sections
    if (lowerLine.includes('ingredient')) {
      currentSection = 'ingredients';
      continue;
    } else if (lowerLine.includes('instruction') || lowerLine.includes('directions') || lowerLine.includes('steps')) {
      currentSection = 'instructions';
      instructionCounter = 0;
      continue;
    } else if (lowerLine.includes('cooking time') || lowerLine.includes('prep time')) {
      data.cookingTime = extractTime(line);
      continue;
    } else if (lowerLine.includes('serving')) {
      data.servings = extractServings(line);
      continue;
    } else if (lowerLine.includes('difficulty')) {
      data.difficulty = extractDifficulty(line);
      continue;
    }
    
    // Parse content based on current section
    if (currentSection === 'ingredients' && isIngredientLine(line)) {
      const ingredient = cleanIngredientLine(line);
      if (ingredient) {
        data.ingredients.push(ingredient);
      }
    } else if (currentSection === 'instructions' && isInstructionLine(line)) {
      const instruction = cleanInstructionLine(line, ++instructionCounter);
      if (instruction) {
        data.instructions.push(instruction);
      }
    }
  }
  
  // Extract additional metadata
  data.cuisine = extractCuisine(block);
  data.dietary = extractDietary(block);
  data.description = extractDescription(block);
  
  return data.title && data.ingredients.length > 0 ? data : null;
}

function extractTitle(line: string): string {
  // Remove markdown formatting and numbering
  return line
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^#+\s*/, '')
    .replace(/^Recipe \d+:\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .trim();
}

function extractTime(line: string): number | undefined {
  const timeMatch = line.match(/(\d+)\s*(minute|min|hour|hr)/i);
  if (timeMatch) {
    const time = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    return unit.includes('hour') ? time * 60 : time;
  }
  return undefined;
}

function extractServings(line: string): number | undefined {
  const servingMatch = line.match(/(\d+)\s*(serving|portion)/i);
  return servingMatch ? parseInt(servingMatch[1]) : undefined;
}

function extractDifficulty(line: string): 'Easy' | 'Medium' | 'Hard' | undefined {
  const lowerLine = line.toLowerCase();
  if (lowerLine.includes('easy') || lowerLine.includes('simple')) return 'Easy';
  if (lowerLine.includes('medium') || lowerLine.includes('intermediate')) return 'Medium';
  if (lowerLine.includes('hard') || lowerLine.includes('difficult') || lowerLine.includes('advanced')) return 'Hard';
  return undefined;
}

function extractCuisine(block: string): string | undefined {
  const cuisines = ['italian', 'mexican', 'asian', 'chinese', 'indian', 'mediterranean', 'french', 'thai', 'american', 'japanese'];
  const lowerBlock = block.toLowerCase();
  
  return cuisines.find(cuisine => lowerBlock.includes(cuisine));
}

function extractDietary(block: string): string[] {
  const dietary = [];
  const lowerBlock = block.toLowerCase();
  
  if (lowerBlock.includes('vegetarian')) dietary.push('vegetarian');
  if (lowerBlock.includes('vegan')) dietary.push('vegan');
  if (lowerBlock.includes('gluten-free') || lowerBlock.includes('gluten free')) dietary.push('gluten-free');
  if (lowerBlock.includes('dairy-free') || lowerBlock.includes('dairy free')) dietary.push('dairy-free');
  if (lowerBlock.includes('low-carb') || lowerBlock.includes('low carb')) dietary.push('low-carb');
  if (lowerBlock.includes('high-protein') || lowerBlock.includes('high protein')) dietary.push('high-protein');
  
  return dietary;
}

function extractDescription(block: string): string | undefined {
  // Look for description-like sentences
  const lines = block.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 20 && 
        trimmed.length < 200 && 
        !trimmed.includes(':') && 
        !isIngredientLine(trimmed) && 
        !isInstructionLine(trimmed) &&
        (trimmed.includes('delicious') || trimmed.includes('perfect') || trimmed.includes('recipe'))) {
      return trimmed.replace(/^[-*]\s*/, '');
    }
  }
  return undefined;
}

function isIngredientLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  
  // Check for ingredient patterns
  const ingredientPatterns = [
    /^\d+\s*(cup|tbsp|tsp|lb|oz|gram|kg|piece|clove|inch)/i,
    /^[-*•]\s*\d/,
    /^[-*•]\s*[a-zA-Z]/,
    /\d+\s*(cup|tbsp|tsp|lb|oz|gram|kg|piece|clove)/i
  ];
  
  return ingredientPatterns.some(pattern => pattern.test(trimmed));
}

function isInstructionLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 5) return false;
  
  // Check for instruction patterns
  const instructionPatterns = [
    /^\d+\.\s*/,
    /^[-*•]\s*/,
    /^(heat|cook|add|mix|stir|combine|place|cut|chop)/i
  ];
  
  return instructionPatterns.some(pattern => pattern.test(trimmed)) ||
         (trimmed.includes('.') && trimmed.length > 10);
}

function cleanIngredientLine(line: string): string | null {
  const cleaned = line
    .replace(/^[-*•]\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .trim();
  
  return cleaned.length > 2 ? cleaned : null;
}

function cleanInstructionLine(line: string, stepNumber: number): string | null {
  let cleaned = line
    .replace(/^[-*•]\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .trim();
  
  // Ensure instruction starts with capital letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned.length > 3 ? cleaned : null;
}

function convertToRecipeObject(data: ParsedRecipeData, index: number): Recipe {
  // Parse ingredients into structured format with realistic pricing
  const ingredients: Ingredient[] = data.ingredients.map((ingredientText, i) => {
    const parsed = parseIngredientText(ingredientText);
    return {
      name: parsed.name,
      amount: parsed.amount,
      unit: parsed.unit,
      // Only add estimatedPrice if the function exists and returns a valid price
      ...(typeof estimateRealisticPrice === 'function' && {
        estimatedPrice: estimateRealisticPrice(parsed.name, parsed.amount, parsed.unit) || 0
      })
    };
  });
  
  // Use realistic nutrition estimation or provide defaults
  const nutrition: NutritionInfo = typeof estimateRealisticNutrition === 'function' 
    ? estimateRealisticNutrition(ingredients, data.servings || 4)
    : {
        calories: 300,
        protein: 15,
        carbs: 35,
        fat: 12,
        fiber: 5
      };
  
  // Calculate realistic total cost
  const totalCost = ingredients.reduce((sum, ing) => sum + ((ing as any).estimatedPrice || 0), 0);
  
  // Safe cuisine handling with proper type assertion
  const cuisineCapitalized = data.cuisine 
    ? (data.cuisine.charAt(0).toUpperCase() + data.cuisine.slice(1)) 
    : 'Other';
  
  const recipe: Recipe = {
    id: `ai-recipe-${Date.now()}-${index}`,
    title: data.title,
    description: data.description || `A delicious ${cuisineCapitalized.toLowerCase()} recipe`,
    ingredients,
    instructions: data.instructions,
    cookingTime: data.cookingTime || 30,
    servings: data.servings || 4,
    difficulty: data.difficulty || 'Medium',
    cuisine: cuisineCapitalized as Recipe['cuisine'],
    dietary: (data.dietary || []) as Recipe['dietary'],
    nutrition,
    image: generateRecipeImage(data.title, data.cuisine),
    rating: 4.0 + Math.random() * 1.0, // Random rating between 4-5
    // Add additional properties that might be expected
    ...(totalCost > 0 && {
      costPerServing: Math.round((totalCost / (data.servings || 4)) * 100) / 100,
      estimatedCost: Math.round(totalCost * 100) / 100
    }),
    // Add reviews if expected
    ...(Math.random() > 0.5 && {
      reviews: Math.floor(Math.random() * 200) + 50
    })
  };
  
  console.log(`💰 Recipe "${recipe.title}": ${(recipe as any).costPerServing || 'N/A'}/serving, ${recipe.nutrition.calories} cal/serving`);
  
  return recipe;
}

function parseIngredientText(text: string): { name: string; amount: number; unit: string } {
  // Enhanced ingredient parsing with better unit recognition
  const patterns = [
    // "2 cups flour" or "1.5 tbsp olive oil"
    /^(\d+(?:\.\d+)?(?:\/\d+)?)\s+(cups?|tbsp|tsp|tablespoons?|teaspoons?|pounds?|lbs?|ounces?|oz|grams?|g|kilograms?|kg|pieces?|cloves?|slices?|cans?|bottles?)\s+(.+)/i,
    // "2 medium onions" or "3 large eggs"
    /^(\d+(?:\.\d+)?)\s+(small|medium|large|whole|each)\s+(.+)/i,
    // "1/2 of an onion" or "a pinch of salt"
    /^(a\s+pinch|pinch|a\s+dash|dash|a\s+handful|handful|\d+\/\d+)\s+(?:of\s+)?(.+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let [, amountStr, unit, name] = match;
      
      // Handle fractions and special amounts
      let amount = 1;
      if (amountStr.includes('/')) {
        const [num, denom] = amountStr.split('/');
        amount = parseInt(num) / parseInt(denom);
      } else if (amountStr.includes('pinch') || amountStr.includes('dash')) {
        amount = 0.125; // 1/8 tsp
        unit = 'tsp';
      } else if (amountStr.includes('handful')) {
        amount = 0.5;
        unit = 'cup';
      } else {
        amount = parseFloat(amountStr) || 1;
      }
      
      // Normalize units
      unit = normalizeUnit(unit);
      name = name.trim().replace(/^(of\s+)?/, '');
      
      return { amount, unit, name };
    }
  }
  
  // Fallback for unparseable ingredients
  return {
    amount: 1,
    unit: 'item',
    name: text.replace(/^(a|an|some)\s+/i, '').trim()
  };
}

function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'cups': 'cup', 'cup': 'cup',
    'tablespoons': 'tbsp', 'tablespoon': 'tbsp', 'tbsp': 'tbsp',
    'teaspoons': 'tsp', 'teaspoon': 'tsp', 'tsp': 'tsp',
    'pounds': 'lb', 'pound': 'lb', 'lbs': 'lb', 'lb': 'lb',
    'ounces': 'oz', 'ounce': 'oz', 'oz': 'oz',
    'grams': 'g', 'gram': 'g', 'g': 'g',
    'kilograms': 'kg', 'kilogram': 'kg', 'kg': 'kg',
    'pieces': 'piece', 'piece': 'piece',
    'cloves': 'clove', 'clove': 'clove',
    'slices': 'slice', 'slice': 'slice',
    'cans': 'can', 'can': 'can',
    'bottles': 'bottle', 'bottle': 'bottle',
    'small': 'small', 'medium': 'medium', 'large': 'large',
    'whole': 'whole', 'each': 'each'
  };
  
  return unitMap[unit.toLowerCase()] || unit.toLowerCase();
}

function generateRecipeImage(title: string, cuisine?: string): string {
  const titleLower = title.toLowerCase();
  
  // First try to match by dish type
  for (const [dishType, imageUrl] of Object.entries(dishImageMap)) {
    if (titleLower.includes(dishType)) {
      console.log('🖼️ Found dish-specific image for:', dishType);
      return imageUrl;
    }
  }
  
  // Then try to match by cuisine
  if (cuisine) {
    const cuisineLower = cuisine.toLowerCase();
    const cuisineImage = cuisineImageMap[cuisineLower];
    if (cuisineImage) {
      console.log('🖼️ Found cuisine-specific image for:', cuisine);
      return cuisineImage;
    }
  }
  
  // Fallback to a random quality image
  const randomIndex = Math.floor(Math.random() * qualityImageUrls.length);
  const selectedImage = qualityImageUrls[randomIndex];
  console.log('🖼️ Using random quality image:', selectedImage);
  
  return selectedImage;
}