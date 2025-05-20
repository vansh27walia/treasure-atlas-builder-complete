
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { JSZip } from "https://esm.sh/jszip@3.10.1";

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
    const { shipmentId, formats = ['pdf', 'png', 'zpl'] } = await req.json();
    
    if (!shipmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing shipment ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get shipment details for the file name
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipment_records')
      .select('tracking_code')
      .eq('shipment_id', shipmentId)
      .limit(1)
      .single();
      
    if (shipmentError && shipmentError.code !== 'PGRST116') {
      console.error('Error fetching shipment:', shipmentError);
    }

    const trackingCode = shipment?.tracking_code || shipmentId;
    
    // Create a new JSZip instance
    const zip = new JSZip();
    const labelPromises = [];

    // Get labels in all requested formats
    for (const format of formats) {
      const promise = fetchLabelInFormat(shipmentId, format, supabase)
        .then(fileData => {
          if (fileData) {
            // Add the file to the zip archive
            zip.file(`shipping_label_${trackingCode}_${format}.${format}`, fileData, { binary: true });
            return true;
          }
          return false;
        })
        .catch(err => {
          console.error(`Error fetching ${format} label:`, err);
          return false;
        });
        
      labelPromises.push(promise);
    }
    
    await Promise.all(labelPromises);
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipBuffer = await zipBlob.arrayBuffer();
    
    // Upload the zip file to Supabase Storage
    const zipFileName = `label_archive_${shipmentId}_${Date.now()}.zip`;
    
    // Ensure the bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some(b => b.name === 'shipping-labels')) {
        await supabase.storage.createBucket('shipping-labels', {
          public: true
        });
        console.log('Created shipping-labels bucket');
      }
    } catch (error) {
      console.error('Error checking/creating bucket:', error);
      // Continue anyway as bucket might already exist
    }
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shipping-labels')
      .upload(zipFileName, zipBuffer, {
        contentType: 'application/zip',
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading zip to storage:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create archive' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Create a signed URL for the zip
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('shipping-labels')
      .createSignedUrl(zipFileName, 60 * 60); // 1 hour expiry
      
    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return new Response(
        JSON.stringify({ error: 'Failed to create download link' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        archiveUrl: urlData.signedUrl,
        formats: formats,
        fileName: `shipping_labels_${trackingCode}.zip`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in create-label-archive function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to fetch a label in a specific format
async function fetchLabelInFormat(shipmentId, format, supabase) {
  try {
    // First try to get the label from our database
    const { data: labelRecord, error: dbError } = await supabase
      .from('shipment_records')
      .select('label_url')
      .eq('shipment_id', shipmentId)
      .eq('file_type', format)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (!dbError && labelRecord?.label_url) {
      // Fetch the label content from the URL
      const response = await fetch(labelRecord.label_url);
      if (response.ok) {
        return new Uint8Array(await response.arrayBuffer());
      }
    }
    
    // If not found in database, generate a new one via the get-stored-label function
    const { data, error } = await supabase.functions.invoke('get-stored-label', {
      body: { 
        shipment_id: shipmentId,
        file_type: format
      }
    });
    
    if (error || !data?.labelUrl) {
      console.error(`Error getting ${format} label:`, error || 'No label URL returned');
      return null;
    }
    
    // Fetch the label content from the URL
    const response = await fetch(data.labelUrl);
    if (!response.ok) {
      console.error(`Error downloading ${format} label: ${response.status}`);
      return null;
    }
    
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    console.error(`Error fetching ${format} label:`, error);
    return null;
  }
}
