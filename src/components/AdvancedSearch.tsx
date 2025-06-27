// src/components/AdvancedSearch.tsx
// AI-enhanced natural language recipe search

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Recipe, SearchFilters } from '@/types/recipe';
import { Search, Mic, MicOff, Sparkles, Zap, Clock, Send, X } from 'lucide-react';

interface AdvancedSearchProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onNaturalLanguageQuery: (query: string) => Promise<Recipe[]>;
  isLoading?: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'ingredient' | 'cuisine' | 'dietary' | 'time' | 'style';
  filters?: SearchFilters;
  icon: string;
}

interface QueryAnalysis {
  ingredients: string[];
  constraints: {
    time?: number;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    cuisine?: string;
    dietary?: string[];
    servings?: number;
  };
  intent: 'find_recipe' | 'get_suggestions' | 'learn_technique' | 'plan_meal';
  confidence: number;
}

export default function AdvancedSearch({ 
  onSearch, 
  onNaturalLanguageQuery, 
  isLoading = false 
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart search suggestions
  const suggestions: SearchSuggestion[] = [
    {
      id: 'quick_dinner',
      text: 'Quick dinner ideas under 30 minutes',
      type: 'time',
      icon: '⚡',
      filters: { maxCookingTime: 30, dietary: [] }
    },
    {
      id: 'healthy_lunch',
      text: 'Healthy lunch recipes with high protein',
      type: 'dietary',
      icon: '🥗',
      filters: { dietary: ['high-protein'], maxCookingTime: 45 }
    },
    {
      id: 'comfort_food',
      text: 'Comfort food for a cozy evening',
      type: 'style',
      icon: '🏠',
      filters: { cuisine: 'American', difficulty: 'Easy', dietary: [] }
    },
    {
      id: 'mediterranean',
      text: 'Fresh Mediterranean flavors',
      type: 'cuisine',
      icon: '🇬🇷',
      filters: { cuisine: 'Mediterranean', dietary: [] }
    },
    {
      id: 'batch_cooking',
      text: 'Recipes perfect for meal prep',
      type: 'style',
      icon: '📦',
      filters: { servings: 6, dietary: [] }
    },
    {
      id: 'one_pot',
      text: 'One-pot meals for easy cleanup',
      type: 'style',
      icon: '🍲',
      filters: { dietary: [] }
    }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      // Configure recognition settings with null check
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    // Load recent queries from localStorage
    const saved = localStorage.getItem('recentQueries');
    if (saved) {
      setRecentQueries(JSON.parse(saved));
    }
  }, []);

  // Analyze query with AI
  useEffect(() => {
    if (query.length > 3) {
      analyzeQuery(query);
    } else {
      setQueryAnalysis(null);
      setFollowUpQuestions([]);
    }
  }, [query]);

  const analyzeQuery = async (searchQuery: string) => {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 300));

    const analysis: QueryAnalysis = {
      ingredients: extractIngredients(searchQuery),
      constraints: extractConstraints(searchQuery),
      intent: determineIntent(searchQuery),
      confidence: 0.85
    };

    setQueryAnalysis(analysis);
    setFollowUpQuestions(generateFollowUpQuestions(analysis));
  };

  const extractIngredients = (text: string): string[] => {
    const commonIngredients = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp',
      'rice', 'pasta', 'bread', 'noodles',
      'tomato', 'onion', 'garlic', 'potato', 'carrot', 'broccoli',
      'cheese', 'milk', 'eggs', 'butter',
      'basil', 'oregano', 'thyme', 'rosemary'
    ];

    return commonIngredients.filter(ingredient => 
      text.toLowerCase().includes(ingredient)
    );
  };

  const extractConstraints = (text: string) => {
    const constraints: QueryAnalysis['constraints'] = {};

    // Time constraints
    const timeMatches = text.match(/(\d+)\s*(minute|min|hour|hr)/gi);
    if (timeMatches) {
      const time = parseInt(timeMatches[0]);
      const unit = timeMatches[0].toLowerCase();
      constraints.time = unit.includes('hour') ? time * 60 : time;
    }

    // Difficulty
    if (text.toLowerCase().includes('easy') || text.toLowerCase().includes('simple')) {
      constraints.difficulty = 'Easy';
    } else if (text.toLowerCase().includes('advanced') || text.toLowerCase().includes('complex')) {
      constraints.difficulty = 'Hard';
    }

    // Cuisine
    const cuisines = ['italian', 'mexican', 'asian', 'indian', 'french', 'mediterranean'];
    cuisines.forEach(cuisine => {
      if (text.toLowerCase().includes(cuisine)) {
        constraints.cuisine = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
      }
    });

    // Dietary
    const dietary = [];
    if (text.toLowerCase().includes('vegetarian')) dietary.push('vegetarian');
    if (text.toLowerCase().includes('vegan')) dietary.push('vegan');
    if (text.toLowerCase().includes('gluten-free')) dietary.push('gluten-free');
    if (text.toLowerCase().includes('healthy')) dietary.push('healthy');
    if (text.toLowerCase().includes('low-carb')) dietary.push('low-carb');
    
    if (dietary.length > 0) {
      constraints.dietary = dietary;
    }

    // Servings
    const servingMatch = text.match(/(\d+)\s*(people|person|serving)/i);
    if (servingMatch) {
      constraints.servings = parseInt(servingMatch[1]);
    }

    return constraints;
  };

  const determineIntent = (text: string): QueryAnalysis['intent'] => {
    if (text.toLowerCase().includes('how to') || text.toLowerCase().includes('technique')) {
      return 'learn_technique';
    }
    if (text.toLowerCase().includes('meal plan') || text.toLowerCase().includes('week')) {
      return 'plan_meal';
    }
    if (text.toLowerCase().includes('suggest') || text.toLowerCase().includes('recommend')) {
      return 'get_suggestions';
    }
    return 'find_recipe';
  };

  const generateFollowUpQuestions = (analysis: QueryAnalysis): string[] => {
    const questions = [];

    if (analysis.ingredients.length > 0) {
      questions.push(`Would you like recipes that use ${analysis.ingredients.join(' and ')} as main ingredients?`);
    }

    if (analysis.constraints.time) {
      questions.push(`Should I focus on recipes under ${analysis.constraints.time} minutes?`);
    }

    if (!analysis.constraints.dietary) {
      questions.push('Any dietary restrictions I should know about?');
    }

    if (!analysis.constraints.servings) {
      questions.push('How many people are you cooking for?');
    }

    return questions.slice(0, 2); // Limit to 2 questions
  };

  const startVoiceRecognition = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    // Save to recent queries
    const updated = [query, ...recentQueries.filter(q => q !== query)].slice(0, 5);
    setRecentQueries(updated);
    localStorage.setItem('recentQueries', JSON.stringify(updated));

    // Determine search type
    if (queryAnalysis && queryAnalysis.confidence > 0.7) {
      // Use natural language processing
      await onNaturalLanguageQuery(query);
    } else {
      // Use traditional search with extracted filters
      const filters: SearchFilters = {
        dietary: (queryAnalysis?.constraints.dietary || []) as any[],
        maxCookingTime: queryAnalysis?.constraints.time,
        difficulty: queryAnalysis?.constraints.difficulty,
        cuisine: queryAnalysis?.constraints.cuisine as any,
        servings: queryAnalysis?.constraints.servings
      };
      onSearch(query, filters);
    }

    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    if (suggestion.filters) {
      onSearch(suggestion.text, suggestion.filters);
    }
    setShowSuggestions(false);
  };

  const handleFollowUpClick = (question: string) => {
    setQuery(question);
    inputRef.current?.focus();
  };

  const clearQuery = () => {
    setQuery('');
    setQueryAnalysis(null);
    setFollowUpQuestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Main Search Input */}
      <div className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Try: 'Quick chicken dinner for 4 people' or 'Healthy vegetarian lunch under 30 minutes'"
              className="w-full pl-12 pr-20 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            
            {query && (
              <button
                onClick={clearQuery}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="ml-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </button>
        </div>

        {/* AI Analysis Display */}
        {queryAnalysis && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI Understanding:</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {Math.round(queryAnalysis.confidence * 100)}% confident
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {queryAnalysis.ingredients.length > 0 && (
                <div>
                  <span className="font-medium text-purple-800">Ingredients detected:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {queryAnalysis.ingredients.map(ingredient => (
                      <span key={ingredient} className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <span className="font-medium text-purple-800">Intent:</span>
                <span className="ml-2 text-purple-700">
                  {queryAnalysis.intent.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {Object.keys(queryAnalysis.constraints).length > 0 && (
              <div className="mt-2">
                <span className="font-medium text-purple-800 text-sm">Constraints:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {queryAnalysis.constraints.time && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {queryAnalysis.constraints.time} min
                    </span>
                  )}
                  {queryAnalysis.constraints.difficulty && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {queryAnalysis.constraints.difficulty}
                    </span>
                  )}
                  {queryAnalysis.constraints.cuisine && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      {queryAnalysis.constraints.cuisine}
                    </span>
                  )}
                  {queryAnalysis.constraints.servings && (
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                      {queryAnalysis.constraints.servings} servings
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">
              💡 AI Assistant asks:
            </div>
            <div className="space-y-2">
              {followUpQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleFollowUpClick(question)}
                  className="block text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded transition-colors w-full"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {showSuggestions && !queryAnalysis && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Quick Suggestions */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Quick Ideas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{suggestion.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{suggestion.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Queries */}
          {recentQueries.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Searches</h4>
              <div className="space-y-1">
                {recentQueries.map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(recentQuery)}
                    className="block text-left w-full p-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    {recentQuery}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}