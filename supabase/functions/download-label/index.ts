
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shipmentReference = url.searchParams.get('shipment');
    const labelType = url.searchParams.get('type') || 'pdf';
    const trackingCode = url.searchParams.get('tracking');
    const forceDownload = url.searchParams.get('download') === 'true';
    
    console.log('Download request received:', { shipmentReference, labelType, trackingCode, forceDownload });

    if (!shipmentReference && !trackingCode) {
      return new Response(
        JSON.stringify({ error: 'Missing shipment reference or tracking code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
        console.log('User authenticated:', userId);
      } catch (error) {
        console.log('Could not authenticate user:', error);
      }
    }

    // Query label file by shipment reference or tracking code
    let query = supabase
      .from('shipping_label_files')
      .select('*')
      .eq('label_type', labelType);

    if (shipmentReference) {
      query = query.eq('shipment_id', shipmentReference);
    } else if (trackingCode) {
      query = query.eq('tracking_code', trackingCode);
    }

    // If user is authenticated, only show their labels
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: labelFiles, error } = await query.limit(1);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!labelFiles || labelFiles.length === 0) {
      console.log('No label files found for query');
      return new Response(
        JSON.stringify({ error: 'Label not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const labelFile = labelFiles[0];
    console.log('Found label file:', labelFile.id, 'URL:', labelFile.supabase_url);

    // For direct download, return the file content with proper headers
    if (forceDownload) {
      try {
        console.log('Fetching file from:', labelFile.supabase_url);
        
        // Fetch the file from Supabase storage using the service role key
        const fileResponse = await fetch(labelFile.supabase_url, {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        });
        
        if (!fileResponse.ok) {
          console.error('Failed to fetch file:', fileResponse.status, fileResponse.statusText);
          throw new Error(`Failed to fetch file: ${fileResponse.status}`);
        }
        
        const fileBlob = await fileResponse.blob();
        console.log('File fetched successfully, size:', fileBlob.size);
        
        if (fileBlob.size === 0) {
          throw new Error('File is empty');
        }
        
        const contentType = labelType === 'pdf' ? 'application/pdf' : 
                           labelType === 'png' ? 'image/png' : 'text/plain';
        
        const filename = `shipping_label_${trackingCode || shipmentReference || 'download'}.${labelType}`;
        
        // Convert blob to array buffer for response
        const arrayBuffer = await fileBlob.arrayBuffer();
        
        return new Response(arrayBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': arrayBuffer.byteLength.toString(),
            'Cache-Control': 'no-cache'
          }
        });
      } catch (error) {
        console.error('Error fetching file:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch file', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Return label metadata
    const response = {
      shipment_id: labelFile.shipment_id,
      tracking_code: labelFile.tracking_code,
      label_type: labelFile.label_type,
      download_url: labelFile.supabase_url,
      file_size: labelFile.file_size,
      created_at: labelFile.created_at
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in download-label function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Download Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
