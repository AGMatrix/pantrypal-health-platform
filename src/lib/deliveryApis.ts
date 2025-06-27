// src/lib/deliveryApis.ts
// Integration with delivery and grocery APIs

import { Recipe, Ingredient } from '@/types/recipe';

// === DELIVERY SERVICE TYPES ===

export interface DeliveryService {
  id: string;
  name: string;
  type: 'restaurant' | 'grocery' | 'both';
  logo: string;
  estimatedDeliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  available: boolean;
  rating: number;
}

export interface RestaurantItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  restaurant: {
    name: string;
    rating: number;
    deliveryTime: string;
    deliveryFee: number;
  };
  cuisine: string;
  tags: string[];
}

export interface GroceryItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  store: {
    name: string;
    deliveryTime: string;
    deliveryFee: number;
  };
  inStock: boolean;
  category: string;
}

export interface DeliveryOptions {
  restaurants: RestaurantItem[];
  groceries: GroceryItem[];
  services: DeliveryService[];
}

// === MAIN DELIVERY API CLASS ===

export class DeliveryIntegration {
  private userLocation: { lat: number; lng: number; address: string } | null = null;

  constructor() {
    this.initializeLocation();
  }

  private async initializeLocation() {
    try {
      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current Location'
            };
          },
          () => {
            // Fallback to default location (you can customize this)
            this.userLocation = {
              lat: 40.7128,
              lng: -74.0060,
              address: 'New York, NY'
            };
          }
        );
      }
    } catch (error) {
      console.error('Location initialization failed:', error);
    }
  }

  // === RESTAURANT DELIVERY (DoorDash, Uber Eats, etc.) ===

  async findSimilarDishes(recipe: Recipe): Promise<RestaurantItem[]> {
    try {
      console.log('🍽️ Finding restaurant dishes similar to:', recipe.title);

      // In production, you'd call actual APIs here
      // For now, we'll simulate API responses based on the recipe
      
      const searchTerms = this.extractSearchTerms(recipe);
      const mockRestaurantItems = this.generateMockRestaurantItems(searchTerms, recipe);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return mockRestaurantItems;
    } catch (error) {
      console.error('Restaurant search failed:', error);
      return [];
    }
  }

  private extractSearchTerms(recipe: Recipe): string[] {
    const terms = [];
    
    // Extract main dish type from title
    const title = recipe.title.toLowerCase();
    if (title.includes('pasta')) terms.push('pasta');
    if (title.includes('pizza')) terms.push('pizza');
    if (title.includes('burger')) terms.push('burger');
    if (title.includes('chicken')) terms.push('chicken');
    if (title.includes('salad')) terms.push('salad');
    if (title.includes('soup')) terms.push('soup');
    if (title.includes('stir fry')) terms.push('stir fry');
    
    // Add cuisine type
    if (recipe.cuisine) terms.push(recipe.cuisine.toLowerCase());
    
    // Add main ingredients
    recipe.ingredients.slice(0, 3).forEach(ing => {
      if (['chicken', 'beef', 'fish', 'pasta', 'rice'].includes(ing.name.toLowerCase())) {
        terms.push(ing.name.toLowerCase());
      }
    });

    return terms;
  }

  private generateMockRestaurantItems(searchTerms: string[], recipe: Recipe): RestaurantItem[] {
    const mockRestaurants = [
      { name: 'Local Italian Kitchen', cuisine: 'Italian', rating: 4.5, deliveryTime: '25-35 min', deliveryFee: 2.99 },
      { name: 'Bangkok Express', cuisine: 'Thai', rating: 4.3, deliveryTime: '30-40 min', deliveryFee: 3.49 },
      { name: 'Farm Fresh Bistro', cuisine: 'American', rating: 4.6, deliveryTime: '20-30 min', deliveryFee: 1.99 },
      { name: 'Mediterranean Delight', cuisine: 'Mediterranean', rating: 4.4, deliveryTime: '35-45 min', deliveryFee: 4.99 },
      { name: 'Spice Route', cuisine: 'Indian', rating: 4.2, deliveryTime: '40-50 min', deliveryFee: 3.99 }
    ];

    return mockRestaurants.map((restaurant, index) => ({
      id: `restaurant-${index}`,
      name: this.generateSimilarDishName(recipe.title, restaurant.cuisine),
      description: `Delicious ${restaurant.cuisine.toLowerCase()} dish similar to your recipe`,
      price: recipe.costPerServing ? recipe.costPerServing * 2.5 : 15.99, // Restaurant markup
      image: `https://images.unsplash.com/photo-${1500000000000 + index * 1000000}?w=300&h=200&fit=crop`,
      restaurant,
      cuisine: restaurant.cuisine,
      tags: searchTerms
    }));
  }

  private generateSimilarDishName(recipeTitle: string, cuisine: string): string {
    const baseName = recipeTitle.replace(/homemade|easy|quick|simple/gi, '').trim();
    const cuisinePrefix = {
      'Italian': 'Authentic',
      'Thai': 'Traditional',
      'American': 'Classic',
      'Mediterranean': 'Fresh',
      'Indian': 'Spicy'
    };

    return `${cuisinePrefix[cuisine as keyof typeof cuisinePrefix] || 'Delicious'} ${baseName}`;
  }

  // === GROCERY DELIVERY (Instacart, Amazon Fresh, etc.) ===

  async findIngredients(ingredients: Ingredient[], storePreference?: string): Promise<GroceryItem[]> {
    try {
      console.log('🛒 Finding grocery items for ingredients:', ingredients.map(i => i.name));

      const groceryItems: GroceryItem[] = [];
      const stores = this.getAvailableStores();

      for (const ingredient of ingredients) {
        const items = await this.searchGroceryItem(ingredient, stores, storePreference);
        groceryItems.push(...items);
      }

      return groceryItems;
    } catch (error) {
      console.error('Grocery search failed:', error);
      return [];
    }
  }

  private getAvailableStores() {
    return [
      { name: 'Whole Foods', deliveryTime: '1-2 hours', deliveryFee: 4.95, markup: 1.2 },
      { name: 'Kroger', deliveryTime: '2-3 hours', deliveryFee: 2.95, markup: 1.0 },
      { name: 'Walmart Grocery', deliveryTime: '3-4 hours', deliveryFee: 1.95, markup: 0.9 },
      { name: 'Target', deliveryTime: '2-3 hours', deliveryFee: 3.95, markup: 1.1 }
    ];
  }

  private async searchGroceryItem(ingredient: Ingredient, stores: any[], storePreference?: string): Promise<GroceryItem[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const targetStores = storePreference 
      ? stores.filter(s => s.name.toLowerCase().includes(storePreference.toLowerCase()))
      : stores.slice(0, 2); // Show top 2 stores

    return targetStores.map((store, index) => ({
      id: `${ingredient.name}-${store.name}-${index}`,
      name: this.normalizeIngredientName(ingredient.name),
      price: (ingredient.estimatedPrice || 2.99) * store.markup,
      unit: ingredient.unit,
      image: this.getIngredientImage(ingredient.name),
      store: {
        name: store.name,
        deliveryTime: store.deliveryTime,
        deliveryFee: store.deliveryFee
      },
      inStock: Math.random() > 0.1, // 90% chance in stock
      category: this.categorizeIngredient(ingredient.name)
    }));
  }

  private normalizeIngredientName(name: string): string {
    // Clean up ingredient names for grocery search
    return name
      .replace(/\b(fresh|dried|chopped|diced|sliced)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getIngredientImage(ingredientName: string): string {
    const imageMap: Record<string, string> = {
      'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&h=150&fit=crop',
      'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=150&fit=crop',
      'onion': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=150&fit=crop',
      'garlic': 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=200&h=150&fit=crop',
      'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=150&fit=crop'
    };

    const key = Object.keys(imageMap).find(k => 
      ingredientName.toLowerCase().includes(k)
    );

    return key ? imageMap[key] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=150&fit=crop';
  }

  private categorizeIngredient(name: string): string {
    const categories: Record<string, string[]> = {
      'Produce': ['tomato', 'onion', 'garlic', 'lettuce', 'carrot', 'potato', 'bell pepper'],
      'Meat & Seafood': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp'],
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs'],
      'Pantry': ['rice', 'pasta', 'flour', 'sugar', 'oil', 'salt', 'pepper', 'spices'],
      'Frozen': ['frozen vegetables', 'ice cream', 'frozen fruit']
    };

    for (const [category, items] of Object.entries(categories)) {
      if (items.some(item => name.toLowerCase().includes(item))) {
        return category;
      }
    }

    return 'Other';
  }

  // === MEAL KIT SERVICES (Blue Apron, HelloFresh, etc.) ===

  async findMealKits(recipe: Recipe): Promise<any[]> {
    try {
      console.log('📦 Finding meal kit alternatives for:', recipe.title);

      // Mock meal kit data
      const mealKits = [
        {
          id: 'kit-1',
          service: 'HelloFresh',
          name: `${recipe.title} Meal Kit`,
          description: 'Pre-portioned ingredients with easy-to-follow recipe card',
          price: recipe.estimatedCost ? recipe.estimatedCost * 1.8 : 24.99,
          servings: recipe.servings,
          deliveryTime: '3-7 days',
          rating: 4.4,
          image: recipe.image
        },
        {
          id: 'kit-2',
          service: 'Blue Apron',
          name: `Chef's ${recipe.title}`,
          description: 'Restaurant-quality ingredients delivered to your door',
          price: recipe.estimatedCost ? recipe.estimatedCost * 2.0 : 28.99,
          servings: recipe.servings,
          deliveryTime: '4-8 days',
          rating: 4.2,
          image: recipe.image
        }
      ];

      return mealKits;
    } catch (error) {
      console.error('Meal kit search failed:', error);
      return [];
    }
  }

  // === UNIFIED SEARCH ===

  async getDeliveryOptions(recipe: Recipe): Promise<DeliveryOptions> {
    try {
      console.log('🚀 Getting all delivery options for recipe:', recipe.title);

      const [restaurants, groceries] = await Promise.all([
        this.findSimilarDishes(recipe),
        this.findIngredients(recipe.ingredients)
      ]);

      const services: DeliveryService[] = [
        {
          id: 'doordash',
          name: 'DoorDash',
          type: 'restaurant',
          logo: '🚗',
          estimatedDeliveryTime: '25-35 min',
          deliveryFee: 2.99,
          minimumOrder: 12,
          available: true,
          rating: 4.5
        },
        {
          id: 'ubereats',
          name: 'Uber Eats',
          type: 'restaurant',
          logo: '🚛',
          estimatedDeliveryTime: '20-30 min',
          deliveryFee: 3.49,
          minimumOrder: 15,
          available: true,
          rating: 4.3
        },
        {
          id: 'instacart',
          name: 'Instacart',
          type: 'grocery',
          logo: '🛒',
          estimatedDeliveryTime: '1-2 hours',
          deliveryFee: 5.99,
          minimumOrder: 10,
          available: true,
          rating: 4.4
        },
        {
          id: 'amazon-fresh',
          name: 'Amazon Fresh',
          type: 'grocery',
          logo: '📦',
          estimatedDeliveryTime: '2-4 hours',
          deliveryFee: 0, // Free with Prime
          minimumOrder: 35,
          available: true,
          rating: 4.2
        }
      ];

      return {
        restaurants,
        groceries,
        services
      };
    } catch (error) {
      console.error('Failed to get delivery options:', error);
      return {
        restaurants: [],
        groceries: [],
        services: []
      };
    }
  }

  // === ORDER MANAGEMENT ===

  async initiateOrder(serviceId: string, items: any[], userInfo: any) {
    console.log(`🛍️ Initiating order with ${serviceId}:`, items);
    
    // In production, this would:
    // 1. Redirect to the service's API/website
    // 2. Use deep links to pre-populate cart
    // 3. Track order status
    
    const serviceUrls: Record<string, string> = {
      'doordash': 'https://www.doordash.com',
      'ubereats': 'https://www.ubereats.com',
      'instacart': 'https://www.instacart.com',
      'amazon-fresh': 'https://www.amazon.com/fresh',
      'hellofresh': 'https://www.hellofresh.com',
      'blueapron': 'https://www.blueapron.com'
    };

    const url = serviceUrls[serviceId];
    if (url) {
      // In a real app, you'd use proper deep linking with pre-populated cart
      window.open(url, '_blank');
      return { success: true, redirectUrl: url };
    }

    return { success: false, error: 'Service not available' };
  }

  // === PRICE COMPARISON ===

  calculateBestValue(deliveryOptions: DeliveryOptions, recipe: Recipe): any {
    const options = [];

    // Restaurant option
    if (deliveryOptions.restaurants.length > 0) {
      const avgRestaurantPrice = deliveryOptions.restaurants.reduce((sum, item) => sum + item.price, 0) / deliveryOptions.restaurants.length;
      options.push({
        type: 'restaurant',
        name: 'Order Similar Dish',
        totalCost: avgRestaurantPrice + 2.99, // Add delivery fee
        convenience: 'High',
        time: '25-35 min',
        effort: 'None'
      });
    }

    // Grocery option
    if (deliveryOptions.groceries.length > 0) {
      const groceryCost = deliveryOptions.groceries.reduce((sum, item) => sum + item.price, 0);
      options.push({
        type: 'grocery',
        name: 'Order Ingredients',
        totalCost: groceryCost + 4.95, // Add delivery fee
        convenience: 'Medium',
        time: '1-2 hours + cooking time',
        effort: 'Medium'
      });
    }

    // Cooking option (baseline)
    options.push({
      type: 'cook',
      name: 'Cook at Home',
      totalCost: recipe.estimatedCost || 0,
      convenience: 'Low',
      time: `${recipe.cookingTime} min + shopping`,
      effort: 'High'
    });

    return options.sort((a, b) => a.totalCost - b.totalCost);
  }
}