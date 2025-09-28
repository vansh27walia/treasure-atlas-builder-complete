
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

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
    
    if (!rates || !Array.isArray(rates) || rates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No rates provided for analysis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If OpenAI key is not configured, provide a basic analysis
    if (!OPENAI_API_KEY) {
      console.log('No OpenAI API key found. Providing basic analysis.');
      return provideBasicAnalysis(rates);
    }
    
    // Get detailed analysis from OpenAI
    return await getAIAnalysis(rates);
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to get AI analysis from OpenAI
async function getAIAnalysis(rates: any[]) {
  try {
    // Prepare data for OpenAI prompt
    const formattedRates = rates.map((rate: any) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      rate: parseFloat(rate.rate),
      currency: rate.currency,
      delivery_days: rate.delivery_days || 'unknown',
      delivery_date: rate.delivery_date || 'unknown'
    }));

    // Create the prompt for OpenAI
    const prompt = `
      Analyze the following shipping rate options and recommend:
      1. The best overall option (balanced for price and speed)
      2. The best value option (most economical)
      3. The fastest delivery option
      4. The most reliable carrier option
      
      Also provide a brief analysis of the options in 2-3 sentences.
      
      Here are the shipping rates:
      ${JSON.stringify(formattedRates, null, 2)}
      
      Respond with a JSON object containing:
      {
        "bestOverallRateId": "id of the best overall rate",
        "bestValueRateId": "id of the best value rate",
        "fastestRateId": "id of the fastest rate",
        "mostReliableRateId": "id of the most reliable carrier rate",
        "analysis": "brief analysis of the options"
      }
    `;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a shipping logistics expert assistant that analyzes shipping options and provides recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return provideBasicAnalysis(rates);
    }
    
    try {
      // Parse the response from OpenAI
      const content = data.choices[0].message.content;
      // Extract JSON from the response (in case it's wrapped in markdown or other text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      const recommendations = JSON.parse(jsonString);
      
      return new Response(
        JSON.stringify(recommendations),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError, data);
      return provideBasicAnalysis(rates);
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return provideBasicAnalysis(rates);
  }
}

// Fallback function for basic analysis without AI
function provideBasicAnalysis(rates: any[]) {
  // Sort rates by price to find best value
  const sortedByPrice = [...rates].sort((a, b) => 
    parseFloat(a.rate) - parseFloat(b.rate)
  );
  
  // Sort rates by delivery time to find fastest
  const sortedBySpeed = [...rates].filter(r => r.delivery_days)
    .sort((a, b) => a.delivery_days - b.delivery_days);
  
  // Maps of carrier reliability based on general market perception
  const carrierReliabilityScores = {
    'UPS': 4.7,
    'USPS': 4.3,
    'FedEx': 4.6,
    'DHL': 4.5
  };
  
  // Find the most reliable carrier
  let mostReliableRate = rates[0];
  let highestReliability = 0;
  
  for (const rate of rates) {
    const carrier = rate.carrier.toUpperCase();
    let reliabilityScore = 0;
    
    // Check if carrier exists in our reliability scores
    Object.keys(carrierReliabilityScores).forEach(key => {
      if (carrier.includes(key)) {
        reliabilityScore = carrierReliabilityScores[key as keyof typeof carrierReliabilityScores];
      }
    });
    
    if (reliabilityScore > highestReliability) {
      highestReliability = reliabilityScore;
      mostReliableRate = rate;
    }
  }
  
  // Determine best overall (balance between price and speed)
  // Use a simple scoring system based on normalized price and delivery time
  let bestOverallRate = rates[0];
  let bestOverallScore = -1;
  
  const maxPrice = Math.max(...rates.map((r: any) => parseFloat(r.rate)));
  const minPrice = Math.min(...rates.map((r: any) => parseFloat(r.rate)));
  const priceRange = maxPrice - minPrice || 1;
  
  const ratesWithDays = rates.filter((r: any) => r.delivery_days);
  const maxDays = Math.max(...ratesWithDays.map((r: any) => r.delivery_days));
  const minDays = Math.min(...ratesWithDays.map((r: any) => r.delivery_days));
  const daysRange = maxDays - minDays || 1;
  
  for (const rate of rates) {
    // Skip rates without delivery days for this calculation
    if (!rate.delivery_days) continue;
    
    const priceScore = 1 - ((parseFloat(rate.rate) - minPrice) / priceRange);
    const speedScore = 1 - ((rate.delivery_days - minDays) / daysRange);
    const overallScore = priceScore * 0.6 + speedScore * 0.4; // Weight price slightly more
    
    if (overallScore > bestOverallScore) {
      bestOverallScore = overallScore;
      bestOverallRate = rate;
    }
  }
  
  // Create response object
  const analysis = {
    bestOverallRateId: bestOverallRate.id,
    bestValueRateId: sortedByPrice[0]?.id,
    fastestRateId: sortedBySpeed[0]?.id,
    mostReliableRateId: mostReliableRate?.id,
    analysis: `Found ${rates.length} shipping options. The cheapest is ${sortedByPrice[0]?.carrier} ${sortedByPrice[0]?.service} at $${sortedByPrice[0]?.rate}, while the fastest is ${sortedBySpeed[0]?.carrier} ${sortedBySpeed[0]?.service} with delivery in ${sortedBySpeed[0]?.delivery_days} days. For the best balance of cost and delivery time, consider ${bestOverallRate.carrier} ${bestOverallRate.service}.`
  };
  
  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
