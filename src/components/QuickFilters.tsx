// src/components/QuickFilters.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SearchFilters, DietaryRestriction, CuisineType } from '@/types/recipe';
import { 
  Clock, DollarSign, Zap, Heart, ChefHat, Users, Filter, X, 
  Globe, Utensils, Star, Flame, Leaf, ShieldCheck, ChevronDown, Menu
} from 'lucide-react';

interface QuickFiltersProps {
  onApplyFilter: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
  onAutoSearch?: () => void;
}

interface QuickFilter {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  activeColor: string;
  filters: SearchFilters;
  category: 'dietary' | 'time' | 'difficulty' | 'budget' | 'cuisine' | 'special';
}

interface CuisineFilter {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  cuisine: CuisineType;
}

export default function QuickFilters({ 
  onApplyFilter, 
  currentFilters,
  onAutoSearch 
}: QuickFiltersProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const quickFilters: QuickFilter[] = [
    // Time-based filters
    {
      id: 'quick-meals',
      name: '15 Min Meals',
      description: 'Fast recipes for busy days',
      icon: Clock,
      gradient: 'from-blue-500 to-blue-600',
      activeColor: 'bg-blue-500 text-white border-blue-500 shadow-md',
      category: 'time',
      filters: {
        maxCookingTime: 15,
        difficulty: 'Easy',
        dietary: []
      }
    },
    {
      id: 'quick-breakfast',
      name: 'Quick Breakfast',
      description: 'Morning energy in 10 minutes',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      activeColor: 'bg-amber-500 text-white border-amber-500 shadow-md',
      category: 'time',
      filters: {
        maxCookingTime: 10,
        dietary: []
      }
    },
    
    // Budget filters
    {
      id: 'budget-friendly',
      name: 'Budget Meals', 
      description: 'Under $5 per serving',
      icon: DollarSign,
      gradient: 'from-green-500 to-green-600',
      activeColor: 'bg-green-500 text-white border-green-500 shadow-md',
      category: 'budget',
      filters: {
        maxCost: 5,
        dietary: []
      }
    },
    {
      id: 'super-budget',
      name: 'Ultra Budget',
      description: 'Under $3 per serving',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      activeColor: 'bg-emerald-500 text-white border-emerald-500 shadow-md',
      category: 'budget',
      filters: {
        maxCost: 3,
        difficulty: 'Easy',
        dietary: []
      }
    },

    // Dietary filters
    {
      id: 'high-protein',
      name: 'High Protein',
      description: 'Great for fitness goals',
      icon: Zap,
      gradient: 'from-purple-500 to-purple-600',
      activeColor: 'bg-purple-500 text-white border-purple-500 shadow-md',
      category: 'dietary',
      filters: {
        dietary: ['high-protein' as DietaryRestriction]
      }
    },
    {
      id: 'vegetarian',
      name: 'Vegetarian',
      description: 'Plant-based options',
      icon: Leaf,
      gradient: 'from-green-500 to-emerald-500',
      activeColor: 'bg-green-500 text-white border-green-500 shadow-md',
      category: 'dietary',
      filters: {
        dietary: ['vegetarian' as DietaryRestriction]
      }
    },
    {
      id: 'vegan',
      name: 'Vegan',
      description: '100% plant-based',
      icon: Heart,
      gradient: 'from-emerald-500 to-green-600',
      activeColor: 'bg-emerald-500 text-white border-emerald-500 shadow-md',
      category: 'dietary',
      filters: {
        dietary: ['vegan' as DietaryRestriction]
      }
    },
    {
      id: 'healthy',
      name: 'Healthy',
      description: 'Nutritious & balanced',
      icon: ShieldCheck,
      gradient: 'from-teal-500 to-cyan-500',
      activeColor: 'bg-teal-500 text-white border-teal-500 shadow-md',
      category: 'dietary',
      filters: {
        dietary: ['healthy' as DietaryRestriction]
      }
    },

    // Difficulty filters
    {
      id: 'beginner',
      name: 'Beginner Friendly',
      description: 'Easy recipes to start with',
      icon: ChefHat,
      gradient: 'from-yellow-500 to-orange-500',
      activeColor: 'bg-yellow-500 text-white border-yellow-500 shadow-md',
      category: 'difficulty',
      filters: {
        difficulty: 'Easy',
        maxCookingTime: 30,
        dietary: []
      }
    },

    // Special filters
    {
      id: 'family',
      name: 'Family Meals',
      description: '4+ servings, kid-friendly',
      icon: Users,
      gradient: 'from-orange-500 to-red-500',
      activeColor: 'bg-orange-500 text-white border-orange-500 shadow-md',
      category: 'special',
      filters: {
        servings: 4,
        difficulty: 'Easy',
        maxCost: 15,
        dietary: []
      }
    },
    {
      id: 'trending',
      name: 'Trending',
      description: 'Popular this week',
      icon: Star,
      gradient: 'from-pink-500 to-rose-500',
      activeColor: 'bg-pink-500 text-white border-pink-500 shadow-md',
      category: 'special',
      filters: {
        dietary: []
      }
    }
  ];

  const cuisineFilters: CuisineFilter[] = [
    {
      id: 'italian',
      name: 'Italian',
      emoji: '🍝',
      description: 'Pasta, pizza & Mediterranean',
      gradient: 'from-red-500 to-green-500',
      cuisine: 'Italian' as CuisineType
    },
    {
      id: 'asian',
      name: 'Asian',
      emoji: '🥢',
      description: 'Stir-fry, noodles & rice',
      gradient: 'from-red-600 to-yellow-500',
      cuisine: 'Asian' as CuisineType
    },
    {
      id: 'mexican',
      name: 'Mexican',
      emoji: '🌮',
      description: 'Tacos, burritos & spice',
      gradient: 'from-orange-500 to-red-600',
      cuisine: 'Mexican' as CuisineType
    },
    {
      id: 'indian',
      name: 'Indian',
      emoji: '🍛',
      description: 'Curry, spices & flavor',
      gradient: 'from-orange-600 to-pink-500',
      cuisine: 'Indian' as CuisineType
    },
    {
      id: 'american',
      name: 'American',
      emoji: '🍔',
      description: 'Classic comfort food',
      gradient: 'from-blue-500 to-red-500',
      cuisine: 'American' as CuisineType
    },
    {
      id: 'french',
      name: 'French',
      emoji: '🥐',
      description: 'Elegant & sophisticated',
      gradient: 'from-blue-600 to-purple-500',
      cuisine: 'French' as CuisineType
    },
    {
      id: 'mediterranean',
      name: 'Mediterranean',
      emoji: '🫒',
      description: 'Healthy & fresh flavors',
      gradient: 'from-green-500 to-blue-500',
      cuisine: 'Mediterranean' as CuisineType
    },
    {
      id: 'japanese',
      name: 'Japanese',
      emoji: '🍣',
      description: 'Sushi, ramen & clean taste',
      gradient: 'from-pink-500 to-red-500',
      cuisine: 'Japanese' as CuisineType
    }
  ];

  const isFilterActive = (filter: QuickFilter): boolean => {
    const matches = {
      maxCookingTime: !filter.filters.maxCookingTime || currentFilters.maxCookingTime === filter.filters.maxCookingTime,
      maxCost: !filter.filters.maxCost || currentFilters.maxCost === filter.filters.maxCost,
      difficulty: !filter.filters.difficulty || currentFilters.difficulty === filter.filters.difficulty,
      servings: !filter.filters.servings || currentFilters.servings === filter.filters.servings,
      dietary: filter.filters.dietary.length === 0 || 
               filter.filters.dietary.every(d => currentFilters.dietary.includes(d)),
      cuisine: !filter.filters.cuisine || currentFilters.cuisine === filter.filters.cuisine
    };

    return Object.values(matches).every(match => match);
  };

  const isCuisineActive = (cuisine: CuisineType): boolean => {
    return currentFilters.cuisine === cuisine;
  };

  const handleFilterClick = (filter: QuickFilter) => {
    console.log('🔍 QuickFilter clicked:', filter.name, filter.filters);
    
    if (isFilterActive(filter)) {
      // If already active, clear filters
      console.log('🔍 Clearing active filter');
      onApplyFilter({ dietary: [] });
    } else {
      // Apply the quick filter
      console.log('🔍 Applying new filter:', filter.filters);
      onApplyFilter(filter.filters);
      
      // Auto-trigger search after a short delay
      setTimeout(() => {
        if (onAutoSearch) {
          console.log('🔍 Auto-triggering search...');
          onAutoSearch();
        }
      }, 100);
    }

    // Close dropdown on mobile after selection
    if (isMobile) {
      setIsDropdownOpen(false);
    }
  };

  const handleCuisineClick = (cuisine: CuisineType) => {
    console.log('🔍 Cuisine clicked:', cuisine);
    
    if (isCuisineActive(cuisine)) {
      // If already active, clear cuisine filter
      onApplyFilter({ ...currentFilters, cuisine: undefined });
    } else {
      // Apply cuisine filter
      onApplyFilter({ ...currentFilters, cuisine });
      
      // Auto-trigger search
      setTimeout(() => {
        if (onAutoSearch) {
          onAutoSearch();
        }
      }, 100);
    }

    // Close dropdown on mobile after selection
    if (isMobile) {
      setIsDropdownOpen(false);
    }
  };

  const clearAllFilters = () => {
    console.log('🔍 Clearing all filters');
    onApplyFilter({ dietary: [] });
    setIsDropdownOpen(false);
  };

  const hasActiveFilters = 
    currentFilters.cuisine || 
    currentFilters.dietary.length > 0 ||
    currentFilters.maxCookingTime ||
    currentFilters.difficulty ||
    currentFilters.maxCost ||
    currentFilters.servings;

  // Group filters by category
  const filtersByCategory = quickFilters.reduce((acc, filter) => {
    if (!acc[filter.category]) {
      acc[filter.category] = [];
    }
    acc[filter.category].push(filter);
    return acc;
  }, {} as Record<string, QuickFilter[]>);

  // Get all filters for dropdown (including cuisines)
  const getAllFilters = () => {
    const allFilters = [...quickFilters];
    cuisineFilters.forEach(cuisine => {
      allFilters.push({
        id: `cuisine-${cuisine.id}`,
        name: cuisine.name,
        description: cuisine.description,
        icon: Globe,
        gradient: cuisine.gradient,
        activeColor: 'bg-blue-500 text-white border-blue-500 shadow-md',
        category: 'cuisine' as const,
        filters: { cuisine: cuisine.cuisine, dietary: [] }
      });
    });
    return allFilters;
  };

  const getFilteredFilters = () => {
    const allFilters = getAllFilters();
    if (activeCategory === 'all') return allFilters;
    return allFilters.filter(f => f.category === activeCategory);
  };

  const categories = [
    { id: 'all', name: 'All Filters', icon: Filter },
    { id: 'cuisine', name: 'Cuisines', icon: Globe },
    { id: 'time', name: 'Time', icon: Clock },
    { id: 'dietary', name: 'Diet & Health', icon: Leaf },
    { id: 'budget', name: 'Budget', icon: DollarSign },
    { id: 'difficulty', name: 'Difficulty', icon: ChefHat },
    { id: 'special', name: 'Special', icon: Star }
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (currentFilters.cuisine) count++;
    count += currentFilters.dietary.length;
    if (currentFilters.maxCookingTime) count++;
    if (currentFilters.difficulty) count++;
    if (currentFilters.maxCost) count++;
    if (currentFilters.servings) count++;
    return count;
  };

  // Mobile Dropdown View
  if (isMobile) {
    return (
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-m font-bold text-gray-900">Quick Filters</h3>
              <p className="text-sm text-gray-600">Apply filter combinations</p>
            </div>
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Mobile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <Menu className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">
                Choose Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow">
              {/* Category Tabs */}
              <div className="border-b border-gray-200 p-2">
                <div className="flex gap-1 overflow-x-auto">
                  {categories.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-small whitespace-nowrap transition-colors ${
                          activeCategory === category.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Options */}
              <div className="max-h-80 overflow-y-auto p-2">
                <div className="space-y-2">
                  {getFilteredFilters().map((filter) => {
                    const Icon = filter.icon;
                    const isActive = filter.category === 'cuisine' 
                      ? isCuisineActive(filter.filters.cuisine!)
                      : isFilterActive(filter);
                    
                    return (
                      <button
                        key={filter.id}
                        onClick={() => {
                          if (filter.category === 'cuisine') {
                            handleCuisineClick(filter.filters.cuisine!);
                          } else {
                            handleFilterClick(filter);
                          }
                        }}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                          isActive
                            ? 'bg-blue-50 border-2 border-blue-200'
                            : 'border-2 border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${filter.gradient} flex-shrink-0`}>
                          {filter.category === 'cuisine' ? (
                            <span className="text-lg">
                              {cuisineFilters.find(c => c.cuisine === filter.filters.cuisine)?.emoji}
                            </span>
                          ) : (
                            <Icon className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {filter.name}
                            </span>
                            {isActive && <span className="text-blue-600">✓</span>}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {filter.description}
                          </p>
                          {/* Filter details */}
                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                            {filter.filters.maxCost && (
                              <div>💰 Under ${filter.filters.maxCost}</div>
                            )}
                            {filter.filters.maxCookingTime && (
                              <div>⏱️ {filter.filters.maxCookingTime} min max</div>
                            )}
                            {filter.filters.difficulty && (
                              <div>👨‍🍳 {filter.filters.difficulty}</div>
                            )}
                            {filter.filters.servings && (
                              <div>👥 {filter.filters.servings}+ servings</div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popular Combinations in Dropdown */}
              <div className="border-t border-gray-200 p-3">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Popular Combinations</h5>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const filters = {
                        cuisine: 'Italian' as CuisineType,
                        maxCookingTime: 30,
                        dietary: ['vegetarian' as DietaryRestriction]
                      };
                      onApplyFilter(filters);
                      setTimeout(() => onAutoSearch?.(), 100);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="text-sm font-medium">🍝 Quick Italian Vegetarian</div>
                  </button>
                  <button
                    onClick={() => {
                      const filters = {
                        cuisine: 'Asian' as CuisineType,
                        maxCookingTime: 20,
                        dietary: []
                      };
                      onApplyFilter(filters);
                      setTimeout(() => onAutoSearch?.(), 100);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="text-sm font-medium">🥢 Fast Asian Cuisine</div>
                  </button>
                  <button
                    onClick={() => {
                      const filters = {
                        maxCost: 5,
                        maxCookingTime: 25,
                        difficulty: 'Easy' as const,
                        dietary: []
                      };
                      onApplyFilter(filters);
                      setTimeout(() => onAutoSearch?.(), 100);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="text-sm font-medium">💰 Cheap & Quick</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Filter className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium text-gray-900">Active Filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentFilters.cuisine && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  🍽️ {currentFilters.cuisine}
                </span>
              )}
              {currentFilters.dietary.map(dietary => (
                <span key={dietary} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  🥗 {dietary}
                </span>
              ))}
              {currentFilters.difficulty && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  👨‍🍳 {currentFilters.difficulty}
                </span>
              )}
              {currentFilters.maxCookingTime && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  ⏱️ ≤ {currentFilters.maxCookingTime} min
                </span>
              )}
              {currentFilters.maxCost && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  💵 ≤ ${currentFilters.maxCost}
                </span>
              )}
              {currentFilters.servings && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  👥 {currentFilters.servings}+ servings
                </span>
              )}
            </div>
            
            <div className="mt-3 text-sm text-blue-600">
              🔍 Filters applied! {onAutoSearch ? 'Searching automatically...' : 'Click search to apply filters.'}
            </div>
          </div>
        )}

        {/* Smart Suggestion */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="text-xl">💡</div>
            <div>
              <div className="font-medium mb-1">Smart Suggestion</div>
              <div className="text-blue-100 text-sm">
                {getSuggestedFilter()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-7xl mx-auto space-y-10">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Quick Filters</h3>
          <p className="text-gray-600 mt-1">Find recipes that match your preferences</p>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Simple Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Cuisines */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-orange-100">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Cuisines</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {cuisineFilters.map((cuisineFilter) => {
              const active = isCuisineActive(cuisineFilter.cuisine);
              
              return (
                <button
                  key={cuisineFilter.id}
                  onClick={() => handleCuisineClick(cuisineFilter.cuisine)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                    active 
                      ? 'bg-orange-50 border-2 border-orange-200 shadow-md' 
                      : 'bg-white border border-gray-200 hover:border-orange-200 hover:shadow-sm'
                  }`}
                >
                  <span className="text-3xl flex-shrink-0">{cuisineFilter.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-lg">
                      {cuisineFilter.name}
                      {active && <span className="ml-2 text-orange-600">✓</span>}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {cuisineFilter.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: All Other Filters */}
        <div className="space-y-8">
          
          {/* Time Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Time & Speed</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {filtersByCategory.time?.map((filter) => {
                const Icon = filter.icon;
                const active = isFilterActive(filter);
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterClick(filter)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                      active 
                        ? 'bg-blue-50 border-2 border-blue-200 shadow-md' 
                        : 'bg-white border border-gray-200 hover:border-blue-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${filter.gradient} flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-lg">
                        {filter.name}
                        {active && <span className="ml-2 text-blue-600">✓</span>}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {filter.description}
                      </div>
                      {filter.filters.maxCookingTime && (
                        <div className="text-xs text-blue-600 mt-1 font-medium">
                          ⏱️ {filter.filters.maxCookingTime} minutes maximum
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-green-100">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Budget Friendly</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {filtersByCategory.budget?.map((filter) => {
                const Icon = filter.icon;
                const active = isFilterActive(filter);
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterClick(filter)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                      active 
                        ? 'bg-green-50 border-2 border-green-200 shadow-md' 
                        : 'bg-white border border-gray-200 hover:border-green-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${filter.gradient} flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-lg">
                        {filter.name}
                        {active && <span className="ml-2 text-green-600">✓</span>}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {filter.description}
                      </div>
                      {filter.filters.maxCost && (
                        <div className="text-xs text-green-600 mt-1 font-medium">
                          💰 Under ${filter.filters.maxCost} per serving
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-100">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Diet & Health</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {filtersByCategory.dietary?.map((filter) => {
                const Icon = filter.icon;
                const active = isFilterActive(filter);
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterClick(filter)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                      active 
                        ? 'bg-emerald-50 border-2 border-emerald-200 shadow-md' 
                        : 'bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${filter.gradient} flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-lg">
                        {filter.name}
                        {active && <span className="ml-2 text-emerald-600">✓</span>}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {filter.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Special Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-100">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Special & Difficulty</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[...filtersByCategory.difficulty || [], ...filtersByCategory.special || []].map((filter) => {
                const Icon = filter.icon;
                const active = isFilterActive(filter);
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterClick(filter)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                      active 
                        ? 'bg-purple-50 border-2 border-purple-200 shadow-md' 
                        : 'bg-white border border-gray-200 hover:border-purple-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${filter.gradient} flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-lg">
                        {filter.name}
                        {active && <span className="ml-2 text-purple-600">✓</span>}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {filter.description}
                      </div>
                      {filter.filters.servings && (
                        <div className="text-xs text-purple-600 mt-1 font-medium">
                          👥 {filter.filters.servings}+ servings
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Popular Combinations */}
<div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-4 border border-blue-100">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-14 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-xl">⚡</span>
      </div>
      <div>
        <h4 className="text-2xl font-bold text-gray-900">Popular Combinations</h4>
        <p className="text-gray-600 text-sm mt-1">Quick shortcuts to common recipe searches</p>
      </div>
    </div>
    
    {/* Quick stats */}
    <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white/60 rounded-full">
      <span className="text-xs text-gray-600 font-medium">Most requested</span>
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
    </div>
  </div>
  
  {/* Better responsive grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
    <button
      onClick={() => {
        const filters = {
          cuisine: 'Italian' as CuisineType,
          maxCookingTime: 30,
          dietary: ['vegetarian' as DietaryRestriction]
        };
        onApplyFilter(filters);
        setTimeout(() => onAutoSearch?.(), 100);
      }}
      className="group relative overflow-hidden bg-white rounded-2xl p-6 transition-all duration-300 border border-gray-200 hover:border-orange-200 hover:shadow-xl hover:scale-105"
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 text-center">
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🍝</div>
        <div className="font-bold text-gray-900 text-lg mb-2">Italian Vegetarian</div>
        <div className="text-sm text-gray-600 mb-3">Perfect pasta without meat</div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">30 min</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Veggie</span>
        </div>
      </div>
      
      {/* Hover effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </button>
    
    <button
      onClick={() => {
        const filters = {
          cuisine: 'Asian' as CuisineType,
          maxCookingTime: 20,
          dietary: []
        };
        onApplyFilter(filters);
        setTimeout(() => onAutoSearch?.(), 100);
      }}
      className="group relative overflow-hidden bg-white rounded-2xl p-6 transition-all duration-300 border border-gray-200 hover:border-red-200 hover:shadow-xl hover:scale-105"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 text-center">
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🥢</div>
        <div className="font-bold text-gray-900 text-lg mb-2">Fast Asian</div>
        <div className="text-sm text-gray-600 mb-3">Quick stir-fry & noodles</div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">20 min</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Speedy</span>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </button>
    
    <button
      onClick={() => {
        const filters = {
          maxCost: 5,
          maxCookingTime: 25,
          difficulty: 'Easy' as const,
          dietary: []
        };
        onApplyFilter(filters);
        setTimeout(() => onAutoSearch?.(), 100);
      }}
      className="group relative overflow-hidden bg-white rounded-2xl p-6 transition-all duration-300 border border-gray-200 hover:border-green-200 hover:shadow-xl hover:scale-105"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 text-center">
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💰</div>
        <div className="font-bold text-gray-900 text-lg mb-2">Budget Friendly</div>
        <div className="text-sm text-gray-600 mb-3">Delicious & affordable</div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Under $5</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Easy</span>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </button>
    
    <button
      onClick={() => {
        const filters = {
          dietary: ['high-protein' as DietaryRestriction, 'healthy' as DietaryRestriction],
          maxCookingTime: 30
        };
        onApplyFilter(filters);
        setTimeout(() => onAutoSearch?.(), 100);
      }}
      className="group relative overflow-hidden bg-white rounded-2xl p-6 transition-all duration-300 border border-gray-200 hover:border-purple-200 hover:shadow-xl hover:scale-105"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 text-center">
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💪</div>
        <div className="font-bold text-gray-900 text-lg mb-2">High Protein</div>
        <div className="text-sm text-gray-600 mb-3">Fuel your fitness goals</div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Protein</span>
          <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full">Healthy</span>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </button>
  </div>
  
  {/* Additional combinations */}
  <div className="mt-6 pt-6 border-t border-gray-200">
    <div className="text-center">
      <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
        <span>More combinations</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  </div>
  
  {/* Pro tip */}
  <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-200/50">
    <div className="flex items-start gap-3">
      <div className="text-lg">💡</div>
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm mb-1">Pro Tip</div>
        <div className="text-xs text-gray-600 leading-relaxed">
          These combinations are based on the most popular recipe searches. Click any combination to instantly apply multiple filters and find exactly what you're craving!
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <h5 className="text-lg font-bold text-gray-900">Active Filters</h5>
            <span className="text-sm text-gray-500">({getActiveFiltersCount()} applied)</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {currentFilters.cuisine && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <span>🍽️</span>
                {currentFilters.cuisine}
              </span>
            )}
            {currentFilters.dietary.map(dietary => (
              <span key={dietary} className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <span>🥗</span>
                {dietary}
              </span>
            ))}
            {currentFilters.difficulty && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <span>👨‍🍳</span>
                {currentFilters.difficulty}
              </span>
            )}
            {currentFilters.maxCookingTime && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                <span>⏱️</span>
                ≤ {currentFilters.maxCookingTime} min
              </span>
            )}
            {currentFilters.maxCost && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                <span>💵</span>
                ≤ ${currentFilters.maxCost}
              </span>
            )}
            {currentFilters.servings && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                <span>👥</span>
                {currentFilters.servings}+ servings
              </span>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700 font-medium">
              🔍 {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied! 
              {onAutoSearch ? ' Searching automatically...' : ' Click search to apply filters.'}
            </div>
          </div>
        </div>
      )}

      {/* Smart Suggestion */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <div className="text-xl font-bold mb-2">Smart Suggestion</div>
            <div className="text-blue-100 leading-relaxed">
              {getSuggestedFilter()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 

// Helper function to provide contextual suggestions
function getSuggestedFilter(): string {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  if (hour < 10) {
    return "It's morning! Try 'Quick Breakfast' for fast morning options that will energize your day.";
  } else if (hour < 17) {
    return "Lunch time! 'Budget Meals' are perfect for midday cooking without breaking the bank.";
  } else if (day === 0 || day === 6) {
    return "Weekend vibes! Try 'Family Meals' for cooking together and creating memorable moments.";
  } else {
    return "Weeknight dinner? '15 Min Meals' will save you time and reduce stress after a busy day.";
  }
}