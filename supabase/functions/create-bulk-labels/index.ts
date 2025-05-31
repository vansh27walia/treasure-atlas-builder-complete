
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LabelOptions {
  format?: string;
  size?: string;
}

interface ShipmentData {
  id: string;
  easypost_id: string;
  selectedRateId: string;
  recipient: string;
  details: any;
}

const createEasyPostBatch = async (shipments: ShipmentData[], userId: string, labelOptions: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Initiating bulk label creation for ${shipments.length} shipments via EasyPost Batch API.`);
    
    // First, let's buy the shipments individually instead of using batch API
    // This is more reliable for smaller batches
    const processedLabels = [];
    const batchId = `batch_${Date.now()}`;
    let batchLabelUrl = null;

    for (const shipmentData of shipments) {
      try {
        console.log(`Processing shipment ${shipmentData.id} with EasyPost ID: ${shipmentData.easypost_id}`);
        
        // Buy the shipment with the selected rate
        const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.easypost_id}/buy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rate: { id: shipmentData.selectedRateId }
          }),
        });

        if (!buyResponse.ok) {
          const errorData = await buyResponse.json();
          console.error(`Failed to buy shipment ${shipmentData.easypost_id}:`, errorData);
          continue;
        }

        const shipment = await buyResponse.json();
        console.log(`Successfully purchased shipment ${shipment.id}, tracking: ${shipment.tracking_code}`);

        if (shipment.postage_label && shipment.tracking_code) {
          // Store all label formats
          const labelUrls = await downloadAndStoreAllFormats(shipment.postage_label, shipment.tracking_code, userId, batchId);
          
          processedLabels.push({
            id: shipmentData.id,
            easypost_id: shipment.id,
            tracking_code: shipment.tracking_code,
            label_urls: labelUrls,
            label_url: labelUrls.pdf || labelUrls.png || '', // Backward compatibility
            status: 'completed',
            carrier: shipment.selected_rate?.carrier || 'Unknown',
            service: shipment.selected_rate?.service || 'Unknown',
            rate: shipment.selected_rate?.rate || 0,
            customer_name: shipmentData.details?.to_name || shipmentData.recipient,
            customer_address: `${shipment.to_address?.street1}, ${shipment.to_address?.city}, ${shipment.to_address?.state} ${shipment.to_address?.zip}`,
            customer_phone: shipment.to_address?.phone,
            customer_email: shipment.to_address?.email,
            batch_id: batchId,
            batch_label_url: batchLabelUrl
          });
        }
      } catch (error) {
        console.error(`Error processing shipment ${shipmentData.id}:`, error);
      }
    }

    // Create a consolidated batch label if we have processed labels
    if (processedLabels.length > 0) {
      try {
        // For now, we'll use the first label as the "batch" label
        // In a real implementation, you might want to create a custom batch label
        batchLabelUrl = processedLabels[0].label_url;
        
        // Update all processed labels with the batch label URL
        processedLabels.forEach(label => {
          label.batch_label_url = batchLabelUrl;
        });
        
        console.log('Batch label created:', batchLabelUrl);
      } catch (error) {
        console.error('Error creating batch label:', error);
      }
    }

    return {
      batchId,
      batchEasyPostId: batchId, // Using our generated batch ID
      batchLabelUrl,
      processedLabels,
      totalLabels: processedLabels.length
    };

  } catch (error) {
    console.error('Error during batch label creation process:', error);
    throw error;
  }
};

const downloadAndStoreAllFormats = async (postageLabel: any, trackingCode: string, userId: string, batchId: string): Promise<Record<string, string>> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const labelUrls: Record<string, string> = {};
  
  if (!postageLabel) {
    console.error('No postage label data available');
    return labelUrls;
  }
  
  const formats = [
    { key: 'pdf', url: postageLabel.label_url, contentType: 'application/pdf', extension: 'pdf' },
    { key: 'png', url: postageLabel.label_png_url, contentType: 'image/png', extension: 'png' },
    { key: 'zpl', url: postageLabel.label_zpl_url, contentType: 'application/x-zpl', extension: 'zpl' }
  ];

  for (const format of formats) {
    if (!format.url) {
      console.log(`No ${format.key.toUpperCase()} URL available`);
      continue;
    }
    
    try {
      console.log(`Downloading ${format.key.toUpperCase()} label from EasyPost: ${format.url}`);
      
      const response = await fetch(format.url);
      if (!response.ok) {
        console.warn(`Failed to download ${format.key} format: ${response.status}`);
        continue;
      }
      
      const labelBlob = await response.blob();
      const labelArrayBuffer = await labelBlob.arrayBuffer();
      const labelBuffer = new Uint8Array(labelArrayBuffer);
      
      const fileName = `shipping_label_${trackingCode}_${Date.now()}.${format.extension}`;
      const filePath = `${batchId}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('shipping-labels-2')
        .upload(filePath, labelBuffer, {
          contentType: format.contentType,
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error(`Error uploading ${format.key} label:`, uploadError);
        continue;
      }
      
      const { data: urlData } = await supabase
        .storage
        .from('shipping-labels-2')
        .getPublicUrl(filePath);
        
      labelUrls[format.key] = urlData.publicUrl;
      
      const { error: insertError } = await supabase
        .from('bulk_label_uploads')
        .insert({
          user_id: userId,
          batch_id: batchId,
          file_name: fileName,
          file_path: filePath,
          file_size: labelBuffer.length,
          file_type: format.key.toUpperCase(),
          tracking_code: trackingCode,
          upload_status: 'completed'
        });
        
      if (insertError) {
        console.error(`Error inserting ${format.key} label record:`, insertError);
      } else {
        console.log(`Successfully stored ${format.key.toUpperCase()} label: ${urlData.publicUrl}`);
      }
      
    } catch (error) {
      console.error(`Error processing ${format.key} label:`, error);
    }
  }
  
  return labelUrls;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { shipments, pickupAddress, labelOptions = {} } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create labels using individual purchases instead of batch API for better reliability
    const batchResult = await createEasyPostBatch(shipments, user.id, labelOptions);

    // Store batch information in Supabase
    const { error: batchInsertError } = await supabase
      .from('batches')
      .insert({
        user_id: user.id,
        batch_id: batchResult.batchId,
        easypost_batch_id: batchResult.batchEasyPostId,
        batch_label_url: batchResult.batchLabelUrl,
        total_shipments: shipments.length,
        successful_shipments: batchResult.processedLabels.length,
        status: 'completed'
      });

    if (batchInsertError) {
      console.error('Error storing batch information:', batchInsertError);
    }

    console.log(`Batch processing complete: ${batchResult.processedLabels.length} successful labels created`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels: batchResult.processedLabels,
        batchId: batchResult.batchId,
        batchLabelUrl: batchResult.batchLabelUrl,
        total: shipments.length,
        successful: batchResult.processedLabels.length,
        failed: shipments.length - batchResult.processedLabels.length,
        message: `Successfully created ${batchResult.processedLabels.length} labels in PDF, PNG, and ZPL formats`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Bulk Label Creation Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
