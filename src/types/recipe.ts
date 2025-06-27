// src/types/recipe.ts

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  optional?: boolean;
  estimatedPrice?: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
}

export interface Nutrition extends NutritionInfo {}

export type CuisineType = 
  | 'Italian' 
  | 'Mexican' 
  | 'Asian' 
  | 'Indian' 
  | 'American' 
  | 'Mediterranean' 
  | 'French' 
  | 'Thai' 
  | 'Chinese' 
  | 'Japanese'
  | 'Other';

export type DietaryRestriction = 
  | 'vegetarian' 
  | 'vegan' 
  | 'gluten-free' 
  | 'dairy-free' 
  | 'nut-free' 
  | 'low-carb' 
  | 'keto'
  | 'high-protein'
  | 'healthy';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  cookingTime: number; // in minutes
  servings: number;
  difficulty: DifficultyLevel;
  cuisine: CuisineType;
  dietary: DietaryRestriction[];
  nutrition: NutritionInfo;
  costPerServing?: number;
  estimatedCost?: number;
  image?: string;
  rating?: number;
  reviews?: number;
  createdAt?: Date;
  author?: string;
  tags?: string[];
}

export interface SearchFilters {
  cuisine?: CuisineType;
  dietary: DietaryRestriction[];
  maxCookingTime?: number;
  difficulty?: DifficultyLevel;
  maxCost?: number;
  servings?: number;
  ingredients?: string[];
}

export interface UserPreferences {
  favoriteRecipes: string[];
  allergies: string[];
  preferredCuisines: CuisineType[];
  budgetRange: {
    min: number;
    max: number;
  };
  householdSize: number;
  cookingSkillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface SearchResult {
  recipes: Recipe[];
  totalCount: number;
  searchTime: number;
  suggestions?: string[];
}

export interface SearchRequest {
  prompt: string;
  filters?: SearchFilters;
  maxResults?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}