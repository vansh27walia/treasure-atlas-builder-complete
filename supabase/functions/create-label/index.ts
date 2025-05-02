
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
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

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

    // Parse the request body to get shipment id and rate id
    const { shipmentId, rateId } = await req.json();
    
    if (!shipmentId || !rateId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Buy the label with EasyPost API
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId }
      }),
    });

    const data = await response.json();
    
    // Check for API errors
    if (!response.ok) {
      console.error('EasyPost API error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to create label', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Download the label PDF from EasyPost
    const labelURL = data.postage_label.label_url;
    const labelResponse = await fetch(labelURL);
    if (!labelResponse.ok) {
      throw new Error('Failed to download label from EasyPost');
    }
    
    // Convert the label to a blob
    const labelBlob = await labelResponse.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Generate a unique filename for the label
    const fileName = `label_${shipmentId}_${Date.now()}.pdf`;
    
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
      return new Response(
        JSON.stringify({ error: 'Failed to store label', details: uploadError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
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
      return new Response(
        JSON.stringify({ error: 'Failed to create label URL', details: signedURLError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
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
        created_at: new Date().toISOString()
      });
      
    if (dbError) {
      console.error('Error saving shipment record:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save shipment record', details: dbError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Configure a scheduled function to delete the label after 2 weeks
    // This would ideally be implemented with a cron job or through database triggers
    // For now, we'll rely on the signed URL expiration

    // Return the label information with our internally stored URL
    return new Response(
      JSON.stringify({
        labelUrl: signedURLData.signedUrl,
        trackingCode: data.tracking_code,
        shipmentId: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
