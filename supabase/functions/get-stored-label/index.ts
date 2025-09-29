
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
    const { shipment_id, label_format, file_format } = requestData;
    
    console.log('Get stored label request:', requestData);
    
    if (!shipment_id) {
      return new Response(
        JSON.stringify({ error: 'Missing shipment ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Try to retrieve the shipment record
    const { data: shipmentRecord, error: recordError } = await supabase
      .from('shipment_records')
      .select('*')
      .eq('shipment_id', shipment_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recordError || !shipmentRecord) {
      console.error('Error retrieving shipment record:', recordError);
      return new Response(
        JSON.stringify({ error: 'Shipment record not found', details: recordError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    console.log('Found shipment record:', shipmentRecord);

    // Check if the requested format matches the stored one, if not we need to regenerate
    const storedFormat = shipmentRecord.label_format || 'PDF';
    const storedSize = shipmentRecord.label_size || '4x6';
    const storedFileFormat = shipmentRecord.file_format || 'pdf';
    
    const requestedFormat = label_format || storedFormat;
    const requestedFileFormat = file_format || storedFileFormat;
    
    if (requestedFormat === storedFormat && requestedFileFormat === storedFileFormat && shipmentRecord.label_url) {
      // The formats match, return the stored URL
      return new Response(
        JSON.stringify({
          labelUrl: shipmentRecord.label_url,
          trackingCode: shipmentRecord.tracking_code,
          shipmentId: shipment_id,
          fileFormat: storedFileFormat
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // The formats don't match, we need to regenerate the label
    console.log('Regenerating label with new format', {
      requested: { format: requestedFormat, fileFormat: requestedFileFormat },
      stored: { format: storedFormat, fileFormat: storedFileFormat }
    });
    
    // Call the create-label function with the new format
    const createLabelResponse = await fetch(new URL('/functions/v1/create-label', supabaseUrl).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        shipmentId: shipment_id,
        rateId: shipmentRecord.rate_id,
        options: {
          label_format: requestedFormat,
          label_size: requestedFormat, // Size is the same as format in our case
          file_format: requestedFileFormat
        }
      })
    });
    
    if (!createLabelResponse.ok) {
      const errorData = await createLabelResponse.json();
      console.error('Error regenerating label:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to regenerate label', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: createLabelResponse.status }
      );
    }
    
    const regeneratedLabel = await createLabelResponse.json();
    
    return new Response(
      JSON.stringify({
        labelUrl: regeneratedLabel.labelUrl,
        trackingCode: regeneratedLabel.trackingCode || shipmentRecord.tracking_code,
        shipmentId: shipment_id,
        fileFormat: requestedFileFormat
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
