// src/lib/recipeTracking.ts
// Utility functions for tracking recipe interactions

export interface RecipeInteraction {
    recipeId: string;
    recipeData: any;
    interactionType: 'viewed' | 'cooked' | 'favorited' | 'added_to_cart';
  }
  
  export async function trackRecipeInteraction(interaction: RecipeInteraction) {
    try {
      const response = await fetch('/api/health/recent-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interaction),
      });
  
      const data = await response.json();
      
      if (data.success) {
        console.log('Recipe interaction tracked:', interaction.interactionType, 'for', interaction.recipeData.title);
        return data.healthMatch;
      }
    } catch (error) {
      console.error('Failed to track recipe interaction:', error);
    }
    
    return null;
  }
  
  export async function checkRecipeHealthMatch(recipe: any) {
    try {
      const healthMatch = await trackRecipeInteraction({
        recipeId: recipe.id,
        recipeData: recipe,
        interactionType: 'viewed'
      });
      
      return healthMatch;
    } catch (error) {
      console.error('Failed to check recipe health match:', error);
      return null;
    }
  }
  
  // Enhanced recipe safety checking for rare conditions
  export async function checkRecipeRareConditionSafety(recipe: any) {
    try {
      const response = await fetch('/api/health/check-rare-condition-safety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeIngredients: recipe.ingredients,
          recipeId: recipe.id
        }),
      });
  
      const data = await response.json();
      
      if (data.success) {
        return {
          isSafe: data.isSafe,
          warnings: data.warnings || [],
          recommendations: data.recommendations || [],
          confidenceLevel: data.confidenceLevel
        };
      }
    } catch (error) {
      console.error('Failed to check recipe safety:', error);
    }
    
    return null;
  }