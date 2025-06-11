
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
    console.log('Ensuring shipping-labels bucket exists...');
    
    // Check if bucket exists by trying to list objects
    const { data, error } = await supabase.storage
      .from('shipping-labels')
      .list('', { limit: 1 });
    
    if (error && error.message.includes('not found')) {
      console.log('Creating shipping-labels bucket...');
      
      const { error: createError } = await supabase.storage.createBucket('shipping-labels', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('Successfully created shipping-labels bucket');
      }
    } else if (error) {
      console.error('Bucket check error:', error);
    } else {
      console.log('shipping-labels bucket exists and is accessible');
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureStorageBucket:', error);
    return false;
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
    
    // Ensure bucket exists
    await ensureStorageBucket(supabase);
    
    // Download the label from EasyPost
    const response = await fetch(easyPostLabelUrl);
    if (!response.ok) {
      console.error(`Failed to download label: ${response.status} ${response.statusText}`);
      return easyPostLabelUrl; // Return original URL as fallback
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Create filename
    const fileName = `shipping_label_${trackingCode}_${Date.now()}.png`;
    
    console.log(`Uploading label to shipping-labels bucket: ${fileName}`);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shipping-labels')
      .upload(fileName, labelBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading label to shipping-labels bucket:', uploadError);
      return easyPostLabelUrl; // Return original URL as fallback
    }
    
    // Get public URL
    const { data: urlData } = await supabase
      .storage
      .from('shipping-labels')
      .getPublicUrl(fileName);
      
    console.log(`Label stored successfully in shipping-labels bucket: ${urlData.publicUrl}`);
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

        // Purchase label via EasyPost and store in shipping-labels bucket
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
        bulk_label_png_url: null,
        bulk_label_pdf_url: null,
        message: `Processed ${processedLabels.length} out of ${shipments.length} labels`,
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
