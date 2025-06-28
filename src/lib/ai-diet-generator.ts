// src/lib/ai-diet-generator.ts

import { z } from 'zod';

const RareConditionAnalysisSchema = z.object({
  conditionName: z.string(),
  definition: z.string().optional(),
  overview: z.string(),
  confidenceLevel: z.enum(['low', 'medium', 'high']),
  dietaryRecommendations: z.object({
    avoidFoods: z.array(z.string()),
    recommendedFoods: z.array(z.string()),
    keyNutrients: z.array(z.string()),
    mealPlanningTips: z.array(z.string()).optional()
  }),
  warningSigns: z.array(z.string()).optional(),
  specialNotes: z.array(z.string()).optional(),
  medicationInteractions: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  medicalDisclaimer: z.string()
});

const DietPlanParamsSchema = z.object({
  healthConditions: z.array(z.string()).max(20),
  severityLevels: z.record(z.string(), z.enum(['mild', 'moderate', 'severe'])),
  currentMedications: z.array(z.string()).max(50),
  allergens: z.array(z.string()).max(20),
  dietaryPreferences: z.array(z.string()).max(20),
  goalType: z.enum(['maintenance', 'improvement', 'weight-loss', 'weight-gain', 'athletic', 'heart-healthy', 'anti-inflammatory']),
  rareConditionAnalysis: z.array(RareConditionAnalysisSchema).optional(),
  preferences: z.object({
    cookingSkillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    budgetRange: z.object({
      min: z.number().min(1).max(100),
      max: z.number().min(1).max(200)
    }),
    cuisinePreferences: z.array(z.string()).optional(),
    mealPrepTime: z.number().min(5).max(180).optional()
  }),
  userId: z.string(),
  symptoms: z.string().optional(),
  doctorRecommendations: z.string().optional(),
  additionalInfo: z.string().optional()
});

export type DietPlanParams = z.infer<typeof DietPlanParamsSchema>;
export type RareConditionAnalysis = z.infer<typeof RareConditionAnalysisSchema>;

export interface GeneratedDietPlan {
  restrictions: string[];
  recommendations: string[];
  specialNotes: string[];
  mealPlan: {
    dailyMeals: Record<string, {
      breakfast: string;
      lunch: string;
      dinner: string;
      snacks: string;
    }>;
  };
  shoppingList: Array<{
    category: string;
    items: string[];
  }>;
  mealPrepTips: string[];
  nutritionGuidelines: string;
  emergencySubstitutions: string[];
  progressTracking: string;
  rareConditionIntegration?: {
    conditionsAnalyzed: number;
    keyConsiderations: string[];
    nutritionalFocus: string[];
    specialModifications: string[];
  };
  metadata: {
    generatedAt: string;
    version: string;
    generationMethod: 'ai' | 'structured';
    confidenceScore: number;
    processingTime: number;
    hasRareConditionAnalysis: boolean;
  };
}

export interface DietPlanResult {
  success: boolean;
  data?: GeneratedDietPlan;
  error?: string;
  retryable?: boolean;
}

export async function generateDietPlanWithAI(params: DietPlanParams): Promise<DietPlanResult> {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting enhanced diet plan generation with rare condition support');
    console.log('📊 Parameters:', {
      healthConditions: params.healthConditions?.length || 0,
      hasRareAnalysis: !!params.rareConditionAnalysis && params.rareConditionAnalysis.length > 0,
      goalType: params.goalType,
      allergens: params.allergens?.length || 0
    });
    
    // Validate input parameters
    const validationResult = DietPlanParamsSchema.safeParse(params);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid parameters: ${formatValidationError(validationResult.error)}`,
        retryable: false
      };
    }

    const validParams = validationResult.data;

    // Step 1: Analyze health conditions to identify rare ones needing analysis
    const conditionAnalysis = await analyzeHealthConditions(validParams);
    console.log('🔍 Condition analysis:', conditionAnalysis);

    // Always ensure rareConditionAnalysis is either undefined or an array
    let enhancedRareAnalysis = validParams.rareConditionAnalysis;
    if (conditionAnalysis.needsRareAnalysis && conditionAnalysis.rare.length > 0) {
      console.log('🧬 Processing rare conditions:', conditionAnalysis.rare);
      enhancedRareAnalysis = await processRareConditions(validParams, conditionAnalysis.rare);
    }

    // Step 3: Generate diet plan with enhanced rare condition data
    const enhancedParams = {
      ...validParams,
      rareConditionAnalysis: enhancedRareAnalysis
    };

    // FIXED: Check for Perplexity API key only
    const hasPerplexityKey = process.env.PERPLEXITY_API_KEY;
    
    console.log('🔍 API Key Check:', {
      hasPerplexity: !!hasPerplexityKey,
      keyLength: hasPerplexityKey?.length || 0,
      keyPrefix: hasPerplexityKey?.substring(0, 8) || 'none'
    });

    if (hasPerplexityKey) {
      console.log('🤖 Attempting Perplexity AI generation...');
      const aiResult = await generateWithPerplexityAI(enhancedParams);
      
      if (aiResult.success && aiResult.data) {
        console.log('✅ Perplexity AI generation successful');
        aiResult.data.metadata.processingTime = Date.now() - startTime;
        return aiResult;
      } else {
        console.log('⚠️ Perplexity AI generation failed, using enhanced structured fallback:', aiResult.error);
      }
    } else {
      console.log('ℹ️ No Perplexity API key found, using enhanced structured generation');
    }

    // Use enhanced structured fallback
    const fallbackResult = await generateEnhancedStructuredPlan(enhancedParams);
    if (fallbackResult.data) {
      fallbackResult.data.metadata.processingTime = Date.now() - startTime;
    }
    
    return fallbackResult;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Enhanced diet plan generation failed:', errorMessage);
    
    return {
      success: false,
      error: `Enhanced diet plan generation failed: ${errorMessage}`,
      retryable: true
    };
  }
}

async function generateWithPerplexityAI(params: DietPlanParams): Promise<DietPlanResult> {
  try {
    console.log('🔍 Generating enhanced diet plan with Perplexity AI');
    
    const prompt = createEnhancedDietPlanPrompt(params);
    const aiResponse = await callPerplexityAPI(prompt);
    
    if (aiResponse) {
      console.log('📝 Perplexity AI response received');
      const parsedPlan = parseEnhancedAIResponse(aiResponse, params);
      
      if (parsedPlan) {
        return {
          success: true,
          data: parsedPlan
        };
      }
    }
    
    throw new Error('Perplexity AI generation failed');

  } catch (error) {
    console.error('❌ Perplexity AI generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Perplexity AI generation failed',
      retryable: true
    };
  }
}

async function callPerplexityAPI(prompt: string): Promise<string | null> {
  try {
    console.log('🚀 Calling Perplexity API...');
    
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not found in environment variables');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a specialized medical nutritionist with expertise in rare diseases and therapeutic diets. Create comprehensive, evidence-based dietary plans that integrate rare condition needs with standard nutritional principles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
        top_p: 1,
        return_citations: true,
        search_domain_filter: ["pubmed.ncbi.nlm.nih.gov", "mayoclinic.org", "webmd.com", "healthline.com"]
      }),
    });

    console.log('📡 Perplexity response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity API error response:', errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid Perplexity API key or insufficient credits');
      } else if (response.status === 429) {
        throw new Error('Perplexity API rate limit exceeded');
      } else {
        throw new Error(`Perplexity API failed: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('✅ Perplexity API success');
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from Perplexity API');
    }
    
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('❌ Perplexity API network error:', error);
    throw error;
  }
}

