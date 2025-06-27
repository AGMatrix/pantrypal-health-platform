// src/app/api/health/analyze-rare-condition/route.ts
// Complete AI-powered analysis for rare/unlisted health conditions

import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { 
      conditionName,
      symptoms,
      currentMedications,
      doctorRecommendations,
      severity,
      additionalInfo
    } = await request.json();

    if (!conditionName) {
      return Response.json({ success: false, error: 'Condition name is required' }, { status: 400 });
    }

    console.log('🔍 Starting analysis for condition:', conditionName);

    // Use AI to research the condition and generate dietary guidelines
    const aiAnalysis = await analyzeRareCondition({
      conditionName,
      symptoms,
      currentMedications,
      doctorRecommendations,
      severity,
      additionalInfo
    });

    // Save the analysis for future reference
    await saveRareConditionAnalysis(authUser.userId, {
      conditionName,
      aiAnalysis,
      userInputs: { symptoms, currentMedications, doctorRecommendations, severity, additionalInfo }
    });

    return Response.json({
      success: true,
      analysis: aiAnalysis,
      message: 'Rare condition analysis completed successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Rare condition analysis error:', errorMessage);
    return Response.json({ success: false, error: 'Analysis failed' }, { status: 500 });
  }
}

async function analyzeRareCondition(params: any) {
  const {
    conditionName,
    symptoms,
    currentMedications,
    doctorRecommendations,
    severity,
    additionalInfo
  } = params;

  console.log('🔍 Analyzing condition:', conditionName);

  // First, try to get a comprehensive disease-specific analysis
  const comprehensiveAnalysis = await getComprehensiveAnalysis(conditionName, params);
  
  if (comprehensiveAnalysis) {
    console.log('✅ Got comprehensive analysis for:', conditionName);
    return comprehensiveAnalysis;
  }

  // If AI fails, generate a detailed condition-specific fallback
  console.log('⚠️ AI failed, generating detailed fallback for:', conditionName);
  return generateDetailedFallback(conditionName, params);
}

async function getComprehensiveAnalysis(conditionName: string, params: any) {
  const { symptoms, currentMedications, doctorRecommendations, severity, additionalInfo } = params;

  // Create a more specific and targeted research prompt
  const researchPrompt = `Provide detailed dietary recommendations for ${conditionName}. Be specific and condition-focused.

CONDITION: ${conditionName}
SEVERITY: ${severity}
SYMPTOMS: ${symptoms || 'Not specified'}
MEDICATIONS: ${currentMedications || 'None'}
DOCTOR ADVICE: ${doctorRecommendations || 'None'}
ADDITIONAL INFO: ${additionalInfo || 'None'}

Provide specific dietary guidance for ${conditionName}:

MEDICAL DEFINITION:
- Clear 2-3 sentence definition of ${conditionName}
- How it affects the body systems

DIETARY RESTRICTIONS (specific to ${conditionName}):
- List 5-8 specific foods or ingredients to avoid
- Explain why each restriction is important for ${conditionName}

RECOMMENDED FOODS (beneficial for ${conditionName}):
- List 8-12 specific foods that help with ${conditionName}
- Explain the benefits for this condition

KEY NUTRIENTS:
- 4-6 specific nutrients important for ${conditionName}
- Target amounts if known

MEAL PLANNING STRATEGIES:
- Specific meal timing recommendations for ${conditionName}
- Portion size considerations
- Food preparation methods

CONDITION-SPECIFIC WARNINGS:
- Red flag symptoms related to diet
- When to contact healthcare provider
- Emergency signs

Be specific to ${conditionName} - avoid generic health advice.
Be extremely detailed and comprehensive. Do not truncate any sections.`;

  try {
    console.log('🤖 Attempting AI analysis for:', conditionName);
    
    // Check if we have the required environment variables for direct AI call
    const hasPerplexityKey = process.env.PERPLEXITY_API_KEY;
    const hasOpenAIKey = process.env.OPENAI_API_KEY;
    
    let data;
    
    if (hasPerplexityKey) {
      // Direct Perplexity API call for medical research
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a medical nutrition expert. Provide evidence-based dietary recommendations for specific health conditions.'
            },
            {
              role: 'user',
              content: researchPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        }),
      });

      if (perplexityResponse.ok) {
        data = await perplexityResponse.json();
        console.log('✅ Using Perplexity API for medical analysis');
      } else {
        throw new Error('Perplexity API failed');
      }
    } else if (hasOpenAIKey) {
      // Fallback to OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a medical nutrition expert. Provide evidence-based dietary recommendations for specific health conditions.'
            },
            {
              role: 'user',
              content: researchPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        }),
      });

      if (openaiResponse.ok) {
        data = await openaiResponse.json();
        console.log('✅ Using OpenAI API for medical analysis');
      } else {
        throw new Error('OpenAI API failed');
      }
    } else {
      // No AI API available, skip to fallback
      console.log('⚠️ No AI API keys available, using fallback database');
      throw new Error('No AI API keys configured');
    }
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;
      console.log('✅ AI Response received for:', conditionName);
      console.log('📝 Response length:', aiResponse.length);
      
      return parseComprehensiveAIResponse(aiResponse, conditionName, params);
    } else {
      console.log('⚠️ No valid AI response content for:', conditionName);
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      throw new Error('No valid AI response content');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('⚠️ AI analysis failed for', conditionName, ':', errorMessage);
    return null;
  }
}

