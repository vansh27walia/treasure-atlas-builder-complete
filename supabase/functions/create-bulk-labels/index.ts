
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ensureStorageBucket = async (supabase: any) => {
  try {
    console.log('Using shipping-labels-2 bucket for label storage');
    return 'shipping-labels-2';
  } catch (error) {
    console.error('Error with storage bucket:', error);
    return 'shipping-labels-2';
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
            label_urls: {
              png: existingShipment.postage_label?.label_url,
              pdf: existingShipment.postage_label?.label_pdf_url,
              zpl: existingShipment.postage_label?.label_zpl_url
            },
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
      label_urls: {
        png: boughtShipment.postage_label?.label_url,
        pdf: boughtShipment.postage_label?.label_pdf_url,
        zpl: boughtShipment.postage_label?.label_zpl_url
      },
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

const downloadAndStoreLabel = async (labelUrl: string, trackingCode: string, shipmentId: string, format: string = 'png'): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading and storing ${format.toUpperCase()} label for shipment ${shipmentId} with tracking ${trackingCode}`);
    
    const bucketName = await ensureStorageBucket(supabase);
    
    // Download the label from EasyPost
    const response = await fetch(labelUrl);
    if (!response.ok) {
      console.error(`Failed to download label: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to download label: ${response.status}`);
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Create unique filename with batch organization
    const timestamp = Date.now();
    const fileName = `bulk_labels/${format.toLowerCase()}/label_${trackingCode}_${timestamp}.${format.toLowerCase()}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';
    
    console.log(`Uploading ${format} to ${bucketName} bucket at path: ${fileName}`);
    
    // Upload to Supabase Storage with proper error handling
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, labelBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`Failed to upload ${format} label:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    console.log(`Successfully uploaded ${format} label: ${fileName}`);
    
    // Get public URL - this is OUR URL, not EasyPost's
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    const publicUrl = urlData.publicUrl;
    console.log(`${format.toUpperCase()} label accessible at our URL: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`Error downloading and storing ${format} label:`, error);
    // Return empty string instead of EasyPost URL on failure
    return '';
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

    console.log(`Processing ${shipments.length} shipments for label creation with ALL formats (PNG, PDF, ZPL).`);
    
    const processedLabels = [];
    const failedLabels = [];
    
    // Process ALL shipments individually to ensure proper storage
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Generate label and get all formats from EasyPost
        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, 'PNG');
        
        // Store ALL available formats in Supabase with OUR URLs
        const storedLabelUrls: any = {};
        
        // Always store PNG (primary format)
        if (labelData.label_urls?.png || labelData.label_url) {
          const pngUrl = labelData.label_urls?.png || labelData.label_url;
          const ourPngUrl = await downloadAndStoreLabel(pngUrl, labelData.tracking_code, shipment.id, 'png');
          if (ourPngUrl) {
            storedLabelUrls.png = ourPngUrl;
          }
        }
        
        // Store PDF if available
        if (labelData.label_urls?.pdf) {
          const ourPdfUrl = await downloadAndStoreLabel(labelData.label_urls.pdf, labelData.tracking_code, shipment.id, 'pdf');
          if (ourPdfUrl) {
            storedLabelUrls.pdf = ourPdfUrl;
          }
        }
        
        // Store ZPL if available
        if (labelData.label_urls?.zpl) {
          const ourZplUrl = await downloadAndStoreLabel(labelData.label_urls.zpl, labelData.tracking_code, shipment.id, 'zpl');
          if (ourZplUrl) {
            storedLabelUrls.zpl = ourZplUrl;
          }
        }

        // Ensure we have at least one format stored
        if (Object.keys(storedLabelUrls).length === 0) {
          throw new Error('Failed to store any label formats');
        }

        const processedLabel = {
          ...shipment,
          ...labelData,
          // IMPORTANT: Use OUR URLs, never EasyPost URLs
          label_url: storedLabelUrls.png || storedLabelUrls.pdf || Object.values(storedLabelUrls)[0],
          label_urls: storedLabelUrls, // Only OUR URLs
          status: 'completed' as const,
          customer_name: labelData.customer_name || shipment.details?.to_name || shipment.recipient,
          customer_address: labelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
          customer_phone: labelData.customer_phone || shipment.details?.to_phone,
          customer_email: labelData.customer_email || shipment.details?.to_email,
          customer_company: labelData.customer_company || shipment.details?.to_company,
        };

        processedLabels.push(processedLabel);
        console.log(`✅ Successfully processed shipment ${shipmentIndex}/${shipments.length}: ${shipment.id} with formats: ${Object.keys(storedLabelUrls).join(', ')}`);

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

    console.log(`✅ Processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    // Validate that we created labels
    if (processedLabels.length === 0) {
      throw new Error('No labels were successfully created');
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels with multiple formats stored in your system`,
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
