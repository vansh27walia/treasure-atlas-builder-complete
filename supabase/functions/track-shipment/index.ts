
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_number } = await req.json();
    
    if (!tracking_number) {
      return new Response(
        JSON.stringify({ error: 'Tracking number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const easypostApiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!easypostApiKey) {
      return new Response(
        JSON.stringify({ error: 'EasyPost API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Tracking shipment:', tracking_number);

    // Call EasyPost API to get tracker info
    const easypostResponse = await fetch(`https://api.easypost.com/v2/trackers/${tracking_number}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${easypostApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!easypostResponse.ok) {
      if (easypostResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Tracking number not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      throw new Error(`EasyPost API error: ${easypostResponse.status}`);
    }

    const trackerData = await easypostResponse.json();
    console.log('EasyPost tracker response:', trackerData);

    // Transform the data to match our frontend expectations
    const transformedData = {
      tracking_code: trackerData.tracking_code,
      carrier: trackerData.carrier,
      status: trackerData.status,
      est_delivery_date: trackerData.est_delivery_date,
      signed_by: trackerData.signed_by,
      weight: trackerData.weight,
      public_url: trackerData.public_url,
      tracking_details: trackerData.tracking_details?.map((detail: any) => ({
        description: detail.message || detail.description,
        location: detail.tracking_location?.city ? 
          `${detail.tracking_location.city}, ${detail.tracking_location.state}` : 
          detail.tracking_location?.zip || 'Unknown',
        timestamp: detail.datetime,
        status: detail.status
      })) || [],
      shipment_id: trackerData.shipment_id,
      created_at: trackerData.created_at,
      updated_at: trackerData.updated_at
    };

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in track-shipment function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track shipment', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
