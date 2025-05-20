
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers
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
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const requestData = await req.json();
    const shipmentId = requestData.shipment_id;
    
    if (!shipmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing shipment_id parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Retrieving label for shipment ID: ${shipmentId}`);

    // Get the label URL from the database
    const { data, error } = await supabase
      .from('shipment_records')
      .select('label_url, tracking_code')
      .eq('shipment_id', shipmentId)
      .single();
    
    if (error || !data) {
      console.error('Error retrieving label from database:', error);
      
      // If not found in database, try to get it from EasyPost API
      console.log('Label not found in database, trying EasyPost API...');
      
      // Get EasyPost API key
      const apiKey = Deno.env.get('EASYPOST_API_KEY');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'EasyPost API key not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Try to retrieve the shipment from EasyPost
      try {
        const easypostResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!easypostResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve shipment from EasyPost', status: easypostResponse.status }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: easypostResponse.status }
          );
        }
        
        const shipmentData = await easypostResponse.json();
        
        if (shipmentData.postage_label?.label_url) {
          return new Response(
            JSON.stringify({
              labelUrl: shipmentData.postage_label.label_url,
              trackingCode: shipmentData.tracking_code,
              source: 'easypost_api'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: 'No label URL found in EasyPost response' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
      } catch (easypostError) {
        console.error('Error retrieving shipment from EasyPost:', easypostError);
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve shipment', details: easypostError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Return the label URL and tracking code
    return new Response(
      JSON.stringify({
        labelUrl: data.label_url,
        trackingCode: data.tracking_code,
        source: 'database'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-stored-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
