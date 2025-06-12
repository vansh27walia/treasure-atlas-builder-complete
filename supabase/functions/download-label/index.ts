
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
      return new Response(
        JSON.stringify({ error: 'Label not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const labelFile = labelFiles[0];

    // For direct download, return the file content with proper headers
    if (forceDownload) {
      try {
        // Fetch the file from Supabase storage
        const fileResponse = await fetch(labelFile.supabase_url);
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file: ${fileResponse.status}`);
        }
        
        const fileBlob = await fileResponse.blob();
        const contentType = labelType === 'pdf' ? 'application/pdf' : 
                           labelType === 'png' ? 'image/png' : 'text/plain';
        
        return new Response(fileBlob, {
          headers: {
            ...corsHeaders,
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="shipping_label_${trackingCode || 'download'}.${labelType}"`,
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
        console.error('Error fetching file:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch file' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // For redirect download
    if (url.searchParams.get('redirect') === 'true') {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': labelFile.supabase_url
        }
      });
    }

    // Return label metadata with all available formats
    const response = {
      shipment_id: labelFile.shipment_id,
      tracking_code: labelFile.tracking_code,
      label_type: labelFile.label_type,
      download_url: labelFile.supabase_url,
      file_size: labelFile.file_size,
      created_at: labelFile.created_at,
      // Add direct download endpoints for different formats
      download_endpoints: {
        pdf: `/functions/v1/download-label?shipment=${shipmentReference}&type=pdf&download=true`,
        png: `/functions/v1/download-label?shipment=${shipmentReference}&type=png&download=true`,
        zpl: `/functions/v1/download-label?shipment=${shipmentReference}&type=zpl&download=true`
      }
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
