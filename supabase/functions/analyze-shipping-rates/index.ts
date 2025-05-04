
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rates } = await req.json();
    
    if (!openAIApiKey) {
      // Fallback to simple algorithm if OpenAI API key is not available
      console.log("OpenAI API key not available, using fallback algorithm");
      return new Response(
        JSON.stringify(getFallbackAnalysis(rates)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Analyzing ${rates.length} shipping rates with OpenAI...`);
    
    const analysis = await getAIAnalysis(rates);
    
    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-shipping-rates function:', error);
    
    // Return a fallback analysis in case of error
    const { rates = [] } = await req.json().catch(() => ({ rates: [] }));
    
    return new Response(
      JSON.stringify({
        ...getFallbackAnalysis(rates),
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAIAnalysis(rates: any[]) {
  if (!rates || rates.length === 0) {
    return {
      bestOverallRateId: null,
      bestValueRateId: null,
      fastestRateId: null,
      mostReliableRateId: null,
      analysis: "No shipping rates available to analyze."
    };
  }
  
  const prompt = `
    As a shipping expert, analyze these shipping rates and recommend the best options:
    
    ${JSON.stringify(rates, null, 2)}
    
    Please identify:
    1. The best overall shipping option (balanced for cost, speed, and reliability)
    2. The best value option (most economical for the service level)
    3. The fastest delivery option
    4. The most reliable option based on carrier reputation
    
    Also provide a brief analysis explaining your recommendations in 2-3 sentences.
    Return your response in this JSON format:
    {
      "bestOverallRateId": "rate_id",
      "bestValueRateId": "rate_id",
      "fastestRateId": "rate_id",
      "mostReliableRateId": "rate_id",
      "analysis": "Your brief analysis here"
    }
  `;
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIApiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a shipping logistics expert who analyzes shipping rates and provides recommendations. Only respond in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log("Received analysis from OpenAI");
  
  try {
    // Parse the response text as JSON
    const aiAnalysis = JSON.parse(data.choices[0].message.content);
    
    // Add reliability check - make sure the rate IDs actually exist
    const validRateIds = rates.map(r => r.id);
    
    return {
      bestOverallRateId: validRateIds.includes(aiAnalysis.bestOverallRateId) ? aiAnalysis.bestOverallRateId : getFastestRate(rates),
      bestValueRateId: validRateIds.includes(aiAnalysis.bestValueRateId) ? aiAnalysis.bestValueRateId : getBestValueRate(rates),
      fastestRateId: validRateIds.includes(aiAnalysis.fastestRateId) ? aiAnalysis.fastestRateId : getFastestRate(rates),
      mostReliableRateId: validRateIds.includes(aiAnalysis.mostReliableRateId) ? aiAnalysis.mostReliableRateId : getMostReliableRate(rates),
      analysis: aiAnalysis.analysis || "Based on the available shipping options, I've highlighted the best choices for your shipment."
    };
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    // Fallback to algorithmic analysis
    return getFallbackAnalysis(rates);
  }
}

function getFallbackAnalysis(rates: any[]) {
  if (!rates || rates.length === 0) {
    return {
      bestOverallRateId: null,
      bestValueRateId: null,
      fastestRateId: null,
      mostReliableRateId: null,
      analysis: "No shipping rates available to analyze."
    };
  }
  
  const bestValueRateId = getBestValueRate(rates);
  const fastestRateId = getFastestRate(rates);
  const mostReliableRateId = getMostReliableRate(rates);
  
  // For best overall, pick a balance between value and speed
  const bestOverallRateId = getBestOverallRate(rates, bestValueRateId, fastestRateId);
  
  return {
    bestOverallRateId,
    bestValueRateId,
    fastestRateId,
    mostReliableRateId,
    analysis: "I've analyzed the available shipping options and highlighted the best choices based on price, delivery time, and carrier reliability."
  };
}

function getBestValueRate(rates: any[]): string | null {
  if (!rates || rates.length === 0) return null;
  
  // Sort by price (lowest first)
  const sortedByPrice = [...rates].sort((a, b) => {
    return parseFloat(a.rate) - parseFloat(b.rate);
  });
  
  return sortedByPrice[0]?.id || null;
}

function getFastestRate(rates: any[]): string | null {
  if (!rates || rates.length === 0) return null;
  
  // Sort by delivery days (lowest first)
  const sortedBySpeed = [...rates].sort((a, b) => {
    const aDays = a.delivery_days || a.est_delivery_days || 999;
    const bDays = b.delivery_days || b.est_delivery_days || 999;
    return aDays - bDays;
  });
  
  return sortedBySpeed[0]?.id || null;
}

function getMostReliableRate(rates: any[]): string | null {
  if (!rates || rates.length === 0) return null;
  
  // Assign reliability scores based on carrier
  const carrierReliability: {[key: string]: number} = {
    'USPS': 4,
    'UPS': 5,
    'FedEx': 4.5,
    'DHL': 4.2
  };
  
  // Sort by reliability score
  const sortedByReliability = [...rates].sort((a, b) => {
    const aCarrier = Object.keys(carrierReliability).find(c => 
      a.carrier.toUpperCase().includes(c)) || '';
    const bCarrier = Object.keys(carrierReliability).find(c => 
      b.carrier.toUpperCase().includes(c)) || '';
    
    const aScore = carrierReliability[aCarrier] || 3;
    const bScore = carrierReliability[bCarrier] || 3;
    
    return bScore - aScore;
  });
  
  return sortedByReliability[0]?.id || null;
}

function getBestOverallRate(rates: any[], bestValueId: string | null, fastestId: string | null): string | null {
  if (!rates || rates.length === 0) return null;
  if (rates.length === 1) return rates[0].id;
  
  // If there are only two rates, and we already identified the best value and fastest,
  // choose the one that's not the cheapest if the price difference is reasonable
  if (rates.length === 2 && bestValueId && fastestId && bestValueId !== fastestId) {
    const cheapest = rates.find(r => r.id === bestValueId);
    const fastest = rates.find(r => r.id === fastestId);
    
    if (cheapest && fastest) {
      const cheapestPrice = parseFloat(cheapest.rate);
      const fastestPrice = parseFloat(fastest.rate);
      
      // If the fastest option is less than 30% more expensive than the cheapest,
      // recommend the fastest option as the best overall
      if (fastestPrice <= cheapestPrice * 1.3) {
        return fastestId;
      }
    }
    
    return bestValueId;
  }
  
  // For more than two rates, use a scoring system
  const ratesWithScores = rates.map(rate => {
    const priceScore = 100 - (parseFloat(rate.rate) / Math.max(...rates.map(r => parseFloat(r.rate)))) * 100;
    
    // Normalize delivery days (lower is better)
    const deliveryDays = rate.delivery_days || rate.est_delivery_days || 999;
    const speedScore = 100 - (deliveryDays / Math.max(...rates.map(r => r.delivery_days || r.est_delivery_days || 999))) * 100;
    
    // Get carrier reliability score
    const carrierReliability: {[key: string]: number} = {
      'USPS': 80,
      'UPS': 95,
      'FedEx': 90,
      'DHL': 85
    };
    
    const carrier = Object.keys(carrierReliability).find(c => 
      rate.carrier.toUpperCase().includes(c)) || '';
    const reliabilityScore = carrierReliability[carrier] || 70;
    
    // Calculate overall score - price is 50%, speed is 30%, reliability is 20%
    const overallScore = (priceScore * 0.5) + (speedScore * 0.3) + (reliabilityScore * 0.2);
    
    return {
      ...rate,
      overallScore
    };
  });
  
  // Sort by overall score (highest first)
  const sortedByScore = [...ratesWithScores].sort((a, b) => b.overallScore - a.overallScore);
  
  return sortedByScore[0]?.id || null;
}
