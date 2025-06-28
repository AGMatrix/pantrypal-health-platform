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
  console.log('🔍 Parsing AI response:', aiResponse.substring(0, 300) + '...');
  
  try {
    const recipes: Recipe[] = [];
    
    // Enhanced recipe splitting with multiple strategies
    const recipeBlocks = splitIntoRecipeBlocks(aiResponse);
    console.log(`📦 Found ${recipeBlocks.length} potential recipe blocks`);
    
    recipeBlocks.forEach((block, index) => {
      try {
        console.log(`🔍 Parsing block ${index + 1}:`, block.substring(0, 100) + '...');
        const parsedData = parseRecipeBlock(block);
        
        if (parsedData && parsedData.title && parsedData.ingredients.length > 0) {
          const recipe = convertToRecipeObject(parsedData, index);
          recipes.push(recipe);
          console.log(`✅ Successfully parsed recipe: "${recipe.title}"`);
        } else {
          console.warn(`⚠️ Block ${index + 1} failed validation:`, {
            hasTitle: !!parsedData?.title,
            ingredientCount: parsedData?.ingredients?.length || 0,
            instructionCount: parsedData?.instructions?.length || 0
          });
        }
      } catch (error) {
        console.warn(`❌ Failed to parse recipe block ${index + 1}:`, error);
      }
    });
    
    console.log(`✅ Successfully parsed ${recipes.length} total recipes with realistic pricing`);
    return recipes;
    
  } catch (error) {
    console.error('❌ Failed to parse recipe response:', error);
    return [];
  }
}

function splitIntoRecipeBlocks(response: string): string[] {
  console.log('🔍 Splitting response into recipe blocks...');
  
  // Enhanced recipe separators
  const separators = [
    /\*\*Recipe \d+:/gi,
    /Recipe \d+:/gi,
    /\*\*\d+\.\s*[^*\n]+\*\*/gi,
    /#{1,3}\s*Recipe/gi,
    /#{1,3}\s*\d+\./gi,
    /\n\s*\d+\.\s*[A-Z][^.\n]{10,}/g, // "1. Recipe Name" format
    /\n\s*[A-Z][^.\n]{15,}:\s*\n/g  // "Recipe Name:" format
  ];
  
  let blocks: string[] = [];
  
  // Try different splitting patterns
  for (const separator of separators) {
    const matches = Array.from(response.matchAll(separator));
    if (matches.length > 0) {
      console.log(`📍 Found ${matches.length} matches with separator:`, separator);
      
      blocks = [];
      let lastIndex = 0;
      
      matches.forEach((match, i) => {
        if (i > 0) {
          // Extract the block between previous match and current match
          const blockStart = lastIndex;
          const blockEnd = match.index || response.length;
          const block = response.substring(blockStart, blockEnd).trim();
          if (block.length > 50) {
            blocks.push(block);
          }
        }
        lastIndex = match.index || 0;
      });
      
      // Add the last block
      const lastBlock = response.substring(lastIndex).trim();
      if (lastBlock.length > 50) {
        blocks.push(lastBlock);
      }
      
      if (blocks.length > 1) break; // Found a good splitting pattern
    }
  }
  
  // Fallback strategies
  if (blocks.length <= 1) {
    console.log('🔄 Using fallback splitting strategies...');
    
    // Try splitting by double newlines with recipe keywords
    const paragraphs = response.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    const recipeKeywords = ['ingredient', 'instruction', 'cook', 'recipe', 'serve'];
    
    blocks = paragraphs.filter(paragraph => {
      const lower = paragraph.toLowerCase();
      return recipeKeywords.some(keyword => lower.includes(keyword)) &&
             (lower.includes('cup') || lower.includes('tbsp') || lower.includes('tsp') || lower.includes('lb'));
    });
    
    console.log(`📦 Fallback found ${blocks.length} potential recipe blocks`);
  }
  
  // If still no blocks, try to treat the entire response as one recipe
  if (blocks.length === 0) {
    console.log('🔄 Treating entire response as single recipe');
    blocks = [response];
  }
  
  return blocks.filter(block => block.trim().length > 0);
}

