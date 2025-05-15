
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
    const { shipmentId, rateId, options = {} } = requestData;
    
    if (!shipmentId || !rateId) {
      console.error('Missing required parameters', { shipmentId, rateId });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Creating shipping-to label for shipment ${shipmentId} with rate ${rateId}`);
    console.log(`Label options:`, options);

    try {
      // Check if storage bucket exists, create if not
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .listBuckets();
      
      const bucketExists = bucketData?.some(bucket => bucket.name === 'shipping-labels');
      
      if (!bucketExists) {
        console.log('Creating shipping-labels bucket');
        const { error } = await supabase
          .storage
          .createBucket('shipping-labels', {
            public: false,
            fileSizeLimit: 10485760, // 10MB limit for label files
          });
          
        if (error) {
          console.error('Error creating bucket:', error);
          throw new Error('Failed to create storage bucket');
        }
      }
    } catch (bucketError) {
      console.error('Error checking/creating bucket:', bucketError);
      // Continue anyway, the bucket might exist but we might not have permission to list buckets
    }

    // Create request body for EasyPost with label format options
    const buyOptions = {
      rate: { id: rateId }
    };
    
    // If label format and size are specified, add them to the request
    if (options.label_format || options.label_size) {
      buyOptions.label_format = options.label_format || "PDF";
      buyOptions.label_size = options.label_size || "4x6";
    }

    // Buy the label with EasyPost API
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buyOptions),
    });

    const data = await response.json();
    
    // Check for API errors
    if (!response.ok) {
      console.error('EasyPost API error:', JSON.stringify(data, null, 2));
      
      // If postage already exists, try to get the existing label
      if (data.error?.code === 'SHIPMENT.POSTAGE.EXISTS') {
        console.log('Postage already exists, retrieving existing label');
        
        // Get the shipment details to get the label URL
        const shipmentResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!shipmentResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve existing shipment', details: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        
        const shipmentData = await shipmentResponse.json();
        if (shipmentData.postage_label?.label_url) {
          // We got the existing label URL, return it
          return new Response(
            JSON.stringify({
              labelUrl: shipmentData.postage_label.label_url,
              trackingCode: shipmentData.tracking_code,
              shipmentId: shipmentData.id,
              message: 'Retrieved existing label'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to create label', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Download the label PDF from EasyPost
    const labelURL = data.postage_label.label_url;
    console.log(`Label URL from EasyPost: ${labelURL}`);
    
    const labelResponse = await fetch(labelURL);
    if (!labelResponse.ok) {
      console.error('Failed to download label from EasyPost');
      throw new Error('Failed to download label from EasyPost');
    }
    
    // Convert the label to a blob
    const labelBlob = await labelResponse.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Generate a unique filename for the label
    const fileName = `shipping_to_label_${shipmentId}_${Date.now()}.pdf`;
    
    // Upload the label to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shipping-labels')
      .upload(fileName, labelBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading label to storage:', uploadError);
      
      // If storage upload fails, still return the original EasyPost label URL
      return new Response(
        JSON.stringify({ 
          labelUrl: labelURL,
          trackingCode: data.tracking_code,
          shipmentId: data.id,
          message: 'Using original EasyPost URL due to storage error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a signed URL for the label with 2 weeks expiration
    const twoWeeksInSeconds = 60 * 60 * 24 * 14;
    const { data: signedURLData, error: signedURLError } = await supabase
      .storage
      .from('shipping-labels')
      .createSignedUrl(fileName, twoWeeksInSeconds);
      
    if (signedURLError) {
      console.error('Error creating signed URL:', signedURLError);
      
      // If we can't create a signed URL, return the original EasyPost URL
      return new Response(
        JSON.stringify({ 
          labelUrl: labelURL,
          trackingCode: data.tracking_code,
          shipmentId: data.id,
          message: 'Using original EasyPost URL due to signed URL error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Save the shipping record in the database
    const { error: dbError } = await supabase
      .from('shipment_records')
      .insert({
        shipment_id: shipmentId,
        rate_id: rateId,
        tracking_code: data.tracking_code,
        label_url: signedURLData.signedUrl,
        status: 'created',
        carrier: data.selected_rate?.carrier,
        service: data.selected_rate?.service,
        delivery_days: data.selected_rate?.delivery_days || null,
        charged_rate: data.selected_rate?.rate || null,
        easypost_rate: data.selected_rate?.rate || null,
        currency: data.selected_rate?.currency || 'USD',
        label_format: options.label_format || "PDF",
        label_size: options.label_size || "4x6",
        is_shipping_to: true,
        created_at: new Date().toISOString()
      });
      
    if (dbError) {
      console.error('Error saving shipment record:', dbError);
      // Continue anyway as we already have the label URL
    }

    // Return the label information with our internally stored URL
    return new Response(
      JSON.stringify({
        labelUrl: signedURLData.signedUrl || labelURL, // Fall back to EasyPost URL if needed
        trackingCode: data.tracking_code,
        shipmentId: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-shipping-to-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
