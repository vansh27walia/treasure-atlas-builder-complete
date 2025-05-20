
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
    const { shipment_id, label_format = '4x6', file_type = 'pdf' } = requestData;
    
    if (!shipment_id) {
      console.error('Missing required parameter: shipment_id');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: shipment_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // First, try to find the record in our database
    const { data: records, error: dbError } = await supabase
      .from('shipment_records')
      .select('*')
      .eq('shipment_id', shipment_id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (dbError) {
      console.error('Error fetching from database:', dbError);
      // Continue to EasyPost
    }
    
    // If we found a record with a valid label URL and matching format, return it
    if (records && records.length > 0 && records[0].label_url && 
        records[0].label_size === label_format && 
        records[0].file_type === file_type) {
      return new Response(
        JSON.stringify({
          labelUrl: records[0].label_url,
          trackingCode: records[0].tracking_code,
          shipmentId: records[0].shipment_id,
          source: 'database'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no matching record was found or the format is different, regenerate from EasyPost
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get the shipment details from EasyPost
    const shipmentResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!shipmentResponse.ok) {
      console.error('Error fetching shipment from EasyPost');
      return new Response(
        JSON.stringify({ error: 'Error fetching shipment from EasyPost' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const shipmentData = await shipmentResponse.json();
    
    // Check if the shipment has a postage label
    if (!shipmentData.postage_label?.label_url) {
      console.error('No label URL in shipment data');
      return new Response(
        JSON.stringify({ error: 'No label URL in shipment data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    const labelURL = shipmentData.postage_label.label_url;
    const trackingCode = shipmentData.tracking_code || 'unknown';
    
    // Download the label from EasyPost
    const labelResponse = await fetch(labelURL);
    
    if (!labelResponse.ok) {
      console.error('Error downloading label from EasyPost');
      return new Response(
        JSON.stringify({ error: 'Error downloading label from EasyPost' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Convert the label to a buffer
    const labelBlob = await labelResponse.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Generate a unique filename for the label
    const fileName = `label_${shipment_id}_${file_type}_${Date.now()}.${file_type}`;
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shipping-labels')
      .upload(fileName, labelBuffer, {
        contentType: file_type === 'pdf' ? 'application/pdf' : 
                    file_type === 'png' ? 'image/png' : 
                    file_type === 'zpl' ? 'application/octet-stream' : 
                    'application/pdf',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading label to storage:', uploadError);
      
      // If upload fails, return the original EasyPost URL
      return new Response(
        JSON.stringify({
          labelUrl: labelURL,
          trackingCode,
          shipmentId: shipment_id,
          source: 'easypost'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a signed URL for the label
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('shipping-labels')
      .createSignedUrl(fileName, 60 * 60 * 24 * 14); // 2 weeks
    
    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      
      // If we can't create a signed URL, return the original EasyPost URL
      return new Response(
        JSON.stringify({
          labelUrl: labelURL,
          trackingCode,
          shipmentId: shipment_id,
          source: 'easypost'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Save the retrieved label in the database
    const { error: insertError } = await supabase
      .from('shipment_records')
      .insert({
        shipment_id,
        tracking_code: trackingCode,
        label_url: urlData.signedUrl,
        label_size: label_format,
        file_type,
        status: 'retrieved'
      });
    
    if (insertError) {
      console.error('Error saving to database:', insertError);
      // Continue anyway
    }
    
    return new Response(
      JSON.stringify({
        labelUrl: urlData.signedUrl,
        trackingCode,
        shipmentId: shipment_id,
        source: 'regenerated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in get-stored-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
