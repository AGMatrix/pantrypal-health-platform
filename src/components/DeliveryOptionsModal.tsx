// src/components/DeliveryOptionsModal.tsx

'use client';

import React, { useState } from 'react';
import { Recipe } from '@/types/recipe';
import { X, Truck, ShoppingCart, ExternalLink } from 'lucide-react';

interface DeliveryOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  userIngredients?: string[];
}

export default function DeliveryOptionsModal({ 
  isOpen, 
  onClose, 
  recipe 
}: DeliveryOptionsModalProps) {
  const [selectedTab, setSelectedTab] = useState<'restaurants' | 'groceries' | 'comparison'>('restaurants');

  const handleOrderClick = (service: string) => {
    alert(`This would redirect you to ${service}. Feature coming soon!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-600 text-white">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Delivery Options</h2>
              <p className="text-blue-100 text-sm">For: {recipe.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('restaurants')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              selectedTab === 'restaurants'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setSelectedTab('groceries')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              selectedTab === 'groceries'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Groceries
          </button>
          <button
            onClick={() => setSelectedTab('comparison')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              selectedTab === 'comparison'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Compare
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {selectedTab === 'restaurants' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 mb-4">Order Similar Dishes</h3>
              
              {/* DoorDash */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                      DD
                    </div>
                    <div>
                      <h4 className="font-semibold">DoorDash</h4>
                      <p className="text-sm text-gray-600">Popular delivery app</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOrderClick('DoorDash')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Order
                  </button>
                </div>
              </div>

              {/* Uber Eats */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold">
                      UE
                    </div>
                    <div>
                      <h4 className="font-semibold">Uber Eats</h4>
                      <p className="text-sm text-gray-600">Fast delivery</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOrderClick('Uber Eats')}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Order
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'groceries' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 mb-4">Order Ingredients</h3>
              
              {/* Instacart */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                      IC
                    </div>
                    <div>
                      <h4 className="font-semibold">Instacart</h4>
                      <p className="text-sm text-gray-600">Grocery delivery</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOrderClick('Instacart')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Shop
                  </button>
                </div>
              </div>

              {/* DoorDash */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                      DD
                    </div>
                    <div>
                      <h4 className="font-semibold">DoorDash</h4>
                      <p className="text-sm text-gray-600">Popular delivery app</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOrderClick('DoorDash')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Shop
                  </button>
                </div>
              </div>

              {/* Amazon Fresh */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                      AF
                    </div>
                    <div>
                      <h4 className="font-semibold">Amazon Fresh</h4>
                      <p className="text-sm text-gray-600">Prime delivery</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOrderClick('Amazon Fresh')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Shop
                  </button>
                </div>
              </div>

              {/* Walmart */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                      W
                    </div>
                    <div>
                      <h4 className="font-semibold">Walmart Grocery</h4>
                      <p className="text-sm text-gray-600">Best prices</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOrderClick('Walmart Grocery')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Shop
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'comparison' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 mb-4">Cost Comparison</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Cook at Home */}
                <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-green-900">Cook at Home</h4>
                      <p className="text-sm text-green-700">More Quantity • Same price</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-900">
                        ${recipe.estimatedCost?.toFixed(2) || '12.00'}
                      </div>
                      <div className="text-xs text-green-700">Total cost</div>
                    </div>
                  </div>
                </div>

                {/* Restaurant */}
                <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-orange-900">Restaurant Delivery</h4>
                      <p className="text-sm text-orange-700">Fastest option</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-900">$25.40</div>
                      <div className="text-xs text-orange-700">With tip & delivery</div>
                    </div>
                  </div>
                </div>

                {/* Grocery */}
                <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-blue-900">Grocery Delivery</h4>
                      <p className="text-sm text-blue-700">Best balance</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-900">$22.94</div>
                      <div className="text-xs text-blue-700">With delivery fee</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
                <h4 className="font-bold text-purple-900 mb-2">Recommendation</h4>
                <p className="text-purple-800 text-sm">
                  Grocery delivery offers the best balance of cost and convenience for this recipe.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Feature preview - Coming soon!
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}