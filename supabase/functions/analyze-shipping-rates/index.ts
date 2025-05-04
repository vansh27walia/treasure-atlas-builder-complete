
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
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
    
    // Get the API key from environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({
          bestValueRateId: findBestValueRate(rates)?.id,
          fastestRateId: findFastestRate(rates)?.id,
          analysis: "AI analysis not available. Using algorithm-based recommendations."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!rates || rates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No rates provided for analysis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Prepare the data for AI analysis
    const ratesForAnalysis = rates.map((rate: any) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      rate: parseFloat(rate.rate),
      delivery_days: rate.delivery_days || "unknown",
      original_rate: rate.original_rate ? parseFloat(rate.original_rate) : null
    }));

    // Use OpenAI to analyze the shipping options
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI specialized in shipping logistics. Analyze shipping rate options and provide recommendations based on cost, delivery time, and carrier reliability. Respond in JSON format only.'
          },
          {
            role: 'user',
            content: `Analyze these shipping rate options and recommend the best overall option, best value option, fastest option, and most reliable option. Also provide a brief analysis explaining the recommendations. Here are the shipping rates: ${JSON.stringify(ratesForAnalysis)}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await response.json();
    
    if (!aiData.choices || aiData.choices.length === 0) {
      console.error('Invalid response from OpenAI API:', aiData);
      
      // Fall back to algorithmic recommendations
      return new Response(
        JSON.stringify({
          bestOverallRateId: findBestOverallRate(rates)?.id,
          bestValueRateId: findBestValueRate(rates)?.id,
          fastestRateId: findFastestRate(rates)?.id,
          mostReliableRateId: findMostReliableRate(rates)?.id,
          analysis: "Using algorithm-based recommendations due to AI service limitations."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the AI response
    const aiContent = aiData.choices[0].message.content;
    let aiRecommendations;
    
    try {
      aiRecommendations = JSON.parse(aiContent);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      aiRecommendations = {
        bestOverallRateId: findBestOverallRate(rates)?.id,
        bestValueRateId: findBestValueRate(rates)?.id,
        fastestRateId: findFastestRate(rates)?.id,
        mostReliableRateId: findMostReliableRate(rates)?.id,
        analysis: "Using algorithm-based recommendations due to parsing error."
      };
    }

    return new Response(
      JSON.stringify(aiRecommendations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in analyze-shipping-rates function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper functions for algorithmic recommendations

function findBestValueRate(rates: any[]) {
  if (!rates || rates.length === 0) return null;
  
  // Sort by a combination of price and delivery days
  return [...rates].sort((a, b) => {
    const aPrice = parseFloat(a.rate);
    const bPrice = parseFloat(b.rate);
    const aDays = a.delivery_days || 7; // Default to 7 days if unknown
    const bDays = b.delivery_days || 7;
    
    // Create a score that combines price and delivery time
    // Lower is better
    const aScore = aPrice * (aDays * 0.1);
    const bScore = bPrice * (bDays * 0.1);
    
    return aScore - bScore;
  })[0];
}

function findFastestRate(rates: any[]) {
  if (!rates || rates.length === 0) return null;
  
  // Sort by delivery days (ascending)
  return [...rates].sort((a, b) => {
    const aDays = a.delivery_days || 999;
    const bDays = b.delivery_days || 999;
    return aDays - bDays;
  })[0];
}

function findBestOverallRate(rates: any[]) {
  if (!rates || rates.length === 0) return null;
  
  // Best overall is a balance between price and speed
  return [...rates].sort((a, b) => {
    const aPrice = parseFloat(a.rate);
    const bPrice = parseFloat(b.rate);
    const aDays = a.delivery_days || 7;
    const bDays = b.delivery_days || 7;
    
    // Normalize price (0-1 scale)
    const maxPrice = Math.max(...rates.map(r => parseFloat(r.rate)));
    const aPriceNorm = aPrice / maxPrice;
    const bPriceNorm = bPrice / maxPrice;
    
    // Normalize days (0-1 scale)
    const maxDays = Math.max(...rates.map(r => r.delivery_days || 7));
    const aDaysNorm = aDays / maxDays;
    const bDaysNorm = bDays / maxDays;
    
    // Combined score (lower is better)
    const aScore = aPriceNorm * 0.6 + aDaysNorm * 0.4;
    const bScore = bPriceNorm * 0.6 + bDaysNorm * 0.4;
    
    return aScore - bScore;
  })[0];
}

function findMostReliableRate(rates: any[]) {
  if (!rates || rates.length === 0) return null;
  
  // For reliability, we favor established carriers
  const reliabilityRanking = {
    'UPS': 5,
    'USPS': 4,
    'FedEx': 5, 
    'DHL': 4,
    'DHL Express': 5
  };
  
  return [...rates].sort((a, b) => {
    const aCarrier = a.carrier.toUpperCase();
    const bCarrier = b.carrier.toUpperCase();
    
    const aReliability = Object.keys(reliabilityRanking).some(carrier => 
      aCarrier.includes(carrier)) ? reliabilityRanking[aCarrier] || 3 : 3;
    
    const bReliability = Object.keys(reliabilityRanking).some(carrier => 
      bCarrier.includes(carrier)) ? reliabilityRanking[bCarrier] || 3 : 3;
    
    // If reliability is the same, consider delivery days as a tiebreaker
    if (aReliability === bReliability) {
      const aDays = a.delivery_days || 999;
      const bDays = b.delivery_days || 999;
      return aDays - bDays;
    }
    
    // Higher reliability scores come first
    return bReliability - aReliability;
  })[0];
}