// Analyze health conditions to identify rare ones
async function analyzeHealthConditions(params: DietPlanParams) {
  const commonConditions = [
    'diabetes', 'type 2 diabetes', 'type 1 diabetes',
    'hypertension', 'high blood pressure',
    'heart disease', 'cardiovascular disease',
    'obesity', 'overweight',
    'arthritis', 'osteoarthritis', 'rheumatoid arthritis',
    'asthma', 'copd',
    'depression', 'anxiety',
    'high cholesterol', 'hyperlipidemia',
    'osteoporosis', 'osteopenia',
    'gerd', 'acid reflux',
    'migraine', 'headaches',
    'allergies', 'food allergies',
    'celiac disease', 'gluten intolerance',
    'lactose intolerance', 'dairy intolerance',
    'ibs', 'irritable bowel syndrome',
    'hypothyroidism', 'hyperthyroidism',
    'anemia', 'iron deficiency'
  ];

  const rareConditions: string[] = [];
  const commonFound: string[] = [];

  params.healthConditions.forEach(condition => {
    const lowerCondition = condition.toLowerCase().trim();
    
    const isCommon = commonConditions.some(common => 
      lowerCondition.includes(common) || common.includes(lowerCondition)
    );

    if (isCommon) {
      commonFound.push(condition);
    } else {
      rareConditions.push(condition);
    }
  });

  return {
    total: params.healthConditions.length,
    common: commonFound,
    rare: rareConditions,
    needsRareAnalysis: rareConditions.length > 0 && !params.rareConditionAnalysis
  };
}

// Process rare conditions to get analysis
async function processRareConditions(params: DietPlanParams, rareConditions: string[]): Promise<RareConditionAnalysis[]> {
  const analyses: RareConditionAnalysis[] = [];

  for (const condition of rareConditions) {
    try {
      console.log(`🔍 Analyzing rare condition: ${condition}`);
      
      // Call rare condition analysis API
      const response = await fetch('/api/health/analyze-rare-condition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(params.userId && { 'x-user-id': params.userId })
        },
        body: JSON.stringify({
          conditionName: condition,
          symptoms: params.symptoms || '',
          currentMedications: params.currentMedications || [],
          doctorRecommendations: params.doctorRecommendations || '',
          severity: params.severityLevels?.[condition] || 'moderate',
          additionalInfo: params.additionalInfo || ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.analysis) {
          analyses.push(result.analysis);
          console.log(`✅ Analysis completed for ${condition}`);
        }
      } else {
        console.log(`⚠️ Analysis failed for ${condition}, using fallback`);
        analyses.push(createFallbackAnalysis(condition));
      }
    } catch (error) {
      console.error(`❌ Error analyzing ${condition}:`, error);
      analyses.push(createFallbackAnalysis(condition));
    }
  }

  return analyses;
}

