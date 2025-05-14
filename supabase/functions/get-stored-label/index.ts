
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
      return new Response(
        JSON.stringify({ error: 'Missing shipment ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Try to find the shipment record in the database
    const { data: shipmentRecord, error: shipmentError } = await supabase
      .from('shipment_records')
      .select('*')
      .eq('shipment_id', shipment_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (shipmentError) {
      console.error('Error fetching shipment record:', shipmentError);
      
      // If we can't find in database, try to find the label in storage
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from('shipping-labels')
        .list('', {
          search: `label_${shipment_id}`
        });
        
      if (storageError || !storageFiles || storageFiles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Label not found', details: 'No record found in database or storage' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      // Found files in storage, get the signed URL for the most recent one
      const mostRecentFile = storageFiles.sort((a, b) => 
        (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime())
      )[0];
      
      const { data: signedURLData, error: signedURLError } = await supabase
        .storage
        .from('shipping-labels')
        .createSignedUrl(mostRecentFile.name, 60 * 60 * 24 * 14); // 2 weeks
        
      if (signedURLError) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate signed URL', details: signedURLError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({
          labelUrl: signedURLData.signedUrl,
          message: 'Retrieved from storage',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If we found a record and it has a label URL
    if (shipmentRecord && shipmentRecord.label_url) {
      // Check if the URL is still valid (not expired)
      try {
        const response = await fetch(shipmentRecord.label_url, {
          method: 'HEAD',
        });
        
        if (response.ok) {
          // URL is still valid, return it
          return new Response(
            JSON.stringify({
              labelUrl: shipmentRecord.label_url,
              trackingCode: shipmentRecord.tracking_code,
              shipmentId: shipmentRecord.shipment_id,
              message: 'Retrieved existing label from database'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fetchError) {
        console.error('Error testing label URL:', fetchError);
        // URL might be expired, continue to regenerate
      }
    }
    
    // If the URL is expired or not valid, get the EasyPost API key to regenerate
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured for regeneration' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get the shipment details from EasyPost to get the label URL
    const shipmentResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!shipmentResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve shipment from EasyPost',
          status: shipmentResponse.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    const shipmentData = await shipmentResponse.json();
    
    if (!shipmentData.postage_label?.label_url) {
      return new Response(
        JSON.stringify({ error: 'Shipment has no label URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get the original label URL from EasyPost
    const labelURL = shipmentData.postage_label.label_url;
    
    try {
      // Download the label
      const labelResponse = await fetch(labelURL);
      if (!labelResponse.ok) {
        throw new Error('Failed to download label from EasyPost');
      }
      
      // Convert to blob and buffer
      const labelBlob = await labelResponse.blob();
      const labelArrayBuffer = await labelBlob.arrayBuffer();
      const labelBuffer = new Uint8Array(labelArrayBuffer);
      
      // Generate a unique filename for the label
      const fileName = `label_${shipment_id}_refreshed_${Date.now()}.pdf`;
      
      // Upload to storage
      const { error: uploadError } = await supabase
        .storage
        .from('shipping-labels')
        .upload(fileName, labelBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Error uploading refreshed label:', uploadError);
        return new Response(
          JSON.stringify({
            labelUrl: labelURL,
            trackingCode: shipmentData.tracking_code,
            shipmentId: shipment_id,
            message: 'Using original EasyPost URL due to storage error'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Create signed URL
      const { data: signedURLData, error: signedURLError } = await supabase
        .storage
        .from('shipping-labels')
        .createSignedUrl(fileName, 60 * 60 * 24 * 14); // 2 weeks
        
      if (signedURLError) {
        return new Response(
          JSON.stringify({
            labelUrl: labelURL,
            trackingCode: shipmentData.tracking_code,
            shipmentId: shipment_id,
            message: 'Using original EasyPost URL due to signed URL error'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Update the shipment record in database
      if (shipmentRecord) {
        await supabase
          .from('shipment_records')
          .update({
            label_url: signedURLData.signedUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', shipmentRecord.id);
      } else {
        // Insert new record if none exists
        await supabase
          .from('shipment_records')
          .insert({
            shipment_id: shipment_id,
            tracking_code: shipmentData.tracking_code,
            label_url: signedURLData.signedUrl,
            status: 'refreshed',
            carrier: shipmentData.selected_rate?.carrier,
            service: shipmentData.selected_rate?.service,
            created_at: new Date().toISOString()
          });
      }
      
      return new Response(
        JSON.stringify({
          labelUrl: signedURLData.signedUrl,
          trackingCode: shipmentData.tracking_code,
          shipmentId: shipment_id,
          message: 'Refreshed label successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error refreshing label:', error);
      return new Response(
        JSON.stringify({
          labelUrl: labelURL,
          trackingCode: shipmentData.tracking_code,
          shipmentId: shipment_id,
          message: 'Using original EasyPost URL due to refresh error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in get-stored-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
