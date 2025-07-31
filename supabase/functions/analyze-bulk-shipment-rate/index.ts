
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MARKUP CONFIGURATION - Modify this to change pricing markup
const PRICING_MARKUP_PERCENTAGE = 5; // 5% markup on all rates
const INSURANCE_MARKUP_PERCENTAGE = 3; // 3% markup on insurance

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selectedRate, allRates, shipmentData, context } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Analyzing bulk shipment rate with markup:', PRICING_MARKUP_PERCENTAGE + '%');

    // Apply markup to rates
    const applyMarkup = (baseRate: number) => {
      return baseRate * (1 + PRICING_MARKUP_PERCENTAGE / 100);
    };

    // Calculate original rate and marked up rate
    const originalRate = parseFloat(selectedRate.rate);
    const markedUpRate = applyMarkup(originalRate);
    
    // Calculate discount info
    const discountPercentage = selectedRate.discount_percentage || 0;
    const originalPrice = selectedRate.original_rate ? parseFloat(selectedRate.original_rate) : markedUpRate;
    const savingsAmount = Math.max(0, originalPrice - markedUpRate);

    // Analyze the selected rate against all available rates
    const rates = allRates || [];
    const prices = rates.map(r => applyMarkup(parseFloat(r.rate)));
    const deliveryTimes = rates.map(r => r.delivery_days || 5);

    // Calculate positions
    const cheapestPrice = Math.min(...prices);
    const fastestDelivery = Math.min(...deliveryTimes);
    const isCheapest = Math.abs(markedUpRate - cheapestPrice) < 0.01;
    const isFastest = selectedRate.delivery_days === fastestDelivery;

    // Enhanced reliability scoring based on carrier and service
    const reliabilityScores: { [key: string]: number } = {
      'USPS': 82,
      'UPS': 92,
      'FEDEX': 90,
      'DHL': 85,
      'ONTRAC': 78,
      'LASERSHIP': 75
    };

    const serviceReliabilityBonus: { [key: string]: number } = {
      'EXPRESS': 8,
      'PRIORITY': 6,
      'OVERNIGHT': 10,
      'GROUND': 0,
      'STANDARD': 0
    };

    const baseReliability = reliabilityScores[selectedRate.carrier?.toUpperCase()] || 75;
    const serviceName = selectedRate.service?.toUpperCase() || '';
    let serviceBonus = 0;
    
    Object.keys(serviceReliabilityBonus).forEach(key => {
      if (serviceName.includes(key)) {
        serviceBonus = Math.max(serviceBonus, serviceReliabilityBonus[key]);
      }
    });

    const reliabilityScore = Math.min(100, baseReliability + serviceBonus);

    // Enhanced scoring calculations (5 criteria)
    const costScore = Math.round((cheapestPrice / markedUpRate) * 100);
    const speedScore = Math.round((fastestDelivery / (selectedRate.delivery_days || 5)) * 100);
    
    // New criteria scores
    const serviceQualityScore = Math.round(
      (reliabilityScore * 0.6) + 
      (selectedRate.carrier === 'UPS' || selectedRate.carrier === 'FEDEX' ? 25 : 15) +
      (serviceName.includes('EXPRESS') || serviceName.includes('PRIORITY') ? 15 : 10)
    );
    
    const trackingScore = Math.round(
      (selectedRate.carrier === 'UPS' ? 95 : 
       selectedRate.carrier === 'FEDEX' ? 92 :
       selectedRate.carrier === 'USPS' ? 88 :
       selectedRate.carrier === 'DHL' ? 90 : 80) +
      (serviceName.includes('EXPRESS') ? 5 : 0)
    );

    // Overall score calculation with 5 criteria
    const overallScore = Math.round(
      (costScore * 0.25) + 
      (speedScore * 0.25) + 
      (reliabilityScore * 0.20) + 
      (serviceQualityScore * 0.15) + 
      (trackingScore * 0.15)
    );

    // Determine efficiency
    const efficiencyScores = rates.map(rate => {
      const price = applyMarkup(parseFloat(rate.rate));
      const days = rate.delivery_days || 5;
      return (cheapestPrice / price) * 50 + (fastestDelivery / days) * 50;
    });
    const bestEfficiencyScore = Math.max(...efficiencyScores);
    const selectedEfficiencyScore = (cheapestPrice / markedUpRate) * 50 + (fastestDelivery / (selectedRate.delivery_days || 5)) * 50;
    const isMostEfficient = Math.abs(selectedEfficiencyScore - bestEfficiencyScore) < 1;

    // Calculate insurance cost if applicable
    const insuranceCost = shipmentData.insurance_amount ? 
      (parseFloat(shipmentData.insurance_amount) * 0.01 * (1 + INSURANCE_MARKUP_PERCENTAGE / 100)) : 0;
    
    const totalCost = markedUpRate + insuranceCost;

    // Create enhanced prompt for Gemini API
    const prompt = `Analyze this bulk shipping rate and provide a detailed recommendation:

Rate Details:
- Carrier: ${selectedRate.carrier}
- Service: ${selectedRate.service}
- Base Price: $${originalRate.toFixed(2)}
- Final Price (with markup): $${markedUpRate.toFixed(2)}
- Insurance Cost: $${insuranceCost.toFixed(2)}
- Total Cost: $${totalCost.toFixed(2)}
- Delivery Time: ${selectedRate.delivery_days} days

Enhanced Scores:
- Overall Score: ${overallScore}/100
- Cost Score: ${costScore}/100
- Speed Score: ${speedScore}/100
- Reliability Score: ${reliabilityScore}/100
- Service Quality Score: ${serviceQualityScore}/100
- Tracking Score: ${trackingScore}/100

Context:
- Total available rates: ${rates.length}
- Price range: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}
- Is cheapest: ${isCheapest}
- Is fastest: ${isFastest}
- Is most efficient: ${isMostEfficient}
- Applied markup: ${PRICING_MARKUP_PERCENTAGE}%

Provide a 2-sentence recommendation focusing on value, reliability, and delivery speed for bulk shipping operations.`;

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
      "This rate offers good value for bulk shipping with reliable delivery times and comprehensive tracking.";

    const analysis = {
      overallScore,
      reliabilityScore,
      speedScore,
      costScore,
      serviceQualityScore,
      trackingScore,
      recommendation,
      discountInfo: {
        originalPrice: originalPrice,
        discountedPrice: markedUpRate,
        discountPercentage: discountPercentage,
        savingsAmount: savingsAmount
      },
      labels: {
        isCheapest,
        isFastest,
        isMostReliable: reliabilityScore >= 88,
        isMostEfficient,
        isAIRecommended: overallScore >= 85
      },
      pricing: {
        baseRate: originalRate,
        markedUpRate: markedUpRate,
        markup: PRICING_MARKUP_PERCENTAGE,
        insuranceCost: insuranceCost,
        totalCost: totalCost
      }
    };

    console.log('Bulk shipment analysis completed with enhanced scoring');

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
