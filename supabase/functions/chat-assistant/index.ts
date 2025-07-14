import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

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
    const { message, rates = [], context = 'shipping' } = await req.json();

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Create context-aware prompt
    const systemPrompt = `You are a helpful shipping assistant. You can:
1. Explain shipping options and carrier differences
2. Recommend the best rates based on user needs
3. Help users understand shipping terms and processes
4. Sort rates by different criteria (fastest, cheapest, most reliable)

Available rates: ${JSON.stringify(rates, null, 2)}

User context: ${context}

Rules:
- Be helpful and concise
- Focus on shipping-related topics
- If asked to sort rates, respond with action: "sort_rates" and criteria
- Explain carrier differences clearly
- Recommend based on user priorities (speed, cost, reliability)
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User message: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I apologize, but I'm having trouble responding right now. Please try again.";

    // Check if response contains rate sorting request
    let action = null;
    let criteria = null;

    const lowerResponse = assistantResponse.toLowerCase();
    if (lowerResponse.includes('fastest') || lowerResponse.includes('quickest')) {
      action = 'sort_rates';
      criteria = 'fastest';
    } else if (lowerResponse.includes('cheapest') || lowerResponse.includes('lowest price')) {
      action = 'sort_rates';
      criteria = 'cheapest';
    } else if (lowerResponse.includes('reliable') || lowerResponse.includes('most reliable')) {
      action = 'sort_rates';
      criteria = 'reliable';
    }

    return new Response(JSON.stringify({ 
      response: assistantResponse,
      action,
      criteria
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I apologize, but I'm experiencing technical difficulties. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});