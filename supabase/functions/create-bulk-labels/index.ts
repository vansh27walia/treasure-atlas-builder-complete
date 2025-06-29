
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "npm:pdf-lib"; // Required for local PNG to PDF conversion

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Ensures the existence of the Supabase Storage bucket or returns its name.
 * For Deno Edge Functions, we typically assume the bucket exists.
 * @param {object} supabase - The Supabase client instance.
 * @returns {Promise<string>} The name of the storage bucket.
 */
const ensureStorageBucket = async (supabase) => {
  try {
    console.log('Using shipping-labels-2 bucket for label storage');
    // In a production environment, you might add logic here to create the bucket
    // if it doesn't exist, but for Deno Edge Functions, it's usually pre-configured.
    return 'shipping-labels-2';
  } catch (error) {
    console.error('Error with storage bucket:', error);
    // Fallback or error handling if bucket name cannot be determined
    return 'shipping-labels-2';
  }
};

/**
 * Downloads a label from a given URL and stores it directly into Supabase Storage.
 * This is used for ZPL or directly storing binary content.
 * @param {string} labelUrl - The URL of the label to download.
 * @param {string} shipmentId - The unique ID of the shipment.
 * @param {string} labelType - Type of label (e.g., 'individual', 'batch').
 * @param {string} format - The format of the label (e.g., 'png', 'pdf', 'zpl').
 * @returns {Promise<string|null>} The public URL of the stored label, or null if an error occurs.
 */
