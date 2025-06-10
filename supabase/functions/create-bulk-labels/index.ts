
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
    console.log('Checking storage bucket access...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return 'shipping-labels-2';
    }
    
    console.log('Available buckets:', buckets?.map(b => b.name) || []);
    
    // Check for shipping-labels-2 bucket first (preferred)
    const preferredBucket = buckets?.find(bucket => bucket.name === 'shipping-labels-2');
    if (preferredBucket) {
      console.log('Using existing shipping-labels-2 bucket');
      return 'shipping-labels-2';
    }
    
    // Try to create shipping-labels-2 bucket
    console.log('Attempting to create shipping-labels-2 bucket...');
    const { data: createData, error: createError } = await supabase.storage.createBucket('shipping-labels-2', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/png', 'application/pdf']
    });
    
    if (createError) {
      console.error('Failed to create shipping-labels-2 bucket:', createError);
      return 'shipping-labels-2'; // Still try to use it
    }
    
    console.log('Successfully created shipping-labels-2 bucket');
    return 'shipping-labels-2';
    
  } catch (error) {
    console.error('Critical error in ensureStorageBucket:', error);
    return 'shipping-labels-2';
  }
};

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, options: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId} in ${options.format || 'PNG'} format.`);
    
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId },
        label_format: options.format || 'PNG',
        label_size: options.size || '4x6',
      }),
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      
      // Handle specific error cases
      if (errorData.error?.code === 'SHIPMENT.POSTAGE.EXISTS') {
        // If postage already exists, try to get the existing shipment data
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
    console.log(`Successfully purchased label for shipment ${shipmentId}. Tracking: ${boughtShipment.tracking_code}`);
    
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

const downloadAndStoreLabel = async (easyPostLabelUrl: string, trackingCode: string, format: string = 'png'): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Requesting ${format.toUpperCase()} label from EasyPost for shipment ${trackingCode}`);
    
    const bucketName = await ensureStorageBucket(supabase);
    console.log(`Using bucket: ${bucketName} for upload`);
    
    // Download the label from EasyPost
    const response = await fetch(easyPostLabelUrl);
    if (!response.ok) {
      console.error(`Failed to download label: ${response.status} ${response.statusText}`);
      return easyPostLabelUrl;
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Create filename with proper extension and path
    const fileName = `batch_labels/shipping_label_${trackingCode}_${Date.now()}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : 'image/png';
    
    console.log(`Attempting upload to ${bucketName} bucket at path: ${fileName} with Content-Type: ${contentType}`);
    
    // Upload to Supabase Storage with retry logic
    let uploadData, uploadError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await supabase
        .storage
        .from(bucketName)
        .upload(fileName, labelBuffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });
        
      uploadData = result.data;
      uploadError = result.error;
      
      if (!uploadError) break;
      
      console.warn(`Upload attempt ${attempt} failed:`, uploadError);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
      
    if (uploadError) {
      console.error(`Error uploading label to ${bucketName} bucket after 3 attempts:`, uploadError);
      return easyPostLabelUrl;
    }
    
    // Get public URL
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`Label stored successfully in ${bucketName} bucket: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error downloading and storing label:', error);
    return easyPostLabelUrl;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipments, pickupAddress, labelOptions = {} } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for batch label creation.`);
    
    const processedLabels = [];
    const failedLabels = [];
    
    // Process shipments in smaller batches to avoid rate limiting
    const batchSize = 3; // Process 3 at a time
    const delayBetweenBatches = 2000; // 2 second delay between batches
    const delayBetweenShipments = 1000; // 1 second delay between individual shipments
    
    for (let i = 0; i < shipments.length; i += batchSize) {
      const batch = shipments.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(shipments.length / batchSize)} (shipments ${i + 1}-${Math.min(i + batchSize, shipments.length)})`);
      
      // Process each shipment in the batch
      for (let j = 0; j < batch.length; j++) {
        const shipment = batch[j];
        const shipmentIndex = i + j + 1;
        
        try {
          console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id} with EasyPost ID ${shipment.easypost_id}`);
          
          if (!shipment.selectedRateId || !shipment.easypost_id) {
            throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
          }

          // Purchase label via EasyPost
          const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, {
            format: 'PNG',
            size: '4x6'
          });

          // Store the PNG label
          console.log(`Attempting to get and store PNG label for shipment ${shipment.id}`);
          const storedLabelUrl = await downloadAndStoreLabel(labelData.label_url, labelData.tracking_code, 'png');
          console.log(`Successfully stored png label for shipment ${shipment.id}.`);

          const processedLabel = {
            ...shipment,
            ...labelData,
            label_url: storedLabelUrl,
            status: 'completed' as const,
            customer_name: labelData.customer_name || shipment.details?.to_name || shipment.recipient,
            customer_address: labelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
            customer_phone: labelData.customer_phone || shipment.details?.to_phone,
            customer_email: labelData.customer_email || shipment.details?.to_email,
            customer_company: labelData.customer_company || shipment.details?.to_company,
          };

          processedLabels.push(processedLabel);
          console.log(`Successfully processed label ${shipmentIndex}/${shipments.length} for shipment ${shipment.id}`);

          // Add delay between shipments to avoid rate limiting
          if (j < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenShipments));
          }

        } catch (error) {
          console.error(`FAILED to process label for shipment ${shipment.id}:`, error);
          failedLabels.push({
            shipmentId: shipment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            originalShipment: shipment
          });
          console.log(`Continuing with remaining ${shipments.length - shipmentIndex} shipments...`);
        }
      }
      
      // Add delay between batches
      if (i + batchSize < shipments.length) {
        console.log(`Waiting ${delayBetweenBatches}ms before processing next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`Batch label processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Batch processed ${processedLabels.length} out of ${shipments.length} labels successfully`,
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
