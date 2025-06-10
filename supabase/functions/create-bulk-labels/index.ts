
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

const ensureStorageBucket = async (supabase: any) => {
  try {
    console.log('Using shipping-labels bucket for label storage');
    return 'shipping-labels';
  } catch (error) {
    console.error('Error with storage bucket:', error);
    return 'shipping-labels';
  }
};

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, format: string = 'PNG') => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating ${format} label for shipment ${shipmentId} with rate ${rateId}`);
    
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId },
        label_format: format,
        label_size: '4x6',
      }),
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      
      if (errorData.error?.code === 'SHIPMENT.POSTAGE.EXISTS') {
        console.log(`Postage already exists for ${shipmentId}, fetching existing data...`);
        const getResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        if (getResponse.ok) {
          const existingShipment = await getResponse.json();
          console.log(`Retrieved existing shipment data for ${shipmentId}`);
          return {
            id: existingShipment.id,
            tracking_code: existingShipment.tracking_code,
            label_url: existingShipment.postage_label?.label_url,
            carrier: existingShipment.selected_rate?.carrier,
            service: existingShipment.selected_rate?.service,
            rate: existingShipment.selected_rate?.rate,
            customer_name: existingShipment.to_address?.name,
            customer_address: `${existingShipment.to_address?.street1}, ${existingShipment.to_address?.city}, ${existingShipment.to_address?.state} ${existingShipment.to_address?.zip}`,
            customer_phone: existingShipment.to_address?.phone,
            customer_email: existingShipment.to_address?.email,
            customer_company: existingShipment.to_address?.company,
          };
        }
      }
      
      throw new Error(`EasyPost purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtShipment = await buyResponse.json();
    console.log(`Successfully purchased ${format} label for shipment ${shipmentId}. Tracking: ${boughtShipment.tracking_code}`);
    
    return {
      id: boughtShipment.id,
      tracking_code: boughtShipment.tracking_code,
      label_url: boughtShipment.postage_label?.label_url,
      carrier: boughtShipment.selected_rate?.carrier,
      service: boughtShipment.selected_rate?.service,
      rate: boughtShipment.selected_rate?.rate,
      customer_name: boughtShipment.to_address?.name,
      customer_address: `${boughtShipment.to_address?.street1}, ${boughtShipment.to_address?.city}, ${boughtShipment.to_address?.state} ${boughtShipment.to_address?.zip}`,
      customer_phone: boughtShipment.to_address?.phone,
      customer_email: boughtShipment.to_address?.email,
      customer_company: boughtShipment.to_address?.company,
    };
    
  } catch (error) {
    console.error(`EasyPost label purchase error for shipment ${shipmentId}:`, error);
    throw error;
  }
};

