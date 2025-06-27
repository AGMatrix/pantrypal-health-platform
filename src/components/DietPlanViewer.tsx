// src/components/DietPlanViewer.tsx

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ShoppingCart, 
  Clock, 
  Users, 
  ChefHat, 
  AlertTriangle, 
  CheckCircle,
  Utensils,
  Heart,
  Brain,
  Printer,
  Download,
  X,
  ArrowLeft,
  ArrowRight,
  Zap,
  Search,
  Loader2,
  Menu
} from 'lucide-react';
import MarkdownText from './MarkdownText';

interface DietPlanViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  userId?: string;
}

export default function DietPlanViewer({ isOpen, onClose, onEdit, userId }: DietPlanViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDay, setSelectedDay] = useState('Day 1');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Fetch diet plan when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDietPlan();
    }
  }, [isOpen, userId]);

  const fetchDietPlan = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching diet plan for user:', userId);
      
      const response = await fetch('/api/health/diet-plan', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'x-user-id': userId })
        }
      });

      console.log('📥 Diet plan response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch diet plan: ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 Diet plan result:', result);

      if (result.success && result.data) {
        setDietPlan(result.data);
        console.log('✅ Diet plan loaded successfully');
      } else {
        setDietPlan(null);
        console.log('ℹ️ No active diet plan found');
      }

    } catch (error) {
      console.error('❌ Failed to fetch diet plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to load diet plan');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShoppingItem = (itemKey: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!dietPlan) return;
    
    const dataStr = JSON.stringify(dietPlan, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diet-plan-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Loading Your Diet Plan</h3>
          <p className="text-sm sm:text-base text-gray-600">Fetching your personalized nutrition plan...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Error Loading Diet Plan</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchDietPlan}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No diet plan state
  if (!dietPlan) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center max-w-md w-full">
          <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Diet Plan Found</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">You haven't created a personalized diet plan yet.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Create Diet Plan
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mealPlanDays = dietPlan.mealPlan?.dailyMeals ? Object.keys(dietPlan.mealPlan.dailyMeals) : [];
  const currentDayIndex = mealPlanDays.findIndex(day => day === selectedDay);

  const nextDay = () => {
    const nextIndex = (currentDayIndex + 1) % mealPlanDays.length;
    setSelectedDay(mealPlanDays[nextIndex]);
  };

  const prevDay = () => {
    const prevIndex = currentDayIndex === 0 ? mealPlanDays.length - 1 : currentDayIndex - 1;
    setSelectedDay(mealPlanDays[prevIndex]);
  };

  // Navigation tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Brain, shortLabel: 'Info' },
    { id: 'meals', label: 'Meal Plan', icon: Utensils, shortLabel: 'Meals' },
    { id: 'shopping', label: 'Shopping List', icon: ShoppingCart, shortLabel: 'Shop' },
    { id: 'guidelines', label: 'Guidelines', icon: CheckCircle, shortLabel: 'Guide' },
    { id: 'tips', label: 'Tips & Notes', icon: ChefHat, shortLabel: 'Tips' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-6xl h-full sm:h-auto sm:max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center py-3 bg-gray-50">
          <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header - Responsive */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg sm:rounded-xl">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                Your Diet Plan
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                Generated {new Date(dietPlan.metadata?.timestamp || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop action buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                title="Print"
              >
                <Printer className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                title="Download"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base touch-manipulation"
                >
                  Edit Plan
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Action Menu */}
        {showMobileMenu && (
          <div className="sm:hidden bg-gray-50 border-b border-gray-200 p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  handlePrint();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm touch-manipulation"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => {
                  handleDownload();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm touch-manipulation"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    setShowMobileMenu(false);
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm touch-manipulation"
                >
                  <Brain className="w-4 h-4" />
                  Edit Diet Plan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs - Responsive */}
        <div className="border-b bg-gray-50 overflow-x-auto">
          <div className="flex min-w-full">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Responsive */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Plan Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Plan Overview</h3>
                <MarkdownText className="text-gray-700 text-sm sm:text-base">
                  {dietPlan.overview || 'Your personalized diet plan has been created based on your health profile and preferences.'}
                </MarkdownText>
                
                {dietPlan.metadata && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="text-center p-2 sm:p-3 bg-white/50 rounded-lg">
                      <div className="font-semibold text-blue-600">Method</div>
                      <div className="text-gray-600 capitalize">{dietPlan.metadata.generationMethod || 'AI'}</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-white/50 rounded-lg">
                      <div className="font-semibold text-blue-600">Confidence</div>
                      <div className="text-gray-600">{Math.round((dietPlan.metadata.confidenceScore || 0.8) * 100)}%</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-white/50 rounded-lg">
                      <div className="font-semibold text-blue-600">Duration</div>
                      <div className="text-gray-600">7 Days</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-white/50 rounded-lg">
                      <div className="font-semibold text-blue-600">Categories</div>
                      <div className="text-gray-600">{dietPlan.shoppingList?.length || 0}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Key Restrictions */}
              {dietPlan.restrictions && dietPlan.restrictions.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Important Dietary Restrictions
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {dietPlan.restrictions.map((restriction: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <MarkdownText className="text-red-800 text-sm sm:text-base">{restriction}</MarkdownText>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Recommendations */}
              {dietPlan.recommendations && dietPlan.recommendations.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Health Recommendations
                  </h3>
                  <div className="grid gap-2 sm:gap-3">
                    {dietPlan.recommendations.map((recommendation: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <MarkdownText className="text-green-800 text-sm sm:text-base">{recommendation}</MarkdownText>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Notes */}
              {dietPlan.specialNotes && dietPlan.specialNotes.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-4">Special Notes</h3>
                  <ul className="space-y-2">
                    {dietPlan.specialNotes.map((note: string, index: number) => (
                      <li key={index} className="text-yellow-800 flex items-start gap-2 text-sm sm:text-base">
                        <span className="text-yellow-600 mt-1">•</span>
                        <MarkdownText>{note}</MarkdownText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Meal Plan Tab */}
          {activeTab === 'meals' && (
            <div className="space-y-4 sm:space-y-6">
              {mealPlanDays.length > 0 && (
                <>
                  {/* Day Navigation - Mobile Optimized */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <button
                      onClick={prevDay}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                      disabled={mealPlanDays.length <= 1}
                    >
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    <div className="text-center flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{selectedDay}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Day {currentDayIndex + 1} of {mealPlanDays.length}</p>
                    </div>
                    
                    <button
                      onClick={nextDay}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                      disabled={mealPlanDays.length <= 1}
                    >
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Day Selector - Horizontal Scroll */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {mealPlanDays.map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation ${
                          selectedDay === day
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  {/* Selected Day Meals - Responsive Grid */}
                  {dietPlan.mealPlan?.dailyMeals?.[selectedDay] && (
                    <div className="space-y-4 sm:space-y-6">
                      {Object.entries(dietPlan.mealPlan.dailyMeals[selectedDay]).map(([mealType, mealData]: [string, any]) => {
                        // Parse meal data if it's a string (from AI generation)
                        let mealInfo = { name: '', calories: 0, ingredients: [], notes: '' };
                        
                        if (typeof mealData === 'string') {
                          const calorieMatch = mealData.match(/\((\d+)\s*calories?\)/i);
                          const calories = calorieMatch ? parseInt(calorieMatch[1]) : 0;
                          const name = mealData.replace(/\(\d+\s*calories?\)/i, '').trim();
                          
                          mealInfo = { name, calories, ingredients: [], notes: '' };
                        } else if (typeof mealData === 'object') {
                          mealInfo = {
                            name: mealData.name || mealData.title || `${mealType} meal`,
                            calories: mealData.calories || 0,
                            ingredients: mealData.ingredients || [],
                            notes: mealData.notes || mealData.description || ''
                          };
                        }
                        
                        return (
                          <div key={mealType} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                              <div className={`p-2 sm:p-3 rounded-lg ${
                                mealType === 'breakfast' ? 'bg-yellow-100 text-yellow-600' :
                                mealType === 'lunch' ? 'bg-orange-100 text-orange-600' :
                                mealType === 'dinner' ? 'bg-purple-100 text-purple-600' :
                                'bg-green-100 text-green-600'
                              }`}>
                                <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <h4 className="text-base sm:text-lg font-semibold text-gray-900 capitalize flex-1">{mealType}</h4>
                              {mealInfo.calories > 0 && (
                                <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                                  {mealInfo.calories} cal
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2 sm:space-y-3">
                              <h5 className="font-medium text-gray-900 text-sm sm:text-base">
                                {mealInfo.name}
                              </h5>
                              
                              {mealInfo.ingredients.length > 0 && (
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Ingredients:</p>
                                  <p className="text-xs sm:text-sm text-gray-600">{mealInfo.ingredients.join(', ')}</p>
                                </div>
                              )}
                              
                              {mealInfo.notes && (
                                <MarkdownText className="text-xs sm:text-sm text-gray-600 italic">{mealInfo.notes}</MarkdownText>
                              )}
                              
                              <button
                                onClick={() => {
                                  const searchQuery = `${mealInfo.name} ${mealInfo.calories ? `around ${mealInfo.calories} calories` : ''}`;
                                  window.dispatchEvent(new CustomEvent('searchRecipes', { 
                                    detail: { query: searchQuery, mealType, targetCalories: mealInfo.calories } 
                                  }));
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2 touch-manipulation"
                              >
                                <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                                Find Recipes for This Meal
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              
              {mealPlanDays.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-gray-600">
                  <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm sm:text-base">No meal plan available</p>
                </div>
              )}
            </div>
          )}

          {/* Shopping List Tab */}
          {activeTab === 'shopping' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Shopping List</h3>
                <div className="text-xs sm:text-sm text-gray-600">
                  {Object.values(checkedItems).filter(Boolean).length} of {
                    dietPlan.shoppingList?.reduce((total: number, category: any) => total + (category.items?.length || 0), 0) || 0
                  } items checked
                </div>
              </div>
              
              {dietPlan.shoppingList && dietPlan.shoppingList.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {dietPlan.shoppingList.map((category: any, categoryIndex: number) => (
                    <div key={categoryIndex} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        {category.category}
                        <span className="text-xs sm:text-sm text-gray-500 font-normal">
                          ({category.items?.length || 0} item{(category.items?.length || 0) === 1 ? '' : 's'})
                        </span>
                      </h4>
                      
                      <div className="space-y-2">
                        {category.items?.map((item: string, itemIndex: number) => {
                          const itemKey = `${categoryIndex}-${itemIndex}`;
                          return (
                            <label key={itemIndex} className="flex items-center gap-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors touch-manipulation">
                              <input
                                type="checkbox"
                                checked={checkedItems[itemKey] || false}
                                onChange={() => toggleShoppingItem(itemKey)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 touch-manipulation"
                              />
                              <span className={`text-sm sm:text-base flex-1 ${checkedItems[itemKey] ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                {item}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-600">
                  <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm sm:text-base">No shopping list available</p>
                </div>
              )}
            </div>
          )}

          {/* Guidelines Tab */}
          {activeTab === 'guidelines' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Nutritional Guidelines */}
              {dietPlan.nutritionalGuidelines && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-4">Nutritional Guidelines</h3>
                  <MarkdownText className="text-blue-800 text-sm sm:text-base">{dietPlan.nutritionalGuidelines}</MarkdownText>
                </div>
              )}

              {/* Emergency Substitutions */}
              {dietPlan.emergencySubstitutions && dietPlan.emergencySubstitutions.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-4">Emergency Substitutions</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {dietPlan.emergencySubstitutions.map((sub: any, index: number) => (
                      <div key={index} className="bg-purple-100 rounded-lg p-3 sm:p-4">
                        <MarkdownText className="text-purple-800 text-sm sm:text-base">{sub}</MarkdownText>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Tracking */}
              {dietPlan.progressTracking && (
                <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-4">Progress Tracking</h3>
                  <MarkdownText className="text-green-800 text-sm sm:text-base">{dietPlan.progressTracking}</MarkdownText>
                </div>
              )}
            </div>
          )}

          {/* Tips & Notes Tab */}
          {activeTab === 'tips' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Meal Prep Tips */}
              {dietPlan.mealPrepTips && dietPlan.mealPrepTips.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
                    Meal Prep Tips
                  </h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {dietPlan.mealPrepTips.map((tip: string, index: number) => (
                      <li key={index} className="text-green-800 flex items-start gap-2 text-sm sm:text-base">
                        <span className="text-green-600 mt-1">•</span>
                        <MarkdownText className="flex-1">{tip}</MarkdownText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medical Disclaimer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Important Medical Disclaimer
                </h3>
                <MarkdownText className="text-yellow-800 text-sm sm:text-base">
                  This diet plan is for educational and informational purposes only. It is not intended as medical advice, 
                  diagnosis, or treatment. Always consult with your healthcare provider before making significant changes to 
                  your diet, especially if you have medical conditions, take medications, or have specific health concerns. 
                  Individual nutritional needs may vary, and this plan should be adapted based on your healthcare provider's 
                  recommendations.
                </MarkdownText>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Responsive */}
        <div className="border-t bg-gray-50 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              💡 Your personalized nutrition plan synced with AI recommendations
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="order-2 sm:order-1 px-4 py-2 sm:px-6 sm:py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base touch-manipulation"
              >
                Close
              </button>
              
              <button
                onClick={() => {
                  // Search for recipes matching diet plan
                  const searchQuery = 'healthy recipes for my diet plan';
                  window.dispatchEvent(new CustomEvent('searchRecipes', { 
                    detail: { query: searchQuery, source: 'diet-plan' } 
                  }));
                  onClose();
                }}
                className="order-1 sm:order-2 w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Find Recipes
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom scrollbar styles for mobile */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Touch-friendly scrollbars for tablets and desktop */
        @media (min-width: 768px) {
          .scrollbar-hide {
            scrollbar-width: thin;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: block;
            width: 6px;
            height: 6px;
          }
          .scrollbar-hide::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          .scrollbar-hide::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .scrollbar-hide::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        }
      `}</style>
    </div>
  );
}