// Create fallback analysis for rare conditions
function createFallbackAnalysis(conditionName: string): RareConditionAnalysis {
  return {
    conditionName,
    overview: `${conditionName} is a rare condition that requires specialized dietary considerations and medical supervision.`,
    confidenceLevel: 'medium',
    dietaryRecommendations: {
      avoidFoods: [
        'Highly processed foods',
        'Foods with artificial additives',
        'Excessive sugar',
        'Trans fats',
        'Known trigger foods'
      ],
      recommendedFoods: [
        'Whole, unprocessed foods',
        'Anti-inflammatory foods',
        'Nutrient-dense vegetables',
        'Lean proteins',
        'Healthy fats',
        'Fresh fruits'
      ],
      keyNutrients: [
        'Complete vitamin profile',
        'Essential minerals',
        'Omega-3 fatty acids',
        'Antioxidants',
        'Adequate protein'
      ],
      mealPlanningTips: [
        'Maintain regular meal times',
        'Focus on nutrient density',
        'Monitor individual responses',
        'Keep detailed food logs'
      ]
    },
    warningSigns: [
      'Any new or worsening symptoms',
      'Unusual reactions to foods',
      'Changes in appetite or digestion'
    ],
    specialNotes: [
      'This condition requires individualized dietary approach',
      'Regular medical monitoring recommended',
      'Work with healthcare providers familiar with this condition'
    ],
    restrictions: ['rare-condition-monitored', 'medical-supervision-required'],
    recommendations: ['nutrient-dense', 'anti-inflammatory', 'individualized-approach'],
    medicalDisclaimer: 'This analysis is for educational purposes only. Always consult your healthcare provider for personalized medical advice.'
  };
}

// Create enhanced prompt with rare condition integration
function createEnhancedDietPlanPrompt(params: DietPlanParams): string {
  const allergenWarnings = params.allergens.length > 0 
    ? `CRITICAL SAFETY: Completely avoid ${params.allergens.join(', ')}. Check all ingredients for hidden sources.` 
    : '';

  const conditionsText = params.healthConditions.length > 0 
    ? `Health conditions: ${params.healthConditions.join(', ')}` 
    : '';

  const medicationsText = params.currentMedications.length > 0 
    ? `Current medications: ${params.currentMedications.join(', ')}` 
    : '';

  let rareConditionText = '';
  if (params.rareConditionAnalysis && params.rareConditionAnalysis.length > 0) {
    rareConditionText = '\nRARE CONDITION ANALYSIS:\n';
    params.rareConditionAnalysis.forEach((analysis, index) => {
      rareConditionText += `\nCondition ${index + 1}: ${analysis.conditionName}
Definition: ${analysis.definition || analysis.overview}
Critical foods to avoid: ${analysis.dietaryRecommendations.avoidFoods.join(', ')}
Recommended foods: ${analysis.dietaryRecommendations.recommendedFoods.join(', ')}
Key nutrients needed: ${analysis.dietaryRecommendations.keyNutrients.join(', ')}
Warning signs: ${analysis.warningSigns?.join(', ') || 'Monitor carefully'}
Special considerations: ${analysis.specialNotes?.join('; ') || 'Requires medical supervision'}`;
    });
  }

  return `Create a comprehensive, medically-informed 7-day diet plan for someone with complex health needs including rare conditions.

PATIENT PROFILE:
${conditionsText}
${allergenWarnings}
${rareConditionText}
Dietary preferences: ${params.dietaryPreferences.join(', ')}
${medicationsText}
Primary goal: ${params.goalType}
Cooking skill level: ${params.preferences.cookingSkillLevel}
Budget range: $${params.preferences.budgetRange.min}-${params.preferences.budgetRange.max} per serving

CRITICAL REQUIREMENTS:
- Integrate rare condition dietary needs into all recommendations
- Ensure all meals are safe for the listed health conditions
- Consider medication-food interactions
- Provide specific calorie counts for each meal
- Include variety while respecting all restrictions

Please provide a detailed response in this exact JSON format:
{
  "restrictions": [
    "**Critical Safety**: [Specific restriction with medical reasoning]",
    "**Rare Condition Management**: [Condition-specific restrictions]"
  ],
  "recommendations": [
    "**Therapeutic Foods**: [Foods that actively help manage conditions]",
    "**Rare Condition Support**: [Specific recommendations for rare conditions]"
  ],
  "specialNotes": [
    "**Medical Supervision**: [Monitoring requirements]",
    "**Rare Condition Monitoring**: [Specific monitoring for rare conditions]"
  ],
  "mealPlan": {
    "dailyMeals": {
      "day1": {
        "breakfast": "[Meal name considering all conditions] (XXX calories)",
        "lunch": "[Meal name considering all conditions] (XXX calories)", 
        "dinner": "[Meal name considering all conditions] (XXX calories)",
        "snacks": "[Snack options considering all conditions] (XXX calories)"
      },
      "day2": { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
      "day3": { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
      "day4": { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
      "day5": { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
      "day6": { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
      "day7": { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." }
    }
  },
  "shoppingList": [
    {
      "category": "Therapeutic Foods",
      "items": ["Foods specifically beneficial for the rare conditions"]
    },
    {
      "category": "Safe Proteins", 
      "items": ["Proteins that are safe for all conditions"]
    },
    {
      "category": "Condition-Safe Vegetables",
      "items": ["Vegetables that support the health conditions"]
    },
    {
      "category": "Specialized Items",
      "items": ["Any specialized foods needed for rare conditions"]
    }
  ],
  "mealPrepTips": [
    "**Rare Condition Prep**: [Specific prep tips for rare conditions]",
    "**Safety Measures**: [Food safety considerations for the conditions]"
  ],
  "nutritionGuidelines": "Comprehensive guidelines addressing all health conditions, especially rare ones. Include specific nutrient targets and timing considerations.",
  "emergencySubstitutions": [
    "**Condition-Safe Swaps**: [Safe alternatives for each condition]",
    "**Rare Condition Alternatives**: [Specific substitutions for rare conditions]"
  ],
  "progressTracking": "Detailed tracking plan for all conditions, with special attention to rare condition symptoms and responses to dietary changes."
}

IMPORTANT:
- Every recommendation must be safe for ALL listed conditions
- Integrate rare condition needs into standard meal planning
- Include specific monitoring for rare conditions
- Provide actionable, practical guidance
- Ensure nutritional adequacy despite restrictions`;
}

