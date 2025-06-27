// src/components/WorkingShoppingList.tsx
'use client';

import React from 'react';
import { Recipe } from '@/types/recipe';
import { X, ShoppingCart } from 'lucide-react';

interface WorkingShoppingListProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
}

export default function WorkingShoppingList({ isOpen, onClose, recipes }: WorkingShoppingListProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Shopping List</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-2">
          {recipes.flatMap(recipe => 
            recipe.ingredients.map((ingredient, index) => (
              <div key={`${recipe.id}-${index}`} className="p-3 border rounded-lg">
                <span>{ingredient.amount} {ingredient.unit} {ingredient.name}</span>
                <span className="text-sm text-gray-600 ml-2">({recipe.title})</span>
              </div>
            ))
          )}
        </div>
        
        <button 
          onClick={onClose}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}