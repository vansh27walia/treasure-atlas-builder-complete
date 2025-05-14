
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
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Required configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const { labelUrl, format, shipmentId } = await req.json();
    
    if (!labelUrl || !format || !shipmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Converting label format to ${format.toUpperCase()} for shipment ${shipmentId}`);
    
    // Check if we've already converted and stored this format
    const storageKey = `label_${shipmentId}_${format}.${format}`;
    const { data: existingFile } = await supabase
      .storage
      .from('shipping-labels')
      .getPublicUrl(storageKey);
      
    if (existingFile?.publicUrl) {
      console.log(`Found existing converted label: ${existingFile.publicUrl}`);
      return new Response(
        JSON.stringify({ convertedUrl: existingFile.publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // We need to convert the label using EasyPost API
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/label`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_format: format.toUpperCase()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('EasyPost API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to convert label format',
          details: errorData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }
    
    const labelData = await response.json();
    if (!labelData.label_url) {
      return new Response(
        JSON.stringify({ error: 'No label URL found in EasyPost response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Download the converted label
    const labelResponse = await fetch(labelData.label_url);
    if (!labelResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to download converted label' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: labelResponse.status }
      );
    }
    
    // Convert the label to a blob and then to a buffer
    const labelBlob = await labelResponse.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Upload the converted label to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shipping-labels')
      .upload(storageKey, labelBuffer, {
        contentType: format === 'pdf' ? 'application/pdf' : 
                    format === 'png' ? 'image/png' : 
                    'application/zpl',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Error uploading converted label:', uploadError);
      
      // If storage upload fails, still return the original EasyPost URL
      return new Response(
        JSON.stringify({ 
          convertedUrl: labelData.label_url,
          message: 'Using original EasyPost URL due to storage error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get a public URL for the uploaded file
    const { data: publicUrlData } = await supabase
      .storage
      .from('shipping-labels')
      .getPublicUrl(storageKey);
    
    if (!publicUrlData?.publicUrl) {
      return new Response(
        JSON.stringify({ 
          convertedUrl: labelData.label_url,
          message: 'Using original EasyPost URL as public URL could not be generated'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Successfully converted label to ${format.toUpperCase()}: ${publicUrlData.publicUrl}`);
    
    // Return the label URL
    return new Response(
      JSON.stringify({
        convertedUrl: publicUrlData.publicUrl,
        originalUrl: labelUrl,
        format: format
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in convert-label-format function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
