
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selectedRate, allRates, context } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Analyze the selected rate against all available rates
    const rates = allRates || [];
    const selectedRatePrice = parseFloat(selectedRate.rate);
    const prices = rates.map((r: any) => parseFloat(r.rate));
    const deliveryTimes = rates.map((r: any) => r.delivery_days || 5);

    // Calculate positions
    const cheapestPrice = Math.min(...prices);
    const fastestDelivery = Math.min(...deliveryTimes);
    const isCheapest = selectedRatePrice === cheapestPrice;
    const isFastest = selectedRate.delivery_days === fastestDelivery;

    // Determine reliability based on carrier
    const reliabilityScores: { [key: string]: number } = {
      'USPS': 85,
      'UPS': 90,
      'FEDEX': 88,
      'DHL': 82
    };

    const carrierReliability = reliabilityScores[selectedRate.carrier?.toUpperCase()] || 75;

    // Calculate scores
    const costScore = Math.round(((cheapestPrice / selectedRatePrice) * 100));
    const speedScore = Math.round(((fastestDelivery / (selectedRate.delivery_days || 5)) * 100));
    const reliabilityScore = carrierReliability;

    // Overall score calculation
    const overallScore = Math.round((costScore * 0.3 + speedScore * 0.3 + reliabilityScore * 0.4));

    // Determine if it's the most efficient (balance of cost and speed)
    const efficiencyScores = rates.map((rate: any) => {
      const price = parseFloat(rate.rate);
      const days = rate.delivery_days || 5;
      return (cheapestPrice / price) * 50 + (fastestDelivery / days) * 50;
    });
    const bestEfficiencyScore = Math.max(...efficiencyScores);
    const selectedEfficiencyScore = (cheapestPrice / selectedRatePrice) * 50 + (fastestDelivery / (selectedRate.delivery_days || 5)) * 50;
    const isMostEfficient = Math.abs(selectedEfficiencyScore - bestEfficiencyScore) < 1;

    // Create prompt for Gemini API - Focus on shipment quality, reliability, timing
    const prompt = `Analyze this shipping option and explain if it's good for the shipment:

Shipment Details:
- Carrier: ${selectedRate.carrier} ${selectedRate.service}
- Delivery Time: ${selectedRate.delivery_days} days
- Reliability Score: ${reliabilityScore}/100
- Speed Score: ${speedScore}/100

Context:
- Total options: ${rates.length}
- Fastest available: ${fastestDelivery} days
- Is fastest: ${isFastest}
- Is most reliable: ${reliabilityScore >= 85}

Write 3-4 lines explaining: 1) Is this shipment good for the recipient? 2) Will it deliver on time? 3) Is the carrier reliable? Focus on shipment quality and timing, not price.`;

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      })
    });

    const geminiData = await geminiResponse.json();
    const recommendation = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
      "This rate offers a good balance of cost and delivery time for your shipment needs.";

    const analysis = {
      overallScore,
      reliabilityScore,
      speedScore,
      costScore,
      recommendation,
      labels: {
        isCheapest,
        isFastest,
        isMostReliable: reliabilityScore >= 85,
        isMostEfficient,
        isAIRecommended: overallScore >= 85
      }
    };

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
