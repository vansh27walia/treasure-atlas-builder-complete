
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
    const { message, context } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are ShipAI, a smart shipping assistant. You help users with:
- Evaluating shipping options based on quality, reliability, and timing
- Explaining which shipments are best for their needs
- Comparing carriers (UPS, USPS, FedEx, DHL) on delivery speed and reliability
- Providing insights on international shipping, customs, and documentation
- Troubleshooting shipping problems

When discussing rates, focus on:
1. Shipment quality - will it arrive safely?
2. Delivery timing - will it arrive on time?
3. Carrier reliability - is this carrier dependable?
4. Service type - is this the right service for the recipient?

Keep responses helpful, concise, and focused on shipment quality over price.

User message: ${message}`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        }
      })
    });

    const geminiData = await geminiResponse.json();
    const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I'm here to help with your shipping needs. Could you please provide more details about what you're looking for?";

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ship-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      response: "I'm having trouble responding right now. Please try again or contact support if the issue persists."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
