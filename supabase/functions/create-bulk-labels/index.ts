
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
    // Check if bucket exists by trying to list objects in it
    const { data, error } = await supabase.storage
      .from('shipping-labels')
      .list('', { limit: 1 });
    
    if (error && error.message.includes('Bucket not found')) {
      console.log('Bucket not found, creating it now...');
      
      // Try to create the bucket
      const { error: createError } = await supabase.storage.createBucket('shipping-labels', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      }
      
      console.log('Successfully created shipping-labels bucket');
    }
    
    console.log('Storage bucket shipping-labels is accessible');
    return true;
  } catch (error) {
    console.error('Error checking/creating storage bucket:', error);
    throw error;
  }
};

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, options: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId}`);
    
    // Buy the shipment with selected rate via EasyPost API
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading label from EasyPost: ${easyPostLabelUrl}`);
    
    // Ensure bucket exists and is accessible
    await ensureStorageBucket(supabase);
    
    // Download the label from EasyPost
    const response = await fetch(easyPostLabelUrl);
    if (!response.ok) {
      throw new Error(`Failed to download label: ${response.status}`);
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Create filename with proper extension based on content
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const extension = contentType.includes('png') ? 'png' : 'pdf';
    const fileName = `shipping_label_${trackingCode}_${Date.now()}.${extension}`;
    
    console.log(`Uploading label to storage: ${fileName}`);
    
    // Upload the label to Supabase Storage - FIXED BUCKET NAME
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shipping-labels')  // Fixed: was 'shipping-labels-2'
      .upload(fileName, labelBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading label:', uploadError);
      throw new Error(`Failed to upload label to storage: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = await supabase
      .storage
      .from('shipping-labels')  // Fixed: was 'shipping-labels-2'
      .getPublicUrl(fileName);
      
    console.log(`Label stored successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error downloading and storing label:', error);
    // Fallback to original EasyPost URL if storage fails
    console.log('Falling back to original EasyPost URL');
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

    console.log(`Processing ${shipments.length} shipments for label creation`);
    
    const processedLabels = [];
    const failedLabels = [];

    // Process each shipment individually to ensure we get all labels
    for (const shipment of shipments) {
      try {
        console.log(`Processing label for shipment ${shipment.id} with EasyPost ID ${shipment.easypost_id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for live label generation');
        }

        // Purchase label via EasyPost and store in our system
        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, labelOptions);

        // Ensure we preserve all shipment details
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
        console.log(`Successfully processed label for shipment ${shipment.id}`);

      } catch (error) {
        console.error(`Failed to create label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`Label processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        bulk_label_png_url: null, // TODO: Implement bulk label generation
        bulk_label_pdf_url: null, // TODO: Implement bulk label generation
        message: `Processed ${processedLabels.length} live labels and stored them in our system`,
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
