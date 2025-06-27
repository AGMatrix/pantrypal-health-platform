import { NextRequest } from 'next/server';

const substitutionDatabase: Record<string, string[]> = {
  'butter': ['margarine', 'coconut oil', 'olive oil', 'vegetable oil', 'applesauce (for baking)'],
  'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk', 'rice milk'],
  'eggs': ['flax eggs (1 tbsp ground flax + 3 tbsp water)', 'applesauce (1/4 cup)', 'mashed banana (1/4 cup)', 'aquafaba (3 tbsp)'],
  'flour': ['almond flour', 'coconut flour', 'oat flour', 'rice flour', 'gluten-free flour blend'],
  'sugar': ['honey (reduce liquid)', 'maple syrup (reduce liquid)', 'stevia', 'agave nectar', 'date paste'],
  'cheese': ['nutritional yeast', 'cashew cream', 'vegan cheese', 'tahini (for nutty flavor)'],
  'chicken': ['tofu', 'tempeh', 'mushrooms (portobello)', 'jackfruit', 'cauliflower'],
  'beef': ['lentils', 'black beans', 'mushrooms', 'beyond meat', 'walnut crumbles'],
  'cream': ['coconut cream', 'cashew cream', 'greek yogurt', 'silken tofu blended'],
  'sour cream': ['greek yogurt', 'cashew cream', 'coconut cream', 'cottage cheese blended'],
  'heavy cream': ['coconut cream', 'cashew cream + water', 'silken tofu + non-dairy milk'],
  'yogurt': ['coconut yogurt', 'cashew yogurt', 'almond yogurt', 'applesauce (in baking)'],
  'parmesan': ['nutritional yeast', 'cashew parmesan', 'pecorino romano', 'aged cheddar'],
  'breadcrumbs': ['crushed crackers', 'ground oats', 'almond flour', 'crushed nuts'],
  'vanilla extract': ['almond extract (use less)', 'vanilla bean paste', 'maple syrup', 'rum extract'],
  'lemon juice': ['lime juice', 'vinegar', 'white wine', 'citric acid solution'],
  'garlic': ['garlic powder (1 clove = 1/8 tsp)', 'shallots', 'onion powder', 'asafoetida (tiny amount)'],
  'onion': ['shallots', 'scallions', 'leeks', 'onion powder', 'celery'],
  'tomatoes': ['tomato paste + water', 'tomato sauce', 'red bell peppers', 'sun-dried tomatoes'],
  'wine': ['grape juice + vinegar', 'broth', 'apple cider vinegar', 'lemon juice + water'],
  'honey': ['maple syrup', 'agave nectar', 'brown rice syrup', 'date syrup'],
  'baking powder': ['baking soda + cream of tartar (1:2 ratio)', 'self-rising flour'],
  'baking soda': ['baking powder (use 3x amount)', 'potash', 'self-rising flour'],
  'cornstarch': ['arrowroot powder', 'potato starch', 'tapioca starch', 'flour (use 2x amount)'],
  'mayonnaise': ['greek yogurt', 'avocado', 'hummus', 'tahini', 'mashed silken tofu'],
  'ketchup': ['tomato sauce + vinegar + sugar', 'tomato paste + honey + vinegar'],
  'worcestershire sauce': ['soy sauce + vinegar + brown sugar', 'fish sauce + molasses', 'tamari + balsamic vinegar']
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ingredient = searchParams.get('ingredient')?.toLowerCase();
    
    if (!ingredient) {
      return Response.json(
        { success: false, error: 'Ingredient parameter required' },
        { status: 400 }
      );
    }
    
    // Find substitutions
    let substitutions: string[] = [];
    
    // Direct match
    if (substitutionDatabase[ingredient]) {
      substitutions = substitutionDatabase[ingredient];
    } else {
      // Partial match
      for (const [key, subs] of Object.entries(substitutionDatabase)) {
        if (ingredient.includes(key) || key.includes(ingredient)) {
          substitutions = subs;
          break;
        }
      }
    }
    
    // If no specific substitutions found, provide general advice
    if (substitutions.length === 0) {
      substitutions = [
        'Check online substitution guides for specific ratios',
        'Consider the ingredient\'s role (fat, liquid, binding, flavor)',
        'Taste and adjust as needed',
        'Some substitutions may change texture or flavor'
      ];
    }
    
    return Response.json({
      success: true,
      ingredient,
      substitutions,
      count: substitutions.length
    });
    
  } catch (error) {
    console.error('Substitutions error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}