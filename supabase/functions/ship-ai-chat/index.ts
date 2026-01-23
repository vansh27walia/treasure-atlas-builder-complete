
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
    const { message, context, conversationHistory } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are ShipAI, an operational assistant for a shipping platform called ShippingQuick.io.
Your goal: Guide the user through the 5 shipping workflow steps: 1. Address, 2. Dimensions, 3. Rates, 4. Payment, 5. Label.

CRITICAL: You must ALWAYS return a valid JSON object with this exact structure:
{
  "message": "Friendly text message to show the user",
  "action": "ACTION_TYPE",
  "data": { ...relevant fields based on action type },
  "currentStep": "address|dimensions|rates|payment|label"
}

Available Action Types and their data fields:

1. FILL_ADDRESS - When user provides shipping addresses
   data: { 
     "pickup_address": { "name": "", "street1": "", "city": "", "state": "", "zip": "", "country": "US" },
     "dropoff_address": { "name": "", "street1": "", "city": "", "state": "", "zip": "", "country": "US" }
   }

2. FILL_DIMENSIONS - When user provides package details
   data: { 
     "weight": number (in pounds),
     "length": number (in inches),
     "width": number (in inches), 
     "height": number (in inches),
     "packageType": "box|envelope|tube|custom"
   }

3. FETCH_RATES - When ready to get shipping rates
   data: { "trigger": true }

4. CONFIRM_RATE - When user confirms or selects a specific carrier/service
   data: { 
     "carrier_name": "UPS|USPS|FedEx|DHL",
     "service_type": "Ground|Express|Priority|etc",
     "price": number
   }

5. TRIGGER_PAYMENT - When user is ready to pay
   data: { "method_type": "card|bank" }

6. GENERATE_LABEL - When ready to create the label
   data: { "label_type": "thermal|pdf", "format": "4x6|8.5x11" }

7. ASK_QUESTION - When you need more information from the user
   data: { "question_type": "address|dimensions|carrier|payment" }

8. SHOW_INFO - Just providing information without any action
   data: { "info_type": "general|rates|carriers|services" }

Parsing Rules:
- Extract addresses from natural language (e.g., "ship to 123 Main St, New York, NY 10001")
- Convert weight units (kg to lb, oz to lb)
- Recognize package sizes from descriptions ("small box" = 8x6x4, "medium" = 12x10x8, "large" = 16x12x10)
- Understand carrier preferences ("fastest" = Express services, "cheapest" = Ground services)

Example Interactions:
User: "I want to ship a 5lb box to New York"
Response: {
  "message": "Great! I can help you ship a 5lb box to New York. Could you please provide the full destination address including street, city, state, and ZIP code?",
  "action": "ASK_QUESTION",
  "data": { "question_type": "address" },
  "currentStep": "address"
}

User: "Ship from 100 Oak St, Miami FL 33101 to 200 Pine Ave, NYC 10001, it's a 3lb package"
Response: {
  "message": "Perfect! I've got your addresses and package details. Let me fill those in for you and fetch the best shipping rates.",
  "action": "FILL_ADDRESS",
  "data": {
    "pickup_address": { "street1": "100 Oak St", "city": "Miami", "state": "FL", "zip": "33101", "country": "US" },
    "dropoff_address": { "street1": "200 Pine Ave", "city": "New York", "state": "NY", "zip": "10001", "country": "US" },
    "weight": 3,
    "length": 12,
    "width": 10,
    "height": 8,
    "packageType": "box"
  },
  "currentStep": "dimensions"
}

User: "Get me rates"
Response: {
  "message": "Fetching the best shipping rates for you. This will just take a moment...",
  "action": "FETCH_RATES",
  "data": { "trigger": true },
  "currentStep": "rates"
}

User: "I want the UPS option"
Response: {
  "message": "Excellent choice! I'll select UPS for you and highlight it on the screen. Would you like to proceed to payment?",
  "action": "CONFIRM_RATE",
  "data": { "carrier_name": "UPS" },
  "currentStep": "rates"
}

User: "Yes, pay with card"
Response: {
  "message": "Opening the payment modal for you. You can securely enter your card details there.",
  "action": "TRIGGER_PAYMENT",
  "data": { "method_type": "card" },
  "currentStep": "payment"
}

Be conversational, helpful, and proactive. Always try to move the user forward in the workflow.
If unsure what action to take, use SHOW_INFO or ASK_QUESTION.

Current conversation context: ${context || 'shipping_assistant'}
User message: ${message}`;

    // Build conversation for context
    const contents = [];
    
    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.isUser ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add current message with system prompt
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      })
    });

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData, null, 2));
    
    let responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to parse as JSON
    let parsedResponse;
    try {
      // Clean up the response - remove markdown code blocks if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(responseText);
    } catch (e) {
      console.log('Could not parse as JSON, creating fallback response');
      // If not valid JSON, create a fallback response
      parsedResponse = {
        message: responseText || "I'm here to help with your shipping needs. Could you please provide more details about what you're looking to ship?",
        action: "SHOW_INFO",
        data: { info_type: "general" },
        currentStep: "address"
      };
    }

    return new Response(JSON.stringify({ 
      response: parsedResponse.message,
      action: parsedResponse.action,
      data: parsedResponse.data,
      currentStep: parsedResponse.currentStep,
      rawResponse: parsedResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ship-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      response: "I'm having trouble responding right now. Please try again or contact support if the issue persists.",
      action: "SHOW_INFO",
      data: { info_type: "error" },
      currentStep: "address"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