function parseRecipeBlock(block: string): ParsedRecipeData | null {
  console.log('🔍 Parsing individual recipe block...');
  
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
    
    // Extract title (more flexible patterns)
    if (!data.title) {
      if (line.includes('**') || line.includes('#') || i === 0 || 
          /^[A-Z][^.]{10,}$/.test(line) || 
          /recipe \d+:/i.test(line)) {
        data.title = extractTitle(line);
        if (data.title) {
          console.log(`📝 Found title: "${data.title}"`);
          continue;
        }
      }
    }
    
    // Enhanced section detection
    if (lowerLine.includes('ingredient') || lowerLine.includes('what you need') || lowerLine.includes('you\'ll need')) {
      currentSection = 'ingredients';
      console.log('🥕 Switched to ingredients section');
      continue;
    } else if (lowerLine.includes('instruction') || lowerLine.includes('directions') || 
               lowerLine.includes('steps') || lowerLine.includes('method') || 
               lowerLine.includes('how to make') || lowerLine.includes('preparation')) {
      currentSection = 'instructions';
      instructionCounter = 0;
      console.log('👨‍🍳 Switched to instructions section');
      continue;
    } else if (lowerLine.includes('cooking time') || lowerLine.includes('prep time') || 
               lowerLine.includes('total time')) {
      data.cookingTime = extractTime(line);
      console.log(`⏱️ Found cooking time: ${data.cookingTime} minutes`);
      continue;
    } else if (lowerLine.includes('serving') || lowerLine.includes('yield') || lowerLine.includes('makes')) {
      data.servings = extractServings(line);
      console.log(`🍽️ Found servings: ${data.servings}`);
      continue;
    } else if (lowerLine.includes('difficulty') || lowerLine.includes('skill level')) {
      data.difficulty = extractDifficulty(line);
      console.log(`📊 Found difficulty: ${data.difficulty}`);
      continue;
    } else if (lowerLine.includes('cuisine') || lowerLine.includes('style')) {
      data.cuisine = extractCuisine(line);
      console.log(`🌍 Found cuisine: ${data.cuisine}`);
      continue;
    } else if (lowerLine.includes('description') || (i === 1 && data.title && line.length > 20 && line.length < 200)) {
      data.description = extractDescription(line);
      console.log(`📖 Found description: ${data.description?.substring(0, 50)}...`);
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
  
  // Extract additional metadata from the entire block
  if (!data.cuisine) {
    data.cuisine = extractCuisine(block);
  }
  data.dietary = extractDietary(block);
  
  // Validation
  const isValid = data.title && data.ingredients.length > 0;
  console.log(`✅ Recipe validation:`, {
    title: data.title,
    ingredients: data.ingredients.length,
    instructions: data.instructions.length,
    valid: isValid
  });
  
  return isValid ? data : null;
}

function extractTitle(line: string): string {
  // Remove markdown formatting and numbering
  let title = line
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^#+\s*/, '')
    .replace(/^Recipe \d+:\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^-\s*/, '')
    .trim();
  
  // If title has a colon, take the part after it
  if (title.includes(':')) {
    const parts = title.split(':');
    if (parts.length > 1 && parts[1].trim().length > 0) {
      title = parts[1].trim();
    }
  }
  
  return title;
}

function extractTime(line: string): number | undefined {
  const timePatterns = [
    /(\d+)\s*(minute|min|hour|hr)s?/i,
    /(\d+)\s*-\s*(\d+)\s*(minute|min|hour|hr)s?/i,
    /prep:\s*(\d+)\s*(minute|min|hour|hr)s?/i,
    /cook:\s*(\d+)\s*(minute|min|hour|hr)s?/i,
    /total:\s*(\d+)\s*(minute|min|hour|hr)s?/i
  ];
  
  for (const pattern of timePatterns) {
    const match = line.match(pattern);
    if (match) {
      const time = parseInt(match[1]);
      const unit = match[2] || match[4];
      if (unit && unit.toLowerCase().includes('hour')) {
        return time * 60;
      }
      return time;
    }
  }
  return undefined;
}

function extractServings(line: string): number | undefined {
  const servingPatterns = [
    /(\d+)\s*(serving|portion|people|person)/i,
    /serves?\s*(\d+)/i,
    /makes?\s*(\d+)/i,
    /yield:?\s*(\d+)/i
  ];
  
  for (const pattern of servingPatterns) {
    const match = line.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  return undefined;
}

function extractDifficulty(line: string): 'Easy' | 'Medium' | 'Hard' | undefined {
  const lowerLine = line.toLowerCase();
  if (lowerLine.includes('easy') || lowerLine.includes('simple') || lowerLine.includes('beginner')) return 'Easy';
  if (lowerLine.includes('medium') || lowerLine.includes('intermediate') || lowerLine.includes('moderate')) return 'Medium';
  if (lowerLine.includes('hard') || lowerLine.includes('difficult') || lowerLine.includes('advanced') || lowerLine.includes('expert')) return 'Hard';
  return undefined;
}

function extractCuisine(text: string): string | undefined {
  const cuisines = ['italian', 'mexican', 'asian', 'chinese', 'indian', 'mediterranean', 'french', 'thai', 'american', 'japanese', 'korean', 'middle eastern', 'greek'];
  const lowerText = text.toLowerCase();
  
  const found = cuisines.find(cuisine => lowerText.includes(cuisine));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : undefined;
}

function extractDietary(block: string): string[] {
  const dietary = [];
  const lowerBlock = block.toLowerCase();
  
  if (lowerBlock.includes('vegetarian')) dietary.push('vegetarian');
  if (lowerBlock.includes('vegan')) dietary.push('vegan');
  if (lowerBlock.includes('gluten-free') || lowerBlock.includes('gluten free')) dietary.push('gluten-free');
  if (lowerBlock.includes('dairy-free') || lowerBlock.includes('dairy free')) dietary.push('dairy-free');
  if (lowerBlock.includes('low-carb') || lowerBlock.includes('low carb') || lowerBlock.includes('keto')) dietary.push('low-carb');
  if (lowerBlock.includes('high-protein') || lowerBlock.includes('high protein')) dietary.push('high-protein');
  if (lowerBlock.includes('healthy') || lowerBlock.includes('nutritious')) dietary.push('healthy');
  
  return dietary;
}

function extractDescription(text: string): string | undefined {
  // Clean up the description text
  let description = text
    .replace(/^\*\*Description:\*\*\s*/i, '')
    .replace(/^Description:\s*/i, '')
    .replace(/^-\s*/, '')
    .trim();
  
  if (description.length > 10 && description.length < 300) {
    return description;
  }
  return undefined;
}

function isIngredientLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  
  // Enhanced ingredient patterns
  const ingredientPatterns = [
    /^\d+\s*(cup|tbsp|tsp|lb|oz|gram|kg|piece|clove|inch|slice|can|bottle)/i,
    /^[-*•]\s*\d/,
    /^[-*•]\s*[a-zA-Z]/,
    /\d+\s*(cup|tbsp|tsp|lb|oz|gram|kg|piece|clove|slice|can|bottle)/i,
    /^(a|an|one|two|three|four|five)\s+(cup|tbsp|tsp|lb|oz|piece|clove)/i,
    /^\d+\/\d+\s*(cup|tbsp|tsp)/i,
    /^(½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞)\s*(cup|tbsp|tsp)/i
  ];
  
  return ingredientPatterns.some(pattern => pattern.test(trimmed));
}

function isInstructionLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 5) return false;
  
  // Enhanced instruction patterns
  const instructionPatterns = [
    /^\d+\.\s*/,
    /^[-*•]\s*/,
    /^(heat|cook|add|mix|stir|combine|place|cut|chop|dice|slice|sauté|simmer|boil|bake|fry|grill|roast|season|serve|garnish|remove|drain|whisk|blend|fold|pour)/i,
    /^(in a|using a|with a|on a|over|under|until|when|while|after|before)/i
  ];
  
  return instructionPatterns.some(pattern => pattern.test(trimmed)) ||
         (trimmed.includes('.') && trimmed.length > 15);
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
  
  // Add period if missing
  if (cleaned.length > 0 && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.';
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
    description: data.description || `A delicious ${data.cuisine || 'homestyle'} recipe with great flavors`,
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
    /^(a\s+pinch|pinch|a\s+dash|dash|a\s+handful|handful|\d+\/\d+)\s+(?:of\s+)?(.+)/i,
    // "½ cup flour" - Unicode fractions
    /^(½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞)\s*(cup|tbsp|tsp|lb|oz)s?\s+(.+)/i
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
      } else if (amountStr === '½') {
        amount = 0.5;
      } else if (amountStr === '¼') {
        amount = 0.25;
      } else if (amountStr === '¾') {
        amount = 0.75;
      } else if (amountStr === '⅓') {
        amount = 0.33;
      } else if (amountStr === '⅔') {
        amount = 0.67;
      } else if (amountStr === '⅛') {
        amount = 0.125;
      } else if (amountStr === '⅜') {
        amount = 0.375;
      } else if (amountStr === '⅝') {
        amount = 0.625;
      } else if (amountStr === '⅞') {
        amount = 0.875;
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