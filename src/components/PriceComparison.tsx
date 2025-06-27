// src/components/PriceComparison.tsx
// Multi-store price comparison for recipe ingredients

'use client';

import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient } from '@/types/recipe';
import { formatPrice } from '@/lib/utils';
import { 
  ShoppingCart, 
  TrendingDown, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Star,
  Truck,
  AlertCircle,
  RefreshCw,
  Filter
} from 'lucide-react';

interface PriceComparisonProps {
  recipe: Recipe;
  servings?: number;
  onStoreSelect: (store: Store, items: ShoppingItem[]) => void;
}

interface Store {
  id: string;
  name: string;
  logo: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  distance: number; // miles
  availability: number; // percentage of items available
}

interface ShoppingItem {
  ingredient: Ingredient;
  store: Store;
  price: number;
  unit: string;
  inStock: boolean;
  salePrice?: number;
  originalPrice?: number;
  promotion?: string;
  substitutes?: Array<{
    name: string;
    price: number;
    savings: number;
  }>;
}

interface PriceData {
  store: Store;
  items: ShoppingItem[];
  totalCost: number;
  totalSavings: number;
  estimatedDeliveryTime: string;
}

export default function PriceComparison({ recipe, servings = recipe.servings, onStoreSelect }: PriceComparisonProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance' | 'delivery'>('price');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  // Mock stores data
  const stores: Store[] = [
    {
      id: 'whole_foods',
      name: 'Whole Foods Market',
      logo: '🥗',
      rating: 4.5,
      deliveryTime: '1-2 hours',
      deliveryFee: 4.95,
      minimumOrder: 35,
      distance: 2.3,
      availability: 95
    },
    {
      id: 'kroger',
      name: 'Kroger',
      logo: '🛒',
      rating: 4.2,
      deliveryTime: '2-3 hours',
      deliveryFee: 2.95,
      minimumOrder: 25,
      distance: 1.8,
      availability: 88
    },
    {
      id: 'walmart',
      name: 'Walmart Grocery',
      logo: '🏪',
      rating: 4.0,
      deliveryTime: '3-4 hours',
      deliveryFee: 1.95,
      minimumOrder: 20,
      distance: 3.1,
      availability: 92
    },
    {
      id: 'target',
      name: 'Target',
      logo: '🎯',
      rating: 4.3,
      deliveryTime: '2-3 hours',
      deliveryFee: 3.95,
      minimumOrder: 30,
      distance: 2.7,
      availability: 85
    },
    {
      id: 'instacart',
      name: 'Instacart (Multiple Stores)',
      logo: '📦',
      rating: 4.1,
      deliveryTime: '1-2 hours',
      deliveryFee: 5.95,
      minimumOrder: 10,
      distance: 0, // Various locations
      availability: 98
    }
  ];

  // Scale ingredients based on servings
  const scaledIngredients = recipe.ingredients.map(ingredient => ({
    ...ingredient,
    amount: (ingredient.amount * servings) / recipe.servings
  }));

  useEffect(() => {
    fetchPriceData();
  }, [recipe, servings]);

  const fetchPriceData = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const priceComparisons: PriceData[] = stores.map(store => {
      const items = scaledIngredients.map(ingredient => 
        generateMockPricing(ingredient, store)
      );
      
      const totalCost = items.reduce((sum, item) => sum + item.price, 0) + store.deliveryFee;
      const totalSavings = items.reduce((sum, item) => 
        sum + (item.originalPrice ? item.originalPrice - item.price : 0), 0
      );
      
      return {
        store,
        items,
        totalCost,
        totalSavings,
        estimatedDeliveryTime: store.deliveryTime
      };
    });

    setPriceData(priceComparisons);
    setLoading(false);
  };

  const generateMockPricing = (ingredient: Ingredient, store: Store): ShoppingItem => {
    // Base pricing with store-specific multipliers
    const basePrices: Record<string, number> = {
      'chicken': 6.99, 'beef': 8.99, 'fish': 12.99, 'pork': 5.99,
      'cheese': 4.50, 'milk': 3.49, 'eggs': 2.99, 'butter': 4.99,
      'onion': 1.29, 'garlic': 2.49, 'tomato': 2.99, 'potato': 1.99,
      'rice': 2.99, 'pasta': 1.49, 'bread': 2.49, 'oil': 3.99
    };

    const storeMultipliers: Record<string, number> = {
      'whole_foods': 1.3,
      'kroger': 1.0,
      'walmart': 0.85,
      'target': 1.1,
      'instacart': 1.15
    };

    const basePrice = basePrices[ingredient.name.toLowerCase()] || 3.99;
    const multiplier = storeMultipliers[store.id] || 1.0;
    let price = basePrice * multiplier * ingredient.amount;
    
    // Add some randomness
    price *= (0.9 + Math.random() * 0.2);
    
    const finalPrice = Math.round(price * 100) / 100;
    const inStock = Math.random() > 0.1; // 90% chance in stock
    
    // Generate sale pricing randomly
    const hasSale = Math.random() > 0.7; // 30% chance of sale
    const salePrice = hasSale ? finalPrice * 0.8 : undefined;
    const originalPrice = hasSale ? finalPrice : undefined;

    const item: ShoppingItem = {
      ingredient,
      store,
      price: salePrice || finalPrice,
      unit: ingredient.unit,
      inStock,
      salePrice,
      originalPrice,
      promotion: hasSale ? 'Weekly Special' : undefined
    };

    // Add substitutes for out-of-stock items
    if (!inStock) {
      item.substitutes = [
        {
          name: `Organic ${ingredient.name}`,
          price: finalPrice * 1.4,
          savings: -(finalPrice * 0.4)
        },
        {
          name: `Store brand ${ingredient.name}`,
          price: finalPrice * 0.7,
          savings: finalPrice * 0.3
        }
      ];
    }

    return item;
  };

  const sortedPriceData = [...priceData].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.totalCost - b.totalCost;
      case 'rating':
        return b.store.rating - a.store.rating;
      case 'distance':
        return a.store.distance - b.store.distance;
      case 'delivery':
        return a.store.deliveryFee - b.store.deliveryFee;
      default:
        return 0;
    }
  });

  const filteredData = showOnlyAvailable 
    ? sortedPriceData.filter(data => data.store.availability >= 90)
    : sortedPriceData;

  const bestPrice = Math.min(...priceData.map(data => data.totalCost));
  const avgPrice = priceData.reduce((sum, data) => sum + data.totalCost, 0) / priceData.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Price Comparison</h3>
            <p className="text-sm text-gray-600">
              Compare prices for {recipe.title} ({servings} servings)
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchPriceData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Prices
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="price">Total Price</option>
            <option value="rating">Store Rating</option>
            <option value="distance">Distance</option>
            <option value="delivery">Delivery Fee</option>
          </select>
        </div>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            className="rounded"
          />
          Show only high availability stores (90%+)
        </label>

        {/* Price Summary */}
        <div className="ml-auto flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">Best: <strong>{formatPrice(bestPrice)}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">Avg: <strong>{formatPrice(avgPrice)}</strong></span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Comparing prices across stores...</span>
          </div>
        </div>
      )}

      {/* Price Comparison Grid */}
      {!loading && (
        <div className="space-y-4">
          {filteredData.map((data) => (
            <div
              key={data.store.id}
              className={`border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${
                selectedStore === data.store.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              } ${
                data.totalCost === bestPrice 
                  ? 'ring-2 ring-green-500 ring-opacity-50' 
                  : ''
              }`}
              onClick={() => setSelectedStore(
                selectedStore === data.store.id ? null : data.store.id
              )}
            >
              {/* Store Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{data.store.logo}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {data.store.name}
                      {data.totalCost === bestPrice && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Best Price
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{data.store.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{data.store.distance} mi</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{data.store.deliveryTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        <span>{formatPrice(data.store.deliveryFee)} delivery</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(data.totalCost)}
                  </div>
                  {data.totalSavings > 0 && (
                    <div className="text-sm text-green-600">
                      Save {formatPrice(data.totalSavings)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {data.store.availability}% available
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedStore === data.store.id && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <h5 className="font-medium text-gray-900">Item Breakdown:</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.items.map((item, index) => (
                      <div key={index} className="bg-white rounded border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {item.ingredient.amount} {item.ingredient.unit} {item.ingredient.name}
                            </div>
                            {!item.inStock && (
                              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Out of stock</span>
                              </div>
                            )}
                            {item.promotion && (
                              <div className="text-xs text-blue-600 mt-1">
                                🏷️ {item.promotion}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {formatPrice(item.price)}
                            </div>
                            {item.originalPrice && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatPrice(item.originalPrice)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Substitutes for out-of-stock items */}
                        {!item.inStock && item.substitutes && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-600 mb-1">Available substitutes:</div>
                            {item.substitutes.map((sub, subIndex) => (
                              <div key={subIndex} className="text-xs text-gray-700 flex justify-between">
                                <span>{sub.name}</span>
                                <span className={sub.savings > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatPrice(sub.price)} 
                                  ({sub.savings > 0 ? 'save' : 'extra'} {formatPrice(Math.abs(sub.savings))})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded p-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatPrice(data.totalCost - data.store.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery fee:</span>
                        <span>{formatPrice(data.store.deliveryFee)}</span>
                      </div>
                      {data.totalSavings > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Total savings:</span>
                          <span>-{formatPrice(data.totalSavings)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-200">
                        <span>Total:</span>
                        <span>{formatPrice(data.totalCost)}</span>
                      </div>
                    </div>

                    {/* Minimum Order Warning */}
                    {data.totalCost < data.store.minimumOrder && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚠️ Add {formatPrice(data.store.minimumOrder - data.totalCost)} more to meet minimum order requirement
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onStoreSelect(data.store, data.items)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Shop at {data.store.name}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Price Insights */}
      {!loading && priceData.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Smart Shopping Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <strong>Best Value:</strong> {priceData.find(d => d.totalCost === bestPrice)?.store.name} 
              saves you {formatPrice(avgPrice - bestPrice)} vs average
            </div>
            <div>
              <strong>Fastest Delivery:</strong> {
                priceData.reduce((fastest, current) => 
                  current.store.deliveryTime < fastest.store.deliveryTime ? current : fastest
                ).store.name
              }
            </div>
            <div>
              <strong>Highest Availability:</strong> {
                priceData.reduce((best, current) => 
                  current.store.availability > best.store.availability ? current : best
                ).store.name
              } ({Math.max(...priceData.map(d => d.store.availability))}% in stock)
            </div>
            <div>
              <strong>Total Potential Savings:</strong> Up to {
                formatPrice(Math.max(...priceData.map(d => d.totalSavings)))
              } with sales and promotions
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && priceData.length === 0 && (
        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No price data available</p>
          <p className="text-sm text-gray-500">
            Try refreshing or check your internet connection
          </p>
        </div>
      )}
    </div>
  );
}
                          <div className="mt-2 pt-2 border-t border-gray-100"></div>