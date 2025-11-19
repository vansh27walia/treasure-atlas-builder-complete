
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * MANDATORY: Define the JSON Schema for Structured Output.
 * Detailed analysis is required to be 3-4 sentences for quicker generation time.
 */
const analysisSchema = {
    type: 'object',
    properties: {
        overallScore: {
            type: 'integer',
            description: 'The final score (0-100) combining all factors (Cost, Speed, Reliability). This is the value score.',
            minimum: 0,
            maximum: 100
        },
        reliabilityScore: {
            type: 'integer',
            description: 'The score (0-100) reflecting the reliability and on-time performance of this specific Carrier/Service combination.',
            minimum: 0,
            maximum: 100
        },
        speedScore: {
            type: 'integer',
            description: 'The score (0-100) for delivery speed relative to the fastest available option.',
            minimum: 0,
            maximum: 100
        },
        costScore: {
            type: 'integer',
            description: 'The score (0-100) for cost value relative to the cheapest available option.',
            minimum: 0,
            maximum: 100
        },
        detailedAnalysis: {
            type: 'string',
            // Optimized for speed: 3-4 sentence analysis
            description: 'A professional, concise 3-4 sentence analysis of the selected rate. Explain the scores, mention the biggest pro and con, and provide a final recommendation.'
        }
    },
    required: ['overallScore', 'reliabilityScore', 'speedScore', 'costScore', 'detailedAnalysis']
};

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { selectedRate, allRates, context } = await req.json();
    
    // --- Using GEMINI_API_KEY_1 ---
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY_1');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY_1 is not configured');
    }

    // --- Data Pre-processing ---
    const rates = allRates || [];
    const selectedRatePrice = parseFloat(selectedRate.rate);
    const prices = rates.map((r: any)=>parseFloat(r.rate));
    const deliveryTimes = rates.map((r: any)=>r.delivery_days || 5);

    // Calculate simple facts for the AI's prompt context
    const cheapestPrice = Math.min(...prices);
    const fastestDelivery = Math.min(...deliveryTimes);
    const isCheapest = selectedRatePrice === cheapestPrice;
    const isFastest = selectedRate.delivery_days === fastestDelivery;

    // Format all rates into a readable list for the AI's prompt
    const ratesList = (allRates || []).map((r: any) => 
        `C:${r.carrier}|S:${r.service}|P:$${parseFloat(r.rate).toFixed(2)}|D:${r.delivery_days || 'N/A'}`
    ).join(';');

    // --- Prompt Construction (MAXIMUM COMPRESSION for speed) ---
    const prompt = `You are a shipping logistics expert. Analyze the SELECTED RATE against ALL RATES. Assign scores (0-100) for Cost, Speed, and Reliability. The 'overallScore' must reflect value. Higher service levels (Express/Priority) must yield higher 'reliabilityScore'. Strict JSON output is mandatory per schema.

CONTEXT:
- Total Options: ${rates.length}
- Cheapest: $${cheapestPrice.toFixed(2)}
- Fastest: ${fastestDelivery} days
- General: ${context || 'Standard e-commerce shipment.'}

SELECTED RATE:
- Carrier: ${selectedRate.carrier}
- Service: ${selectedRate.service}
- Price: $${selectedRatePrice.toFixed(2)}
- Days: ${selectedRate.delivery_days}

ALL RATES:
${ratesList}

Generate the required JSON object immediately.`;

    // --- Call Gemini API with JSON Mode ---
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2, // Low temperature for high consistency
            responseMimeType: "application/json",
            responseSchema: analysisSchema
        }
      })
    });
    
    // Error Handling Block
    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('*** FATAL GEMINI API ERROR ***');
        console.error('HTTP Status:', geminiResponse.status);
        console.error('Raw Error Body:', errorText.substring(0, 500));
        throw new Error(`Gemini API failed with status ${geminiResponse.status}.`);
    }

    const geminiData = await geminiResponse.json();
    const rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    // Check for content
    if (!rawJsonText) {
        console.error('Gemini API returned a 200 OK, but lacked the expected structured content in candidates[0].', geminiData);
        throw new Error('Gemini API did not return structured analysis.');
    }

    // Parse the guaranteed JSON output
    const analysis = JSON.parse(rawJsonText);
    // Destructure all required scores
    const { overallScore, reliabilityScore, speedScore, costScore } = analysis;
    
    // Clean and truncate the detailed analysis for a clean "quick change" (recommendation) summary
    const cleanedAnalysis = analysis.detailedAnalysis.trim();

    // Final Response payload
    const finalResponse = {
      ...analysis, // Contains all scores and detailedAnalysis from Gemini
      recommendation: cleanedAnalysis.substring(0, 120),
      labels: {
        // Absolute Best Labels
        isCheapest,
        isFastest,

        // High Tier (Excellent) Labels (Threshold >= 85)
        isMostReliable: reliabilityScore >= 85, // Use AI score for reliability flag
        isAIRecommended: overallScore >= 85,
        
        // Mid Tier (Good) Labels (Threshold >= 75) - Added to increase benefit visibility per user request
        isGoodValue: overallScore >= 75,
        isGoodSpeed: speedScore >= 75,
        isGoodCost: costScore >= 75,
      }
    };

    return new Response(JSON.stringify(finalResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in analyze-shipping-rate:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze rate',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
