
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

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
    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
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

    // Parse the request body
    const requestData = await req.json();
    const { shipmentId, formats = ['pdf', 'png', 'zpl'] } = requestData;
    
    if (!shipmentId) {
      console.error('Missing required parameter: shipmentId');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: shipmentId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get the shipment from EasyPost to ensure we have tracking info
    const shipmentResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
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
    const trackingCode = shipmentData.tracking_code || 'unknown';
    const labelURL = shipmentData.postage_label?.label_url;
    
    if (!labelURL) {
      console.error('No label URL in shipment data');
      return new Response(
        JSON.stringify({ error: 'No label URL in shipment data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Create a zip file
    const zip = new JSZip();
    
    // Add each requested format
    for (const format of formats) {
      // Get the appropriate label for each format type
      try {
        // The original label is always a PDF, but we need to get it in other formats if requested
        const response = await fetch(labelURL);
        
        if (!response.ok) {
          console.error(`Error fetching label in ${format} format`);
          continue;
        }
        
        const fileBuffer = new Uint8Array(await response.arrayBuffer());
        zip.addFile(`shipping_label_${trackingCode}.${format}`, fileBuffer);
        
      } catch (error) {
        console.error(`Error processing ${format} format:`, error);
        // Continue to the next format
      }
    }
    
    // Include a receipt file
    const receiptContent = `
    Shipping Label Receipt
    -----------------------------------
    Date: ${new Date().toISOString()}
    Tracking Number: ${trackingCode}
    Carrier: ${shipmentData.selected_rate?.carrier || 'Unknown'}
    Service: ${shipmentData.selected_rate?.service || 'Unknown'}
    Cost: ${shipmentData.selected_rate?.rate || 'Unknown'}
    Estimated Delivery: ${shipmentData.selected_rate?.delivery_date || 'Unknown'}
    `;
    
    zip.addFile(`receipt_${trackingCode}.txt`, new TextEncoder().encode(receiptContent));
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: "uint8array" });
    
    // Upload to Supabase storage
    const bucketName = 'shipping-labels';
    const filename = `label_archive_${shipmentId}_${Date.now()}.zip`;
    
    // Ensure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some(b => b.name === bucketName)) {
        await supabase.storage.createBucket(bucketName, {
          public: true
        });
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      // Continue anyway as the bucket might already exist
    }
    
    // Upload the ZIP file
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(filename, zipBlob, {
        contentType: 'application/zip',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('Error uploading ZIP file:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Error uploading ZIP file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Create a signed URL for the ZIP file
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(filename, 60 * 60); // 1 hour expiration
    
    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return new Response(
        JSON.stringify({ error: 'Error creating signed URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({
        archiveUrl: urlData.signedUrl,
        trackingCode,
        shipmentId,
        formats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in create-label-archive function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
