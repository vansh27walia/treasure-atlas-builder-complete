
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, conversation } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Build conversation history for context
    const conversationContext = conversation?.map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n') || '';

    const systemPrompt = `You are a helpful shipping assistant specialized in helping users understand shipping rates, carriers, and delivery options. You have access to current shipping rates and can help users make informed decisions.

Available carriers: USPS, UPS, FedEx, DHL

Key information to help with:
- Explain differences between carriers and services
- Help choose fastest, cheapest, or most reliable options
- Explain delivery timeframes
- Clarify shipping restrictions and requirements
- Help with international shipping and customs

If you recommend a specific rate from the available options, respond with a JSON object that includes "recommendedRateId" field.

Current context: ${context}
Previous conversation: ${conversationContext}

Be concise, helpful, and focus on shipping-related topics.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser question: ${message}`
          }]
        }],
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
    const assistantResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't process your request. Please try again.";

    // Check if response contains a rate recommendation
    let recommendedRateId = null;
    try {
      const jsonMatch = assistantResponse.match(/\{[^}]*"recommendedRateId"[^}]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendedRateId = parsed.recommendedRateId;
      }
    } catch (e) {
      // Not a JSON response, that's fine
    }

    return new Response(JSON.stringify({ 
      response: assistantResponse,
      recommendedRateId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm sorry, I encountered an error. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
