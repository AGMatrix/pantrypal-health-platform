// src/components/SmartShoppingList.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Recipe } from '@/types/recipe';
import { X, ShoppingCart, Check, Trash2, Plus, AlertCircle, Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';

interface ShoppingListItem {
  id: string;
  recipeId?: string;
  name: string;
  amount?: number;
  unit?: string;
  estimatedPrice?: number;
  checked: boolean;
  isAlreadyOwned: boolean;
  category?: string;
}

interface SmartShoppingListProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  userIngredients: string[];
  onCartUpdate?: () => void;
}

export default function SmartShoppingList({
  isOpen,
  onClose,
  recipes,
  userIngredients,
  onCartUpdate
}: SmartShoppingListProps) {
  const { user, updateUserData } = useAuth();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load shopping list when component opens
  useEffect(() => {
    if (isOpen && user) {
      loadShoppingList();
    }
  }, [isOpen, user]);

  // Add recipes to shopping list when component opens
  useEffect(() => {
    if (isOpen && recipes.length > 0 && user && shoppingList.length === 0) {
      addRecipesToShoppingList();
    }
  }, [isOpen, recipes, user, shoppingList.length]);

  // Load shopping list from API
  // In SmartShoppingList.tsx, update loadShoppingList to sync with AuthContext:
const loadShoppingList = async () => {
  if (!user) return;

  setIsLoading(true);
  setError(null);

  try {
    console.log('🔄 Loading shopping list for user:', user.email);
    
    const response = await fetch('/api/user/shopping-list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.accessToken || 'demo'}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      const items = result.shopping_list || [];
      console.log('✅ Loaded shopping list:', items.length, 'items');
      setShoppingList(items);
      setHasUnsavedChanges(false);
      
      // 🔥 SYNC WITH AUTH CONTEXT
      await updateUserData({ shoppingList: items });
      console.log('🔄 Synced AuthContext with', items.length, 'items');
    } else {
      throw new Error(result.error || 'Failed to load shopping list');
    }
  } catch (err) {
    console.error('❌ Failed to load shopping list:', err);
    setError(err instanceof Error ? err.message : 'Failed to load shopping list');
    setShoppingList([]);
  } finally {
    setIsLoading(false);
  }
};

  // Save shopping list to API
  const saveShoppingList = async (newList: ShoppingListItem[]) => {
    if (!user) return;
  
    setIsSaving(true);
    setError(null);
  
    try {
      console.log('💾 Saving shopping list:', newList.length, 'items');
      
      const response = await fetch('/api/user/shopping-list', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.accessToken || 'demo'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopping_list: newList
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Shopping list saved successfully');
        setHasUnsavedChanges(false);
        
        await updateUserData({ shoppingList: newList });
        console.log('🔄 Updated AuthContext with', newList.length, 'items');
        
        onCartUpdate?.();
      } else {
        throw new Error(result.error || 'Failed to save shopping list');
      }
    } catch (err) {
      console.error('❌ Failed to save shopping list:', err);
      setError(err instanceof Error ? err.message : 'Failed to save shopping list');
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Update shopping list with debounced save
  const updateShoppingList = useCallback((newList: ShoppingListItem[]) => {
    setShoppingList(newList);
    setHasUnsavedChanges(true);
    
    // Debounced save
    const timeoutId = setTimeout(() => {
      saveShoppingList(newList);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [user]);

  // Add recipes to shopping list
  const addRecipesToShoppingList = async () => {
    if (!user || !recipes.length) return;

    console.log('🛒 Adding recipes to shopping list:', recipes.length, 'recipes');

    for (const recipe of recipes) {
      try {
        const response = await fetch('/api/user/shopping-list', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.accessToken || 'demo'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeId: recipe.id,
            ingredients: recipe.ingredients
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add recipe ${recipe.title}`);
        }

        const result = await response.json();
        if (result.success) {
          console.log('✅ Added recipe to shopping list:', recipe.title);
        }
      } catch (err) {
        console.error('❌ Failed to add recipe:', recipe.title, err);
      }
    }

    // Reload the shopping list to get the updated data
    await loadShoppingList();
  };

  // Toggle item checked status
  const toggleItemCheck = async (itemId: string) => {
    const updatedList = shoppingList.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    updateShoppingList(updatedList);
  };

  // Remove item from list
  const removeItem = async (itemId: string) => {
    const updatedList = shoppingList.filter(item => item.id !== itemId);
    updateShoppingList(updatedList);
  };

  // Add custom item
  const addCustomItem = (name: string) => {
    if (!name.trim() || !user) return;
    
    const newItem: ShoppingListItem = {
      id: `custom-${Date.now()}-${Math.random()}`,
      name: name.trim(),
      checked: false,
      isAlreadyOwned: false,
      category: 'Other'
    };
    
    const updatedList = [...shoppingList, newItem];
    updateShoppingList(updatedList);
  };

  // Clear all items
  const clearAllItems = () => {
    updateShoppingList([]);
  };

  // Clear completed items
  const clearCompletedItems = () => {
    const updatedList = shoppingList.filter(item => !item.checked);
    updateShoppingList(updatedList);
  };

  // Categorize ingredient for better organization
  const categorizeIngredient = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase();
    
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('fish') || name.includes('salmon')) {
      return 'Meat & Seafood';
    }
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('butter') || name.includes('cream')) {
      return 'Dairy';
    }
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('berry') || name.includes('grape')) {
      return 'Fruits';
    }
    if (name.includes('carrot') || name.includes('onion') || name.includes('tomato') || name.includes('lettuce') || name.includes('pepper') || name.includes('cucumber')) {
      return 'Vegetables';
    }
    if (name.includes('bread') || name.includes('rice') || name.includes('pasta') || name.includes('flour') || name.includes('cereal')) {
      return 'Grains & Bread';
    }
    if (name.includes('oil') || name.includes('vinegar') || name.includes('salt') || name.includes('pepper') || name.includes('spice') || name.includes('sauce')) {
      return 'Condiments & Spices';
    }
    
    return 'Other';
  };

  // Group items by category
  const groupedItems = shoppingList.reduce((groups, item) => {
    const category = item.category || categorizeIngredient(item.name);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ShoppingListItem[]>);

  // Calculate totals
  const totalItems = shoppingList.length;
  const completedItems = shoppingList.filter(item => item.checked).length;
  const totalEstimatedPrice = shoppingList
    .filter(item => !item.checked && item.estimatedPrice)
    .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Smart Shopping List</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{totalItems} items</span>
                <span>•</span>
                <span>{completedItems} completed</span>
                {totalEstimatedPrice > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-medium">${totalEstimatedPrice.toFixed(2)} estimated</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </div>
            )}
            
            {/* Connection status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            {/* Save status */}
            {isSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            )}
            
            {hasUnsavedChanges && !isSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                Unsaved changes
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={loadShoppingList}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh from server"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={loadShoppingList}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {totalItems === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your shopping list is empty</h3>
              <p className="text-gray-600 mb-6">Add recipes to automatically generate your shopping list</p>
              <AddCustomItemForm onAdd={addCustomItem} />
            </div>
          ) : (
            /* Shopping List */
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <AddCustomItemForm onAdd={addCustomItem} />
                {completedItems > 0 && (
                  <button
                    onClick={clearCompletedItems}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Clear Completed ({completedItems})
                  </button>
                )}
                <button
                  onClick={clearAllItems}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Grouped Items */}
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-lg border-b border-gray-200 pb-2">
                    {category} ({items.length})
                  </h3>
                  <div className="grid gap-3">
                    {items.map((item) => (
                      <ShoppingListItemComponent
                        key={item.id}
                        item={item}
                        onToggleCheck={toggleItemCheck}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {totalItems > 0 && (
                <span>
                  {completedItems} of {totalItems} items completed
                  {totalEstimatedPrice > 0 && (
                    <span className="ml-2">• ${totalEstimatedPrice.toFixed(2)} remaining</span>
                  )}
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              
              {totalItems > 0 && (
                <button
                  onClick={() => {
                    alert('Export to store feature coming soon!');
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                  Export to Store
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual shopping list item component
function ShoppingListItemComponent({
  item,
  onToggleCheck,
  onRemove
}: {
  item: ShoppingListItem;
  onToggleCheck: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
      item.checked 
        ? 'bg-green-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <button
        onClick={() => onToggleCheck(item.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.checked
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {item.checked && <Check className="w-4 h-4" />}
      </button>
      
      <div className="flex-1">
        <div className={`font-medium ${item.checked ? 'text-green-800 line-through' : 'text-gray-900'}`}>
          {item.name}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
          {item.amount && item.unit && (
            <span>{item.amount} {item.unit}</span>
          )}
          
          {item.estimatedPrice && (
            <span className="font-medium">${item.estimatedPrice.toFixed(2)}</span>
          )}
          
          {item.recipeId && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              Recipe ingredient
            </span>
          )}
          
          {item.isAlreadyOwned && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              You have this
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Add custom item form component
function AddCustomItemForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [newItemName, setNewItemName] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onAdd(newItemName.trim());
      setNewItemName('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
        placeholder="Add custom item..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2 font-medium"
      >
        <Plus className="w-4 h-4" />
        Add
      </button>
    </form>
  );
}