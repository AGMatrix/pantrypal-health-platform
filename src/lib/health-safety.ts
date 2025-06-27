import { Recipe } from '@/types/recipe';

export async function checkRecipeRareConditionSafety(recipe: Recipe, userId: string) {
    try {
      const response = await fetch('/api/health/check-rare-condition-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeIngredients: recipe.ingredients,
          userId
        })
      });
      
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      console.error('Rare condition safety check failed:', error);
      return null;
    }
  }