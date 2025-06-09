
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; // Corrected import path for Supabase client

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Purchases a label from EasyPost. This typically buys one specific format.
 * Returns the bought shipment data.
 */
const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, format: string = 'PNG', size: string = '4x6') => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId} in ${format} format.`);
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rate: {
          id: rateId
        },
        label_format: format, // Use the requested format here
        label_size: size      // Use the requested size here
      })
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      throw new Error(`EasyPost purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtShipment = await buyResponse.json();
    console.log(`Successfully purchased label for shipment ${shipmentId}. Tracking: ${boughtShipment.tracking_code}`);
    return boughtShipment;
  } catch (error) {
    console.error(`EasyPost label purchase error for shipment ${shipmentId}:`, error);
    throw error;
  }
};

/**
 * Fetches a label from EasyPost in a specific format after it has been bought.
 * Note: This function can still request PDF/ZPL from EasyPost, but the formatsToGenerate array
 * in the main handler will now only request 'png'.
 */
const getEasyPostLabelByFormat = async (easypostShipmentId: string, format: 'pdf' | 'png' | 'zpl'): Promise<string> => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EASYPOST_API_KEY not configured');
  }
  const easyPostFormat = format === 'zpl' ? 'ZPL' : format.toUpperCase(); 
  try {
    console.log(`Requesting ${easyPostFormat} label from EasyPost for shipment ${easypostShipmentId}`);
    const labelResponse = await fetch(`https://api.easypost.com/v2/shipments/${easypostShipmentId}/label?file_format=${easyPostFormat}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!labelResponse.ok) {
      const errorData = await labelResponse.json();
      console.error(`Failed to get ${easyPostFormat} label from EasyPost: ${labelResponse.status} ${labelResponse.statusText}`, errorData);
      throw new Error(`EasyPost label fetch error for ${easyPostFormat}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const labelShipment = await labelResponse.json();
    if (!labelShipment.postage_label?.label_url) {
      console.error(`EasyPost response for ${easyPostFormat} did not contain a label_url:`, labelShipment);
      throw new Error(`EasyPost did not return label URL for format: ${easyPostFormat}`);
    }
    return labelShipment.postage_label.label_url; // This URL points to the label file on EasyPost's CDN
  } catch (error) {
    console.error(`Error fetching ${format} label from EasyPost:`, error);
    throw error;
  }
};

/**
 * Downloads a label from a given URL (EasyPost CDN) and uploads it directly to the 'shipping-labels-2' bucket.
 * The storage path within the bucket is dynamic based on a unique run ID.
 */
const downloadAndStoreLabel = async (easyPostLabelUrl: string, trackingCode: string, fileExtension: 'png' | 'pdf' | 'zpl', runId: string): Promise<string | null> => {
  if (!easyPostLabelUrl) {
    console.warn('No EasyPost label URL provided for download and store.');
    return null;
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase config not found for downloadAndStoreLabel');
      return null;
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const bucketName = 'shipping-labels-2'; // Hardcoded bucket name
    console.log(`Using hardcoded bucket: ${bucketName} for upload`);

    // Download the label from EasyPost
    const response = await fetch(easyPostLabelUrl);
    if (!response.ok) {
      console.error(`Failed to download label from EasyPost: ${response.status} ${response.statusText}. URL: ${easyPostLabelUrl}`);
      return null;
    }

    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);

    // Determine content type based on extension
    let contentType: string;
    switch (fileExtension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'zpl':
        contentType = 'application/octet-stream'; // ZPL is often treated as binary data
        break;
      default: // Fallback for any unexpected type
        contentType = 'application/octet-stream';
    }

    // File path is {runId}/{filename}
    const fileName = `shipping_label_${trackingCode}_${Date.now()}.${fileExtension}`; // Timestamp for uniqueness
    const filePath = `${runId}/${fileName}`; // Path within the bucket: {runId}/{filename}

    console.log(`Attempting upload to ${bucketName} bucket at path: ${filePath} with Content-Type: ${contentType}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, labelBuffer, {
      contentType: contentType,
      cacheControl: '3600',
      upsert: true
    });

    if (uploadError) {
      console.error(`Error uploading ${fileExtension} label to ${bucketName} bucket:`, uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = await supabase.storage.from(bucketName).getPublicUrl(filePath);
    console.log(`Label stored successfully in ${bucketName} bucket: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error(`Error downloading and storing ${fileExtension} label:`, error);
    return null;
  }
};

