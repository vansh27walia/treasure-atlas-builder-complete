
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
    // Parse the request body
    const requestData = await req.json();
    const { shipmentId } = requestData;
    
    if (!shipmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing shipmentId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration not found');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the shipment record
    const { data: shipmentData, error: shipmentError } = await supabase
      .from('shipment_records')
      .select('label_url, tracking_code, shipment_id')
      .eq('shipment_id', shipmentId)
      .single();

    if (shipmentError || !shipmentData) {
      console.error('Error retrieving shipment record:', shipmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve shipment record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if we need to create a fresh signed URL for the label
    if (shipmentData.label_url && shipmentData.label_url.includes('storage.googleapis.com')) {
      // URL appears to be from storage - extract the path
      const urlParts = shipmentData.label_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (fileName) {
        // Create a fresh signed URL with 24 hours expiration
        const { data: signedURLData, error: signedURLError } = await supabase
          .storage
          .from('shipping-labels')
          .createSignedUrl(fileName, 60 * 60 * 24); // 24 hours
          
        if (!signedURLError && signedURLData?.signedUrl) {
          // Update the label_url in the database
          const { error: updateError } = await supabase
            .from('shipment_records')
            .update({ label_url: signedURLData.signedUrl })
            .eq('shipment_id', shipmentId);
            
          if (updateError) {
            console.error('Error updating label URL:', updateError);
          }
          
          // Return the updated URL
          return new Response(
            JSON.stringify({
              labelUrl: signedURLData.signedUrl,
              trackingCode: shipmentData.tracking_code,
              shipmentId: shipmentData.shipment_id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // If we can't create a fresh signed URL, return the existing label URL
    return new Response(
      JSON.stringify({
        labelUrl: shipmentData.label_url,
        trackingCode: shipmentData.tracking_code,
        shipmentId: shipmentData.shipment_id
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