// Parse enhanced AI response with rare condition integration
function parseEnhancedAIResponse(response: string, params: DietPlanParams): GeneratedDietPlan | null {
  try {
    console.log('📋 Parsing enhanced AI response with rare condition integration...');
    
    let parsed: any = null;
    
    // Try multiple parsing strategies
    try {
      parsed = JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/```\s*([\s\S]*?)\s*```/) ||
                       response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[jsonMatch.length - 1].trim();
        parsed = JSON.parse(jsonStr);
      }
    }
    
    if (!parsed || !validateParsedPlan(parsed)) {
      console.error('❌ Invalid response structure from enhanced AI');
      return null;
    }
    
    // Add rare condition integration summary
    let rareConditionIntegration;
    if (params.rareConditionAnalysis && params.rareConditionAnalysis.length > 0) {
      rareConditionIntegration = createRareConditionIntegration(params.rareConditionAnalysis, parsed);
    }
    
    // Add enhanced metadata
    return {
      ...parsed,
      rareConditionIntegration,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.1.0',
        generationMethod: 'ai',
        confidenceScore: 0.95,
        processingTime: 0,
        hasRareConditionAnalysis: !!(params.rareConditionAnalysis && params.rareConditionAnalysis.length > 0)
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to parse enhanced AI response:', error);
    return null;
  }
}

// Create rare condition integration summary
function createRareConditionIntegration(rareAnalyses: RareConditionAnalysis[], dietPlan: any) {
  const integration = {
    conditionsAnalyzed: rareAnalyses.length,
    keyConsiderations: [] as string[],
    nutritionalFocus: [] as string[],
    specialModifications: [] as string[]
  };

  rareAnalyses.forEach(analysis => {
    // Extract key considerations
    if (analysis.specialNotes) {
      integration.keyConsiderations.push(...analysis.specialNotes.slice(0, 2));
    }

    // Extract nutritional focus
    if (analysis.dietaryRecommendations.keyNutrients) {
      integration.nutritionalFocus.push(...analysis.dietaryRecommendations.keyNutrients.slice(0, 3));
    }

    // Extract special modifications
    if (analysis.dietaryRecommendations.mealPlanningTips) {
      integration.specialModifications.push(...analysis.dietaryRecommendations.mealPlanningTips.slice(0, 2));
    }
  });

  // Remove duplicates
  integration.keyConsiderations = [...new Set(integration.keyConsiderations)];
  integration.nutritionalFocus = [...new Set(integration.nutritionalFocus)];
  integration.specialModifications = [...new Set(integration.specialModifications)];

  return integration;
}

