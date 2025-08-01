
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
    const { message, shipment, allShipments, context } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build comprehensive context for the AI assistant
    const shipmentContext = `
Current Shipment Details:
- ID: ${shipment.id}
- Destination: ${shipment.details?.name}, ${shipment.details?.city}, ${shipment.details?.state} ${shipment.details?.zip}
- Weight: ${shipment.details?.parcel_weight || 'N/A'} lbs
- Dimensions: ${shipment.details?.parcel_length || 'N/A'} x ${shipment.details?.parcel_width || 'N/A'} x ${shipment.details?.parcel_height || 'N/A'} inches
- Current Carrier: ${shipment.carrier}
- Current Service: ${shipment.service}
- Current Rate: $${shipment.rate || 'N/A'}
- Delivery Days: ${shipment.details?.delivery_days || 'N/A'}

Available Rates for This Shipment:
${shipment.availableRates?.map(rate => 
  `- ${rate.carrier} ${rate.service}: $${rate.rate} (${rate.delivery_days} days)`
).join('\n') || 'No rates available'}

Current AI Analysis:
${context?.currentAnalysis ? `
- Overall Score: ${context.currentAnalysis.overallScore}/100
- Cost Score: ${context.currentAnalysis.costScore}/100
- Speed Score: ${context.currentAnalysis.speedScore}/100
- Reliability Score: ${context.currentAnalysis.reliabilityScore}/100
- Service Quality Score: ${context.currentAnalysis.serviceQualityScore}/100
- Tracking Score: ${context.currentAnalysis.trackingScore}/100
- AI Recommendation: ${context.currentAnalysis.recommendation}
` : 'No analysis available'}

Bulk Shipping Context:
- Total Shipments in Batch: ${allShipments?.length || 0}
- Batch Summary: ${allShipments?.map(s => `${s.details?.city}, ${s.details?.state}`).join('; ') || 'N/A'}
`;

    const systemPrompt = `You are a specialized AI assistant for bulk shipping operations. You have access to comprehensive shipment data, rate analysis, and carrier information.

Your primary functions:
1. Help users understand shipping rates and recommendations
2. Explain carrier differences and service options
3. Provide cost optimization suggestions for bulk shipping
4. Answer questions about delivery times, reliability, and tracking
5. Suggest alternatives based on specific requirements (fastest, cheapest, most reliable)
6. Help troubleshoot shipping issues and provide best practices

Key Guidelines:
- Always reference specific data when available
- Provide actionable recommendations
- Consider bulk shipping economics and efficiency
- Explain technical shipping terms in simple language
- Prioritize user's business needs and cost constraints
- Be concise but comprehensive in responses
- If you don't have specific information, clearly state limitations

Context for this conversation:
${shipmentContext}

Remember: You're helping with bulk shipping operations where efficiency and cost-effectiveness are crucial. Always consider the bigger picture of the entire batch when making recommendations.`;

    // Call Gemini API with enhanced context
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser Question: ${message}\n\nPlease provide a helpful and specific response based on the shipment data and context provided.`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      })
    });

    const geminiData = await geminiResponse.json();
    const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I'm here to help with your bulk shipping questions. Could you please provide more specific details about what you'd like to know?";

    return new Response(JSON.stringify({ 
      response,
      context: {
        shipmentId: shipment.id,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-shipping-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
