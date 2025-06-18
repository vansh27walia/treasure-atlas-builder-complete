
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
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'EasyPost API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { tracking_code } = await req.json();
    
    if (!tracking_code) {
      return new Response(
        JSON.stringify({ error: 'Tracking code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Call EasyPost tracking API
    const trackingResponse = await fetch(`https://api.easypost.com/v2/trackers/${tracking_code}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!trackingResponse.ok) {
      if (trackingResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: 'No shipment found for this tracking number.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      const error = await trackingResponse.text();
      return new Response(
        JSON.stringify({ error: `EasyPost tracking error: ${error}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const trackingData = await trackingResponse.json();

    // Format the response for frontend consumption
    const formattedResponse = {
      tracking_code: trackingData.tracking_code,
      status: trackingData.status,
      carrier: trackingData.carrier,
      carrier_detail: trackingData.carrier_detail,
      public_url: trackingData.public_url,
      signed_by: trackingData.signed_by,
      weight: trackingData.weight,
      est_delivery_date: trackingData.est_delivery_date,
      shipment_id: trackingData.shipment_id,
      tracking_details: trackingData.tracking_details?.map(detail => ({
        message: detail.message,
        description: detail.description,
        status: detail.status,
        status_detail: detail.status_detail,
        datetime: detail.datetime,
        source: detail.source,
        tracking_location: detail.tracking_location
      })) || [],
      fees: trackingData.fees || [],
      created_at: trackingData.created_at,
      updated_at: trackingData.updated_at
    };

    return new Response(
      JSON.stringify(formattedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in track-shipment-live function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
