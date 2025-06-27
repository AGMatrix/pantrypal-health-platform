// src/lib/utils.ts
// Utility functions for the recipe app with rating formatting

export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format rating to show up to 1 decimal place
 * Examples: 4.0 -> "4.0", 4.5 -> "4.5", 4.33 -> "4.3"
 */
export function formatRating(rating: number | undefined): string {
  if (!rating && rating !== 0) return '0.0';
  return rating.toFixed(1);
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'hard':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function generateShoppingList(recipes: any[]): any[] {
  // Simplified shopping list generation
  const allIngredients: any[] = [];
  
  recipes.forEach(recipe => {
    if (recipe.ingredients) {
      recipe.ingredients.forEach((ingredient: any) => {
        allIngredients.push({
          ...ingredient,
          recipeId: recipe.id,
          recipeTitle: recipe.title
        });
      });
    }
  });
  
  return allIngredients;
}

export function isPantryStaple(ingredient: string): boolean {
  const pantryStaples = [
    'salt', 'pepper', 'oil', 'olive oil', 'vegetable oil',
    'flour', 'sugar', 'baking powder', 'baking soda',
    'vanilla extract', 'garlic powder', 'onion powder'
  ];
  
  return pantryStaples.some(staple => 
    ingredient.toLowerCase().includes(staple.toLowerCase())
  );
}

export function estimateGroceryCost(ingredients: any[]): number {
  // Simple cost estimation
  return ingredients.reduce((total, ingredient) => {
    return total + (ingredient.estimatedPrice || 2.99);
  }, 0);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}