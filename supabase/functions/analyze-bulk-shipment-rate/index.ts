
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CONFIGURABLE MARKUP RATES - Adjust these values as needed
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup on shipping rates
const INSURANCE_MARKUP_PERCENTAGE = 3; // 3% markup on insurance costs

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selectedRate, allRates, shipment, context } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Apply markup to rates
    const originalRate = parseFloat(selectedRate.rate);
    const markedUpRate = originalRate * (1 + RATE_MARKUP_PERCENTAGE / 100);
    const discountPercentage = Math.round(((markedUpRate - originalRate) / markedUpRate) * 100);

    // Calculate insurance cost with markup if applicable
    const baseInsuranceCost = shipment.details?.insurance_cost || 0;
    const markedUpInsurance = baseInsuranceCost * (1 + INSURANCE_MARKUP_PERCENTAGE / 100);
    const totalCostWithInsurance = markedUpRate + markedUpInsurance;

    // Analyze the selected rate against all available rates
    const rates = allRates || [];
    const prices = rates.map(r => parseFloat(r.rate.toString()));
    const deliveryTimes = rates.map(r => r.delivery_days || 5);

    // Calculate positions
    const cheapestPrice = Math.min(...prices);
    const fastestDelivery = Math.min(...deliveryTimes);
    const isCheapest = originalRate === cheapestPrice;
    const isFastest = selectedRate.delivery_days === fastestDelivery;

    // Enhanced reliability scoring based on carrier and service type
    const reliabilityScores = {
      'USPS': { base: 85, priority: 90, express: 88 },
      'UPS': { base: 92, priority: 95, express: 96 },
      'FedEx': { base: 90, priority: 94, express: 97 },
      'DHL': { base: 85, priority: 88, express: 92 }
    };

    const carrierInfo = reliabilityScores[selectedRate.carrier?.toUpperCase()] || { base: 75, priority: 80, express: 85 };
    let carrierReliability = carrierInfo.base;
    
    if (selectedRate.service?.toLowerCase().includes('express') || selectedRate.service?.toLowerCase().includes('overnight')) {
      carrierReliability = carrierInfo.express;
    } else if (selectedRate.service?.toLowerCase().includes('priority') || selectedRate.service?.toLowerCase().includes('2-day')) {
      carrierReliability = carrierInfo.priority;
    }

    // Enhanced scoring calculations
    const costScore = Math.min(100, Math.round(((cheapestPrice / originalRate) * 100)));
    const speedScore = Math.min(100, Math.round(((fastestDelivery / (selectedRate.delivery_days || 5)) * 100)));
    const reliabilityScore = carrierReliability;
    
    // New service quality score based on service features
    let serviceQualityScore = 75; // Base score
    if (selectedRate.service?.toLowerCase().includes('signature')) serviceQualityScore += 10;
    if (selectedRate.service?.toLowerCase().includes('insurance')) serviceQualityScore += 10;
    if (selectedRate.service?.toLowerCase().includes('tracking')) serviceQualityScore += 5;
    serviceQualityScore = Math.min(100, serviceQualityScore);

    // New tracking score based on carrier capabilities
    const trackingScores = {
      'UPS': 95,
      'FedEx': 92,
      'USPS': 85,
      'DHL': 90
    };
    const trackingScore = trackingScores[selectedRate.carrier?.toUpperCase()] || 75;

    // Overall score calculation with 5 criteria
    const overallScore = Math.round(
      (costScore * 0.25 + speedScore * 0.25 + reliabilityScore * 0.2 + serviceQualityScore * 0.15 + trackingScore * 0.15)
    );

    // Determine efficiency
    const efficiencyScores = rates.map(rate => {
      const price = parseFloat(rate.rate.toString());
      const days = rate.delivery_days || 5;
      return (cheapestPrice / price) * 50 + (fastestDelivery / days) * 50;
    });
    const bestEfficiencyScore = Math.max(...efficiencyScores);
    const selectedEfficiencyScore = (cheapestPrice / originalRate) * 50 + (fastestDelivery / (selectedRate.delivery_days || 5)) * 50;
    const isMostEfficient = Math.abs(selectedEfficiencyScore - bestEfficiencyScore) < 1;

    // Create enhanced prompt for Gemini API
    const prompt = `Analyze this bulk shipping rate and provide a detailed recommendation:

Rate Details:
- Carrier: ${selectedRate.carrier}
- Service: ${selectedRate.service}
- Original Price: $${originalRate.toFixed(2)}
- Final Price (with markup): $${markedUpRate.toFixed(2)}
- Insurance Cost: $${markedUpInsurance.toFixed(2)}
- Total Cost: $${totalCostWithInsurance.toFixed(2)}
- Delivery Time: ${selectedRate.delivery_days} days
- Markup Applied: ${RATE_MARKUP_PERCENTAGE}% on rate, ${INSURANCE_MARKUP_PERCENTAGE}% on insurance

Analysis Scores:
- Overall Score: ${overallScore}/100
- Cost Score: ${costScore}/100
- Speed Score: ${speedScore}/100
- Reliability Score: ${reliabilityScore}/100
- Service Quality Score: ${serviceQualityScore}/100
- Tracking Score: ${trackingScore}/100

Shipment Context:
- Destination: ${shipment.details?.city}, ${shipment.details?.state}
- Weight: ${shipment.details?.parcel_weight || 'N/A'} lbs
- Package Type: ${shipment.details?.package_type || 'Package'}

Market Context:
- Total available rates: ${rates.length}
- Price range: $${context?.priceRange?.min} - $${context?.priceRange?.max}
- Is cheapest: ${isCheapest}
- Is fastest: ${isFastest}
- Is most efficient: ${isMostEfficient}

Provide a 2-sentence recommendation focusing on value, reliability, and suitability for bulk shipping operations. Consider the markup pricing and total cost including insurance.`;

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
      "This rate offers a balanced combination of cost and delivery speed for bulk shipping operations.";

    const analysis = {
      overallScore,
      reliabilityScore,
      speedScore,
      costScore,
      serviceQualityScore,
      trackingScore,
      recommendation,
      originalRate: markedUpRate,
      discountPercentage,
      totalCostWithInsurance,
      labels: {
        isCheapest,
        isFastest,
        isMostReliable: reliabilityScore >= 90,
        isMostEfficient,
        isAIRecommended: overallScore >= 85
      }
    };

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-bulk-shipment-rate:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze bulk shipment rate',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
