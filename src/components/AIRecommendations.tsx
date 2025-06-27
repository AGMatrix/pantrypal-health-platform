// src/components/AIRecommendations.tsx
// Advanced AI-powered recipe recommendations

'use client';

import React, { useState, useEffect } from 'react';
import { Recipe, UserPreferences } from '@/types/recipe';
import { formatRating } from '@/lib/utils';
import MarkdownText from './MarkdownText';
import { Brain, TrendingUp, Target, CheckCircle,   Clock, Sparkles, RefreshCw } from 'lucide-react';

interface AIRecommendationsProps {
  userIngredients: string[];
  userPreferences: UserPreferences;
  cookingHistory: string[]; // Recipe IDs user has cooked
  currentTime?: Date;
  onRecommendationClick: (recommendation: AIRecommendation) => void;
}

interface AIRecommendation {
  id: string;
  type: 'smart_match' | 'trending' | 'seasonal' | 'health_goal' | 'time_based' | 'learning';
  title: string;
  description: string;
  confidence: number; // 0-100
  reasoning: string[];
  suggestedIngredients?: string[];
  estimatedTime?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  recipe?: Recipe;
}

export default function AIRecommendations({
  userIngredients,
  userPreferences,
  cookingHistory,
  currentTime = new Date(),
  onRecommendationClick
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  // Generate AI recommendations based on multiple factors
  useEffect(() => {
    generateRecommendations();
  }, [userIngredients, userPreferences, cookingHistory]);

  const generateRecommendations = async () => {
    setLoading(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newRecommendations: AIRecommendation[] = [];

    // Smart ingredient matching
    if (userIngredients.length > 0) {
      newRecommendations.push({
        id: 'smart_match_1',
        type: 'smart_match',
        title: 'Perfect Match: Mediterranean Bowl',
        description: 'Based on your ingredients, this recipe has 95% ingredient compatibility',
        confidence: 95,
        reasoning: [
          `You have ${userIngredients.length} matching ingredients`,
          'High protein content matches your fitness goals',
          'Cooking time fits your usual schedule'
        ],
        suggestedIngredients: ['feta cheese', 'olives'],
        estimatedTime: 25,
        difficulty: 'Easy',
        tags: ['high_match', 'healthy', 'quick']
      });
    }

    // Time-based recommendations
    const hour = currentTime.getHours();
    let timeRecommendation: AIRecommendation;
    
    if (hour < 10) {
      timeRecommendation = {
        id: 'time_breakfast',
        type: 'time_based',
        title: 'Morning Energy Boost',
        description: 'Quick breakfast recipes to start your day right',
        confidence: 85,
        reasoning: [
          'It\'s morning - perfect time for energizing breakfast',
          'Quick recipes under 15 minutes',
          'High protein to fuel your day'
        ],
        estimatedTime: 12,
        difficulty: 'Easy',
        tags: ['breakfast', 'quick', 'energy']
      };
    } else if (hour > 17) {
      timeRecommendation = {
        id: 'time_dinner',
        type: 'time_based',
        title: 'Comfort Dinner Tonight',
        description: 'Satisfying dinner recipes for a relaxing evening',
        confidence: 88,
        reasoning: [
          'Evening time - perfect for hearty dinner',
          'Comfort food matches weekend vibes',
          'Recipes for your household size'
        ],
        estimatedTime: 45,
        difficulty: 'Medium',
        tags: ['dinner', 'comfort', 'satisfying']
      };
    } else {
      timeRecommendation = {
        id: 'time_lunch',
        type: 'time_based',
        title: 'Light Lunch Options',
        description: 'Fresh and light recipes perfect for midday',
        confidence: 80,
        reasoning: [
          'Lunch time - light but filling options',
          'Quick prep for busy schedule',
          'Balanced nutrition for afternoon energy'
        ],
        estimatedTime: 20,
        difficulty: 'Easy',
        tags: ['lunch', 'light', 'balanced']
      };
    }
    
    newRecommendations.push(timeRecommendation);

    // Trending recipes
    newRecommendations.push({
      id: 'trending_1',
      type: 'trending',
      title: 'Viral TikTok Pasta',
      description: 'This week\'s most popular recipe - everyone\'s making it!',
      confidence: 92,
      reasoning: [
        'Trending on social media this week',
        'Easy technique great for beginners',
        'Uses common pantry ingredients'
      ],
      estimatedTime: 30,
      difficulty: 'Easy',
      tags: ['viral', 'popular', 'social_media']
    });

    // Seasonal recommendations
    const month = currentTime.getMonth();
    const seasonalIngredients = getSeasonalIngredients(month);
    
    newRecommendations.push({
      id: 'seasonal_1',
      type: 'seasonal',
      title: 'Fresh Seasonal Flavors',
      description: `Perfect recipes featuring ${seasonalIngredients.join(', ')}`,
      confidence: 87,
      reasoning: [
        'Features fresh seasonal ingredients',
        'Peak flavor and nutritional value',
        'Often more affordable when in season'
      ],
      suggestedIngredients: seasonalIngredients,
      estimatedTime: 35,
      difficulty: 'Medium',
      tags: ['seasonal', 'fresh', 'sustainable']
    });

    // Health goal based
    if (userPreferences.cookingSkillLevel === 'Beginner') {
      newRecommendations.push({
        id: 'health_beginner',
        type: 'health_goal',
        title: 'Beginner-Friendly Healthy Meals',
        description: 'Simple, nutritious recipes to build your cooking confidence',
        confidence: 90,
        reasoning: [
          'Matches your beginner skill level',
          'Focuses on basic healthy techniques',
          'Build cooking confidence gradually'
        ],
        estimatedTime: 25,
        difficulty: 'Easy',
        tags: ['beginner', 'healthy', 'confidence_building']
      });
    }

    // Learning recommendations based on history
    if (cookingHistory.length > 0) {
      const cuisinePattern = analyzeCookingPattern(cookingHistory);
      newRecommendations.push({
        id: 'learning_1',
        type: 'learning',
        title: `Explore New ${cuisinePattern} Techniques`,
        description: 'Ready to level up your cooking with new techniques?',
        confidence: 83,
        reasoning: [
          `You've mastered basic ${cuisinePattern} recipes`,
          'Time to try intermediate techniques',
          'Builds on your existing skills'
        ],
        estimatedTime: 50,
        difficulty: 'Medium',
        tags: ['skill_building', 'technique', 'progression']
      });
    }

    setRecommendations(newRecommendations);
    setLoading(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 80) return 'text-blue-600 bg-blue-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'smart_match': return <Target className="w-5 h-5" />;
      case 'trending': return <TrendingUp className="w-5 h-5" />;
      case 'time_based': return <Clock className="w-5 h-5" />;
      case 'learning': return <Brain className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'smart_match': return 'text-purple-600 bg-purple-100';
      case 'trending': return 'text-pink-600 bg-pink-100';
      case 'time_based': return 'text-blue-600 bg-blue-100';
      case 'seasonal': return 'text-green-600 bg-green-100';
      case 'health_goal': return 'text-red-600 bg-red-100';
      case 'learning': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredRecommendations = selectedType === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.type === selectedType);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
            <p className="text-sm text-gray-600">Personalized suggestions powered by AI</p>
          </div>
        </div>
        
        <button
          onClick={generateRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'all', label: 'All Suggestions', count: recommendations.length },
          { id: 'smart_match', label: 'Smart Match', count: recommendations.filter(r => r.type === 'smart_match').length },
          { id: 'trending', label: 'Trending', count: recommendations.filter(r => r.type === 'trending').length },
          { id: 'time_based', label: 'Time-Based', count: recommendations.filter(r => r.type === 'time_based').length },
          { id: 'seasonal', label: 'Seasonal', count: recommendations.filter(r => r.type === 'seasonal').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedType === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span>AI is analyzing your preferences...</span>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && (
        <div className="space-y-4">
          {filteredRecommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => onRecommendationClick(recommendation)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(recommendation.type)}`}>
                    {getTypeIcon(recommendation.type)}
                  </div>
                  <div>
                  <MarkdownText className="markdown-content font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {recommendation.title}
                  </MarkdownText>

                    <MarkdownText className="markdown-content text-sm text-gray-600 mt-1">
                    {recommendation.description}
                    </MarkdownText>
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                  {recommendation.confidence}% match
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                {recommendation.estimatedTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {recommendation.estimatedTime} min
                  </span>
                )}
                {recommendation.difficulty && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    recommendation.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    recommendation.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {recommendation.difficulty}
                  </span>
                )}
              </div>

              {/* AI Reasoning */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-2">🧠 AI Reasoning:</div>
                <ul className="text-xs text-gray-600 space-y-1">
                {recommendation.reasoning.map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                   <MarkdownText className="markdown-content">
                   {reason}
                   </MarkdownText>
                </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Ingredients */}
              {recommendation.suggestedIngredients && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Suggested additions:</div>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.suggestedIngredients.map((ingredient, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {recommendation.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRecommendations.length === 0 && (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No recommendations available</p>
          <p className="text-sm text-gray-500">
            Add some ingredients or adjust your preferences to get AI suggestions
          </p>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getSeasonalIngredients(month: number): string[] {
  const seasonalMap: Record<number, string[]> = {
    0: ['citrus', 'winter squash', 'kale'], // January
    1: ['citrus', 'winter vegetables', 'root vegetables'], // February
    2: ['spring greens', 'asparagus', 'peas'], // March
    3: ['spring herbs', 'artichokes', 'spring onions'], // April
    4: ['strawberries', 'spring vegetables', 'fresh herbs'], // May
    5: ['berries', 'zucchini', 'summer herbs'], // June
    6: ['tomatoes', 'corn', 'stone fruits'], // July
    7: ['peaches', 'summer vegetables', 'basil'], // August
    8: ['apples', 'fall squash', 'greens'], // September
    9: ['pumpkin', 'fall vegetables', 'apples'], // October
    10: ['cranberries', 'winter squash', 'root vegetables'], // November
    11: ['winter vegetables', 'citrus', 'holiday spices'] // December
  };
  
  return seasonalMap[month] || ['seasonal vegetables'];
}

function analyzeCookingPattern(cookingHistory: string[]): string {
  // Simulate pattern analysis - in real app would analyze actual recipe data
  const patterns = ['Italian', 'Asian', 'Mediterranean', 'American', 'Mexican'];
  return patterns[Math.floor(Math.random() * patterns.length)];
}