function parseComprehensiveAIResponse(aiResponse: string, conditionName: string, params: any) {
  console.log('📝 Parsing comprehensive AI response for:', conditionName);
  
  // More sophisticated parsing for the structured format
  const analysis = {
    conditionName,
    definition: '',
    pathophysiology: '',
    prevalence: '',
    overview: '',
    dietaryRecommendations: {
      recommendedFoods: [] as string[],
      avoidFoods: [] as string[],
      keyNutrients: [] as string[],
      limitNutrients: [] as string[]
    },
    nutritionalConcerns: [] as string[],
    mealPlanningTips: [] as string[],
    medicationInteractions: [] as string[],
    supplements: {
      recommended: [] as string[],
      avoid: [] as string[]
    },
    warningSigns: [] as string[],
    recipeModifications: [] as string[],
    monitoringGuidelines: [] as string[],
    restrictions: [] as string[],
    recommendations: [] as string[],
    confidenceLevel: 'high' as 'low' | 'medium' | 'high',
    medicalDisclaimer: 'This analysis is for educational purposes only. Always consult your healthcare provider for personalized medical advice.',
    lastUpdated: new Date().toISOString()
  };

  // Fixed regex patterns - replaced 's' flag with [\s\S]* for ES2017 compatibility
  
  // Extract definition
  const definitionMatch = aiResponse.match(/MEDICAL DEFINITION[:\s]*([\s\S]*?)(?=DIETARY RESTRICTIONS|$)/i);
  if (definitionMatch) {
    analysis.definition = definitionMatch[1].trim();
  }

  // Extract pathophysiology if mentioned
  const pathophysiologyMatch = aiResponse.match(/affects? (?:the )?body systems?[:\s]*([\s\S]*?)(?=\n|$)/i);
  if (pathophysiologyMatch) {
    analysis.pathophysiology = pathophysiologyMatch[1].trim();
  }

  // Extract recommended foods
  const recommendedMatch = aiResponse.match(/RECOMMENDED FOODS[:\s]*([\s\S]*?)(?=KEY NUTRIENTS|MEAL PLANNING|$)/i);
  if (recommendedMatch) {
    analysis.dietaryRecommendations.recommendedFoods = extractStructuredList(recommendedMatch[1]);
  }

  // Extract foods to avoid
  const avoidMatch = aiResponse.match(/DIETARY RESTRICTIONS[:\s]*([\s\S]*?)(?=RECOMMENDED FOODS|$)/i);
  if (avoidMatch) {
    analysis.dietaryRecommendations.avoidFoods = extractStructuredList(avoidMatch[1]);
  }

  // Extract key nutrients
  const nutrientsMatch = aiResponse.match(/KEY NUTRIENTS[:\s]*([\s\S]*?)(?=MEAL PLANNING|$)/i);
  if (nutrientsMatch) {
    analysis.dietaryRecommendations.keyNutrients = extractStructuredList(nutrientsMatch[1]);
  }

  // Extract meal planning strategies
  const mealPlanningMatch = aiResponse.match(/MEAL PLANNING STRATEGIES[:\s]*([\s\S]*?)(?=CONDITION-SPECIFIC|WARNING|$)/i);
  if (mealPlanningMatch) {
    analysis.mealPlanningTips = extractStructuredList(mealPlanningMatch[1]);
  }

  // Extract warning signs
  const warningMatch = aiResponse.match(/CONDITION-SPECIFIC WARNINGS[:\s]*([\s\S]*?)$/i);
  if (warningMatch) {
    analysis.warningSigns = extractStructuredList(warningMatch[1]);
  }

  // Create overview from definition and pathophysiology
  analysis.overview = `${analysis.definition} ${analysis.pathophysiology}`.substring(0, 500);

  // Generate restrictions and recommendations
  analysis.restrictions = generateSmartRestrictions(analysis, conditionName);
  analysis.recommendations = generateSmartRecommendations(analysis, conditionName);

  return analysis;
}

