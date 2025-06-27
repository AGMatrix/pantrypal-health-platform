import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Search, Plus, Heart, ShoppingCart, Brain, Play, Check, Info, Target, Sparkles, ChefHat } from 'lucide-react';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: React.ReactNode;
  action?: string;
}

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStepComplete?: (stepId: string) => void;
}

const guideSteps: GuideStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Pantry Pal! 🎉',
    description: 'Let\'s take a quick tour to help you discover amazing recipes using AI. This guide will show you exactly how everything works!',
    position: 'center',
    icon: <ChefHat className="w-6 h-6" />,
  },
  {
    id: 'add-ingredients',
    title: 'Step 1: Add Your Ingredients',
    description: 'Start by typing ingredients you have in your pantry. Just type and press Enter to add each one. For example: "chicken", "rice", "tomatoes"',
    targetElement: '.ingredient-input',
    position: 'bottom',
    icon: <Plus className="w-6 h-6" />,
    action: 'Type ingredients and press Enter'
  },
  {
    id: 'set-filters',
    title: 'Step 2: Set Your Preferences (Optional)',
    description: 'Choose dietary preferences, cuisine type, cooking time, or difficulty level. These filters help AI find recipes that match your needs perfectly.',
    targetElement: '.quick-filters',
    position: 'bottom',
    icon: <Target className="w-6 h-6" />,
    action: 'Select filters that match your preferences'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'Now you know how to use Pantry Pal like a pro! Start by adding your ingredients and let AI help you discover amazing recipes.',
    position: 'center',
    icon: <Check className="w-6 h-6" />,
  }
];

export default function UserGuide({ isOpen, onClose, onStepComplete }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentGuideStep = guideSteps[currentStep];

  // Clear any pending timeouts when component unmounts or closes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset state when guide opens
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 User guide opened, resetting state');
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setIsTransitioning(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (isTransitioning) {
      console.log('⏳ Already transitioning, ignoring next click');
      return;
    }
    
    console.log('➡️ Moving to next step from', currentStep);
    
    // Mark current step as completed
    const stepId = guideSteps[currentStep].id;
    setCompletedSteps(prev => new Set([...prev, stepId]));
    onStepComplete?.(stepId);
    
    if (currentStep < guideSteps.length - 1) {
      setIsTransitioning(true);
      
      // Use a ref to store timeout so we can clear it if needed
      timeoutRef.current = setTimeout(() => {
        console.log('✅ Transitioning to step', currentStep + 1);
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
        timeoutRef.current = null;
      }, 200);
    }
    
  }, [currentStep, isTransitioning, onStepComplete]);

  const handlePrevious = useCallback(() => {
    if (isTransitioning || currentStep === 0) {
      console.log('⏳ Cannot go back - transitioning or at first step');
      return;
    }
    
    console.log('⬅️ Moving to previous step from', currentStep);
    setIsTransitioning(true);
    
    timeoutRef.current = setTimeout(() => {
      console.log('✅ Transitioning to step', currentStep - 1);
      setCurrentStep(currentStep - 1);
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, 200);
  }, [currentStep, isTransitioning]);

  const handleSkip = useCallback(() => {
    if (isTransitioning) return;
    
    console.log('⏭️ Skipping user guide');
    setIsTransitioning(true);
    
    timeoutRef.current = setTimeout(() => {
      onClose();
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, 100);
  }, [isTransitioning, onClose]);

  const handleComplete = useCallback(() => {
    if (isTransitioning) return;
    
    console.log('🎉 Completing user guide');
    const stepId = guideSteps[currentStep].id;
    setCompletedSteps(prev => new Set([...prev, stepId]));
    onStepComplete?.(stepId);
    
    setIsTransitioning(true);
    
    timeoutRef.current = setTimeout(() => {
      onClose();
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, 100);
  }, [currentStep, isTransitioning, onClose, onStepComplete]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const isLastStep = currentStep === guideSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={!isTransitioning ? handleSkip : undefined}
      />

      {/* Guide tooltip */}
      <div className={`absolute transition-all duration-300 ${
        isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      } ${
        currentGuideStep.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
        currentGuideStep.position === 'bottom' ? 'bottom-4 left-1/2 -translate-x-1/2' :
        'top-1/2 right-4 -translate-y-1/2'
      }`}>
        
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-3xl blur-xl transition-all duration-300"></div>
          
          {/* Main tooltip */}
          <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4">
            
            {/* Close button */}
            <button
              onClick={!isTransitioning ? handleSkip : undefined}
              disabled={isTransitioning}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white">
                  {currentGuideStep.icon}
                </div>
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {guideSteps.length}
                </div>
              </div>
              
              <div className="flex-1 ml-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {currentGuideStep.title}
              </h3>
              
              <p className="text-gray-700 leading-relaxed">
                {currentGuideStep.description}
              </p>

              {currentGuideStep.action && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">Try this:</div>
                      <div className="text-blue-700 text-sm">{currentGuideStep.action}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={!isTransitioning ? handlePrevious : undefined}
                disabled={isFirstStep || isTransitioning}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {guideSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 w-6' 
                        : index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {isLastStep ? (
                <button
                  onClick={!isTransitioning ? handleComplete : undefined}
                  disabled={isTransitioning}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Get Started!
                </button>
              ) : (
                <button
                  onClick={!isTransitioning ? handleNext : undefined}
                  disabled={isTransitioning}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTransitioning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Skip option */}
            <div className="text-center mt-4">
              <button
                onClick={!isTransitioning ? handleSkip : undefined}
                disabled={isTransitioning}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip tutorial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickTips() {
  const [showTips, setShowTips] = useState(false);

  const tips = [
    {
      icon: <Search className="w-5 h-5" />,
      title: "Smart Search",
      description: "AI automatically searches when you add ingredients!"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Natural Language",
      description: "Describe what you want: 'quick healthy dinner for 2'"
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Save Favorites",
      description: "Click the heart icon to save recipes you love"
    }
  ];

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="relative">
        {showTips && (
          <div className="absolute bottom-16 left-0 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Quick Tips</h3>
              <button
                onClick={() => setShowTips(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-lg flex-shrink-0">
                  {tip.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{tip.title}</h4>
                  <p className="text-gray-600 text-xs mt-1">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowTips(!showTips)}
          className="group p-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
          title="Quick Tips"
        >
          <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}