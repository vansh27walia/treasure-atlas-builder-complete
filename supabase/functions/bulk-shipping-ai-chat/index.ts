
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
    const { message, shipmentData, allShipments, context } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Prepare context for the AI
    const shipmentSummary = shipmentData ? {
      id: shipmentData.id,
      destination: `${shipmentData.details?.city}, ${shipmentData.details?.state}`,
      selectedCarrier: shipmentData.carrier,
      selectedService: shipmentData.service,
      rate: shipmentData.rate,
      availableRatesCount: shipmentData.availableRates?.length || 0,
      weight: shipmentData.details?.parcel_weight,
      dimensions: `${shipmentData.details?.parcel_length}x${shipmentData.details?.parcel_width}x${shipmentData.details?.parcel_height}`
    } : null;

    const bulkSummary = {
      totalShipments: allShipments?.length || 0,
      totalCost: allShipments?.reduce((sum: number, s: any) => sum + (s.rate || 0), 0) || 0,
      carriers: [...new Set(allShipments?.map((s: any) => s.carrier))],
      avgWeight: allShipments?.length > 0 ? 
        allShipments.reduce((sum: number, s: any) => sum + (s.details?.parcel_weight || 0), 0) / allShipments.length : 0
    };

    const systemPrompt = `You are an expert shipping assistant specializing in bulk shipping operations. You have access to comprehensive shipment data and can help with:

1. Rate analysis and optimization
2. Carrier selection recommendations
3. Cost-saving strategies
4. Delivery time optimization
5. Shipping best practices
6. Insurance recommendations
7. Troubleshooting shipping issues

Current Context:
- User is working with bulk shipping labels
- Total shipments in batch: ${bulkSummary.totalShipments}
- Total estimated cost: $${bulkSummary.totalCost.toFixed(2)}
- Available carriers: ${bulkSummary.carriers.join(', ')}
- Average shipment weight: ${bulkSummary.avgWeight.toFixed(2)} oz

${shipmentSummary ? `
Selected Shipment Details:
- Destination: ${shipmentSummary.destination}
- Current carrier: ${shipmentSummary.selectedCarrier} ${shipmentSummary.selectedService}
- Rate: $${shipmentSummary.rate}
- Package: ${shipmentSummary.weight}oz, ${shipmentSummary.dimensions}
- Available alternatives: ${shipmentSummary.availableRatesCount} rates
` : ''}

Provide helpful, actionable advice. Be concise but thorough. Focus on cost savings and efficiency.`;

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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-shipping-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
