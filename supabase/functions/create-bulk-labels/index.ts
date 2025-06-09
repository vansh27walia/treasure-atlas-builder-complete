
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
    
    // First, list all available buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      // If we can't list buckets, try to use a default bucket name
      console.log('Using default bucket name: shipping-labels');
      return 'shipping-labels';
    }
    
    console.log('Available buckets:', buckets?.map(b => b.name) || []);
    
    // Check if shipping-labels bucket exists
    const shippingLabelsBucket = buckets?.find(bucket => bucket.name === 'shipping-labels');
    if (shippingLabelsBucket) {
      console.log('Using existing shipping-labels bucket');
      return 'shipping-labels';
    }
    
    // Check if shipping-labels-2 bucket exists
    const shippingLabels2Bucket = buckets?.find(bucket => bucket.name === 'shipping-labels-2');
    if (shippingLabels2Bucket) {
      console.log('Using existing shipping-labels-2 bucket');
      return 'shipping-labels-2';
    }
    
    // Try to create shipping-labels bucket
    console.log('Attempting to create shipping-labels bucket...');
    const { data: createData, error: createError } = await supabase.storage.createBucket('shipping-labels', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
    });
    
    if (createError) {
      console.error('Failed to create shipping-labels bucket:', createError);
      
      // If we have any existing bucket, use the first one
      if (buckets && buckets.length > 0) {
        const fallbackBucket = buckets[0].name;
        console.log(`Using fallback bucket: ${fallbackBucket}`);
        return fallbackBucket;
      }
      
      // Last resort: return a default name and hope it works
      console.log('No buckets available, using default name');
      return 'shipping-labels';
    }
    
    console.log('Successfully created shipping-labels bucket');
    return 'shipping-labels';
    
  } catch (error) {
    console.error('Critical error in ensureStorageBucket:', error);
    // Return default bucket name as last resort
    return 'shipping-labels';
  }
};

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, options: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId}`);
    
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
      throw new Error(`EasyPost purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtShipment = await buyResponse.json();
    console.log(`Successfully purchased label for shipment ${shipmentId}`);
    
    // Download and store the label
    const labelUrl = await downloadAndStoreLabel(boughtShipment.postage_label?.label_url, boughtShipment.tracking_code);
    
    return {
      id: boughtShipment.id,
      tracking_code: boughtShipment.tracking_code,
      label_url: labelUrl,
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

const downloadAndStoreLabel = async (easyPostLabelUrl: string, trackingCode: string): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading label from EasyPost: ${easyPostLabelUrl}`);
    
    // Get bucket name to use
    const bucketName = await ensureStorageBucket(supabase);
    console.log(`Using bucket: ${bucketName}`);
    
    // Download the label from EasyPost
    const response = await fetch(easyPostLabelUrl);
    if (!response.ok) {
      console.error(`Failed to download label: ${response.status} ${response.statusText}`);
      return easyPostLabelUrl; // Return original URL as fallback
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Create filename with PNG extension
    const fileName = `shipping_label_${trackingCode}_${Date.now()}.png`;
    
    console.log(`Uploading label to ${bucketName} bucket: ${fileName}`);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, labelBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`Error uploading label to ${bucketName} bucket:`, uploadError);
      return easyPostLabelUrl; // Return original URL as fallback
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
    return easyPostLabelUrl; // Return original URL as fallback
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

    console.log(`Processing ${shipments.length} shipments for label creation`);
    
    const processedLabels = [];
    const failedLabels = [];

    // Process each shipment individually
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      try {
        console.log(`Processing shipment ${i + 1}/${shipments.length}: ${shipment.id} with EasyPost ID ${shipment.easypost_id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Purchase label via EasyPost and store as PNG
        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, {
          format: 'PNG',
          size: '4x6'
        });

        const processedLabel = {
          ...shipment,
          ...labelData,
          status: 'completed' as const,
          customer_name: labelData.customer_name || shipment.details?.to_name || shipment.recipient,
          customer_address: labelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
          customer_phone: labelData.customer_phone || shipment.details?.to_phone,
          customer_email: labelData.customer_email || shipment.details?.to_email,
          customer_company: labelData.customer_company || shipment.details?.to_company,
        };

        processedLabels.push(processedLabel);
        console.log(`Successfully processed label ${i + 1}/${shipments.length} for shipment ${shipment.id}`);

      } catch (error) {
        console.error(`Failed to create label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalShipment: shipment
        });
        console.log(`Continuing with remaining ${shipments.length - i - 1} shipments...`);
      }
    }

    console.log(`Label processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Processed ${processedLabels.length} out of ${shipments.length} labels successfully`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Label Creation Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