// Main Edge Function Handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipments, labelOptions = {}, isIndividualRequest = false } = await req.json();

    // Generate a unique ID for this specific run
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`Starting new label creation run with ID: ${runId}`);

    if (!shipments || !Array.isArray(shipments)) {
      return new Response(JSON.stringify({ error: 'Invalid shipments data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`Processing ${shipments.length} shipments for label creation.`);
    console.log(`Current Request Type: ${isIndividualRequest ? 'Individual' : 'Batch'}`);


    const processedLabels = [];
    const failedLabels = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- CRITICAL CORRECTION: Formats to generate based on request type ---
    // Both individual and batch requests will now only generate PNGs.
    const formatsToGenerate = ['png']; // Only PNG for both individual and batch

    console.log(`Formats to generate for this request: ${formatsToGenerate.join(', ')}`);


    // Process each shipment individually
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      try {
        console.log(`Processing shipment ${i + 1}/${shipments.length}: ${shipment.id} with EasyPost ID ${shipment.easypost_id}`);

        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // --- Step 1: Purchase the label ---
        // Primary purchase format will always be PNG now
        const primaryPurchaseFormat = 'PNG';
        const boughtShipment = await purchaseEasyPostLabel(
          shipment.easypost_id,
          shipment.selectedRateId,
          primaryPurchaseFormat,
          labelOptions.label_size || '4x6'
        );

        // labelUrls will only have 'png' property now
        const labelUrls: { png?: string } = {}; 

        // --- Step 2: Fetch and store each required format ---
        for (const format of formatsToGenerate) { // This loop will only run for 'png' now
          try {
            console.log(`Attempting to get and store ${format.toUpperCase()} label for shipment ${shipment.id}`);
            const easyPostLabelUrl = await getEasyPostLabelByFormat(boughtShipment.id, format as 'png'); // Only PNG allowed here now
            
            if (easyPostLabelUrl) {
              // Pass the runId down to downloadAndStoreLabel
              const supabaseLabelUrl = await downloadAndStoreLabel(easyPostLabelUrl, boughtShipment.tracking_code, format as 'png', runId);
              if (supabaseLabelUrl) {
                labelUrls[format as 'png'] = supabaseLabelUrl;
                console.log(`Successfully stored ${format} label for shipment ${shipment.id}.`);
              } else {
                console.error(`FAILURE: Storing ${format} label in Supabase for shipment ${shipment.id} failed.`);
              }
            } else {
              console.error(`FAILURE: EasyPost did not provide a URL for ${format} label for shipment ${shipment.id}.`);
            }
          } catch (formatError) {
            console.error(`ERROR: Problem getting/storing ${format} label for shipment ${shipment.id}:`, formatError);
            // Don't rethrow, allow other formats to proceed
          }
        }

        const processedLabel = {
          ...shipment, // Original shipment data
          ...boughtShipment, // Data returned from EasyPost buy call
          label_urls: labelUrls, // Store only 'png' URL now
          status: 'completed',
          // Ensure other fields are populated from boughtShipment or original shipment
          customer_name: boughtShipment.to_address?.name || shipment.details?.to_name || shipment.recipient,
          customer_address: `${boughtShipment.to_address?.street1 || shipment.details?.to_street1}, ${boughtShipment.to_address?.city || shipment.details?.to_city}, ${boughtShipment.to_address?.state || shipment.details?.to_state} ${boughtShipment.to_address?.zip || shipment.details?.to_zip}`,
          customer_phone: boughtShipment.to_address?.phone || shipment.details?.to_phone,
          customer_email: boughtShipment.to_address?.email || shipment.details?.to_email,
          customer_company: boughtShipment.to_address?.company || shipment.details?.to_company,
          // Use tracking_code from boughtShipment as it's the official one after purchase
          tracking_code: boughtShipment.tracking_code,
          shipment_id: boughtShipment.id // Ensure we use the EasyPost shipment ID here
        };
        processedLabels.push(processedLabel);
        console.log(`Successfully processed label ${i + 1}/${shipments.length} for shipment ${shipment.id}`);

      } catch (error) {
        console.error(`FAILED to process label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalShipment: shipment
        });
        console.log(`Continuing with remaining ${shipments.length - i - 1} shipments...`);
      }
    }

    console.log(`Label processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(JSON.stringify({
      success: true,
      processedLabels,
      failedLabels,
      total: shipments.length,
      successful: processedLabels.length,
      failed: failedLabels.length,
      message: `Processed ${processedLabels.length} out of ${shipments.length} labels successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('CRITICAL ERROR in create-bulk-labels function:', error);
    return new Response(JSON.stringify({
      error: 'Label Creation Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});