const downloadAndStoreLabel = async (labelUrl, shipmentId, labelType, format = 'png') => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // Use SUPABASE_SERVICE_ROLE_KEY for Storage writes from a trusted backend
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading and storing ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    const bucketName = await ensureStorageBucket(supabase);
    const response = await fetch(labelUrl);

    if (!response.ok) {
      console.error(`Failed to download label from EasyPost: ${response.status} ${response.statusText}`);
      return null; // Return null if download fails
    }

    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);

    const timestamp = Date.now();
    // Create a unique filename to prevent conflicts and enable upsert
    const fileName = `${labelType}_labels/${labelType}_${shipmentId}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';

    console.log(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, labelBuffer, {
      contentType: contentType,
      cacheControl: '3600', // Cache for 1 hour
      upsert: true // Overwrite if a file with the same name exists (less likely with timestamped names)
    });

    if (uploadError) {
      console.error(`Failed to upload label to Supabase Storage:`, uploadError);
      return null; // Return null if upload fails
    }

    const { data: urlData } = await supabase.storage.from(bucketName).getPublicUrl(fileName);
    console.log(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error downloading and storing label:', error);
    return null; // Return null on any error
  }
};

/**
 * Stores a binary label buffer directly into Supabase Storage.
 * Used when you already have the label content in memory (e.g., after PNG to PDF conversion).
 * @param {Uint8Array} labelBuffer - The binary content of the label.
 * @param {string} shipmentId - The unique ID of the shipment.
 * @param {string} labelType - Type of label (e.g., 'individual', 'batch').
 * @param {string} format - The format of the label (e.g., 'pdf', 'png').
 * @returns {Promise<string>} The public URL of the stored label.
 * @throws {Error} If the upload to Supabase Storage fails.
 */
const storeDirectBinaryLabel = async (labelBuffer, shipmentId, labelType, format = 'pdf') => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Storing direct ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    const bucketName = await ensureStorageBucket(supabase);

    const timestamp = Date.now();
    const fileName = `${labelType}_labels/${labelType}_${shipmentId}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';

    console.log(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, labelBuffer, {
      contentType: contentType,
      cacheControl: '3600',
      upsert: true
    });

    if (uploadError) {
      console.error(`Failed to upload direct binary:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = await supabase.storage.from(bucketName).getPublicUrl(fileName);
    console.log(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error storing direct binary label:', error);
    throw error;
  }
};

/**
 * Converts a PNG image (as Uint8Array) to a PDF locally using pdf-lib.
 * @param {Uint8Array} pngBytes - The binary content of the PNG image.
 * @returns {Promise<Uint8Array>} The binary content of the generated PDF.
 * @throws {Error} If the conversion fails.
 */
const convertPngToPdfLocally = async (pngBytes) => {
  try {
    console.log('Converting PNG to PDF locally using pdf-lib');
    const pdfDoc = await PDFDocument.create();
    // Add a page with standard shipping label dimensions (4x6 inches = 288x432 points)
    const page = pdfDoc.addPage([288, 432]);

    // Embed the PNG image
    const pngImage = await pdfDoc.embedPng(pngBytes);
    // Get the dimensions of the PNG image
    const pngDims = pngImage.scale(1);

    // Calculate scaling to fit the page while maintaining aspect ratio
    const pageWidth = 288;
    const pageHeight = 432;
    const scaleX = pageWidth / pngDims.width;
    const scaleY = pageHeight / pngDims.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate centered position
    const scaledWidth = pngDims.width * scale;
    const scaledHeight = pngDims.height * scale;
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    // Draw the PNG image on the page
    page.drawImage(pngImage, {
      x: x,
      y: y,
      width: scaledWidth,
      height: scaledHeight
    });

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();
    console.log('✅ Successfully converted PNG to PDF locally');
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error converting PNG to PDF locally:', error);
    throw error;
  }
};

/**
 * Purchases a label from EasyPost for a given shipment and rate.
 * Handles cases where postage already exists.
 * @param {string} shipmentId - The EasyPost shipment ID.
 * @param {string} rateId - The EasyPost rate ID.
 * @returns {Promise<object>} The purchased EasyPost shipment object.
 * @throws {Error} If EasyPost API call fails.
 */
const purchaseEasyPostLabel = async (shipmentId, rateId) => {
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rate: {
          id: rateId
        }
      })
    });
    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      // If postage already exists, fetch the existing shipment data
      if (errorData.error?.code === 'SHIPMENT.POSTAGE.EXISTS') {
        console.log(`Postage already exists for ${shipmentId}, fetching existing data...`);
        const getResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        if (getResponse.ok) {
          const existingShipment = await getResponse.json();
          console.log(`Retrieved existing shipment data for ${shipmentId}`);
          return existingShipment; // Return existing shipment data
        }
      }
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
 * Orchestrates the download, conversion, and storage of an EasyPost label
 * into Supabase Storage, returning the EasyPost data along with the new public URLs.
 * @param {object} easypostShipmentData - The shipment object returned by EasyPost after purchase.
 * @returns {Promise<object>} The EasyPost shipment data augmented with `label_urls` and `stored_label_url`.
 */
const processAndStoreLabel = async (easypostShipmentData) => {
  const labelUrls = {};
  const postageLabel = easypostShipmentData.postage_label;

  // Ensure there's a postage label object and a label URL from EasyPost
  if (postageLabel && postageLabel.label_url) {
    let pngBytes = null;
    // Attempt to download the PNG label first
    try {
      console.log(`Downloading PNG from EasyPost for shipment ${easypostShipmentData.id}`);
      const pngResponse = await fetch(postageLabel.label_url);
      if (pngResponse.ok) {
        const pngBlob = await pngResponse.blob();
        const pngArrayBuffer = await pngBlob.arrayBuffer();
        pngBytes = new Uint8Array(pngArrayBuffer);

        // Store the downloaded PNG in Supabase Storage
        const storedPngUrl = await storeDirectBinaryLabel(pngBytes, easypostShipmentData.id, 'individual', 'png');
        if (storedPngUrl) {
          labelUrls['png'] = storedPngUrl;
          console.log(`✅ Stored PNG label for shipment ${easypostShipmentData.id}`);
        }
      } else {
        console.warn(`Could not download PNG from EasyPost for ${easypostShipmentData.id}: ${pngResponse.status} ${pngResponse.statusText}`);
      }
    } catch (error) {
      console.error(`Error downloading PNG for ${easypostShipmentData.id}:`, error);
    }

    // If PNG bytes were obtained, convert to PDF locally and store the PDF
    if (pngBytes) {
      try {
        console.log(`Converting PNG to PDF locally for shipment ${easypostShipmentData.id}`);
        const pdfBytes = await convertPngToPdfLocally(pngBytes);
        const storedPdfUrl = await storeDirectBinaryLabel(pdfBytes, easypostShipmentData.id, 'individual', 'pdf');
        if (storedPdfUrl) {
          labelUrls['pdf'] = storedPdfUrl;
          console.log(`✅ Converted and stored PDF label for shipment ${easypostShipmentData.id}`);
        }
      } catch (error) {
        console.error(`Error converting PNG to PDF for ${easypostShipmentData.id}:`, error);
      }
    }

    // If a ZPL label URL is available, download and store it
    if (postageLabel.label_zpl_url) {
      try {
        const storedZplUrl = await downloadAndStoreLabel(postageLabel.label_zpl_url, easypostShipmentData.id, 'individual', 'zpl');
        if (storedZplUrl) {
          labelUrls['zpl'] = storedZplUrl;
          console.log(`✅ Stored ZPL label for shipment ${easypostShipmentData.id}`);
        }
      } catch (error) {
        console.error(`Error storing ZPL label for ${easypostShipmentData.id}:`, error);
      }
    }
  } else {
    console.warn(`No postage_label or label_url found in EasyPost response for shipment ${easypostShipmentData.id}. Label files will not be stored.`);
  }

  // Return the original EasyPost data, plus the new map of stored label URLs,
  // and a primary stored_label_url (preferring PDF, then PNG, fallback to original EasyPost URL)
  return {
    ...easypostShipmentData,
    label_urls: labelUrls,
    stored_label_url: labelUrls['pdf'] || labelUrls['png'] || easypostShipmentData.postage_label?.label_url,
  };
};


// Main Deno Edge Function handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Get the user's JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'No authorization header'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }

    // Create a Supabase client with user authentication
    // Note: This client uses the anon key and user JWT for Row-Level Security
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError?.message);
      return new Response(JSON.stringify({
        error: 'User not authenticated'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }

    const { shipments, pickupAddress, labelOptions = {} } = await req.json();

    if (!shipments || !Array.isArray(shipments)) {
      return new Response(JSON.stringify({
        error: 'Invalid shipments data'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }

    console.log(`Processing ${shipments.length} shipments for label creation for user: ${user.id}`);

    const processedLabels = [];
    const failedLabels = [];

    // Process individual labels one by one
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id} for user: ${user.id}`);
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // 1. Purchase the label from EasyPost
        const easypostLabelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId);

        // 2. Process and store the label in Supabase Storage
        // This function will download the label, convert (if PNG), and upload,
        // returning the original EasyPost data along with the new public URLs from Supabase Storage.
        const labelWithStoredUrls = await processAndStoreLabel(easypostLabelData);

        // Prepare the record for database insertion, using the stored_label_url
        const shipmentRecord = {
          user_id: user.id,
          // Use the EasyPost ID as the shipment_id for your database record if it's unique
          shipment_id: shipment.easypost_id,
          rate_id: shipment.selectedRateId,
          tracking_code: labelWithStoredUrls.tracking_code,
          label_url: labelWithStoredUrls.stored_label_url, // THIS IS THE KEY CHANGE: Use the public URL from Supabase Storage
          status: 'created',
          carrier: labelWithStoredUrls.selected_rate?.carrier,
          service: labelWithStoredUrls.selected_rate?.service,
          delivery_days: labelWithStoredUrls.selected_rate?.delivery_days || null,
          charged_rate: labelWithStoredUrls.selected_rate?.rate || null,
          easypost_rate: labelWithStoredUrls.selected_rate?.rate || null,
          currency: labelWithStoredUrls.selected_rate?.currency || 'USD',
          // Determine format based on what was successfully stored
          label_format: labelOptions.label_format || (labelWithStoredUrls.label_urls['pdf'] ? "PDF" : (labelWithStoredUrls.label_urls['png'] ? "PNG" : "UNKNOWN")),
          label_size: labelOptions.label_size || "4x6",
          is_international: false, // You might need logic to determine this from shipment data
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Save tracking record to Supabase database (using the user's client with RLS)
        const { error: dbError } = await supabaseClient.from('shipment_records').insert(shipmentRecord);
        if (dbError) {
          console.error('Error saving bulk shipment record to Supabase DB:', dbError);
          // You might want to push to failedLabels here as well,
          // or mark the processedLabel as failed to save to DB.
        } else {
          console.log(`Successfully saved tracking record for bulk shipment ${shipment.id} to DB.`);
        }

        // Prepare the response object for the frontend
        const processedLabel = {
          ...shipment,
          ...labelWithStoredUrls, // Include all EasyPost data and new stored label URLs
          status: 'completed',
          customer_name: labelWithStoredUrls.to_address?.name || shipment.details?.to_name || shipment.recipient,
          customer_address: `${labelWithStoredUrls.to_address?.street1 || shipment.details?.to_street1}, ${labelWithStoredUrls.to_address?.city || shipment.details?.to_city}, ${labelWithStoredUrls.to_address?.state || shipment.details?.to_state} ${labelWithStoredUrls.to_address?.zip || shipment.details?.to_zip}`,
          stored_label_url: labelWithStoredUrls.stored_label_url, // Explicitly add for clarity in the response
        };
        processedLabels.push(processedLabel);

        console.log(`✅ Successfully processed shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);

        // Add delay between shipments to avoid rate limiting
        if (i < shipments.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
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

    console.log(`✅ Bulk processing complete for user ${user.id}: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(JSON.stringify({
      success: true,
      processedLabels,
      failedLabels,
      total: shipments.length,
      successful: processedLabels.length,
      failed: failedLabels.length,
      message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels with Supabase Storage and tracking`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(JSON.stringify({
      error: 'Label Creation Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