function extractStructuredList(text: string): string[] {
  if (!text) return [];
  
  return text
    .split(/\n/)
    .map(line => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(item => item.length > 3 && item.length < 150)
    .slice(0, 12); // Limit to reasonable number
}

function generateSmartRestrictions(analysis: any, conditionName: string): string[] {
  const restrictions = ['rare-condition-monitored'];
  const lowerCondition = conditionName.toLowerCase();
  const avoidFoods = analysis.dietaryRecommendations.avoidFoods.join(' ').toLowerCase();
  
  // Add intelligent restrictions based on condition and avoid foods
  if (lowerCondition.includes('celiac') || avoidFoods.includes('gluten')) {
    restrictions.push('gluten-free');
  }
  
  if (lowerCondition.includes('kidney') || lowerCondition.includes('renal') || avoidFoods.includes('sodium')) {
    restrictions.push('low-sodium', 'kidney-friendly');
  }
  
  if (lowerCondition.includes('diabetes') || avoidFoods.includes('sugar')) {
    restrictions.push('diabetic-friendly', 'low-sugar');
  }
  
  if (lowerCondition.includes('heart') || lowerCondition.includes('cardiac')) {
    restrictions.push('heart-healthy', 'low-saturated-fat');
  }
  
  if (avoidFoods.includes('dairy') || avoidFoods.includes('lactose')) {
    restrictions.push('dairy-free');
  }
  
  if (lowerCondition.includes('crohn') || lowerCondition.includes('ibd') || lowerCondition.includes('colitis')) {
    restrictions.push('low-fiber', 'anti-inflammatory');
  }

  if (lowerCondition.includes('mcas') || lowerCondition.includes('mast cell')) {
    restrictions.push('low-histamine', 'fresh-foods-only');
  }

  if (lowerCondition.includes('pots') || lowerCondition.includes('orthostatic')) {
    restrictions.push('high-sodium', 'small-frequent-meals');
  }

  return restrictions;
}

function generateSmartRecommendations(analysis: any, conditionName: string): string[] {
  const recommendations = ['medical-supervision-recommended'];
  const lowerCondition = conditionName.toLowerCase();
  const recommendedFoods = analysis.dietaryRecommendations.recommendedFoods.join(' ').toLowerCase();
  const keyNutrients = analysis.dietaryRecommendations.keyNutrients.join(' ').toLowerCase();
  
  // Add intelligent recommendations
  if (keyNutrients.includes('protein') || recommendedFoods.includes('protein')) {
    recommendations.push('high-protein');
  }
  
  if (keyNutrients.includes('fiber') || recommendedFoods.includes('fiber')) {
    recommendations.push('high-fiber');
  }
  
  if (keyNutrients.includes('omega') || recommendedFoods.includes('fish')) {
    recommendations.push('omega-3-rich');
  }
  
  if (lowerCondition.includes('anemia') || keyNutrients.includes('iron')) {
    recommendations.push('iron-rich');
  }
  
  if (lowerCondition.includes('osteo') || keyNutrients.includes('calcium')) {
    recommendations.push('calcium-rich');
  }
  
  if (recommendedFoods.includes('anti-inflammatory') || lowerCondition.includes('arthritis')) {
    recommendations.push('anti-inflammatory');
  }

  if (lowerCondition.includes('fibromyalgia') || lowerCondition.includes('chronic fatigue')) {
    recommendations.push('energy-supporting', 'nutrient-dense');
  }

  if (lowerCondition.includes('eds') || lowerCondition.includes('ehlers')) {
    recommendations.push('collagen-supporting', 'easily-digestible');
  }

  return recommendations;
}

function generateDetailedFallback(conditionName: string, params: any) {
  console.log('🛡️ Generating detailed fallback for:', conditionName);
  
  const lowerCondition = conditionName.toLowerCase();
  const { symptoms, severity } = params;
  
  // Create condition-specific responses based on keywords and known conditions
  const conditionData = getConditionSpecificData(lowerCondition);
  
  return {
    conditionName,
    definition: conditionData.definition,
    pathophysiology: conditionData.pathophysiology,
    prevalence: conditionData.prevalence || 'Prevalence data may be limited for this condition',
    overview: `${conditionData.definition} ${conditionData.pathophysiology}`.substring(0, 500),
    nutritionalConcerns: conditionData.nutritionalConcerns,
    dietaryRecommendations: {
      recommendedFoods: conditionData.recommendedFoods,
      avoidFoods: conditionData.avoidFoods,
      keyNutrients: conditionData.keyNutrients,
      limitNutrients: conditionData.limitNutrients || []
    },
    mealPlanningTips: conditionData.mealPlanningTips,
    medicationInteractions: conditionData.medicationInteractions,
    supplements: {
      recommended: conditionData.supplements?.recommended || [],
      avoid: conditionData.supplements?.avoid || []
    },
    warningSigns: conditionData.warningSigns,
    recipeModifications: conditionData.recipeModifications,
    monitoringGuidelines: conditionData.monitoringGuidelines || [
      "Monitor symptoms and dietary responses",
      "Keep a food and symptom diary",
      "Regular check-ups with healthcare provider",
      "Track nutritional status"
    ],
    restrictions: conditionData.restrictions,
    recommendations: conditionData.recommendations,
    confidenceLevel: conditionData.confidenceLevel || 'medium',
    medicalDisclaimer: 'This analysis is based on general medical knowledge. Please consult your healthcare provider for personalized guidance.',
    lastUpdated: new Date().toISOString()
  };
}

function getConditionSpecificData(lowerCondition: string) {
  // Enhanced condition matching with more specific keywords
  console.log('🔍 Matching condition keywords for:', lowerCondition);
  
  // Fibromyalgia and related
  if (lowerCondition.includes('fibromyalgia') || lowerCondition.includes('fibro')) {
    return getFibromyalgiaData();
  }
  
  // Ehlers-Danlos Syndrome
  if (lowerCondition.includes('ehlers') || lowerCondition.includes('danlos') || lowerCondition.includes('eds')) {
    return getEhlersDanlosData();
  }
  
  // POTS and autonomic dysfunction
  if (lowerCondition.includes('pots') || lowerCondition.includes('postural') || 
      lowerCondition.includes('tachycardia') || lowerCondition.includes('orthostatic')) {
    return getPOTSData();
  }
  
  // MCAS and Mast Cell disorders
  if (lowerCondition.includes('mcas') || lowerCondition.includes('mast cell') || 
      lowerCondition.includes('mastocytosis')) {
    return getMCASTData();
  }
  
  // Chronic Fatigue Syndrome
  if (lowerCondition.includes('chronic fatigue') || lowerCondition.includes('cfs') || 
      lowerCondition.includes('me/cfs') || lowerCondition.includes('myalgic')) {
    return getCFSData();
  }
  
  // Hashimoto's and thyroid conditions
  if (lowerCondition.includes('hashimoto') || lowerCondition.includes('thyroid') || 
      lowerCondition.includes('hypothyroid')) {
    return getHashimotoData();
  }
  
  // Lupus and autoimmune
  if (lowerCondition.includes('lupus') || lowerCondition.includes('sle')) {
    return getLupusData();
  }
  
  // Rheumatoid Arthritis
  if (lowerCondition.includes('rheumatoid') || lowerCondition.includes('arthritis')) {
    return getRAData();
  }
  
  // Multiple Sclerosis
  if (lowerCondition.includes('multiple sclerosis') || lowerCondition.includes('ms')) {
    return getMSData();
  }
  
  // Crohn's Disease and IBD
  if (lowerCondition.includes('crohn') || lowerCondition.includes('inflammatory bowel')) {
    return getCrohnsData();
  }
  
  // Generic fallback for unknown conditions
  console.log('⚠️ No specific match found, using generic fallback for:', lowerCondition);
  return getGenericRareConditionData(lowerCondition);
}

function getFibromyalgiaData() {
  return {
    definition: "Fibromyalgia is a chronic disorder characterized by widespread musculoskeletal pain, fatigue, and tenderness in specific points on the body.",
    pathophysiology: "The condition affects how the brain and spinal cord process pain signals, often leading to amplified pain sensations. It can also affect digestion, sleep, and energy metabolism.",
    prevalence: "Affects 2-4% of the population, predominantly women aged 30-50.",
    nutritionalConcerns: [
      "Chronic fatigue may affect appetite and meal preparation",
      "Pain medications can cause digestive issues",
      "Sleep disturbances may affect metabolism",
      "Inflammation may be elevated",
      "Energy levels vary significantly throughout the day"
    ],
    recommendedFoods: [
      "Fatty fish (salmon, mackerel, sardines)",
      "Leafy green vegetables (spinach, kale)",
      "Berries (blueberries, cherries)",
      "Nuts and seeds (walnuts, flaxseeds)",
      "Whole grains (quinoa, brown rice)",
      "Lean proteins (chicken, turkey, tofu)",
      "Anti-inflammatory spices (turmeric, ginger)",
      "Tart cherry juice"
    ],
    avoidFoods: [
      "Processed foods high in additives",
      "Excessive caffeine",
      "High-sugar foods",
      "Artificial sweeteners (aspartame)",
      "Trans fats",
      "Excessive alcohol",
      "Foods high in MSG"
    ],
    keyNutrients: [
      "Omega-3 fatty acids",
      "Vitamin D",
      "Magnesium",
      "B-complex vitamins",
      "Antioxidants",
      "Coenzyme Q10"
    ],
    limitNutrients: [
      "Excessive caffeine",
      "Added sugars",
      "Artificial additives",
      "Trans fats"
    ],
    supplements: {
      recommended: [
        "Omega-3 fatty acids",
        "Vitamin D3",
        "Magnesium",
        "Coenzyme Q10"
      ],
      avoid: [
        "High-dose stimulants",
        "Excessive iron (unless deficient)"
      ]
    },
    monitoringGuidelines: [
      "Track pain levels in relation to diet",
      "Monitor energy levels throughout the day",
      "Keep a food and symptom diary",
      "Regular vitamin D level checks"
    ],
    mealPlanningTips: [
      "Prepare meals during high-energy periods",
      "Focus on anti-inflammatory foods",
      "Maintain regular meal times",
      "Keep easy-to-prepare options available",
      "Stay well hydrated"
    ],
    medicationInteractions: [
      "Some pain medications may cause nausea - take with food",
      "Antidepressants may affect appetite",
      "Muscle relaxants may cause drowsiness - avoid large meals"
    ],
    warningSigns: [
      "Severe digestive upset",
      "Unusual fatigue after eating",
      "New or worsening pain patterns",
      "Signs of nutritional deficiency"
    ],
    recipeModifications: [
      "Use anti-inflammatory spices",
      "Choose easy-preparation methods",
      "Include omega-3 rich ingredients",
      "Minimize processed ingredients"
    ],
    restrictions: ['anti-inflammatory-focus', 'energy-supportive'],
    recommendations: ['omega-3-rich', 'anti-inflammatory', 'nutrient-dense'],
    confidenceLevel: 'high'
  };
}

function getMCASTData() {
  return {
    definition: "Mast Cell Activation Syndrome (MCAS) is a condition where mast cells inappropriately release inflammatory mediators, causing a wide range of symptoms.",
    pathophysiology: "Overactive mast cells release histamine and other inflammatory substances, affecting multiple body systems including digestion, skin, and respiratory function.",
    prevalence: "Estimated to affect 1 in 150,000 to 1 in 1,000 people, though likely underdiagnosed.",
    nutritionalConcerns: [
      "Histamine intolerance and reactions",
      "Food triggers can vary greatly between individuals",
      "Malabsorption due to digestive inflammation",
      "Multiple food sensitivities",
      "Nutritional deficiencies from restricted diet"
    ],
    recommendedFoods: [
      "Fresh meat (not aged or processed)",
      "Fresh fish (avoid canned or smoked)",
      "Rice and rice products",
      "Fresh vegetables (except high-histamine ones)",
      "Non-citrus fruits (apple, pear)",
      "Coconut products",
      "Fresh herbs (avoid dried spices)",
      "Olive oil"
    ],
    avoidFoods: [
      "Aged cheeses and fermented dairy",
      "Processed and cured meats",
      "Fermented foods (sauerkraut, kimchi)",
      "Aged wines and alcohol",
      "Tomatoes and tomato products",
      "Spinach and other high-histamine vegetables",
      "Citrus fruits",
      "Chocolate and cocoa"
    ],
    keyNutrients: [
      "Vitamin C (natural antihistamine)",
      "Quercetin",
      "Vitamin B6",
      "Magnesium",
      "Omega-3 fatty acids",
      "Vitamin D"
    ],
    limitNutrients: [
      "Histamine-rich foods",
      "Tyramine",
      "Food additives",
      "Preservatives"
    ],
    supplements: {
      recommended: [
        "Vitamin C",
        "Quercetin",
        "Vitamin D3",
        "Magnesium"
      ],
      avoid: [
        "High-histamine supplements",
        "Fermented probiotics"
      ]
    },
    monitoringGuidelines: [
      "Keep detailed food and symptom diary",
      "Monitor for allergic reactions",
      "Track histamine levels if possible",
      "Regular check-ups with allergist"
    ],
    mealPlanningTips: [
      "Eat fresh foods within 24 hours of preparation",
      "Avoid leftovers and meal prep",
      "Cook foods from fresh ingredients daily",
      "Keep a detailed food and symptom diary",
      "Introduce new foods one at a time"
    ],
    medicationInteractions: [
      "Antihistamines may be taken with food",
      "Mast cell stabilizers timing with meals varies",
      "Some supplements may trigger reactions"
    ],
    warningSigns: [
      "Severe allergic reactions (anaphylaxis)",
      "Rapidly spreading hives or rash",
      "Difficulty breathing after eating",
      "Severe abdominal pain or vomiting"
    ],
    recipeModifications: [
      "Use only fresh ingredients",
      "Avoid aged, fermented, or processed components",
      "Cook foods immediately before eating",
      "Use simple preparation methods"
    ],
    restrictions: ['low-histamine', 'fresh-foods-only', 'no-fermented-foods'],
    recommendations: ['fresh-preparation', 'simple-ingredients', 'antihistamine-foods'],
    confidenceLevel: 'high'
  };
}

function getCFSData() {
  return {
    definition: "Chronic Fatigue Syndrome (CFS/ME) is a complex disorder characterized by extreme fatigue that doesn't improve with rest and may worsen with physical or mental activity.",
    pathophysiology: "The condition affects cellular energy production, immune function, and the nervous system, leading to severe fatigue and post-exertional malaise.",
    prevalence: "Affects approximately 1-2.5 million Americans, with women being affected 2-4 times more often than men.",
    nutritionalConcerns: [
      "Severe fatigue affecting meal preparation",
      "Post-exertional malaise can be triggered by eating",
      "Digestive issues and food sensitivities common",
      "Difficulty maintaining adequate nutrition",
      "Energy crashes related to blood sugar fluctuations"
    ],
    recommendedFoods: [
      "Complex carbohydrates for steady energy",
      "Lean proteins for cellular repair",
      "Foods rich in B vitamins",
      "Magnesium-rich foods",
      "Antioxidant-rich fruits and vegetables",
      "Easy-to-digest foods",
      "Bone broth for nutrients and hydration",
      "Coconut oil for quick energy"
    ],
    avoidFoods: [
      "Simple sugars that cause energy crashes",
      "Highly processed foods",
      "Excessive caffeine",
      "Alcohol",
      "Foods that commonly cause sensitivities",
      "Large, heavy meals"
    ],
    keyNutrients: [
      "B-complex vitamins (especially B12)",
      "Magnesium",
      "Coenzyme Q10",
      "Vitamin D",
      "Iron (if deficient)",
      "Ribose"
    ],
    limitNutrients: [
      "Simple sugars",
      "Caffeine",
      "Processed additives",
      "Excessive fiber"
    ],
    supplements: {
      recommended: [
        "B-complex vitamins",
        "Magnesium",
        "Coenzyme Q10",
        "Vitamin D3"
      ],
      avoid: [
        "High-dose stimulants",
        "Iron (unless deficient)"
      ]
    },
    monitoringGuidelines: [
      "Track energy levels throughout the day",
      "Monitor post-exertional malaise",
      "Keep food and fatigue diary",
      "Regular nutrient status checks"
    ],
    mealPlanningTips: [
      "Prepare simple, easy-to-digest meals",
      "Eat small, frequent meals to maintain energy",
      "Use meal delivery or preparation assistance when possible",
      "Focus on nutrient-dense foods",
      "Stay hydrated throughout the day"
    ],
    medicationInteractions: [
      "Some medications may cause fatigue",
      "Supplements timing may affect energy levels",
      "Pain medications may affect appetite"
    ],
    warningSigns: [
      "Severe worsening of fatigue after eating",
      "Signs of malnutrition",
      "Persistent digestive issues",
      "Significant weight loss or gain"
    ],
    recipeModifications: [
      "Use slow cooker or one-pot meals",
      "Choose simple preparation methods",
      "Focus on nutrient-dense ingredients",
      "Prepare meals during higher energy times"
    ],
    restrictions: ['energy-conserving', 'easy-digest'],
    recommendations: ['nutrient-dense', 'easy-preparation', 'energy-supporting'],
    confidenceLevel: 'high'
  };
}

function getEhlersDanlosData() {
  return {
    definition: "Ehlers-Danlos Syndrome (EDS) is a group of genetic connective tissue disorders affecting collagen production and structure.",
    pathophysiology: "Defective collagen affects skin, joints, blood vessels, and organs. This can impact digestion, joint stability, and wound healing.",
    prevalence: "Affects approximately 1 in 5,000 people worldwide, with varying types and severity.",
    nutritionalConcerns: [
      "Gastroparesis and digestive motility issues",
      "Joint pain may affect food preparation",
      "Increased caloric needs for healing",
      "Poor wound healing",
      "Potential for MCAS (food sensitivities)"
    ],
    recommendedFoods: [
      "Bone broth and collagen-rich foods",
      "Vitamin C rich fruits (citrus, kiwi, strawberries)",
      "Protein sources (lean meats, eggs, legumes)",
      "Zinc-rich foods (pumpkin seeds, oysters)",
      "Soft, easily digestible foods",
      "Cooked vegetables",
      "Probiotic foods (yogurt, kefir)",
      "Healthy fats (avocado, olive oil)"
    ],
    avoidFoods: [
      "Very hard or chewy foods",
      "High-histamine foods (if MCAS present)",
      "Excessive fiber if gastroparesis present",
      "Very hot or very cold foods",
      "Highly processed foods",
      "Foods that commonly trigger sensitivities"
    ],
    keyNutrients: [
      "Vitamin C (collagen synthesis)",
      "Protein (tissue repair)",
      "Zinc (wound healing)",
      "Vitamin D",
      "B-complex vitamins",
      "Magnesium"
    ],
    limitNutrients: [
      "High-histamine foods",
      "Excessive fiber",
      "Hard-to-digest foods",
      "Extreme temperatures"
    ],
    supplements: {
      recommended: [
        "Vitamin C",
        "Collagen peptides",
        "Zinc",
        "Vitamin D3"
      ],
      avoid: [
        "High-histamine supplements",
        "Blood thinners (consult doctor)"
      ]
    },
    monitoringGuidelines: [
      "Monitor gastroparesis symptoms",
      "Track joint pain and mobility",
      "Watch for food intolerances",
      "Regular collagen status assessment"
    ],
    mealPlanningTips: [
      "Eat smaller, frequent meals if gastroparesis present",
      "Focus on soft, cooked foods",
      "Prepare meals when energy levels are higher",
      "Consider texture modifications",
      "Stay hydrated but avoid excessive fluids with meals"
    ],
    medicationInteractions: [
      "Pain medications may slow digestion further",
      "Some supplements may interact with blood thinners",
      "Gastroparesis medications may affect nutrient absorption"
    ],
    warningSigns: [
      "Severe gastroparesis symptoms",
      "Signs of malnutrition",
      "New food intolerances",
      "Severe joint pain after eating"
    ],
    recipeModifications: [
      "Cook vegetables until soft",
      "Use moist cooking methods",
      "Blend or puree foods if needed",
      "Include collagen-supporting ingredients"
    ],
    restrictions: ['soft-texture', 'gastroparesis-friendly', 'low-histamine-option'],
    recommendations: ['collagen-supporting', 'easily-digestible', 'nutrient-dense'],
    confidenceLevel: 'high'
  };
}

function getPOTSData() {
  return {
    definition: "Postural Orthostatic Tachycardia Syndrome (POTS) is a form of autonomic dysfunction characterized by excessive heart rate increase when standing.",
    pathophysiology: "POTS affects blood circulation and autonomic nervous system function, often causing blood pooling in the legs and reduced blood volume.",
    prevalence: "Affects an estimated 1-3 million Americans, with 75-80% being women, typically developing between ages 15-50.",
    nutritionalConcerns: [
      "Blood volume and electrolyte balance critical",
      "Gastroparesis may be present",
      "Salt and fluid intake requirements higher than normal",
      "Blood sugar fluctuations can worsen symptoms",
      "Meal timing affects symptom severity"
    ],
    recommendedFoods: [
      "High-sodium foods (pickles, olives, salted nuts)",
      "Electrolyte-rich foods (coconut water, bananas)",
      "Small, frequent meals",
      "Complex carbohydrates for stable blood sugar",
      "Lean proteins",
      "Compression stockings during meals",
      "Plenty of fluids throughout the day",
      "Foods rich in B vitamins"
    ],
    avoidFoods: [
      "Large, heavy meals",
      "Simple sugars that cause blood sugar spikes",
      "Excessive caffeine (can worsen tachycardia)",
      "Alcohol (causes dehydration)",
      "Very hot foods and drinks",
      "Foods that commonly cause gastroparesis"
    ],
    keyNutrients: [
      "Sodium (higher intake often recommended)",
      "Potassium for electrolyte balance",
      "B vitamins for autonomic function",
      "Iron (if deficient)",
      "Magnesium",
      "Adequate fluids (2-3 liters daily)"
    ],
    limitNutrients: [
      "Simple sugars",
      "Excessive caffeine",
      "Alcohol",
      "Large meal portions"
    ],
    supplements: {
      recommended: [
        "Electrolyte supplements",
        "B-complex vitamins",
        "Iron (if deficient)",
        "Salt tablets (if recommended)"
      ],
      avoid: [
        "Diuretics",
        "Excessive stimulants"
      ]
    },
    monitoringGuidelines: [
      "Track heart rate and blood pressure",
      "Monitor fluid and salt intake",
      "Watch for orthostatic symptoms",
      "Regular electrolyte level checks"
    ],
    mealPlanningTips: [
      "Eat small, frequent meals (5-6 per day)",
      "Increase salt intake as recommended by doctor",
      "Drink 16-20 oz water before meals",
      "Avoid large meals that can worsen blood pooling",
      "Consider eating while lying down if symptoms severe"
    ],
    medicationInteractions: [
      "Beta-blockers may affect heart rate response to meals",
      "Fludrocortisone requires adequate salt intake",
      "Midodrine timing with meals important"
    ],
    warningSigns: [
      "Severe increase in heart rate after eating",
      "Fainting or near-fainting after meals",
      "Severe nausea or vomiting",
      "Signs of dehydration"
    ],
    recipeModifications: [
      "Add extra salt to recipes as tolerated",
      "Focus on smaller portion sizes",
      "Include electrolyte-rich ingredients",
      "Prepare foods that can be eaten while reclining"
    ],
    restrictions: ['small-frequent-meals', 'gastroparesis-friendly'],
    recommendations: ['high-sodium', 'electrolyte-rich', 'blood-volume-supporting'],
    confidenceLevel: 'high'
  };
}

function getHashimotoData() {
  return {
    definition: "Hashimoto's thyroiditis is an autoimmune condition where the immune system attacks the thyroid gland, leading to hypothyroidism.",
    pathophysiology: "Chronic inflammation destroys thyroid tissue, reducing hormone production and slowing metabolism throughout the body.",
    prevalence: "Affects about 5% of the population, with women being 5-8 times more likely to develop the condition.",
    nutritionalConcerns: [
      "Slowed metabolism affects weight management",
      "Digestive issues common with hypothyroidism",
      "Nutrient absorption may be impaired",
      "Food sensitivities often develop",
      "Energy levels fluctuate significantly"
    ],
    recommendedFoods: [
      "Selenium-rich foods (Brazil nuts, seafood)",
      "Iodine-containing foods (seaweed, fish)",
      "Anti-inflammatory foods (fatty fish, berries)",
      "Fiber-rich foods for digestive health",
      "Zinc-rich foods (pumpkin seeds, oysters)",
      "Tyrosine-rich foods (almonds, avocados)",
      "Probiotic foods for gut health"
    ],
    avoidFoods: [
      "Excessive goitrogenic foods when raw (cruciferous vegetables)",
      "Gluten (many with Hashimoto's are sensitive)",
      "Highly processed foods",
      "Excessive soy products",
      "Sugar and refined carbohydrates",
      "Foods high in iodine if iodine-sufficient"
    ],
    keyNutrients: [
      "Selenium (200mcg daily)",
      "Zinc (8-11mg daily)",
      "Vitamin D",
      "B-complex vitamins",
      "Iron (if deficient)",
      "Tyrosine"
    ],
    limitNutrients: [
      "Goitrogens (when raw)",
      "Excessive iodine",
      "Refined sugars",
      "Gluten"
    ],
    supplements: {
      recommended: [
        "Selenium",
        "Vitamin D3",
        "Zinc",
        "B-complex vitamins"
      ],
      avoid: [
        "Excessive iodine",
        "Iron with thyroid medication"
      ]
    },
    monitoringGuidelines: [
      "Regular thyroid function tests",
      "Monitor selenium and zinc levels",
      "Track symptoms and energy levels",
      "Watch for gluten sensitivity"
    ],
    mealPlanningTips: [
      "Take thyroid medication on empty stomach",
      "Wait 1 hour before eating after medication",
      "Focus on anti-inflammatory meals",
      "Include metabolism-supporting foods",
      "Consider elimination diet to identify triggers"
    ],
    medicationInteractions: [
      "Calcium and iron supplements affect levothyroxine absorption",
      "Coffee can interfere with medication absorption",
      "High-fiber foods should be spaced from medication"
    ],
    warningSigns: [
      "Severe fatigue after dietary changes",
      "Rapid weight gain or loss",
      "New digestive symptoms",
      "Changes in heart rate or blood pressure"
    ],
    recipeModifications: [
      "Cook cruciferous vegetables",
      "Include selenium-rich ingredients",
      "Focus on anti-inflammatory spices",
      "Limit refined sugar and processed foods"
    ],
    restrictions: ['anti-inflammatory', 'thyroid-supporting', 'gluten-free-option'],
    recommendations: ['selenium-rich', 'metabolism-supporting', 'gut-healing'],
    confidenceLevel: 'high'
  };
}

function getLupusData() {
  return {
    definition: "Systemic Lupus Erythematosus (SLE) is an autoimmune disease where the immune system attacks healthy tissues throughout the body.",
    pathophysiology: "Chronic inflammation affects multiple organ systems including joints, skin, kidneys, heart, and brain.",
    prevalence: "Affects approximately 1.5 million Americans, with 90% of cases occurring in women, typically diagnosed between ages 15-45.",
    nutritionalConcerns: [
      "Chronic inflammation increases nutrient needs",
      "Kidney involvement may require dietary modifications",
      "Medications can affect nutrient absorption",
      "Increased risk of cardiovascular disease",
      "Bone health concerns due to inflammation and medications"
    ],
    recommendedFoods: [
      "Anti-inflammatory omega-3 rich fish",
      "Colorful fruits and vegetables",
      "Whole grains",
      "Calcium-rich foods for bone health",
      "Foods high in vitamin D",
      "Antioxidant-rich foods (berries, leafy greens)",
      "Lean proteins",
      "Foods rich in folate"
    ],
    avoidFoods: [
      "Alfalfa supplements (can trigger flares)",
      "Excessive alcohol",
      "High-sodium foods if kidney involvement",
      "Saturated and trans fats",
      "Processed meats",
      "Foods high in arachidonic acid"
    ],
    keyNutrients: [
      "Omega-3 fatty acids",
      "Calcium and Vitamin D",
      "Folate",
      "Antioxidants (Vitamins C, E)",
      "Iron (if deficient)",
      "B vitamins"
    ],
    limitNutrients: [
      "Sodium (if kidney disease)",
      "Saturated fats",
      "Processed foods",
      "Alfalfa"
    ],
    supplements: {
      recommended: [
        "Omega-3 fatty acids",
        "Vitamin D3",
        "Calcium",
        "Folate"
      ],
      avoid: [
        "Alfalfa supplements",
        "Echinacea"
      ]
    },
    monitoringGuidelines: [
      "Regular kidney function tests",
      "Monitor for cardiovascular risk",
      "Track bone density",
      "Watch for medication side effects"
    ],
    mealPlanningTips: [
      "Focus on anti-inflammatory Mediterranean-style diet",
      "Monitor sodium if kidney disease present",
      "Include bone-supporting nutrients",
      "Plan easy meals for flare periods",
      "Stay well hydrated"
    ],
    medicationInteractions: [
      "Methotrexate requires folate supplementation",
      "Corticosteroids increase calcium and vitamin D needs",
      "NSAIDs may affect kidney function",
      "Hydroxychloroquine may affect B12 absorption"
    ],
    warningSigns: [
      "Swelling in hands, feet, or face",
      "Changes in urination patterns",
      "Severe fatigue or joint pain after eating",
      "Signs of infection"
    ],
    recipeModifications: [
      "Use anti-inflammatory spices like turmeric",
      "Include omega-3 rich ingredients",
      "Limit sodium if kidney involvement",
      "Focus on antioxidant-rich colorful foods"
    ],
    restrictions: ['anti-inflammatory', 'kidney-friendly-option', 'bone-healthy'],
    recommendations: ['omega-3-rich', 'antioxidant-rich', 'heart-healthy'],
    confidenceLevel: 'high'
  };
}

function getRAData() {
  return {
    definition: "Rheumatoid Arthritis (RA) is an autoimmune inflammatory disease that primarily affects joints but can also impact other organs.",
    pathophysiology: "The immune system attacks joint linings, causing inflammation, pain, and eventual joint damage and deformity.",
    prevalence: "Affects about 1.3 million Americans, with women being 2-3 times more likely to develop RA than men.",
    nutritionalConcerns: [
      "Chronic inflammation increases nutritional needs",
      "Joint pain may affect food preparation abilities",
      "Medications can affect nutrient absorption and appetite",
      "Increased risk of cardiovascular disease",
      "Bone health concerns due to inflammation and steroids"
    ],
    recommendedFoods: [
      "Fatty fish rich in omega-3s",
      "Anti-inflammatory spices (turmeric, ginger)",
      "Colorful fruits and vegetables",
      "Whole grains",
      "Nuts and seeds",
      "Olive oil",
      "Green tea",
      "Foods rich in antioxidants"
    ],
    avoidFoods: [
      "Processed and fried foods",
      "Foods high in saturated fat",
      "Excessive sugar",
      "Trans fats",
      "Excessive omega-6 oils",
      "Alcohol in excess"
    ],
    keyNutrients: [
      "Omega-3 fatty acids (EPA/DHA)",
      "Vitamin D and Calcium",
      "Antioxidants (Vitamins C, E)",
      "Folate (especially if on methotrexate)",
      "Iron (if deficient)",
      "Selenium"
    ],
    limitNutrients: [
      "Saturated fats",
      "Trans fats",
      "Processed foods",
      "Excessive omega-6"
    ],
    supplements: {
      recommended: [
        "Omega-3 fatty acids",
        "Vitamin D3",
        "Folate",
        "Antioxidants"
      ],
      avoid: [
        "Excessive iron",
        "Pro-inflammatory supplements"
      ]
    },
    monitoringGuidelines: [
      "Track inflammation markers",
      "Monitor joint pain and mobility",
      "Regular bone density checks",
      "Watch for medication side effects"
    ],
    mealPlanningTips: [
      "Follow Mediterranean-style anti-inflammatory diet",
      "Use kitchen tools that reduce joint stress",
      "Prepare meals during lower pain periods",
      "Focus on easy-to-prepare nutritious foods",
      "Consider meal prep services during flares"
    ],
    medicationInteractions: [
      "Methotrexate requires folate supplementation",
      "Corticosteroids increase osteoporosis risk",
      "NSAIDs may cause GI issues",
      "Biologics may increase infection risk"
    ],
    warningSigns: [
      "Increased joint pain or swelling after eating",
      "Signs of infection",
      "Severe GI symptoms",
      "Unusual fatigue or weakness"
    ],
    recipeModifications: [
      "Use anti-inflammatory ingredients",
      "Choose easy-grip cooking methods",
      "Include joint-supporting nutrients",
      "Focus on colorful, antioxidant-rich foods"
    ],
    restrictions: ['anti-inflammatory', 'joint-friendly', 'easy-preparation'],
    recommendations: ['omega-3-rich', 'antioxidant-rich', 'mediterranean-style'],
    confidenceLevel: 'high'
  };
}

function getMSData() {
  return {
    definition: "Multiple Sclerosis (MS) is an autoimmune disease where the immune system attacks the protective covering of nerve fibers in the central nervous system.",
    pathophysiology: "Inflammation damages myelin sheaths around nerve fibers, disrupting communication between the brain and body.",
    prevalence: "Affects approximately 1 million Americans, with women being 2-3 times more likely to develop MS than men.",
    nutritionalConcerns: [
      "Fatigue may affect meal preparation and appetite",
      "Swallowing difficulties may develop",
      "Mobility issues can impact food access and preparation",
      "Some medications affect appetite and digestion",
      "Increased risk of osteoporosis"
    ],
    recommendedFoods: [
      "Foods rich in vitamin D",
      "Omega-3 fatty acids from fish",
      "Antioxidant-rich fruits and vegetables",
      "Whole grains for sustained energy",
      "Lean proteins",
      "Foods high in vitamin B12",
      "Probiotic foods for gut health",
      "Foods rich in biotin"
    ],
    avoidFoods: [
      "Highly processed foods",
      "Saturated fats in excess",
      "Foods high in sodium",
      "Alcohol in excess",
      "Simple sugars that cause energy crashes"
    ],
    keyNutrients: [
      "Vitamin D (higher doses often recommended)",
      "Omega-3 fatty acids",
      "Vitamin B12",
      "Antioxidants",
      "Biotin",
      "Calcium for bone health"
    ],
    limitNutrients: [
      "Saturated fats",
      "Processed foods",
      "Excessive sodium",
      "Simple sugars"
    ],
    supplements: {
      recommended: [
        "Vitamin D3",
        "Omega-3 fatty acids",
        "Vitamin B12",
        "Antioxidants"
      ],
      avoid: [
        "Excessive iron",
        "High-dose vitamin A"
      ]
    },
    monitoringGuidelines: [
      "Regular neurological assessments",
      "Monitor vitamin D levels",
      "Track cognitive function",
      "Watch for swallowing difficulties"
    ],
    mealPlanningTips: [
      "Prepare meals during high-energy periods",
      "Focus on nutrient-dense foods",
      "Consider texture modifications if swallowing issues",
      "Plan easy-to-prepare options for fatigue days",
      "Maintain regular meal schedule for energy"
    ],
    medicationInteractions: [
      "Some DMTs may cause GI side effects",
      "Corticosteroids during relapses affect blood sugar",
      "Interferon medications may cause appetite changes"
    ],
    warningSigns: [
      "Difficulty swallowing",
      "Severe fatigue affecting eating",
      "Sudden changes in taste or smell",
      "Coordination problems affecting eating"
    ],
    recipeModifications: [
      "Choose easy-to-handle utensils and containers",
      "Include brain-healthy nutrients",
      "Focus on anti-inflammatory ingredients",
      "Consider texture modifications as needed"
    ],
    restrictions: ['fatigue-friendly', 'easy-preparation', 'swallowing-safe'],
    recommendations: ['vitamin-d-rich', 'brain-healthy', 'anti-inflammatory'],
    confidenceLevel: 'high'
  };
}

function getCrohnsData() {
  return {
    definition: "Crohn's Disease is a type of inflammatory bowel disease (IBD) that causes chronic inflammation in the digestive tract.",
    pathophysiology: "Inflammation can affect any part of the GI tract from mouth to anus, leading to symptoms like abdominal pain, diarrhea, and malabsorption.",
    prevalence: "Affects approximately 780,000 Americans, with equal occurrence in men and women, typically diagnosed between ages 20-30.",
    nutritionalConcerns: [
      "Malabsorption of nutrients due to inflammation",
      "Strictures may require low-fiber diet",
      "Increased caloric needs during flares",
      "Risk of deficiencies in B12, iron, vitamin D",
      "Food triggers vary greatly between individuals"
    ],
    recommendedFoods: [
      "Well-cooked vegetables",
      "Lean proteins",
      "Refined grains during flares",
      "Bananas and other low-fiber fruits",
      "Smooth nut butters",
      "Cooked eggs",
      "Bone broth",
      "Probiotic foods as tolerated"
    ],
    avoidFoods: [
      "High-fiber foods during flares",
      "Raw vegetables and fruits with skins",
      "Nuts and seeds",
      "Spicy foods",
      "High-fat foods",
      "Alcohol",
      "Caffeine in excess",
      "Artificial sweeteners"
    ],
    keyNutrients: [
      "Vitamin B12",
      "Iron",
      "Vitamin D",
      "Folate",
      "Zinc",
      "Omega-3 fatty acids"
    ],
    limitNutrients: [
      "Fiber (during flares)",
      "Fat (if malabsorption)",
      "Lactose",
      "Artificial additives"
    ],
    supplements: {
      recommended: [
        "Vitamin B12",
        "Iron (if deficient)",
        "Vitamin D3",
        "Folate"
      ],
      avoid: [
        "High-fiber supplements",
        "Irritating additives"
      ]
    },
    monitoringGuidelines: [
      "Regular colonoscopies",
      "Monitor nutrient levels",
      "Track symptoms and triggers",
      "Watch for complications"
    ],
    mealPlanningTips: [
      "Keep a food diary to identify triggers",
      "Eat smaller, frequent meals",
      "Focus on easily digestible foods",
      "Cook vegetables thoroughly",
      "Consider liquid nutrition during severe flares"
    ],
    medicationInteractions: [
      "Some medications may cause GI upset",
      "Immunosuppressants may increase infection risk",
      "Iron supplements may worsen constipation"
    ],
    warningSigns: [
      "Increased abdominal pain or cramping",
      "Blood in stool",
      "Severe diarrhea",
      "Signs of malnutrition or dehydration"
    ],
    recipeModifications: [
      "Cook all vegetables until soft",
      "Remove skins and seeds from fruits",
      "Use gentle cooking methods",
      "Focus on easily digestible ingredients"
    ],
    restrictions: ['low-fiber-during-flares', 'easy-digest', 'trigger-aware'],
    recommendations: ['gut-healing', 'nutrient-dense', 'gentle-preparation'],
    confidenceLevel: 'high'
  };
}

function getGenericRareConditionData(conditionName: string) {
  return {
    definition: `${conditionName} is a rare medical condition that may have complex dietary considerations and nutritional impacts.`,
    pathophysiology: "Due to the rarity of this condition, specific pathophysiology may vary. Consult with healthcare providers familiar with this condition.",
    prevalence: "Prevalence data may be limited due to the rarity of this condition.",
    nutritionalConcerns: [
      "Nutritional needs may vary based on specific symptoms",
      "May require specialized dietary monitoring",
      "Potential for medication-food interactions",
      "Individual responses to foods may vary significantly",
      "Regular nutritional assessment may be needed"
    ],
    recommendedFoods: [
      "Nutrient-dense whole foods",
      "Variety of fresh fruits and vegetables",
      "Lean proteins",
      "Whole grains",
      "Healthy fats",
      "Adequate hydration",
      "Foods rich in antioxidants",
      "Easily digestible options"
    ],
    avoidFoods: [
      "Highly processed foods",
      "Foods that trigger symptoms",
      "Excessive alcohol",
      "Foods high in artificial additives",
      "Any known allergens or intolerances"
    ],
    keyNutrients: [
      "Complete vitamin and mineral profile",
      "Adequate protein",
      "Essential fatty acids",
      "Antioxidants",
      "Adequate calories for energy needs"
    ],
    limitNutrients: [
      "Processed additives",
      "Excessive sugar",
      "Trans fats",
      "Potential triggers"
    ],
    supplements: {
      recommended: [
        "Multivitamin",
        "Omega-3 fatty acids",
        "Vitamin D3",
        "Probiotics"
      ],
      avoid: [
        "Unproven supplements",
        "High-dose single nutrients"
      ]
    },
    monitoringGuidelines: [
      "Regular medical monitoring",
      "Nutritional status assessment",
      "Symptom tracking",
      "Medication effectiveness monitoring"
    ],
    mealPlanningTips: [
      "Work closely with healthcare providers",
      "Keep detailed food and symptom logs",
      "Focus on nutritional adequacy",
      "Consider working with a registered dietitian",
      "Plan for symptom management through diet"
    ],
    medicationInteractions: [
      "Consult healthcare provider about all medications",
      "Be aware of potential food-drug interactions",
      "Monitor for side effects that affect nutrition"
    ],
    warningSigns: [
      "Any new or worsening symptoms",
      "Signs of nutritional deficiency",
      "Adverse reactions to foods",
      "Changes in appetite or digestion"
    ],
    recipeModifications: [
      "Focus on gentle, nutritious preparations",
      "Consider individual tolerances",
      "Emphasize food safety",
      "Include variety for nutritional completeness"
    ],
    restrictions: ['rare-condition-monitored', 'individualized-approach'],
    recommendations: ['nutrient-dense', 'medical-supervision', 'symptom-aware'],
    confidenceLevel: 'medium'
  };
}

async function saveRareConditionAnalysis(userId: string, analysisData: any) {
  try {
    // First, ensure the user exists in the users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist, create a basic user record
      console.log('⚠️ User not found, creating basic user record for:', userId);
      
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `user-${userId}@placeholder.com`, // Placeholder email
          name: 'User',
          password_hash: '', // Empty hash as this is created by auth system
          created_at: new Date().toISOString()
        });

      if (createUserError) {
        console.error('Failed to create user record:', createUserError);
        // Continue anyway, just log the analysis without saving
        return false;
      }
    } else if (userCheckError) {
      console.error('Error checking user existence:', userCheckError);
      return false;
    }

    // Now save the analysis
    const { data, error } = await supabase
      .from('rare_condition_analyses')
      .insert({
        user_id: userId,
        condition_name: analysisData.conditionName,
        analysis_result: analysisData.aiAnalysis,
        user_inputs: analysisData.userInputs,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to save rare condition analysis:', error);
      return false;
    }

    console.log('✅ Rare condition analysis saved for user:', userId);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error saving rare condition analysis:', errorMessage);
    return false;
  }
}