const downloadAndStoreLabel = async (
  easyPostLabelUrl: string, 
  trackingCode: string, 
  shipmentId: string, 
  format: string = 'png',
  userId?: string
): Promise<{ supabaseUrl: string; filePath: string; fileSize: number }> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading and storing ${format.toUpperCase()} label for shipment ${shipmentId} with tracking ${trackingCode}`);
    
    const bucketName = await ensureStorageBucket(supabase);
    
    // Download the label from EasyPost
    const response = await fetch(easyPostLabelUrl);
    if (!response.ok) {
      console.error(`Failed to download label: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to download label from EasyPost: ${response.statusText}`);
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Create structured file path
    const timestamp = Date.now();
    const filePath = `${shipmentId}/label_${trackingCode}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';
    
    console.log(`Uploading to ${bucketName} bucket at path: ${filePath}`);
    
    // Upload to Supabase Storage with retry logic
    let uploadError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data: uploadData, error } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, labelBuffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });
        
      uploadError = error;
      
      if (!uploadError) {
        console.log(`Successfully uploaded ${filePath} on attempt ${attempt}`);
        break;
      }
      
      console.warn(`Upload attempt ${attempt} failed:`, uploadError);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
      
    if (uploadError) {
      console.error(`Failed to upload after 3 attempts:`, uploadError);
      throw new Error(`Failed to upload label to storage: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Store label metadata in database
    if (userId) {
      const { error: dbError } = await supabase
        .from('shipping_label_files')
        .insert({
          shipment_id: shipmentId,
          tracking_code: trackingCode,
          label_type: format,
          supabase_url: urlData.publicUrl,
          file_path: filePath,
          file_size: labelBuffer.length,
          easypost_shipment_id: shipmentId,
          user_id: userId
        });

      if (dbError) {
        console.error('Error storing label metadata:', dbError);
      }
    }
      
    console.log(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    
    return {
      supabaseUrl: urlData.publicUrl,
      filePath: filePath,
      fileSize: labelBuffer.length
    };
    
  } catch (error) {
    console.error('Error downloading and storing label:', error);
    throw error;
  }
};

const createBulkZip = async (labelFiles: Array<{ filePath: string; trackingCode: string; format: string }>, batchReference: string): Promise<{ zipUrl: string; zipPath: string }> => {
  // For now, return the first label as placeholder
  // In production, you'd want to implement actual ZIP creation
  if (labelFiles.length > 0) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: urlData } = await supabase
      .storage
      .from('shipping-labels')
      .getPublicUrl(labelFiles[0].filePath);
    
    return {
      zipUrl: urlData.publicUrl,
      zipPath: labelFiles[0].filePath
    };
  }
  
  throw new Error('No label files to zip');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipments, pickupAddress, labelOptions = {}, userId } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for batch label creation with secure storage.`);
    
    const processedLabels = [];
    const failedLabels = [];
    const batchReference = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const labelFiles = [];
    
    // Process ALL shipments with delays to avoid rate limiting
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Generate labels in all three formats and store in Supabase
        const formats = ['PNG', 'PDF', 'ZPL'];
        const labelUrls = {};
        let mainLabelData = null;

        for (const format of formats) {
          try {
            console.log(`Generating ${format} label for shipment ${shipment.id}`);
            
            const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, format);
            
            if (!mainLabelData) {
              mainLabelData = labelData;
            }

            // Download and store the label in Supabase
            const storedLabel = await downloadAndStoreLabel(
              labelData.label_url, 
              labelData.tracking_code, 
              shipment.id,
              format.toLowerCase(),
              userId
            );

            labelUrls[format.toLowerCase()] = storedLabel.supabaseUrl;
            labelFiles.push({
              filePath: storedLabel.filePath,
              trackingCode: labelData.tracking_code,
              format: format.toLowerCase()
            });
            
            console.log(`✅ Successfully generated and stored ${format} label for shipment ${shipment.id}`);
            
            // Add small delay between format generations
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (formatError) {
            console.error(`Failed to generate ${format} label for shipment ${shipment.id}:`, formatError);
          }
        }

        if (mainLabelData && Object.keys(labelUrls).length > 0) {
          const processedLabel = {
            ...shipment,
            ...mainLabelData,
            label_url: labelUrls.png || labelUrls.pdf || Object.values(labelUrls)[0],
            label_urls: labelUrls,
            status: 'completed' as const,
            customer_name: mainLabelData.customer_name || shipment.details?.to_name || shipment.recipient,
            customer_address: mainLabelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
            customer_phone: mainLabelData.customer_phone || shipment.details?.to_phone,
            customer_email: mainLabelData.customer_email || shipment.details?.to_email,
            customer_company: mainLabelData.customer_company || shipment.details?.to_company,
          };

          processedLabels.push(processedLabel);
          console.log(`✅ Successfully processed all formats for shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);
        } else {
          throw new Error('Failed to generate any label formats');
        }

        // Add delay between shipments to avoid rate limiting
        if (i < shipments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ FAILED to process label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalShipment: shipment
        });
      }
    }

    // Create bulk batch record
    let bulkZipUrl = null;
    if (labelFiles.length > 0 && userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { error: batchError } = await supabase
          .from('bulk_label_batches')
          .insert({
            batch_reference: batchReference,
            total_labels: processedLabels.length,
            user_id: userId
          });

        if (batchError) {
          console.error('Error storing bulk batch:', batchError);
        }
      } catch (error) {
        console.error('Error creating bulk batch record:', error);
      }
    }

    console.log(`✅ Batch processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        batchReference,
        bulk_zip_url: bulkZipUrl,
        message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels with secure storage`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Batch Label Creation Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
