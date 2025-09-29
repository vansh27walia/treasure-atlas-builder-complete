
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
    const body = await req.json();
    const { shipment, allShipments, mode } = body;
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    let analysis;

    if (mode === 'individual' && shipment) {
      // Individual shipment analysis
      const rates = shipment.availableRates || [];
      const selectedRate = rates.find((r: any) => r.id === shipment.selectedRateId) || rates[0];
      
      if (!selectedRate) {
        throw new Error('No rate information available for analysis');
      }

      const prices = rates.map((r: any) => parseFloat(r.rate));
      const deliveryTimes = rates.map((r: any) => r.delivery_days || 5);
      
      const cheapestPrice = Math.min(...prices);
      const fastestDelivery = Math.min(...deliveryTimes);
      const selectedPrice = parseFloat(selectedRate.rate);
      const selectedDelivery = selectedRate.delivery_days || 5;

      // Calculate scores based on selected rate
      const costScore = Math.round((cheapestPrice / selectedPrice) * 100);
      const speedScore = Math.round((fastestDelivery / selectedDelivery) * 100);
      const reliabilityScore = getCarrierReliabilityScore(selectedRate.carrier);
      const serviceQualityScore = getServiceQualityScore(selectedRate.service);
      const trackingScore = getTrackingScore(selectedRate.carrier);
      
      const overallScore = Math.round(
        (costScore * 0.25 + speedScore * 0.25 + reliabilityScore * 0.2 + 
         serviceQualityScore * 0.15 + trackingScore * 0.15)
      );

      analysis = {
        overallScore,
        reliabilityScore,
        speedScore,
        costScore,
        serviceQualityScore,
        trackingScore,
        recommendation: await getGeminiRecommendation(selectedRate, rates, 'individual'),
        labels: {
          isCheapest: selectedPrice === cheapestPrice,
          isFastest: selectedDelivery === fastestDelivery,
          isMostReliable: reliabilityScore >= 85,
          isMostEfficient: overallScore >= 80,
          isAIRecommended: overallScore >= 85
        }
      };
    } else {
      // Combined analysis for all shipments
      const totalCost = allShipments.reduce((sum: number, s: any) => sum + parseFloat(s.rate || 0), 0);
      const averageDelivery = allShipments.reduce((sum: number, s: any) => {
        const selectedRate = s.availableRates?.find((r: any) => r.id === s.selectedRateId);
        return sum + (selectedRate?.delivery_days || 5);
      }, 0) / allShipments.length;

      // Calculate combined scores
      const costScore = calculateCombinedCostScore(allShipments);
      const speedScore = calculateCombinedSpeedScore(allShipments);
      const reliabilityScore = calculateCombinedReliabilityScore(allShipments);
      const serviceQualityScore = calculateCombinedServiceScore(allShipments);
      const trackingScore = calculateCombinedTrackingScore(allShipments);
      
      const overallScore = Math.round(
        (costScore * 0.25 + speedScore * 0.25 + reliabilityScore * 0.2 + 
         serviceQualityScore * 0.15 + trackingScore * 0.15)
      );

      analysis = {
        overallScore,
        reliabilityScore,
        speedScore,
        costScore,
        serviceQualityScore,
        trackingScore,
        recommendation: await getGeminiRecommendation(null, allShipments, 'combined'),
        labels: {
          isCheapest: costScore >= 85,
          isFastest: speedScore >= 85,
          isMostReliable: reliabilityScore >= 85,
          isMostEfficient: overallScore >= 80,
          isAIRecommended: overallScore >= 85
        }
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-bulk-shipping-rates:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze rates',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getCarrierReliabilityScore(carrier: string): number {
  const scores: { [key: string]: number } = {
    'USPS': 85,
    'UPS': 90,
    'FEDEX': 88,
    'DHL': 82
  };
  return scores[carrier?.toUpperCase()] || 75;
}

function getServiceQualityScore(service: string): number {
  if (service?.toLowerCase().includes('express')) return 95;
  if (service?.toLowerCase().includes('priority')) return 90;
  if (service?.toLowerCase().includes('ground')) return 80;
  return 85;
}

function getTrackingScore(carrier: string): number {
  const scores: { [key: string]: number } = {
    'USPS': 80,
    'UPS': 95,
    'FEDEX': 92,
    'DHL': 88
  };
  return scores[carrier?.toUpperCase()] || 75;
}

function calculateCombinedCostScore(shipments: any[]): number {
  const totalActual = shipments.reduce((sum, s) => sum + parseFloat(s.rate || 0), 0);
  const totalOptimal = shipments.reduce((sum, s) => {
    const rates = s.availableRates || [];
    const cheapest = Math.min(...rates.map((r: any) => parseFloat(r.rate)));
    return sum + cheapest;
  }, 0);
  
  return Math.round((totalOptimal / totalActual) * 100);
}

function calculateCombinedSpeedScore(shipments: any[]): number {
  const averageActual = shipments.reduce((sum, s) => {
    const selectedRate = s.availableRates?.find((r: any) => r.id === s.selectedRateId);
    return sum + (selectedRate?.delivery_days || 5);
  }, 0) / shipments.length;
  
  const averageOptimal = shipments.reduce((sum, s) => {
    const rates = s.availableRates || [];
    const fastest = Math.min(...rates.map((r: any) => r.delivery_days || 5));
    return sum + fastest;
  }, 0) / shipments.length;
  
  return Math.round((averageOptimal / averageActual) * 100);
}

function calculateCombinedReliabilityScore(shipments: any[]): number {
  const totalScore = shipments.reduce((sum, s) => {
    const selectedRate = s.availableRates?.find((r: any) => r.id === s.selectedRateId);
    return sum + getCarrierReliabilityScore(selectedRate?.carrier || s.carrier);
  }, 0);
  
  return Math.round(totalScore / shipments.length);
}

function calculateCombinedServiceScore(shipments: any[]): number {
  const totalScore = shipments.reduce((sum, s) => {
    const selectedRate = s.availableRates?.find((r: any) => r.id === s.selectedRateId);
    return sum + getServiceQualityScore(selectedRate?.service || s.service);
  }, 0);
  
  return Math.round(totalScore / shipments.length);
}

function calculateCombinedTrackingScore(shipments: any[]): number {
  const totalScore = shipments.reduce((sum, s) => {
    const selectedRate = s.availableRates?.find((r: any) => r.id === s.selectedRateId);
    return sum + getTrackingScore(selectedRate?.carrier || s.carrier);
  }, 0);
  
  return Math.round(totalScore / shipments.length);
}

async function getGeminiRecommendation(selectedRate: any, data: any[], mode: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  let prompt = '';
  
  if (mode === 'individual') {
    prompt = `Analyze this shipping rate and provide a recommendation:

Rate: ${selectedRate.carrier} ${selectedRate.service}
Price: $${parseFloat(selectedRate.rate).toFixed(2)}
Delivery: ${selectedRate.delivery_days} days

Available alternatives: ${data.length} rates
Context: Individual shipment analysis

Provide a 2-sentence recommendation focusing on value and efficiency.`;
  } else {
    const totalShipments = data.length;
    const totalCost = data.reduce((sum, s) => sum + parseFloat(s.rate || 0), 0);
    const carrierBreakdown = data.reduce((acc, s) => {
      const carrier = s.carrier || 'Unknown';
      acc[carrier] = (acc[carrier] || 0) + 1;
      return acc;
    }, {});

    prompt = `Analyze this bulk shipping batch and provide a recommendation:

Total Shipments: ${totalShipments}
Total Cost: $${totalCost.toFixed(2)}
Average Cost: $${(totalCost / totalShipments).toFixed(2)}

Carrier Breakdown: ${Object.entries(carrierBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}

Context: Combined bulk shipping analysis

Provide a 2-sentence recommendation focusing on overall batch efficiency and cost optimization.`;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      })
    });

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || 
      "This selection offers good value for your shipping needs.";
  } catch (error) {
    console.error('Gemini API error:', error);
    return "This selection offers good value for your shipping needs.";
  }
}
