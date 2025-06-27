// src/components/CookingAssistant.tsx
// Enhanced AI-powered step-by-step cooking guidance with responsive design

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Recipe } from '@/types/recipe';
import { 
  ChefHat, 
  Clock, 
  Thermometer, 
  Timer, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  MessageCircle,
  X,
  Settings,
  Zap,
  Target,
  BookOpen,
  Smartphone,
  Home
} from 'lucide-react';

interface CookingAssistantProps {
  recipe: Recipe;
  isActive: boolean;
  onComplete: () => void;
  onExit: () => void;
}

interface CookingStep {
  id: string;
  instruction: string;
  estimatedTime?: number;
  temperature?: number;
  tips: string[];
  warnings?: string[];
  techniques: string[];
  nextStepPrep?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  equipment?: string[];
}

interface Timer {
  id: string;
  name: string;
  duration: number;
  remaining: number;
  isActive: boolean;
  isComplete: boolean;
}

interface CookingSettings {
  voiceEnabled: boolean;
  showTips: boolean;
  autoAdvance: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
}

export default function CookingAssistant({ 
  recipe, 
  isActive, 
  onComplete, 
  onExit 
}: CookingAssistantProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [timers, setTimers] = useState<Timer[]>([]);
  const [cookingNotes, setCookingNotes] = useState<string>('');
  const [showStepsList, setShowStepsList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<CookingSettings>({
    voiceEnabled: false,
    showTips: true,
    autoAdvance: false,
    soundEnabled: true,
    compactMode: window.innerWidth < 768
  });
  
  // Enhanced cooking steps with AI insights
  const [enhancedSteps, setEnhancedSteps] = useState<CookingStep[]>([]);

  // Initialize enhanced steps from recipe
  useEffect(() => {
    if (recipe.instructions && Array.isArray(recipe.instructions)) {
      const enhanced = recipe.instructions.map((instruction, index) => 
        enhanceInstructionWithAI(instruction, index, recipe)
      );
      setEnhancedSteps(enhanced);
    }
  }, [recipe]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      setSettings(prev => ({ ...prev, compactMode: window.innerWidth < 768 }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer management with better notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (timer.isActive && timer.remaining > 0) {
          const newRemaining = timer.remaining - 1;
          
          // Notification when timer completes
          if (newRemaining === 0) {
            notifyTimerComplete(timer);
            return { ...timer, remaining: 0, isActive: false, isComplete: true };
          }
          
          return { ...timer, remaining: newRemaining };
        }
        return timer;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.soundEnabled]);

  // Voice instructions with better error handling
  useEffect(() => {
    if (settings.voiceEnabled && isActive && enhancedSteps[currentStepIndex]) {
      speakInstruction(enhancedSteps[currentStepIndex].instruction);
    }
  }, [currentStepIndex, settings.voiceEnabled, isActive, enhancedSteps]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isActive) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousStep();
          break;
        case 'Enter':
          e.preventDefault();
          markStepComplete();
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, currentStepIndex, enhancedSteps.length]);

  const enhanceInstructionWithAI = useCallback((instruction: string, index: number, recipe: Recipe): CookingStep => {
    const step: CookingStep = {
      id: `step-${index}`,
      instruction,
      tips: [],
      techniques: [],
      equipment: []
    };

    // Extract timing information with better parsing
    const timeMatches = instruction.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi);
    if (timeMatches) {
      const lastMatch = timeMatches[timeMatches.length - 1];
      const timeMatch = lastMatch.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i);
      if (timeMatch) {
        const time = parseFloat(timeMatch[1]);
        const unit = timeMatch[2].toLowerCase();
        if (unit.includes('hour')) {
          step.estimatedTime = Math.round(time * 60);
        } else if (unit.includes('second')) {
          step.estimatedTime = Math.round(time / 60);
        } else {
          step.estimatedTime = Math.round(time);
        }
      }
    }

    // Extract temperature information (both F and C)
    const tempMatch = instruction.match(/(\d+)\s*°?\s*([fFcC])/);
    if (tempMatch) {
      step.temperature = parseInt(tempMatch[1]);
    }

    // Determine difficulty based on techniques
    const complexTechniques = ['julienne', 'brunoise', 'chiffonade', 'emulsify', 'flambe', 'confit'];
    const mediumTechniques = ['sauté', 'braise', 'reduce', 'whisk', 'fold', 'temper'];
    
    // Enhanced technique detection and tips
    const lowerInstruction = instruction.toLowerCase();

    // Cooking methods
    if (lowerInstruction.includes('sauté') || lowerInstruction.includes('fry')) {
      step.techniques.push('sautéing');
      step.tips.push('🔥 Heat the pan before adding oil for even cooking');
      step.tips.push('👥 Don\'t overcrowd - cook in batches for best results');
      step.equipment?.push('frying pan', 'spatula');
      step.difficulty = 'medium';
    }

    if (lowerInstruction.includes('boil')) {
      step.techniques.push('boiling');
      step.tips.push('🧂 Salt the water generously - it should taste like seawater');
      step.tips.push('💨 Wait for a vigorous rolling boil before adding ingredients');
      step.equipment?.push('large pot');
      step.difficulty = 'easy';
    }

    if (lowerInstruction.includes('simmer')) {
      step.techniques.push('simmering');
      step.tips.push('🌡️ Keep bubbles gentle - adjust heat as needed');
      step.tips.push('👀 Partially cover to prevent too much evaporation');
      step.difficulty = 'medium';
    }

    if (lowerInstruction.includes('chop') || lowerInstruction.includes('dice') || lowerInstruction.includes('mince')) {
      step.techniques.push('knife skills');
      step.tips.push('🔪 Keep fingers curled - use knuckles as a guide');
      step.tips.push('⚡ A sharp knife is safer and more efficient than a dull one');
      step.equipment?.push('chef\'s knife', 'cutting board');
      if (lowerInstruction.includes('mince') || lowerInstruction.includes('finely')) {
        step.difficulty = 'medium';
      } else {
        step.difficulty = 'easy';
      }
    }

    if (lowerInstruction.includes('whisk') || lowerInstruction.includes('beat')) {
      step.techniques.push('whisking');
      step.tips.push('💪 Use a figure-8 motion for best incorporation');
      step.tips.push('⏰ Don\'t overbeat - stop when just combined');
      step.equipment?.push('whisk', 'mixing bowl');
    }

    if (lowerInstruction.includes('fold')) {
      step.techniques.push('folding');
      step.tips.push('🤲 Use a gentle cutting and turning motion');
      step.tips.push('📐 Rotate the bowl as you fold for even mixing');
      step.difficulty = 'medium';
    }

    // Seasoning guidance
    if (lowerInstruction.includes('season') || lowerInstruction.includes('salt')) {
      step.tips.push('👅 Taste as you go - you can always add more');
      step.tips.push('🎯 Season at multiple stages for depth of flavor');
    }

    // Common warnings
    if (lowerInstruction.includes('garlic')) {
      step.warnings = ['⚠️ Don\'t let garlic burn - it becomes bitter quickly'];
    }

    if (lowerInstruction.includes('oil') && (lowerInstruction.includes('hot') || lowerInstruction.includes('heat'))) {
      step.warnings = ['🌡️ Watch for oil smoking - reduce heat if needed'];
    }

    if (lowerInstruction.includes('cream') || lowerInstruction.includes('milk')) {
      step.warnings = ['🥛 Don\'t let dairy boil - it may curdle'];
    }

    if (lowerInstruction.includes('chocolate') && lowerInstruction.includes('melt')) {
      step.warnings = ['🍫 Melt slowly - chocolate burns easily'];
      step.tips.push('💡 Use double boiler or low microwave power');
    }

    // Next step preparation hints
    if (index < recipe.instructions.length - 1) {
      const nextInstruction = recipe.instructions[index + 1].toLowerCase();
      if (nextInstruction.includes('add') && step.estimatedTime && step.estimatedTime > 3) {
        step.nextStepPrep = 'While this cooks, prepare ingredients for the next step';
      }
      if (nextInstruction.includes('preheat')) {
        step.nextStepPrep = 'Start preheating your oven for the next step';
      }
    }

    // Set default difficulty if not assigned
    if (!step.difficulty) {
      if (complexTechniques.some(tech => lowerInstruction.includes(tech))) {
        step.difficulty = 'hard';
      } else if (mediumTechniques.some(tech => lowerInstruction.includes(tech))) {
        step.difficulty = 'medium';
      } else {
        step.difficulty = 'easy';
      }
    }

    return step;
  }, []);

  const speakInstruction = useCallback((text: string) => {
    if ('speechSynthesis' in window && settings.voiceEnabled) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Add a small delay to ensure cancellation is complete
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  }, [settings.voiceEnabled]);

  const startTimer = useCallback((name: string, minutes: number) => {
    const newTimer: Timer = {
      id: Date.now().toString(),
      name,
      duration: minutes * 60,
      remaining: minutes * 60,
      isActive: true,
      isComplete: false
    };
    setTimers(prev => [...prev, newTimer]);
  }, []);

  const toggleTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(timer => 
      timer.id === id ? { ...timer, isActive: !timer.isActive } : timer
    ));
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
  }, []);

  const notifyTimerComplete = useCallback((timer: Timer) => {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🍳 Timer Complete: ${timer.name}`, {
        body: 'Your cooking timer has finished!',
        icon: '/chef-icon.png'
      });
    }
    
    // Audio alert
    if (settings.soundEnabled) {
      // Try to play custom sound, fallback to beep
      const audio = new Audio('/timer-sound.mp3');
      audio.play().catch(() => {
        // Create audio context for beep
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
          console.log('🔔 Timer complete:', timer.name);
        }
      });
    }
  }, [settings.soundEnabled]);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    setShowStepsList(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < enhancedSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, enhancedSteps.length]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const markStepComplete = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
    
    if (currentStepIndex < enhancedSteps.length - 1) {
      if (settings.autoAdvance) {
        setTimeout(() => nextStep(), 1000);
      } else {
        nextStep();
      }
    } else {
      onComplete();
    }
  }, [currentStepIndex, enhancedSteps.length, settings.autoAdvance, nextStep, onComplete]);

  const updateSettings = useCallback((newSettings: Partial<CookingSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getDifficultyColor = useCallback((difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  const getDifficultyIcon = useCallback((difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  }, []);

  if (!isActive) return null;

  const currentStep = enhancedSteps[currentStepIndex];
  const progress = enhancedSteps.length > 0 ? ((currentStepIndex + 1) / enhancedSteps.length) * 100 : 0;
  const activeTimers = timers.filter(t => t.isActive || t.isComplete);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl w-full max-w-xs sm:max-w-lg md:max-w-4xl lg:max-w-6xl h-full sm:h-auto sm:max-h-[98vh] overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex-shrink-0">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">Cooking Assistant</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{recipe.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile: Show only essential buttons */}
            {settings.compactMode ? (
              <>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={onExit}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  aria-label="Exit"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                  className={`p-2 rounded-lg transition-colors ${
                    settings.voiceEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  aria-label={settings.voiceEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {settings.voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={onExit}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Exit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Step {currentStepIndex + 1} of {enhancedSteps.length}
            </span>
            <div className="flex items-center gap-2">
              {currentStep?.difficulty && (
                <span className={`text-xs ${getDifficultyColor(currentStep.difficulty)}`}>
                  {getDifficultyIcon(currentStep.difficulty)} {currentStep.difficulty}
                </span>
              )}
              <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Settings Panel (Mobile Dropdown) */}
        {showSettings && (
          <div className="p-3 sm:p-4 bg-blue-50 border-b border-gray-200 flex-shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.showTips}
                  onChange={(e) => updateSettings({ showTips: e.target.checked })}
                  className="rounded"
                />
                <span>AI Tips</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.voiceEnabled}
                  onChange={(e) => updateSettings({ voiceEnabled: e.target.checked })}
                  className="rounded"
                />
                <span>Voice</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoAdvance}
                  onChange={(e) => updateSettings({ autoAdvance: e.target.checked })}
                  className="rounded"
                />
                <span>Auto Next</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                  className="rounded"
                />
                <span>Sound</span>
              </label>
            </div>
          </div>
        )}

        {/* Main Content Area - Fixed scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
          <div className={`h-full ${settings.compactMode ? 'flex flex-col space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6 h-full'}`}>
            {/* Current Step - Better height management */}
            <div className={`${settings.compactMode ? 'flex-1 min-h-0 flex flex-col' : 'lg:col-span-2 flex flex-col h-full'}`}>
              {/* Step Instruction - Fixed header */}
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 flex-shrink-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    Current Step
                  </h3>
                  {settings.compactMode && (
                    <button
                      onClick={() => setShowStepsList(!showStepsList)}
                      className="p-1 text-gray-600 hover:text-gray-800"
                      aria-label="Show all steps"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Scrollable instruction text */}
                <div className="max-h-32 sm:max-h-40 overflow-y-auto mb-3">
                  <p className="text-gray-800 text-sm sm:text-base leading-relaxed">
                    {currentStep?.instruction}
                  </p>
                </div>

                {/* Step Details */}
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                  {currentStep?.estimatedTime && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{currentStep.estimatedTime} min</span>
                    </div>
                  )}
                  {currentStep?.temperature && (
                    <div className="flex items-center gap-1 text-red-600">
                      <Thermometer className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{currentStep.temperature}°F</span>
                    </div>
                  )}
                  {currentStep?.techniques && currentStep.techniques.length > 0 && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{currentStep.techniques.slice(0, 2).join(', ')}</span>
                    </div>
                  )}
                  {currentStep?.equipment && currentStep.equipment.length > 0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{currentStep.equipment.slice(0, 2).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Quick Timer */}
                {currentStep?.estimatedTime && (
                  <div className="mt-3">
                    <button
                      onClick={() => startTimer(`Step ${currentStepIndex + 1}`, currentStep.estimatedTime!)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                    >
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                      Start Timer ({currentStep.estimatedTime} min)
                    </button>
                  </div>
                )}
              </div>

              {/* AI Tips & Warnings - Scrollable section */}
              {settings.showTips && (currentStep?.tips.length > 0 || (currentStep?.warnings && currentStep.warnings.length > 0)) && (
                <div className="flex-1 min-h-0 overflow-y-auto mt-3 sm:mt-4">
                  <div className="space-y-2 sm:space-y-3 pr-2">
                    {/* Tips */}
                    {currentStep?.tips.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <h4 className="flex items-center gap-2 font-medium text-green-900 mb-2 text-sm">
                          <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
                          AI Tips
                        </h4>
                        <ul className="space-y-1">
                          {currentStep.tips.map((tip, index) => (
                            <li key={index} className="text-green-800 text-xs sm:text-sm flex items-start gap-2">
                              <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {currentStep?.warnings && currentStep.warnings.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <h4 className="flex items-center gap-2 font-medium text-yellow-900 mb-2 text-sm">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Important Notes
                        </h4>
                        <ul className="space-y-1">
                          {currentStep.warnings.map((warning, index) => (
                            <li key={index} className="text-yellow-800 text-xs sm:text-sm flex items-start gap-2">
                              <span className="text-yellow-600 mt-0.5 flex-shrink-0">⚠</span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Step Prep */}
                    {currentStep?.nextStepPrep && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <h4 className="flex items-center gap-2 font-medium text-purple-900 mb-2 text-sm">
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                          Prepare for Next Step
                        </h4>
                        <p className="text-purple-800 text-xs sm:text-sm">{currentStep.nextStepPrep}</p>
                      </div>
                    )}

                    {/* Cooking Notes */}
                    {!settings.compactMode && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-2 text-sm">
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Cooking Notes
                        </h4>
                        <textarea
                          value={cookingNotes}
                          onChange={(e) => setCookingNotes(e.target.value)}
                          placeholder="Add your own notes, observations, or modifications..."
                          className="w-full h-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar / Mobile Panels */}
            <div className={`${settings.compactMode ? 'space-y-3' : 'space-y-4'}`}>
              {/* Active Timers */}
              {activeTimers.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2 text-sm">
                    <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                    Active Timers ({activeTimers.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {activeTimers.map(timer => (
                      <div key={timer.id} className="bg-white rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {timer.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleTimer(timer.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              aria-label={timer.isActive ? 'Pause timer' : 'Resume timer'}
                            >
                              {timer.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => removeTimer(timer.id)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                              aria-label="Remove timer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className={`text-sm sm:text-base font-mono ${
                          timer.isComplete ? 'text-green-600' : 
                          timer.remaining <= 60 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {timer.isComplete ? '✅ Done!' : formatTime(timer.remaining)}
                        </div>
                        {timer.remaining <= 60 && timer.remaining > 0 && !timer.isComplete && (
                          <div className="text-xs text-red-600 font-medium">
                            Almost done! 🔥
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile: Collapsible Step Navigation */}
              {(showStepsList || !settings.compactMode) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">All Steps</h4>
                    {settings.compactMode && (
                      <button
                        onClick={() => setShowStepsList(false)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Hide steps"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-48 sm:max-h-60 overflow-y-auto">
                    {enhancedSteps.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => goToStep(index)}
                        className={`w-full text-left p-2 rounded text-xs sm:text-sm transition-colors ${
                          index === currentStepIndex
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : completedSteps.has(index)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {completedSteps.has(index) ? (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex-shrink-0 ${
                              index === currentStepIndex ? 'border-blue-600' : 'border-gray-300'
                            }`} />
                          )}
                          <span className="truncate">
                            {step.instruction.substring(0, settings.compactMode ? 40 : 50)}
                            {step.instruction.length > (settings.compactMode ? 40 : 50) ? '...' : ''}
                          </span>
                          {step.estimatedTime && (
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {step.estimatedTime}m
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions (Mobile) */}
              {settings.compactMode && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                      className={`w-full flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                        settings.voiceEnabled ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'
                      }`}
                    >
                      {settings.voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      Voice Instructions
                    </button>
                    {currentStep?.estimatedTime && (
                      <button
                        onClick={() => startTimer(`Step ${currentStepIndex + 1}`, currentStep.estimatedTime!)}
                        className="w-full flex items-center gap-2 p-2 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200 transition-colors"
                      >
                        <Timer className="w-4 h-4" />
                        Quick Timer ({currentStep.estimatedTime}m)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Notes */}
              {settings.compactMode && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="flex items-center gap-2 font-medium text-gray-900 mb-2 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    Notes
                  </h4>
                  <textarea
                    value={cookingNotes}
                    onChange={(e) => setCookingNotes(e.target.value)}
                    placeholder="Quick notes..."
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className={`${settings.compactMode ? 'flex flex-col space-y-2' : 'flex items-center justify-between'}`}>
            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={previousStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                <SkipBack className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              
              <button
                onClick={markStepComplete}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {currentStepIndex === enhancedSteps.length - 1 ? 'Complete!' : 
                 settings.compactMode ? 'Done' : 'Mark Complete'}
              </button>
              
              <button
                onClick={nextStep}
                disabled={currentStepIndex === enhancedSteps.length - 1}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Tips */}
            {!settings.compactMode && (
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <Smartphone className="w-3 h-3" />
                <span>Use ← → arrow keys or spacebar for navigation</span>
              </div>
            )}
          </div>

          {/* Mobile: Keyboard shortcuts tip */}
          {settings.compactMode && (
            <div className="text-center">
              <div className="text-xs text-gray-500 mt-1">
                💡 Use arrow keys for navigation • Space to complete steps
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}