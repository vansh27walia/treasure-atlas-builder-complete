
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

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, userId: string, options: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Checking shipment ${shipmentId} status before purchase`);
    
    // First, check if the shipment already has postage
    const checkResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!checkResponse.ok) {
      throw new Error(`Failed to check shipment status: ${checkResponse.status}`);
    }

    const existingShipment = await checkResponse.json();
    
    // If shipment already has postage, return existing label info
    if (existingShipment.postage_label && existingShipment.tracking_code) {
      console.log(`Shipment ${shipmentId} already has postage, processing existing labels`);
      
      // Download and store all available label formats
      const labelUrls = await downloadAndStoreAllFormats(existingShipment.postage_label, existingShipment.tracking_code, userId);
      
      return {
        id: existingShipment.id,
        tracking_code: existingShipment.tracking_code,
        label_urls: labelUrls,
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
    
    console.log(`Purchasing new label for shipment ${shipmentId} with rate ${rateId}`);
    
    // Buy the shipment with selected rate via EasyPost API
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId },
        label_format: 'PDF', // Primary format
        label_size: options.size || '4x6',
      }),
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      
      // If conflict error, try to get the existing shipment data
      if (buyResponse.status === 409 || errorData.error?.code === 'SHIPMENT.POSTAGE.EXISTS') {
        console.log(`Postage exists for ${shipmentId}, processing existing labels`);
        
        if (existingShipment.postage_label) {
          const labelUrls = await downloadAndStoreAllFormats(existingShipment.postage_label, existingShipment.tracking_code, userId);
          
          return {
            id: existingShipment.id,
            tracking_code: existingShipment.tracking_code || 'TRACKING_PENDING',
            label_urls: labelUrls,
            carrier: existingShipment.selected_rate?.carrier || 'Unknown',
            service: existingShipment.selected_rate?.service || 'Unknown',
            rate: existingShipment.selected_rate?.rate || '0',
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
    console.log(`Successfully purchased new label for shipment ${shipmentId}`);
    
    // Download and store all available label formats
    const labelUrls = await downloadAndStoreAllFormats(boughtShipment.postage_label, boughtShipment.tracking_code, userId);
    
    return {
      id: boughtShipment.id,
      tracking_code: boughtShipment.tracking_code,
      label_urls: labelUrls,
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

const downloadAndStoreAllFormats = async (postageLabel: any, trackingCode: string, userId: string): Promise<Record<string, string>> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const labelUrls: Record<string, string> = {};
  const batchId = `batch_${Date.now()}`;
  
  // Check if postageLabel exists and has valid URLs
  if (!postageLabel) {
    console.error('No postage label data available');
    return labelUrls;
  }
  
  // Format mappings from EasyPost to our storage
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
      
      // Download the label from EasyPost
      const response = await fetch(format.url);
      if (!response.ok) {
        console.warn(`Failed to download ${format.key} format: ${response.status}`);
        continue;
      }
      
      const labelBlob = await response.blob();
      const labelArrayBuffer = await labelBlob.arrayBuffer();
      const labelBuffer = new Uint8Array(labelArrayBuffer);
      
      // Create filename
      const fileName = `shipping_label_${trackingCode}_${Date.now()}.${format.extension}`;
      const filePath = `${batchId}/${fileName}`;
      
      // Upload to shipping-labels-2 bucket
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
      
      // Get public URL
      const { data: urlData } = await supabase
        .storage
        .from('shipping-labels-2')
        .getPublicUrl(filePath);
        
      labelUrls[format.key] = urlData.publicUrl;
      
      // Insert record into bulk_label_uploads table with user_id
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
    // Get user from JWT token
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

    // Get user from the auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { shipments, pickupAddress, labelOptions = {} } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for bulk label creation`);
    
    const processedLabels = [];
    const failedLabels = [];

    // Process each shipment individually to ensure we get all labels
    for (const shipment of shipments) {
      try {
        console.log(`Processing label for shipment ${shipment.id} with EasyPost ID ${shipment.easypost_id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for live label generation');
        }

        // Purchase label via EasyPost and store all formats in our system
        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, user.id, labelOptions);

        // Ensure we preserve all customer details and add label URLs
        const processedLabel = {
          ...shipment,
          ...labelData,
          status: 'completed' as const,
          // Maintain backward compatibility with single label_url
          label_url: labelData.label_urls?.pdf || labelData.label_urls?.png || '',
          // Add all format URLs
          label_urls_all_formats: labelData.label_urls,
          customer_name: labelData.customer_name || shipment.details?.to_name || shipment.recipient,
          customer_address: labelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
          customer_phone: labelData.customer_phone || shipment.details?.to_phone,
          customer_email: labelData.customer_email || shipment.details?.to_email,
          customer_company: labelData.customer_company || shipment.details?.to_company,
        };

        processedLabels.push(processedLabel);
        console.log(`Successfully processed labels for shipment ${shipment.id}`);

      } catch (error) {
        console.error(`Failed to create labels for shipment ${shipment.id}:`, error);
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
        message: `Processed ${processedLabels.length} shipments with labels in PDF, PNG, and ZPL formats stored in shipping-labels-2 bucket`,
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
