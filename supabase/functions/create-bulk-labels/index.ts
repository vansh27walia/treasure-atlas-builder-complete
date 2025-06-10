
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
    console.log('Using shipping-labels-2 bucket for label storage');
    return 'shipping-labels-2';
  } catch (error) {
    console.error('Error with storage bucket:', error);
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
      
      // Handle postage already exists - fetch existing data
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

const downloadAndStoreLabel = async (easyPostLabelUrl: string, trackingCode: string, shipmentId: string, format: string = 'png'): Promise<string> => {
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
      return easyPostLabelUrl;
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Create unique filename
    const timestamp = Date.now();
    const fileName = `batch_labels/shipping_label_${trackingCode}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : 'image/png';
    
    console.log(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    
    // Upload to Supabase Storage with retry logic
    let uploadError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data: uploadData, error } = await supabase
        .storage
        .from(bucketName)
        .upload(fileName, labelBuffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });
        
      uploadError = error;
      
      if (!uploadError) {
        console.log(`Successfully uploaded ${fileName} on attempt ${attempt}`);
        break;
      }
      
      console.warn(`Upload attempt ${attempt} failed:`, uploadError);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
      
    if (uploadError) {
      console.error(`Failed to upload after 3 attempts:`, uploadError);
      return easyPostLabelUrl;
    }
    
    // Get public URL
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`Label accessible at: ${urlData.publicUrl}`);
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
    
    // Process ALL shipments with delays to avoid rate limiting
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Purchase label via EasyPost
        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, {
          format: 'PNG',
          size: '4x6'
        });

        // Store the label in Supabase
        const storedLabelUrl = await downloadAndStoreLabel(
          labelData.label_url, 
          labelData.tracking_code, 
          shipment.id,
          'png'
        );

        const processedLabel = {
          ...shipment,
          ...labelData,
          label_url: storedLabelUrl,
          label_urls: {
            png: storedLabelUrl,
            pdf: storedLabelUrl,
            zpl: storedLabelUrl
          },
          status: 'completed' as const,
          customer_name: labelData.customer_name || shipment.details?.to_name || shipment.recipient,
          customer_address: labelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
          customer_phone: labelData.customer_phone || shipment.details?.to_phone,
          customer_email: labelData.customer_email || shipment.details?.to_email,
          customer_company: labelData.customer_company || shipment.details?.to_company,
        };

        processedLabels.push(processedLabel);
        console.log(`✅ Successfully processed label ${shipmentIndex}/${shipments.length} for shipment ${shipment.id}`);

        // Add delay between shipments to avoid rate limiting (except for last shipment)
        if (i < shipments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
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

    console.log(`✅ Batch processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels`,
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
