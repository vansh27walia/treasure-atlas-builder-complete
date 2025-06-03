
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURATION ---
// Edit this line to specify your Supabase Storage bucket name
const SHIPPING_BUCKET_NAME = 'shipping-labels'; // Replace 'shipping-labels' with your actual bucket name if different

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LabelOptions {
  format?: string;
  size?: string;
}

const ensureStorageBucket = async (supabase: SupabaseClient) => {
  try {
    console.log(`Checking for Supabase bucket: ${SHIPPING_BUCKET_NAME}`);
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      // Even if listing fails, we can try to create. If creation also fails, that error will be caught.
    }

    const bucketExists = buckets?.some((bucket: any) => bucket.name === SHIPPING_BUCKET_NAME);

    if (!bucketExists) {
      console.log(`Bucket '${SHIPPING_BUCKET_NAME}' not found. Attempting to create...`);
      const { error: bucketError } = await supabase.storage.createBucket(SHIPPING_BUCKET_NAME, {
        public: true, // Set to false if you want private buckets and handle signed URLs
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      });

      if (bucketError) {
        console.error(`Error creating bucket '${SHIPPING_BUCKET_NAME}':`, bucketError);
        throw new Error(`Failed to create storage bucket '${SHIPPING_BUCKET_NAME}': ${bucketError.message}`);
      }
      console.log(`Successfully created bucket '${SHIPPING_BUCKET_NAME}'`);
    } else {
      console.log(`Bucket '${SHIPPING_BUCKET_NAME}' already exists.`);
    }
    return true;
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
};

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, options: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key (EASYPOST_API_KEY) not configured in environment variables.');
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
        label_format: options.format || 'PDF',
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

    // Download and store the label in our system
    const labelUrl = await downloadAndStoreLabel(boughtShipment.postage_label?.label_url, boughtShipment.tracking_code);

    return {
      id: boughtShipment.id,
      tracking_code: boughtShipment.tracking_code,
      label_url: labelUrl, // This will be the Supabase URL if storage succeeds, otherwise EasyPost URL
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

const downloadAndStoreLabel = async (easyPostLabelUrl: string | undefined, trackingCode: string): Promise<string> => {
  if (!easyPostLabelUrl) {
    console.warn(`No EasyPost label URL provided for tracking code ${trackingCode}. Skipping download and store.`);
    return 'NO_LABEL_URL_PROVIDED';
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Role Key not found in environment variables. Falling back to EasyPost URL.');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return easyPostLabelUrl; // Fallback to EasyPost URL
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading label from EasyPost: ${easyPostLabelUrl}`);
    await ensureStorageBucket(supabase); // Ensure the bucket exists or is created

    const response = await fetch(easyPostLabelUrl);
    if (!response.ok) {
      throw new Error(`Failed to download label from EasyPost: ${response.status} ${response.statusText}`);
    }

    const labelBlob = await response.blob();
    // const labelArrayBuffer = await labelBlob.arrayBuffer(); // Not directly needed if using blob with upload
    const fileName = `shipping_label_${trackingCode}_${Date.now()}.pdf`; // Assuming PDF, adjust if format varies

    console.log(`Uploading label to Supabase bucket '${SHIPPING_BUCKET_NAME}' as '${fileName}'`);
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(SHIPPING_BUCKET_NAME)
      .upload(fileName, labelBlob, { // Uploading blob directly is often preferred
        contentType: labelBlob.type || 'application/pdf', // Use blob's type or default
        cacheControl: '3600',
        upsert: false, // Set to true if you want to overwrite if file exists
      });

    if (uploadError) {
      console.error('Error uploading label to Supabase Storage:', uploadError);
      throw new Error(`Failed to upload label to Supabase storage: ${uploadError.message}`);
    }

    console.log('Label uploaded successfully. Path:', uploadData.path);

    // Get public URL
    const { data: urlData } = supabase // Note: Removed await here as getPublicUrl is synchronous
      .storage
      .from(SHIPPING_BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
         console.error('Failed to get public URL for the uploaded label.');
         throw new Error('Failed to get public URL for the uploaded label.');
    }
    
    console.log(`Label stored successfully in Supabase: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error('Error in downloadAndStoreLabel process:', error);
    console.warn(`Falling back to EasyPost URL due to error: ${easyPostLabelUrl}`);
    return easyPostLabelUrl; // Fallback to original EasyPost URL if any part of Supabase interaction fails
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Early check for Supabase credentials
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const easypostApiKey = Deno.env.get('EASYPOST_API_KEY');

  if (!supabaseUrl || !supabaseServiceKey || !easypostApiKey) {
    let missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!easypostApiKey) missingVars.push('EASYPOST_API_KEY');
    const errorMessage = `Missing critical environment variables: ${missingVars.join(', ')}. Please check your function configuration.`;
    console.error(errorMessage);
    return new Response(
      JSON.stringify({ error: 'Configuration Error', message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  try {
    const { shipments, labelOptions = {} } = await req.json(); // Removed pickupAddress as it wasn't used

    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data. Expected an array.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for label creation`);
    const processedLabels = [];
    const failedLabels = [];

    for (const shipment of shipments) {
      try {
        console.log(`Processing label for shipment ${shipment.id} with EasyPost ID ${shipment.easypost_id}`);
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error(`Shipment ${shipment.id} is missing EasyPost shipment ID (easypost_id) or selected rate ID (selectedRateId) for live label generation.`);
        }

        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, labelOptions);
        const processedLabel = {
          ...shipment,
          ...labelData,
          status: 'completed' as const,
          // Prioritize data from EasyPost if available, then fallback to original shipment data
          customer_name: labelData.customer_name || shipment.details?.to_name || shipment.recipient,
          customer_address: labelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
          customer_phone: labelData.customer_phone || shipment.details?.to_phone,
          customer_email: labelData.customer_email || shipment.details?.to_email,
          customer_company: labelData.customer_company || shipment.details?.to_company,
        };
        processedLabels.push(processedLabel);
        console.log(`Successfully processed label for shipment ${shipment.id}`);
      } catch (error) {
        console.error(`Failed to create label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error during label processing for this shipment.',
        });
      }
    }

    console.log(`Label processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed`);
    return new Response(
      JSON.stringify({
        success: failedLabels.length === 0,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Processed ${processedLabels.length} live labels. ${failedLabels.length > 0 ? `${failedLabels.length} failed.` : ''}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in main create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({
        error: 'Label Creation Error',
        message: error instanceof Error ? error.message : 'An unknown error occurred processing the request.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});