// Enhanced structured plan generation
async function generateEnhancedStructuredPlan(params: DietPlanParams): Promise<DietPlanResult> {
  try {
    console.log('🏗️ Generating enhanced structured plan with rare condition integration...');
    
    const structuredPlan = createEnhancedStructuredPlan(params);
    
    return {
      success: true,
      data: {
        ...structuredPlan,
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.1.0',
          generationMethod: 'structured',
          confidenceScore: 0.85,
          processingTime: 0,
          hasRareConditionAnalysis: !!(params.rareConditionAnalysis && params.rareConditionAnalysis.length > 0)
        }
      }
    };

  } catch (error) {
    console.error('❌ Enhanced structured generation failed:', error);
    return {
      success: false,
      error: `Enhanced structured generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: false
    };
  }
}

// Enhanced structured plan creation
function createEnhancedStructuredPlan(params: DietPlanParams): Omit<GeneratedDietPlan, 'metadata'> {
  console.log('🏗️ Creating enhanced structured plan with rare condition support...');
  
  // Analyze health conditions
  const hasHypertension = params.healthConditions.some(c => 
    c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure')
  );
  const hasDiabetes = params.healthConditions.some(c => 
    c.toLowerCase().includes('diabetes')
  );
  const hasHeartDisease = params.healthConditions.some(c => 
    c.toLowerCase().includes('heart')
  );

  // Analyze dietary preferences
  const isVegetarian = params.dietaryPreferences.some(p => p.toLowerCase().includes('vegetarian'));
  const isVegan = params.dietaryPreferences.some(p => p.toLowerCase().includes('vegan'));
  const isGlutenFree = params.dietaryPreferences.some(p => p.toLowerCase().includes('gluten'));
  const isDairyFree = params.dietaryPreferences.some(p => p.toLowerCase().includes('dairy')) || 
                     params.allergens.some(a => a.toLowerCase().includes('dairy'));

  // Create base plan object
  const basePlan = {
    restrictions: generateEnhancedRestrictions({ 
      hasHypertension, 
      hasDiabetes, 
      hasHeartDisease, 
      allergens: params.allergens, 
      rareConditionAnalysis: params.rareConditionAnalysis 
    }),
    recommendations: generateEnhancedRecommendations({ 
      hasHypertension, 
      hasDiabetes, 
      hasHeartDisease, 
      goalType: params.goalType, 
      rareConditionAnalysis: params.rareConditionAnalysis 
    }),
    specialNotes: generateEnhancedSpecialNotes({ 
      hasHypertension, 
      hasDiabetes, 
      hasHeartDisease, 
      medications: params.currentMedications, 
      rareConditionAnalysis: params.rareConditionAnalysis 
    }),
    mealPlan: {
      dailyMeals: generateEnhancedWeeklyMealPlan({ 
        isVegetarian, 
        isVegan, 
        isGlutenFree, 
        isDairyFree, 
        cookingSkill: params.preferences.cookingSkillLevel, 
        goalType: params.goalType,
        rareConditionAnalysis: params.rareConditionAnalysis 
      })
    },
    shoppingList: generateEnhancedShoppingList({ 
      isVegetarian, 
      isVegan, 
      isGlutenFree, 
      isDairyFree, 
      allergens: params.allergens,
      rareConditionAnalysis: params.rareConditionAnalysis 
    }),
    mealPrepTips: generateEnhancedMealPrepTips({ 
      cookingSkill: params.preferences.cookingSkillLevel,
      rareConditionAnalysis: params.rareConditionAnalysis 
    }),
    nutritionGuidelines: generateEnhancedNutritionGuidelines({ 
      hasHypertension, 
      hasDiabetes, 
      hasHeartDisease, 
      goalType: params.goalType,
      rareConditionAnalysis: params.rareConditionAnalysis 
    }),
    emergencySubstitutions: generateEnhancedEmergencySubstitutions({ 
      isVegetarian, 
      isVegan, 
      isGlutenFree, 
      isDairyFree, 
      allergens: params.allergens,
      rareConditionAnalysis: params.rareConditionAnalysis 
    }),
    progressTracking: generateEnhancedProgressTracking({ 
      hasHypertension, 
      hasDiabetes, 
      hasHeartDisease, 
      goalType: params.goalType,
      rareConditionAnalysis: params.rareConditionAnalysis 
    })
  };

  // Add rare condition integration if applicable and return with proper typing
  if (params.rareConditionAnalysis && params.rareConditionAnalysis.length > 0) {
    return {
      ...basePlan,
      rareConditionIntegration: createRareConditionIntegration(params.rareConditionAnalysis, basePlan)
    };
  }

  return basePlan;
}

// Enhanced generation functions with rare condition support
function generateEnhancedRestrictions(conditions: any): string[] {
  const restrictions = [];

  // Add rare condition restrictions first
  if (conditions.rareConditionAnalysis && conditions.rareConditionAnalysis.length > 0) {
    conditions.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      restrictions.push(`**${analysis.conditionName} Management**: Critical dietary restrictions for this rare condition`);
      analysis.dietaryRecommendations.avoidFoods.forEach(food => {
        restrictions.push(`**Avoid ${food}**: Important for ${analysis.conditionName} management`);
      });
    });
  }

  // Add standard condition restrictions
  if (conditions.hasHypertension) {
    restrictions.push("**Sodium Restriction**: Limit sodium to less than 2,300mg per day for blood pressure management");
  }

  if (conditions.hasDiabetes) {
    restrictions.push("**Blood Sugar Control**: Avoid high glycemic foods and monitor carbohydrate portions");
  }

  if (conditions.hasHeartDisease) {
    restrictions.push("**Heart Health**: Limit saturated fat to less than 7% of daily calories");
  }

  if (conditions.allergens && conditions.allergens.length > 0) {
    restrictions.push(`**Allergen Safety**: Completely avoid ${conditions.allergens.join(', ')} and check all food labels`);
  }

  restrictions.push("**Food Safety**: Minimize ultra-processed foods with artificial additives");

  return restrictions;
}

function generateEnhancedRecommendations(conditions: any): string[] {
  const recommendations = [];

  // Add rare condition recommendations first
  if (conditions.rareConditionAnalysis && conditions.rareConditionAnalysis.length > 0) {
    conditions.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      recommendations.push(`**${analysis.conditionName} Support**: Include therapeutic foods for this condition`);
      analysis.dietaryRecommendations.recommendedFoods.slice(0, 3).forEach(food => {
        recommendations.push(`**${food}**: Beneficial for ${analysis.conditionName} management`);
      });
    });
  }

  // Add standard recommendations
  recommendations.push("**Whole Foods Focus**: Emphasize unprocessed, nutrient-dense foods");

  if (conditions.hasHypertension) {
    recommendations.push("**DASH Diet Foods**: Include potassium-rich foods like bananas, spinach, and avocados for blood pressure support");
  }

  if (conditions.hasDiabetes) {
    recommendations.push("**Fiber-Rich Foods**: Emphasize high-fiber foods like oats, quinoa, and legumes for blood sugar control");
  }

  if (conditions.hasHeartDisease) {
    recommendations.push("**Omega-3 Sources**: Include fatty fish twice weekly or plant-based omega-3 sources");
  }

  if (conditions.goalType === 'weight-loss') {
    recommendations.push("**Portion Control**: Focus on protein and vegetables first, use smaller plates");
  }

  return recommendations;
}

function generateEnhancedSpecialNotes(conditions: any): string[] {
  const notes = [];

  notes.push("**Medical Supervision**: This diet plan is educational only. Consult healthcare providers before making changes");

  // Add rare condition specific notes
  if (conditions.rareConditionAnalysis && conditions.rareConditionAnalysis.length > 0) {
    conditions.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      notes.push(`**${analysis.conditionName} Monitoring**: ${analysis.medicalDisclaimer}`);
      if (analysis.warningSigns && analysis.warningSigns.length > 0) {
        notes.push(`**Warning Signs for ${analysis.conditionName}**: ${analysis.warningSigns.join(', ')}`);
      }
    });
  }

  if (conditions.hasHypertension || conditions.hasDiabetes || conditions.hasHeartDisease) {
    notes.push("**Regular Monitoring**: Track your health markers as recommended by your healthcare team");
  }

  if (conditions.medications && conditions.medications.length > 0) {
    notes.push("**Medication Interactions**: Some foods may interact with medications. Consult your pharmacist");
  }

  notes.push("**Gradual Changes**: Implement dietary changes gradually over 2-4 weeks for better adherence");

  return notes;
}

function generateEnhancedWeeklyMealPlan(preferences: any): Record<string, any> {
  const mealPlan: Record<string, any> = {};

  // Create base meal options
  let mealOptions = {
    breakfast: [
      "Anti-inflammatory oatmeal with berries and walnuts (350 calories)",
      "Nutrient-dense avocado toast with tomatoes (320 calories)", 
      "Protein-rich Greek yogurt with fruit and nuts (340 calories)",
      "Therapeutic vegetable scramble with herbs (380 calories)",
      "Healing smoothie bowl with superfoods (360 calories)",
      "Omega-3 rich chia pudding with almonds (330 calories)",
      "Heart-healthy whole grain cereal with banana (310 calories)"
    ],
    lunch: [
      "Therapeutic quinoa salad with healing vegetables (420 calories)",
      "Anti-inflammatory soup with whole grain bread (450 calories)",
      "Nutrient-dense Buddha bowl with tahini (480 calories)",
      "Healing stuffed sweet potato with legumes (460 calories)",
      "Mediterranean salad with therapeutic herbs (440 calories)",
      "Gut-healing veggie wrap with probiotics (410 calories)",
      "Immune-supporting lentil soup (430 calories)"
    ],
    dinner: [
      "Omega-3 rich fish with healing vegetables (480 calories)",
      "Anti-inflammatory chicken with quinoa (520 calories)",
      "Therapeutic vegetable curry with brown rice (500 calories)",
      "Nutrient-dense stuffed bell peppers (460 calories)",
      "Healing salmon with cruciferous vegetables (510 calories)",
      "Lean protein with zucchini noodles (470 calories)",
      "Plant-based healing chili (450 calories)"
    ],
    snacks: [
      "Anti-inflammatory apple with almond butter (180 calories)",
      "Probiotic hummus with healing vegetables (160 calories)",
      "Omega-3 rich nuts and antioxidant fruit (190 calories)",
      "Therapeutic Greek yogurt with berries (140 calories)",
      "Nutrient-dense crackers with healthy fats (170 calories)",
      "Healing protein smoothie (200 calories)",
      "Brain-healthy nuts with dark chocolate (150 calories)"
    ]
  };

  // Modify for rare conditions
  if (preferences.rareConditionAnalysis && preferences.rareConditionAnalysis.length > 0) {
    preferences.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      const avoidFoods = analysis.dietaryRecommendations.avoidFoods.map(f => f.toLowerCase());
      const recommendedFoods = analysis.dietaryRecommendations.recommendedFoods;

      // Filter out avoided foods
      Object.keys(mealOptions).forEach(mealType => {
        mealOptions[mealType as keyof typeof mealOptions] = mealOptions[mealType as keyof typeof mealOptions].filter(meal => {
          const mealLower = meal.toLowerCase();
          return !avoidFoods.some(avoid => mealLower.includes(avoid.toLowerCase()));
        });
      });

      // Add recommended foods where possible
      if (recommendedFoods.length > 0) {
        const beneficialFood = recommendedFoods[0];
        mealOptions.breakfast.unshift(`${analysis.conditionName}-supporting meal with ${beneficialFood} (360 calories)`);
        mealOptions.lunch.unshift(`Therapeutic ${beneficialFood} bowl for ${analysis.conditionName} (440 calories)`);
        mealOptions.dinner.unshift(`Healing ${beneficialFood} dinner for ${analysis.conditionName} (490 calories)`);
      }
    });
  }

  // Apply other dietary restrictions
  if (preferences.isVegan) {
    mealOptions.breakfast = mealOptions.breakfast.map(meal => 
      meal.replace(/Greek yogurt/gi, 'coconut yogurt').replace(/milk/gi, 'plant milk')
    );
    mealOptions.lunch = mealOptions.lunch.filter(meal => 
      !meal.toLowerCase().includes('cheese')
    );
    mealOptions.dinner = mealOptions.dinner.filter(meal => 
      !meal.toLowerCase().includes('fish') && !meal.toLowerCase().includes('chicken') && 
      !meal.toLowerCase().includes('salmon')
    );
  }

  if (preferences.isGlutenFree) {
    mealOptions.breakfast = mealOptions.breakfast.map(meal => 
      meal.replace(/toast/gi, 'gluten-free toast').replace(/cereal/gi, 'gluten-free cereal')
    );
  }

  // Generate 7 days
  for (let day = 1; day <= 7; day++) {
    mealPlan[`day${day}`] = {
      breakfast: mealOptions.breakfast[(day - 1) % mealOptions.breakfast.length],
      lunch: mealOptions.lunch[(day - 1) % mealOptions.lunch.length],
      dinner: mealOptions.dinner[(day - 1) % mealOptions.dinner.length],
      snacks: mealOptions.snacks[(day - 1) % mealOptions.snacks.length]
    };
  }

  return mealPlan;
}

function generateEnhancedShoppingList(preferences: any): Array<{category: string; items: string[]}> {
  const baseList = [
    {
      category: "Therapeutic Proteins",
      items: preferences.isVegan ? [
        "Organic tofu", "Tempeh", "Hemp seeds", "Lentils", "Black beans", "Chickpeas", "Quinoa", "Nutritional yeast"
      ] : [
        "Wild-caught salmon", "Organic chicken breast", "Pasture-raised eggs", "Greek yogurt", "Cottage cheese", "Lean turkey"
      ]
    },
    {
      category: "Healing Vegetables", 
      items: ["Organic spinach", "Kale", "Broccoli", "Bell peppers", "Sweet potatoes", "Carrots", "Beets", "Avocados", "Garlic", "Ginger"]
    },
    {
      category: "Anti-inflammatory Fruits",
      items: ["Blueberries", "Cherries", "Pomegranate", "Oranges", "Lemons", "Apples", "Bananas"]
    },
    {
      category: "Nutrient-Dense Grains",
      items: preferences.isGlutenFree ? [
        "Quinoa", "Brown rice", "Gluten-free oats", "Amaranth", "Buckwheat"
      ] : [
        "Quinoa", "Brown rice", "Steel-cut oats", "Whole grain bread", "Barley"
      ]
    },
    {
      category: "Healthy Fats",
      items: ["Extra virgin olive oil", "Avocado oil", "Raw almonds", "Walnuts", "Chia seeds", "Flaxseeds", "Coconut oil"]
    },
    {
      category: "Therapeutic Herbs & Spices",
      items: ["Turmeric", "Ginger", "Cinnamon", "Garlic", "Oregano", "Thyme", "Rosemary", "Basil"]
    }
  ];

  // Add rare condition specific foods
  if (preferences.rareConditionAnalysis && preferences.rareConditionAnalysis.length > 0) {
    const therapeuticFoods: string[] = [];
    
    preferences.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      therapeuticFoods.push(...analysis.dietaryRecommendations.recommendedFoods.slice(0, 3));
    });

    if (therapeuticFoods.length > 0) {
      baseList.unshift({
        category: "Rare Condition Therapeutics",
        items: [...new Set(therapeuticFoods)] // Remove duplicates
      });
    }
  }

  // Filter out allergens
  if (preferences.allergens && preferences.allergens.length > 0) {
    baseList.forEach(category => {
      category.items = category.items.filter(item => {
        return !preferences.allergens.some((allergen: string) => 
          item.toLowerCase().includes(allergen.toLowerCase())
        );
      });
    });
  }

  return baseList;
}

function generateEnhancedMealPrepTips(preferences: any): string[] {
  const tips = [];

  // Add rare condition specific tips
  if (preferences.rareConditionAnalysis && preferences.rareConditionAnalysis.length > 0) {
    tips.push("**Rare Condition Safety**: Prepare meals with extra attention to condition-specific requirements");
    
    preferences.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      if (analysis.dietaryRecommendations.mealPlanningTips && analysis.dietaryRecommendations.mealPlanningTips.length > 0) {
        tips.push(`**${analysis.conditionName} Prep**: ${analysis.dietaryRecommendations.mealPlanningTips[0]}`);
      }
    });
  }

  if (preferences.cookingSkill === 'Beginner') {
    tips.push("**Start Simple**: Focus on one-pot meals and basic cooking techniques");
    tips.push("**Batch Basics**: Cook large portions of grains and proteins on weekends");
  } else if (preferences.cookingSkill === 'Intermediate') {
    tips.push("**Efficient Prep**: Prepare versatile base ingredients for multiple meal combinations");
    tips.push("**Storage Solutions**: Use glass containers and proper labeling for food safety");
  } else {
    tips.push("**Advanced Techniques**: Use sous vide or pressure cooking for optimal nutrient retention");
    tips.push("**Flavor Layering**: Prep aromatics and spice blends for complex flavors");
  }

  tips.push("**Food Safety**: Follow proper storage guidelines, especially important for health conditions");
  tips.push("**Weekly Planning**: Dedicate time for meal planning based on your health needs");

  return tips;
}

function generateEnhancedNutritionGuidelines(conditions: any): string {
  let guidelines = "**Therapeutic Nutrition**: Focus on foods that actively support your health conditions while maintaining nutritional balance.\n\n";

  // Add rare condition guidelines
  if (conditions.rareConditionAnalysis && conditions.rareConditionAnalysis.length > 0) {
    conditions.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      guidelines += `**${analysis.conditionName} Nutrition**: Focus on ${analysis.dietaryRecommendations.keyNutrients.join(', ')} for optimal management.\n\n`;
    });
  }

  if (conditions.goalType === 'weight-loss') {
    guidelines += "**Weight Management**: Create moderate caloric deficit while ensuring adequate nutrition for health conditions.\n\n";
  } else if (conditions.goalType === 'anti-inflammatory') {
    guidelines += "**Anti-inflammatory Focus**: Emphasize omega-3 fatty acids, colorful antioxidants, and minimize inflammatory foods.\n\n";
  }

  if (conditions.hasHypertension) {
    guidelines += "**Blood Pressure Support**: Emphasize potassium, limit sodium, maintain healthy weight.\n\n";
  }

  if (conditions.hasDiabetes) {
    guidelines += "**Blood Sugar Management**: Focus on low glycemic foods, consistent meal timing, portion control.\n\n";
  }

  if (conditions.hasHeartDisease) {
    guidelines += "**Cardiovascular Health**: Prioritize omega-3s, limit saturated fat, increase soluble fiber.\n\n";
  }

  guidelines += "**Hydration**: Maintain adequate fluid intake, adjust based on health conditions and medications.\n";
  guidelines += "**Nutrient Timing**: Coordinate meals with medications and health monitoring as recommended by healthcare providers.";

  return guidelines;
}

function generateEnhancedEmergencySubstitutions(preferences: any): string[] {
  const substitutions = [];

  // Add rare condition safe substitutions
  if (preferences.rareConditionAnalysis && preferences.rareConditionAnalysis.length > 0) {
    preferences.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      const avoidFoods = analysis.dietaryRecommendations.avoidFoods;
      const safeFoods = analysis.dietaryRecommendations.recommendedFoods;
      
      if (avoidFoods.length > 0 && safeFoods.length > 0) {
        substitutions.push(`**${analysis.conditionName} Safe Swaps**: Replace ${avoidFoods[0]} with ${safeFoods[0]} when needed`);
      }
    });
  }

  if (preferences.isGlutenFree) {
    substitutions.push("**Gluten-Free Emergency**: Rice cakes for bread, quinoa for pasta, certified oats for wheat cereals");
  }

  if (preferences.isVegan) {
    substitutions.push("**Vegan Alternatives**: Plant milk for dairy, tofu scramble for eggs, nutritional yeast for cheese");
  }

  if (preferences.isDairyFree) {
    substitutions.push("**Dairy-Free Options**: Coconut yogurt for dairy yogurt, cashew cream for heavy cream");
  }

  if (preferences.allergens && preferences.allergens.length > 0) {
    substitutions.push(`**Allergen-Safe Backup**: Keep safe alternatives for ${preferences.allergens.join(', ')} readily available`);
  }

  substitutions.push("**Universal Swaps**: Any seasonal vegetables can substitute for similar ones in recipes");
  substitutions.push("**Protein Flexibility**: Plant proteins can replace animal proteins in most meal plans");

  return substitutions;
}

function generateEnhancedProgressTracking(conditions: any): string {
  let tracking = "**Comprehensive Monitoring**: Track multiple health indicators to assess diet plan effectiveness.\n\n";

  // Add rare condition tracking
  if (conditions.rareConditionAnalysis && conditions.rareConditionAnalysis.length > 0) {
    conditions.rareConditionAnalysis.forEach((analysis: RareConditionAnalysis) => {
      tracking += `**${analysis.conditionName} Tracking**: Monitor ${analysis.warningSigns?.join(', ') || 'symptoms and responses'} specific to this condition.\n\n`;
    });
  }

  if (conditions.hasHypertension) {
    tracking += "**Blood Pressure Monitoring**: Track readings and correlate with dietary choices and sodium intake.\n\n";
  }

  if (conditions.hasDiabetes) {
    tracking += "**Glucose Management**: Monitor blood sugar levels and note meal timing and composition effects.\n\n";
  }

  if (conditions.hasHeartDisease) {
    tracking += "**Cardiovascular Wellness**: Track cholesterol levels and note any changes in symptoms.\n\n";
  }

  if (conditions.goalType === 'weight-loss' || conditions.goalType === 'weight-gain') {
    tracking += "**Weight Trends**: Monitor weekly weight changes and body composition if possible.\n\n";
  }

  tracking += "**Daily Wellness**: Log energy levels, sleep quality, mood, and digestive health.\n";
  tracking += "**Symptom Correlation**: Note relationships between specific foods and symptom changes.\n";
  tracking += "**Healthcare Communication**: Share tracking data with your medical team for plan optimization.";

  return tracking;
}

function validateParsedPlan(plan: any): boolean {
  const requiredFields = [
    'restrictions', 'recommendations', 'specialNotes',
    'mealPlan', 'shoppingList', 'mealPrepTips',
    'nutritionGuidelines', 'emergencySubstitutions', 'progressTracking'
  ];
  
  // Check all required fields exist
  for (const field of requiredFields) {
    if (!plan[field]) {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  
  // Validate meal plan structure
  if (!plan.mealPlan.dailyMeals || typeof plan.mealPlan.dailyMeals !== 'object') {
    console.error('❌ Invalid meal plan structure');
    return false;
  }
  
  // Check that we have days in meal plan
  const dayCount = Object.keys(plan.mealPlan.dailyMeals).length;
  if (dayCount < 1) {
    console.error(`❌ Insufficient days in meal plan: ${dayCount}`);
    return false;
  }
  
  console.log('✅ Enhanced diet plan validation passed');
  return true;
}

function formatValidationError(error: z.ZodError): string {
  return error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join('; ');
}