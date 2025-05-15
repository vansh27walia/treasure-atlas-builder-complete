
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
      console.error('Supabase configuration not found');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const requestData = await req.json();
    const { shipment_id } = requestData;
    
    if (!shipment_id) {
      console.error('Missing required parameter: shipment_id');
      return new Response(
        JSON.stringify({ error: 'Missing shipment_id parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Retrieving stored label for shipment ${shipment_id}`);

    // Query the shipment_records table to get the label URL
    const { data: records, error: queryError } = await supabase
      .from('shipment_records')
      .select('label_url, tracking_code, shipment_id, label_format, label_size, is_international')
      .eq('shipment_id', shipment_id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (queryError) {
      console.error('Error querying shipment records:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve shipment record', details: queryError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (records.length === 0 || !records[0].label_url) {
      console.error('No label found for shipment:', shipment_id);
      return new Response(
        JSON.stringify({ error: 'Label not found for this shipment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    const shipmentRecord = records[0];
    console.log('Found shipment record:', shipmentRecord);
    
    // Check if the signed URL is still valid
    try {
      const testResponse = await fetch(shipmentRecord.label_url, { method: 'HEAD' });
      
      if (testResponse.ok) {
        // URL is still valid, return it
        return new Response(
          JSON.stringify({
            labelUrl: shipmentRecord.label_url,
            trackingCode: shipmentRecord.tracking_code,
            shipmentId: shipmentRecord.shipment_id,
            labelFormat: shipmentRecord.label_format || 'PDF',
            labelSize: shipmentRecord.label_size || '4x6',
            isInternational: shipmentRecord.is_international || false,
            message: 'Using existing label URL'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('Signed URL has expired, generating new one');
      }
    } catch (urlTestError) {
      console.error('Error testing URL validity:', urlTestError);
      console.log('Assuming URL is invalid, generating new one');
    }
    
    // If we reach here, the URL is no longer valid or we couldn't test it
    // Try to extract the filename from the URL
    const urlPath = new URL(shipmentRecord.label_url).pathname;
    const pathSegments = urlPath.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    
    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'Failed to extract filename from URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Create a new signed URL
    const twoWeeksInSeconds = 60 * 60 * 24 * 14;
    const { data: signedURLData, error: signedURLError } = await supabase
      .storage
      .from('shipping-labels')
      .createSignedUrl(fileName, twoWeeksInSeconds);
      
    if (signedURLError || !signedURLData?.signedUrl) {
      console.error('Error creating new signed URL:', signedURLError);
      
      // Try to get a public URL as a fallback
      const { data: publicURLData } = await supabase
        .storage
        .from('shipping-labels')
        .getPublicUrl(fileName);
        
      if (publicURLData?.publicUrl) {
        // Update the record with the new URL
        await supabase
          .from('shipment_records')
          .update({ label_url: publicURLData.publicUrl })
          .eq('shipment_id', shipment_id);
          
        return new Response(
          JSON.stringify({
            labelUrl: publicURLData.publicUrl,
            trackingCode: shipmentRecord.tracking_code,
            shipmentId: shipmentRecord.shipment_id,
            labelFormat: shipmentRecord.label_format || 'PDF',
            labelSize: shipmentRecord.label_size || '4x6',
            isInternational: shipmentRecord.is_international || false,
            message: 'Using public URL due to signed URL error'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate new label URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Update the record with the new URL
    await supabase
      .from('shipment_records')
      .update({ label_url: signedURLData.signedUrl })
      .eq('shipment_id', shipment_id);
    
    // Return the new signed URL
    return new Response(
      JSON.stringify({
        labelUrl: signedURLData.signedUrl,
        trackingCode: shipmentRecord.tracking_code,
        shipmentId: shipmentRecord.shipment_id,
        labelFormat: shipmentRecord.label_format || 'PDF',
        labelSize: shipmentRecord.label_size || '4x6',
        isInternational: shipmentRecord.is_international || false,
        message: 'Generated new signed URL'
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
