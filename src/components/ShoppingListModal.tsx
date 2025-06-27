// src/components/ShoppingListModal.tsx
// Generate and display shopping list from selected recipes

'use client';

import React, { useState, useMemo } from 'react';
import { Recipe } from '@/types/recipe';
import { generateShoppingList, formatPrice, isPantryStaple, estimateGroceryCost } from '@/lib/utils';
import { X, ShoppingCart, Check, DollarSign, MapPin, Printer } from 'lucide-react';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  userIngredients?: string[];
}

interface ShoppingItem {
  name: string;
  totalAmount: number;
  unit: string;
  estimatedPrice: number;
  isPantryStaple: boolean;
  fromRecipes: string[];
  isAvailable: boolean;
}

export default function ShoppingListModal({ 
  isOpen, 
  onClose, 
  recipes, 
  userIngredients = [] 
}: ShoppingListModalProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [showPantryStaples, setShowPantryStaples] = useState(true);
  const [showAvailableItems, setShowAvailableItems] = useState(false);

  // Generate comprehensive shopping list
  const shoppingList = useMemo(() => {
    const combinedIngredients: Record<string, ShoppingItem> = {};

    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const key = ingredient.name.toLowerCase();
        const isAvailable = userIngredients.some(userIng =>
          ingredient.name.toLowerCase().includes(userIng.toLowerCase()) ||
          userIng.toLowerCase().includes(ingredient.name.toLowerCase())
        );

        if (combinedIngredients[key]) {
          combinedIngredients[key].totalAmount += ingredient.amount;
          combinedIngredients[key].fromRecipes.push(recipe.title);
          combinedIngredients[key].estimatedPrice += ingredient.estimatedPrice || 0;
        } else {
          combinedIngredients[key] = {
            name: ingredient.name,
            totalAmount: ingredient.amount,
            unit: ingredient.unit,
            estimatedPrice: ingredient.estimatedPrice || estimateItemPrice(ingredient.name, ingredient.amount),
            isPantryStaple: isPantryStaple(ingredient.name),
            fromRecipes: [recipe.title],
            isAvailable
          };
        }
      });
    });

    return Object.values(combinedIngredients);
  }, [recipes, userIngredients]);

  // Filter shopping list based on preferences
  const filteredList = useMemo(() => {
    return shoppingList.filter(item => {
      if (!showAvailableItems && item.isAvailable) return false;
      if (!showPantryStaples && item.isPantryStaple) return false;
      return true;
    });
  }, [shoppingList, showPantryStaples, showAvailableItems]);

  // Group items by category
  const groupedList = useMemo(() => {
    if (!groupByCategory) return { 'All Items': filteredList };

    const categories: Record<string, ShoppingItem[]> = {
      'Produce': [],
      'Meat & Seafood': [],
      'Dairy & Eggs': [],
      'Pantry & Dry Goods': [],
      'Frozen': [],
      'Other': []
    };

    filteredList.forEach(item => {
      const category = categorizeIngredient(item.name);
      categories[category].push(item);
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }, [filteredList, groupByCategory]);

  const totalCost = filteredList.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const checkedCost = filteredList
    .filter(item => checkedItems.has(item.name))
    .reduce((sum, item) => sum + item.estimatedPrice, 0);

  const toggleItem = (itemName: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemName)) {
      newChecked.delete(itemName);
    } else {
      newChecked.add(itemName);
    }
    setCheckedItems(newChecked);
  };

  const handlePrint = () => {
    const printContent = generatePrintableList();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrintableList = () => {
    return `
      <html>
        <head>
          <title>Shopping List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .category { margin: 20px 0; }
            .category h2 { color: #666; border-bottom: 1px solid #ccc; }
            .item { margin: 5px 0; display: flex; align-items: center; }
            .checkbox { margin-right: 10px; }
            .cost { color: #888; }
          </style>
        </head>
        <body>
          <h1>Shopping List</h1>
          <p>For recipes: ${recipes.map(r => r.title).join(', ')}</p>
          <p>Estimated total: ${formatPrice(totalCost)}</p>
          ${Object.entries(groupedList).map(([category, items]) => `
            <div class="category">
              <h2>${category}</h2>
              ${items.map(item => `
                <div class="item">
                  <input type="checkbox" class="checkbox">
                  <span>${item.totalAmount} ${item.unit} ${item.name}</span>
                  <span class="cost">${formatPrice(item.estimatedPrice)}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Shopping List</h2>
              <p className="text-sm text-gray-600">
                For {recipes.length} recipe{recipes.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={groupByCategory}
                  onChange={(e) => setGroupByCategory(e.target.checked)}
                  className="rounded"
                />
                Group by category
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPantryStaples}
                  onChange={(e) => setShowPantryStaples(e.target.checked)}
                  className="rounded"
                />
                Include pantry staples
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAvailableItems}
                  onChange={(e) => setShowAvailableItems(e.target.checked)}
                  className="rounded"
                />
                Show items you have
              </label>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="p-6 bg-blue-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Total Estimated Cost</div>
                <div className="font-semibold text-lg">{formatPrice(totalCost)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Items Checked</div>
                <div className="font-medium">{checkedItems.size} of {filteredList.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Checked Value</div>
                <div className="font-medium">{formatPrice(checkedCost)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div className="flex-1 overflow-y-auto p-6 max-h-96">
          {Object.entries(groupedList).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
                <span className="text-sm text-gray-500 font-normal">
                  ({items.length} item{items.length === 1 ? '' : 's'})
                </span>
              </h3>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      checkedItems.has(item.name)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleItem(item.name)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          checkedItems.has(item.name)
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {checkedItems.has(item.name) && <Check className="w-3 h-3" />}
                      </button>
                      
                      <div className={checkedItems.has(item.name) ? 'line-through text-gray-500' : ''}>
                        <div className="font-medium">
                          {item.totalAmount} {item.unit} {item.name}
                          {item.isAvailable && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              You have this
                            </span>
                          )}
                          {item.isPantryStaple && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Pantry staple
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Used in: {item.fromRecipes.slice(0, 2).join(', ')}
                          {item.fromRecipes.length > 2 && ` +${item.fromRecipes.length - 2} more`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(item.estimatedPrice)}</div>
                      {item.estimatedPrice > 5 && (
                        <div className="text-xs text-red-600">Higher cost item</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 Tip: Prices are estimates. Check store prices for accuracy.
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // In a real app, this would integrate with grocery delivery services
                  alert('Grocery delivery integration coming soon!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Order Online
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function estimateItemPrice(itemName: string, amount: number): number {
  const basePrices: Record<string, number> = {
    'chicken': 6.00,
    'beef': 8.00,
    'fish': 10.00,
    'pork': 5.00,
    'cheese': 4.00,
    'milk': 3.00,
    'eggs': 2.50,
    'bread': 2.00,
    'rice': 1.50,
    'pasta': 1.00,
    'onion': 1.00,
    'garlic': 0.50,
    'tomato': 2.00,
    'potato': 1.50,
    'carrot': 1.50,
    'bell pepper': 3.00,
    'broccoli': 2.50,
    'spinach': 3.00,
    'oil': 4.00,
    'butter': 4.00,
    'flour': 2.00,
    'sugar': 2.50,
    'salt': 1.00,
    'pepper': 3.00,
  };

  let basePrice = 2.00; // default
  const name = itemName.toLowerCase();
  
  for (const [key, price] of Object.entries(basePrices)) {
    if (name.includes(key)) {
      basePrice = price;
      break;
    }
  }

  return Math.round((basePrice * amount / 4) * 100) / 100; // Rough estimation
}

function categorizeIngredient(ingredient: string): string {
  const name = ingredient.toLowerCase();
  
  if (['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp'].some(meat => name.includes(meat))) {
    return 'Meat & Seafood';
  }
  if (['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs'].some(dairy => name.includes(dairy))) {
    return 'Dairy & Eggs';
  }
  if (['onion', 'garlic', 'tomato', 'potato', 'carrot', 'bell pepper', 'broccoli', 'spinach', 'lettuce', 'cucumber'].some(produce => name.includes(produce))) {
    return 'Produce';
  }
  if (['rice', 'pasta', 'flour', 'sugar', 'oil', 'salt', 'pepper', 'spice', 'sauce', 'vinegar'].some(pantry => name.includes(pantry))) {
    return 'Pantry & Dry Goods';
  }
  if (['frozen', 'ice cream'].some(frozen => name.includes(frozen))) {
    return 'Frozen';
  }
  
  return 'Other';
}

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    'Produce': '🥬',
    'Meat & Seafood': '🥩',
    'Dairy & Eggs': '🥛',
    'Pantry & Dry Goods': '🥫',
    'Frozen': '🧊',
    'Other': '🛒',
    'All Items': '📋'
  };
  
  return icons[category] || '📦';
}