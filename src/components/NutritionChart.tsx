// src/components/NutritionChart.tsx

'use client';

import React from 'react';
import { Recipe } from '@/types/recipe';

interface NutritionChartProps {
  recipe: Recipe;
  showDetailed?: boolean;
}

export default function NutritionChart({ recipe, showDetailed = false }: NutritionChartProps) {
  const { nutrition } = recipe;

  // Data for macronutrients
  const macroData = [
    { name: 'Protein', value: nutrition.protein, color: '#10b981', calories: nutrition.protein * 4 },
    { name: 'Carbs', value: nutrition.carbs, color: '#3b82f6', calories: nutrition.carbs * 4 },
    { name: 'Fat', value: nutrition.fat, color: '#f59e0b', calories: nutrition.fat * 9 },
  ];

  // Calculate percentages for daily values (based on 2000 calorie diet)
  const dailyValues = {
    calories: Math.round((nutrition.calories / 2000) * 100),
    protein: Math.round((nutrition.protein / 50) * 100),
    carbs: Math.round((nutrition.carbs / 300) * 100),
    fat: Math.round((nutrition.fat / 65) * 100),
    fiber: Math.round(((nutrition.fiber || 0) / 25) * 100),
  };

  if (!showDetailed) {
    // Simple nutrition display with CSS-only pie chart
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Nutrition Facts</h3>
        
        {/* Simple Pie Chart with CSS */}
        <div className="relative w-48 h-48 mx-auto mb-4">
          <div className="w-full h-full rounded-full" style={{
            background: `conic-gradient(
              ${macroData[0].color} 0deg ${(macroData[0].calories / nutrition.calories) * 360}deg,
              ${macroData[1].color} ${(macroData[0].calories / nutrition.calories) * 360}deg ${((macroData[0].calories + macroData[1].calories) / nutrition.calories) * 360}deg,
              ${macroData[2].color} ${((macroData[0].calories + macroData[1].calories) / nutrition.calories) * 360}deg 360deg
            )`
          }}>
            <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{nutrition.calories}</div>
                <div className="text-sm text-gray-600">calories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 text-sm">
          {macroData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-gray-700">{item.name}: {item.value}g</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed nutrition display
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <h3 className="font-semibold text-gray-900 text-lg">Detailed Nutrition Analysis</h3>
      
      {/* Nutrition Facts Label Style */}
      <div className="border-2 border-black p-4 bg-white font-mono text-sm">
        <div className="text-2xl font-bold border-b-4 border-black pb-1 mb-2">
          Nutrition Facts
        </div>
        <div className="text-sm mb-2">Per serving ({recipe.servings} servings per recipe)</div>
        
        <div className="border-b border-gray-400 pb-2 mb-2">
          <div className="flex justify-between items-end">
            <span className="text-lg font-bold">Calories</span>
            <span className="text-2xl font-bold">{nutrition.calories}</span>
          </div>
        </div>

        <div className="text-right text-xs font-bold mb-2">% Daily Value*</div>

        <div className="space-y-1">
          <div className="flex justify-between border-b border-gray-300 py-1">
            <span className="font-bold">Protein</span>
            <div className="text-right">
              <span>{nutrition.protein}g</span>
              <span className="font-bold ml-2">{dailyValues.protein}%</span>
            </div>
          </div>
          
          <div className="flex justify-between border-b border-gray-300 py-1">
            <span className="font-bold">Carbs</span>
            <div className="text-right">
              <span>{nutrition.carbs}g</span>
              <span className="font-bold ml-2">{dailyValues.carbs}%</span>
            </div>
          </div>
          
          <div className="flex justify-between border-b border-gray-300 py-1">
            <span className="font-bold">Fat</span>
            <div className="text-right">
              <span>{nutrition.fat}g</span>
              <span className="font-bold ml-2">{dailyValues.fat}%</span>
            </div>
          </div>
          
          {nutrition.fiber && (
            <div className="flex justify-between border-b border-gray-300 py-1">
              <span className="font-bold">Fiber</span>
              <div className="text-right">
                <span>{nutrition.fiber}g</span>
                <span className="font-bold ml-2">{dailyValues.fiber}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs mt-3 border-t border-gray-400 pt-2">
          *The % Daily Value tells you how much a nutrient in a serving contributes to a daily diet. 
          2,000 calories a day is used for general nutrition advice.
        </div>
      </div>

      {/* Visual Bar Chart with CSS */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Nutrition Breakdown</h4>
        <div className="space-y-3">
          {macroData.map((item) => {
            const percentage = Math.round((item.value / Math.max(...macroData.map(m => m.value))) * 100);
            return (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.name}</span>
                  <span>{item.value}g</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className="h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: item.color 
                    }}
                  >
                    <span className="text-white text-xs font-medium">{item.value}g</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Insights */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Health Insights</h4>
        <div className="space-y-2 text-sm text-blue-800">
          {nutrition.protein > 20 && (
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>High protein content - great for muscle building!</span>
            </div>
          )}
          {nutrition.fiber && nutrition.fiber > 5 && (
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Good source of fiber - supports digestive health</span>
            </div>
          )}
          {nutrition.calories < 300 && (
            <div className="flex items-center gap-2">
              <span className="text-blue-600">ℹ</span>
              <span>Lower calorie option - perfect for light meals</span>
            </div>
          )}
          {nutrition.fat < 10 && (
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Low fat content - heart-healthy choice</span>
            </div>
          )}
        </div>
      </div>

      {/* Macro Ratio */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Macronutrient Ratio</h4>
        <div className="space-y-2">
          {macroData.map((macro) => {
            const percentage = Math.round((macro.calories / nutrition.calories) * 100);
            return (
              <div key={macro.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{macro.name}</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: macro.color 
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}