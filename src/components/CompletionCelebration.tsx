// src/components/CompletionCelebration.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Recipe } from '@/types/recipe';
import { 
  Trophy, 
  Star, 
  Heart, 
  ChefHat, 
  Clock, 
  Share2, 
  Camera,
  X,
  Sparkles 
} from 'lucide-react';

interface CompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  cookingTimeMinutes: number;
  onRate?: (rating: number) => void;
  onShare?: () => void;
  onSaveToFavorites?: () => void;
}

export default function CompletionCelebration({
  isOpen,
  onClose,
  recipe,
  cookingTimeMinutes,
  onRate,
  onShare,
  onSaveToFavorites
}: CompletionCelebrationProps) {
  const [rating, setRating] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      generateAchievements();
      
      // Hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const generateAchievements = () => {
    const newAchievements = [];
    
    if (cookingTimeMinutes <= (recipe.cookingTime || 60)) {
      newAchievements.push('⏱️ Perfect Timing - Finished on schedule!');
    }
    
    if (recipe.difficulty === 'Hard') {
      newAchievements.push('🏆 Master Chef - Conquered a difficult recipe!');
    }
    
    if (recipe.dietary && Array.isArray(recipe.dietary) && recipe.dietary.includes('healthy')) {
      newAchievements.push('🥗 Health Hero - Chose a nutritious meal!');
    }
    
    if (recipe.costPerServing && recipe.costPerServing < 5) {
      newAchievements.push('💰 Budget Boss - Cooked economically!');
    }
    
    newAchievements.push('👨‍🍳 Kitchen Warrior - Another recipe mastered!');
    
    setAchievements(newAchievements);
  };

  const handleRating = (stars: number) => {
    setRating(stars);
    if (onRate) onRate(stars);
  };

  const getCelebrationMessage = () => {
    const messages = [
      "🎉 Culinary Success! You're a kitchen superstar!",
      "👨‍🍳 Chef Mode: ACTIVATED! Another delicious victory!",
      "🌟 Cooking Champion! That smells absolutely amazing!",
      "🍳 Kitchen Conquered! Time to enjoy your masterpiece!",
      "🎊 Recipe Completed! You've outdone yourself today!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleTakePhoto = async () => {
    try {
      // Check if device has camera access
      const hasMediaDevices = typeof navigator !== 'undefined' && 
                             navigator.mediaDevices && 
                             typeof navigator.mediaDevices.getUserMedia === 'function';
      
      if (hasMediaDevices) {
        // For mobile devices - use camera
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use back camera
        
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            handlePhotoSelected(file);
          }
        };
        
        input.click();
      } else {
        // Fallback for devices without camera
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            handlePhotoSelected(file);
          }
        };
        
        input.click();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('📸 Unable to access camera. Please select a photo from your gallery.');
    }
  };
  
  const handlePhotoSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setIsPhotoModalOpen(true);
      
      // Store in sessionStorage for the photo modal
      sessionStorage.setItem('selectedPhoto', imageDataUrl);
    };
    
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              >
                <div className="w-1 h-1 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
              </div>
            ))}
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={`star-${i}`}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  animationDuration: `${1.5 + Math.random()}s`
                }}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] relative overflow-hidden transform transition-all duration-300">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-8 sm:w-12 h-8 sm:h-12 bg-yellow-400 rounded-full"></div>
            <div className="absolute top-4 sm:top-8 right-4 sm:right-8 w-6 sm:w-8 h-6 sm:h-8 bg-green-400 rounded-full"></div>
            <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 w-8 sm:w-10 h-8 sm:h-10 bg-purple-400 rounded-full"></div>
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-4 sm:w-6 h-4 sm:h-6 bg-pink-400 rounded-full"></div>
          </div>

          {/* Mobile handle */}
          <div className="sm:hidden flex justify-center py-3">
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10 touch-manipulation"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="overflow-y-auto max-h-[90vh] p-4 sm:p-6 md:p-8">
            {/* Main Content */}
            <div className="text-center relative z-10">
              {/* Trophy Icon - Responsive */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-lg animate-pulse">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
              </div>

              {/* Celebration Message - Responsive Typography */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-2">
                {getCelebrationMessage()}
              </h2>

              {/* Recipe Info */}
              <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-4 sm:mb-6 px-2">
                You've successfully cooked <span className="font-bold text-blue-600">{recipe.title}</span>!
              </p>

              {/* Cooking Stats - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">{cookingTimeMinutes}</div>
                  <div className="text-xs sm:text-sm text-blue-700">minutes</div>
                </div>
                <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-900">{recipe.difficulty || 'Easy'}</div>
                  <div className="text-xs sm:text-sm text-green-700">difficulty</div>
                </div>
                <div className="bg-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900">{recipe.nutrition?.calories || 0}</div>
                  <div className="text-xs sm:text-sm text-purple-700">calories</div>
                </div>
                <div className="bg-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-900">{recipe.servings || 1}</div>
                  <div className="text-xs sm:text-sm text-orange-700">servings</div>
                </div>
              </div>

              {/* Achievements - Responsive Cards */}
              {achievements.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">🏆 Achievements Unlocked!</h3>
                  <div className="space-y-2">
                    {achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm text-yellow-800"
                      >
                        {achievement}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Section - Touch-Friendly */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">How was your cooking experience?</h3>
                <div className="flex justify-center gap-1 sm:gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => handleRating(stars)}
                      className={`p-2 sm:p-3 transition-all transform hover:scale-110 active:scale-95 touch-manipulation ${
                        rating >= stars ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <Star className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${rating >= stars ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-green-600 font-medium text-sm sm:text-base">
                    {rating === 5 ? '🌟 Outstanding!' : 
                     rating === 4 ? '😊 Great job!' : 
                     rating === 3 ? '👍 Good work!' : 
                     rating === 2 ? '👌 Nice try!' : 
                     '💪 Keep practicing!'}
                  </p>
                )}
              </div>

              {/* Action Buttons - Responsive Stack */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <button
                  onClick={onSaveToFavorites}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-red-500 text-white rounded-lg sm:rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Save to Favorites
                </button>
                
                <button
                  onClick={onShare}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Share Success
                </button>
                
                <button
                  onClick={handleTakePhoto}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  Take Photo
                </button>
              </div>

              {/* Fun Message - Responsive */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border border-purple-200">
                <p className="text-purple-800 text-xs sm:text-sm italic">
                  "Every recipe completed is a step closer to culinary mastery! 👨‍🍳✨"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {isPhotoModalOpen && (
        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          recipe={recipe}
        />
      )}
    </>
  );
}

// Responsive Photo Modal Component
interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
}

function PhotoModal({ isOpen, onClose, recipe }: PhotoModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const storedPhoto = sessionStorage.getItem('selectedPhoto');
      if (storedPhoto) {
        setImageUrl(storedPhoto);
      }
    }
  }, [isOpen]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `I cooked ${recipe.title}!`,
          text: `Just made ${recipe.title} using PantryPal! 🍳👨‍🍳`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(`Just cooked ${recipe.title} using PantryPal! 🍳👨‍🍳`);
        alert('📋 Recipe info copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('📱 Share your delicious creation on social media!');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `${recipe.title.replace(/\s+/g, '_')}_dish.jpg`;
    link.href = imageUrl;
    link.click();
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">📸 Your Culinary Masterpiece!</h3>
          <img 
            src={imageUrl} 
            alt={recipe.title}
            className="w-full max-h-64 sm:max-h-80 object-cover rounded-xl mb-4" 
          />
          <p className="text-gray-600 text-sm sm:text-base mb-4">Recipe: {recipe.title}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Share
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}