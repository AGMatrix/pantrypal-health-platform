import { Recipe } from '@/types/recipe';

export const mockRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    title: 'Quick Chicken Stir Fry',
    description: 'A delicious and healthy stir fry ready in 20 minutes with vibrant vegetables and tender chicken',
    ingredients: [
      { name: 'chicken breast', amount: 1, unit: 'lb', estimatedPrice: 6.99 },
      { name: 'mixed vegetables', amount: 2, unit: 'cups', estimatedPrice: 3.50 },
      { name: 'soy sauce', amount: 3, unit: 'tbsp', estimatedPrice: 0.50 },
      { name: 'garlic', amount: 2, unit: 'cloves', estimatedPrice: 0.25 },
      { name: 'ginger', amount: 1, unit: 'tsp', estimatedPrice: 0.15 },
      { name: 'oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.30 }
    ],
    instructions: [
      'Cut chicken into bite-sized pieces and season with salt and pepper',
      'Heat oil in a large skillet or wok over medium-high heat',
      'Add chicken and cook for 5-7 minutes until golden brown',
      'Add garlic and ginger, cook for 30 seconds until fragrant',
      'Add mixed vegetables and stir-fry for 3-4 minutes',
      'Pour in soy sauce and stir everything together',
      'Cook for 1-2 more minutes until vegetables are tender-crisp',
      'Serve immediately over rice or noodles'
    ],
    cookingTime: 20,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'Asian',
    dietary: ['high-protein'],
    nutrition: {
      calories: 285,
      protein: 28,
      carbs: 12,
      fat: 14,
      fiber: 3
    },
    costPerServing: 2.75,
    estimatedCost: 11.00,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.5,
    reviews: 128
  },
  {
    id: 'recipe-2',
    title: 'Budget Rice and Beans',
    description: 'Nutritious and affordable rice bowl with protein-packed black beans and aromatic spices',
    ingredients: [
      { name: 'rice', amount: 1, unit: 'cup', estimatedPrice: 0.50 },
      { name: 'black beans', amount: 1, unit: 'can', estimatedPrice: 1.00 },
      { name: 'onion', amount: 0.5, unit: 'medium', estimatedPrice: 0.25 },
      { name: 'garlic', amount: 2, unit: 'cloves', estimatedPrice: 0.25 },
      { name: 'cumin', amount: 1, unit: 'tsp', estimatedPrice: 0.10 },
      { name: 'oil', amount: 1, unit: 'tbsp', estimatedPrice: 0.15 }
    ],
    instructions: [
      'Cook rice according to package directions',
      'Heat oil in a pan, sauté diced onion until translucent',
      'Add garlic and cumin, cook for 1 minute',
      'Add drained black beans and heat through',
      'Season with salt and pepper',
      'Serve beans over rice'
    ],
    cookingTime: 25,
    servings: 3,
    difficulty: 'Easy',
    cuisine: 'Mexican',
    dietary: ['vegetarian', 'high-protein'],
    nutrition: {
      calories: 320,
      protein: 12,
      carbs: 58,
      fat: 4,
      fiber: 8
    },
    costPerServing: 0.75,
    estimatedCost: 2.25,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.2,
    reviews: 89
  },
  {
    id: 'recipe-3',
    title: 'Quick Pasta Aglio e Olio',
    description: 'Simple Italian pasta with garlic and olive oil - a classic comfort dish in under 15 minutes',
    ingredients: [
      { name: 'spaghetti', amount: 8, unit: 'oz', estimatedPrice: 1.00 },
      { name: 'olive oil', amount: 0.25, unit: 'cup', estimatedPrice: 1.50 },
      { name: 'garlic', amount: 4, unit: 'cloves', estimatedPrice: 0.50 },
      { name: 'red pepper flakes', amount: 0.5, unit: 'tsp', estimatedPrice: 0.10 },
      { name: 'parsley', amount: 0.25, unit: 'cup', estimatedPrice: 0.75 },
      { name: 'parmesan cheese', amount: 0.5, unit: 'cup', estimatedPrice: 2.00 }
    ],
    instructions: [
      'Cook spaghetti according to package directions until al dente',
      'While pasta cooks, heat olive oil in large skillet',
      'Add sliced garlic and red pepper flakes to oil',
      'Cook until garlic is golden, about 2 minutes',
      'Drain pasta, reserving 1/2 cup pasta water',
      'Add pasta to skillet with garlic oil',
      'Toss with pasta water and parsley',
      'Serve with grated parmesan'
    ],
    cookingTime: 15,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Italian',
    dietary: ['vegetarian'],
    nutrition: {
      calories: 420,
      protein: 14,
      carbs: 58,
      fat: 16,
      fiber: 4
    },
    costPerServing: 2.95,
    estimatedCost: 5.90,
    image: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.6,
    reviews: 156
  },
  {
    id: 'recipe-4',
    title: 'Fancy Salmon Fillet',
    description: 'Gourmet pan-seared salmon with herbs and lemon butter sauce - restaurant quality at home',
    ingredients: [
      { name: 'salmon fillet', amount: 1, unit: 'lb', estimatedPrice: 16.00 },
      { name: 'lemon', amount: 1, unit: 'whole', estimatedPrice: 0.75 },
      { name: 'fresh dill', amount: 2, unit: 'tbsp', estimatedPrice: 2.00 },
      { name: 'butter', amount: 2, unit: 'tbsp', estimatedPrice: 0.50 },
      { name: 'olive oil', amount: 1, unit: 'tbsp', estimatedPrice: 0.25 }
    ],
    instructions: [
      'Season salmon with salt and pepper',
      'Heat olive oil in skillet over medium-high heat',
      'Cook salmon skin-side down for 4 minutes',
      'Flip and cook 3-4 minutes more',
      'Add butter, lemon juice, and dill to pan',
      'Baste salmon with herb butter',
      'Serve immediately'
    ],
    cookingTime: 15,
    servings: 2,
    difficulty: 'Medium',
    cuisine: 'American',
    dietary: ['high-protein', 'low-carb'],
    nutrition: {
      calories: 340,
      protein: 35,
      carbs: 2,
      fat: 20,
      fiber: 0
    },
    costPerServing: 9.75,
    estimatedCost: 19.50,
    image: 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.8,
    reviews: 203
  },
  {
    id: 'recipe-5',
    title: 'Mediterranean Bowl',
    description: 'Fresh and healthy Mediterranean-inspired quinoa bowl with feta, olives, and vibrant vegetables',
    ingredients: [
      { name: 'quinoa', amount: 1, unit: 'cup', estimatedPrice: 2.00 },
      { name: 'cucumber', amount: 1, unit: 'medium', estimatedPrice: 1.00 },
      { name: 'cherry tomatoes', amount: 1, unit: 'cup', estimatedPrice: 2.50 },
      { name: 'feta cheese', amount: 0.5, unit: 'cup', estimatedPrice: 3.00 },
      { name: 'olives', amount: 0.25, unit: 'cup', estimatedPrice: 1.50 },
      { name: 'olive oil', amount: 2, unit: 'tbsp', estimatedPrice: 0.50 }
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Dice cucumber and halve cherry tomatoes',
      'Crumble feta cheese',
      'Arrange quinoa in bowls',
      'Top with vegetables, feta, and olives',
      'Drizzle with olive oil and season'
    ],
    cookingTime: 20,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Mediterranean',
    dietary: ['vegetarian', 'healthy'],
    nutrition: {
      calories: 380,
      protein: 15,
      carbs: 45,
      fat: 18,
      fiber: 8
    },
    costPerServing: 5.25,
    estimatedCost: 10.50,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.4,
    reviews: 92
  },
  {
    id: 'recipe-6',
    title: 'Classic Pancakes',
    description: 'Fluffy breakfast pancakes that everyone loves - perfect for weekend mornings and special occasions',
    ingredients: [
      { name: 'flour', amount: 2, unit: 'cups', estimatedPrice: 0.50 },
      { name: 'milk', amount: 1.5, unit: 'cups', estimatedPrice: 1.00 },
      { name: 'eggs', amount: 2, unit: 'large', estimatedPrice: 0.50 },
      { name: 'sugar', amount: 2, unit: 'tbsp', estimatedPrice: 0.10 },
      { name: 'baking powder', amount: 2, unit: 'tsp', estimatedPrice: 0.05 },
      { name: 'butter', amount: 2, unit: 'tbsp', estimatedPrice: 0.50 }
    ],
    instructions: [
      'Mix dry ingredients in a large bowl',
      'Whisk together milk, eggs, and melted butter',
      'Combine wet and dry ingredients until just mixed',
      'Heat griddle or non-stick pan over medium heat',
      'Pour batter to form pancakes',
      'Cook until bubbles form, then flip',
      'Serve hot with syrup'
    ],
    cookingTime: 15,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'American',
    dietary: ['vegetarian'],
    nutrition: {
      calories: 220,
      protein: 8,
      carbs: 35,
      fat: 6,
      fiber: 2
    },
    costPerServing: 0.66,
    estimatedCost: 2.65,
    image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&h=300&fit=crop&auto=format&q=80',
    rating: 4.7,
    reviews: 245
  }
];
