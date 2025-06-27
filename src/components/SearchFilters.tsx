// src/components/SearchFilters.tsx
// This component provides filtering options for recipe search

'use client';

import React from 'react';
import { SearchFilters as SearchFiltersType, CuisineType, DietaryRestriction } from '@/types/recipe';
import { ChevronDown } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

export default function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  // Available options
  const cuisineOptions: CuisineType[] = [
    'Italian', 'Mexican', 'Asian', 'Indian', 'American', 
    'Mediterranean', 'French', 'Thai', 'Chinese', 'Japanese'
  ];

  const dietaryOptions: DietaryRestriction[] = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
    'nut-free', 'low-carb', 'keto'
  ];

  const difficultyOptions = ['Easy', 'Medium', 'Hard'] as const;

  // Update a specific filter
  const updateFilter = (key: keyof SearchFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // Toggle dietary restriction
  const toggleDietary = (dietary: DietaryRestriction) => {
    const current = filters.dietary || [];
    const updated = current.includes(dietary)
      ? current.filter(d => d !== dietary)
      : [...current, dietary];
    
    updateFilter('dietary', updated);
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      dietary: [],
    });
  };

  const hasActiveFilters = 
    filters.cuisine || 
    (filters.dietary && filters.dietary.length > 0) ||
    filters.maxCookingTime ||
    filters.difficulty ||
    filters.maxCost;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Filter Recipes</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cuisine Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Cuisine Type
        </label>
        <div className="relative">
          <select
            value={filters.cuisine || ''}
            onChange={(e) => updateFilter('cuisine', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">Any Cuisine</option>
            {cuisineOptions.map(cuisine => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Dietary Preferences
        </label>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map(dietary => (
            <button
              key={dietary}
              onClick={() => toggleDietary(dietary)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                (filters.dietary || []).includes(dietary)
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {dietary.charAt(0).toUpperCase() + dietary.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cooking Time */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Max Cooking Time
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="10"
            max="120"
            step="10"
            value={filters.maxCookingTime || 60}
            onChange={(e) => updateFilter('maxCookingTime', parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-600 min-w-[60px]">
            {filters.maxCookingTime || 60} min
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>10 min</span>
          <span>2 hours</span>
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Difficulty Level
        </label>
        <div className="flex gap-2">
          {difficultyOptions.map(difficulty => (
            <button
              key={difficulty}
              onClick={() => updateFilter('difficulty', 
                filters.difficulty === difficulty ? undefined : difficulty
              )}
              className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                filters.difficulty === difficulty
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Max Cost Per Serving
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">$1</span>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={filters.maxCost || 10}
            onChange={(e) => updateFilter('maxCost', parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-600 min-w-[50px]">
            ${filters.maxCost || 10}
          </span>
        </div>
      </div>

      {/* Servings */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Number of Servings
        </label>
        <select
          value={filters.servings || ''}
          onChange={(e) => updateFilter('servings', e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
        >
          <option value="">Any Amount</option>
          <option value="1">1 serving</option>
          <option value="2">2 servings</option>
          <option value="4">4 servings</option>
          <option value="6">6 servings</option>
          <option value="8">8+ servings</option>
        </select>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {filters.cuisine && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {filters.cuisine}
              </span>
            )}
            {filters.dietary?.map(dietary => (
              <span key={dietary} className="px-2 py-1 bg-green-100 text-green-800 rounded">
                {dietary}
              </span>
            ))}
            {filters.difficulty && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                {filters.difficulty}
              </span>
            )}
            {filters.maxCookingTime && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                ≤ {filters.maxCookingTime} min
              </span>
            )}
            {filters.maxCost && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                ≤ ${filters.maxCost}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}