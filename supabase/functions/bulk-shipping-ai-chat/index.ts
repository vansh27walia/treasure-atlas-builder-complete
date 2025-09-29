
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
    const { message, shipments, context } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Prepare context for the AI
    const shipmentsContext = shipments.map((s: any, index: number) => ({
      index: index + 1,
      recipient: s.recipient,
      carrier: s.carrier,
      service: s.service,
      rate: s.rate,
      delivery_days: s.delivery_days,
      status: s.status || 'pending',
      availableRates: s.availableRates?.length || 0
    }));

    const totalCost = shipments.reduce((sum: number, s: any) => sum + parseFloat(s.rate || 0), 0);
    const carrierCounts = shipments.reduce((acc: any, s: any) => {
      acc[s.carrier] = (acc[s.carrier] || 0) + 1;
      return acc;
    }, {});

    const systemPrompt = `You are ShipAI, an intelligent assistant for bulk shipping management. You have access to the following capabilities:

CURRENT BATCH INFORMATION:
- Total Shipments: ${shipments.length}
- Total Cost: $${totalCost.toFixed(2)}
- Average Cost per Shipment: $${(totalCost / shipments.length).toFixed(2)}
- Carriers Used: ${Object.entries(carrierCounts).map(([k, v]) => `${k} (${v})`).join(', ')}
- Analysis Mode: ${context.analysisMode}

CAPABILITIES:
1. Analyze individual shipments and suggest rate optimizations
2. Provide bulk shipping insights and recommendations
3. Help with carrier selection and service comparisons
4. Identify cost-saving opportunities
5. Explain shipping terms and best practices
6. Assist with troubleshooting shipping issues

AVAILABLE SHIPMENTS DATA:
${shipmentsContext.map((s: any) => 
  `Shipment ${s.index}: ${s.recipient} via ${s.carrier} ${s.service || ''} - $${parseFloat(s.rate || 0).toFixed(2)} (${s.delivery_days || 'N/A'} days, ${s.availableRates} rate options)`
).join('\n')}

You can help users:
- Compare rates and suggest better options
- Explain why certain carriers/services are recommended
- Identify patterns in their shipping data
- Suggest bulk optimizations
- Answer questions about specific shipments
- Provide shipping advice and best practices

Be helpful, concise, and focus on actionable insights. When referencing shipments, use their recipient names or shipment numbers.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: {
        totalShipments: shipments.length,
        totalCost: totalCost.toFixed(2),
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-shipping-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error',
      response: "I'm experiencing technical difficulties. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
