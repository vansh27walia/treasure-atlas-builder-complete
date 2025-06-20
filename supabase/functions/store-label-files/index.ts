
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const requestData = await req.json();
    const { shipmentId, labelUrl, trackingCode, formats = ['pdf', 'png', 'zpl'] } = requestData;

    if (!shipmentId || !labelUrl || !trackingCode) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`Storing label files for shipment ${shipmentId}`);

    const storedFiles = {};

    // Store each format
    for (const format of formats) {
      try {
        const response = await fetch(labelUrl);
        if (!response.ok) continue;

        const fileBuffer = await response.arrayBuffer();
        const fileName = `${trackingCode}_${shipmentId}.${format}`;
        const filePath = `labels/${user.id}/${fileName}`;

        // Store in Supabase storage
        const { error: uploadError } = await supabaseClient.storage
          .from('shipping-labels')
          .upload(filePath, fileBuffer, {
            contentType: format === 'pdf' ? 'application/pdf' : 
                        format === 'png' ? 'image/png' : 'text/plain',
            upsert: true
          });

        if (!uploadError) {
          const { data: urlData } = supabaseClient.storage
            .from('shipping-labels')
            .getPublicUrl(filePath);
          
          storedFiles[format] = urlData.publicUrl;

          // Save to database
          await supabaseClient
            .from('shipping_label_files')
            .insert({
              user_id: user.id,
              shipment_id: shipmentId,
              tracking_code: trackingCode,
              label_type: format,
              file_path: filePath,
              supabase_url: urlData.publicUrl
            });
        }
      } catch (error) {
        console.error(`Error storing ${format} file:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      storedFiles,
      message: `Stored ${Object.keys(storedFiles).length} file formats`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in store-label-files function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
