
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoreLabelsRequest {
  shipmentId?: string;
  batchId?: string;
  labelUrls: {
    pdf?: string;
    png?: string;
    zpl?: string;
    epl?: string;
  };
  type: 'individual' | 'batch';
  trackingCode?: string;
  format?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      shipmentId, 
      batchId, 
      labelUrls, 
      type, 
      trackingCode, 
      format 
    }: StoreLabelsRequest = await req.json();

    console.log('Store label files request:', { 
      shipmentId, 
      batchId, 
      labelUrls, 
      type, 
      trackingCode, 
      format 
    });

    if (type === 'individual') {
      if (!shipmentId) {
        throw new Error('Shipment ID is required for individual labels');
      }

      // Store individual label files
      const labelFiles = [];
      
      for (const [labelFormat, url] of Object.entries(labelUrls)) {
        if (url) {
          labelFiles.push({
            shipment_id: shipmentId,
            tracking_code: trackingCode,
            label_type: labelFormat,
            supabase_url: url,
            file_path: `labels/${shipmentId}/${labelFormat}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      if (labelFiles.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('shipping_label_files')
          .insert(labelFiles);

        if (insertError) {
          console.error('Error inserting label files:', insertError);
          throw insertError;
        }
      }

      console.log(`Stored ${labelFiles.length} individual label files for shipment ${shipmentId}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Stored ${labelFiles.length} label files`,
          shipmentId,
          storedFiles: labelFiles.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (type === 'batch') {
      if (!batchId) {
        throw new Error('Batch ID is required for batch labels');
      }

      // Store batch label files
      const batchFiles = [];
      
      for (const [labelFormat, url] of Object.entries(labelUrls)) {
        if (url) {
          batchFiles.push({
            shipment_id: `batch_${batchId}`,
            tracking_code: `BATCH_${batchId}`,
            label_type: `batch_${labelFormat}`,
            supabase_url: url,
            file_path: `batch_labels/${batchId}/${labelFormat}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      if (batchFiles.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('shipping_label_files')
          .insert(batchFiles);

        if (insertError) {
          console.error('Error inserting batch files:', insertError);
          throw insertError;
        }
      }

      // Also create/update batch record
      const { error: batchError } = await supabaseClient
        .from('bulk_label_batches')
        .upsert({
          id: batchId,
          batch_reference: `BATCH_${batchId}`,
          total_labels: Object.keys(labelUrls).length,
          zip_file_url: labelUrls.pdf, // Use PDF as primary
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (batchError) {
        console.error('Error upserting batch record:', batchError);
      }

      console.log(`Stored ${batchFiles.length} batch label files for batch ${batchId}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Stored ${batchFiles.length} batch files`,
          batchId,
          storedFiles: batchFiles.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    throw new Error('Invalid storage type specified');

  } catch (error) {
    console.error('Error in store-label-files function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to store label files',
        details: error
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
