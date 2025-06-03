
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

async function getShipmentIdFromTracking(trackingCode, purchasedShipments) {
  if (!purchasedShipments || purchasedShipments.length === 0) return null;
  const foundShipment = purchasedShipments.find((s) => s.tracking_code === trackingCode);
  return foundShipment ? foundShipment.id : null;
}

// Helper to download content from a URL
async function downloadLabelContent(sourceUrl, context) {
  console.log(`[DOWNLOAD_CONTENT_START] Attempting to download for ${context} from URL: ${sourceUrl}`);
  if (!sourceUrl || typeof sourceUrl !== 'string') {
    console.warn(`[DOWNLOAD_CONTENT_WARN] Invalid or missing URL for ${context}: ${sourceUrl}. Skipping download.`);
    return null;
  }
  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'YourApp-ShippingClient/1.0'
      }
    });
    const responseContentType = response.headers.get('Content-Type');
    console.log(`[DOWNLOAD_CONTENT_STATUS] For ${context} from ${sourceUrl}: ${response.status} ${response.statusText}, Content-Type: ${responseContentType}`);
    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (e) { /* ignore */ }
      console.warn(`[DOWNLOAD_CONTENT_FAILED] Status: ${response.status}. Body: ${errorBody.substring(0, 300)}`);
      return null;
    }
    const labelArrayBuffer = await response.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    console.log(`[DOWNLOAD_CONTENT_INFO] For ${context} - downloaded labelBuffer.length: ${labelBuffer.length} bytes.`);
    if (labelBuffer.length === 0) {
      console.warn(`[DOWNLOAD_CONTENT_WARN] Downloaded content for ${context} is empty (0 bytes).`);
      return null;
    }
    return labelBuffer;
  } catch (error) {
    console.error(`[DOWNLOAD_CONTENT_ERROR] Error downloading for ${context} from ${sourceUrl}:`, error);
    return null;
  }
}

// Helper to save a buffer to Supabase
async function saveLabelBufferToSupabase(
  labelBuffer,
  baseName,
  saveAsFormatKey,
  userId,
  storageFolder,
  dbMetadata
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[SAVE_LABEL_ERROR] Supabase URL or Service Key missing!');
    return null;
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const formatConfig = {
    png: {
      contentType: 'image/png',
      extension: 'png'
    },
    pdf: {
      contentType: 'application/pdf',
      extension: 'pdf'
    }
  };
  const targetFormat = formatConfig[saveAsFormatKey];
  if (!targetFormat) {
    console.error(`[SAVE_LABEL_ERROR] Invalid saveAsFormatKey '${saveAsFormatKey}' for ${baseName}.`);
    return null;
  }
  const timestamp = Date.now();
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `shipping_label_${sanitizedBaseName}_${timestamp}.${targetFormat.extension}`;
  const safeStorageFolder = storageFolder.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `${safeStorageFolder}/${fileName}`;
  console.log(`[SAVE_LABEL_ATTEMPT] Uploading to Supabase: ${filePath}, as ${saveAsFormatKey.toUpperCase()}, size: ${labelBuffer.length} bytes, contentType: ${targetFormat.contentType}`);
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('shipping-labels-2')
    .upload(filePath, labelBuffer, {
      contentType: targetFormat.contentType,
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    console.error(`[SAVE_LABEL_UPLOAD_ERROR] Supabase upload failed for ${filePath}:`, JSON.stringify(uploadError));
    return null;
  }
  console.log(`[SAVE_LABEL_UPLOAD_SUCCESS] Successfully uploaded ${filePath}. Path: ${uploadData?.path}`);
  
  let publicUrl = null;
  const { data: urlData } = supabase.storage.from('shipping-labels-2').getPublicUrl(filePath);
  if (urlData && urlData.publicUrl && urlData.publicUrl.trim() !== "") {
    publicUrl = urlData.publicUrl;
    console.log(`[SAVE_LABEL_GET_URL_SUCCESS] Public URL for ${filePath}: ${publicUrl}`);
  } else {
    console.warn(`[SAVE_LABEL_GET_URL_WARN] No valid publicUrl for ${filePath}.`);
  }
  
  const dbRecord = {
    user_id: userId,
    batch_id: storageFolder,
    easypost_batch_id: dbMetadata.easypost_batch_id,
    easypost_shipment_id: dbMetadata.easypost_shipment_id,
    tracking_code: dbMetadata.tracking_code,
    file_name: fileName,
    file_path: filePath,
    file_size: labelBuffer.length,
    file_type: saveAsFormatKey.toUpperCase() + (dbMetadata.isConsolidated ? '_CONSOLIDATED' : ''),
    upload_status: 'completed',
    public_url: publicUrl
  };
  
  console.log(`[SAVE_LABEL_DB_INSERT_ATTEMPT] For ${filePath}:`, JSON.stringify(dbRecord));
  const { error: insertError } = await supabase.from('bulk_label_uploads').insert(dbRecord);
  if (insertError) {
    console.error(`[SAVE_LABEL_DB_INSERT_ERROR] For ${filePath}:`, JSON.stringify(insertError));
  } else {
    console.log(`[SAVE_LABEL_DB_INSERT_SUCCESS] For ${filePath}`);
  }
  
  return publicUrl;
}

const createEasyPostBulkLabels = async (shipmentsFromUser, userId, labelOptions = {}) => {
  console.log('[CREATE_BULK_LABELS_START]', {
    numShipments: shipmentsFromUser?.length || 0,
    userId
  });
  
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    console.error('[CREATE_BULK_LABELS_ERROR] CRITICAL: EASYPOST_API_KEY is missing!');
    return {
      status: 'error_configuration',
      message: 'EasyPost API key not configured.',
      labels: [],
      bulk_label_png_url: null,
      bulk_label_pdf_url: null
    };
  }
  
  const processedLabelsInfo = [];
  const successfullyPurchasedEasypostShipments = [];
  const storageFolderForThisRun = `user_${userId}_batch_${Date.now()}`;
  
  if (!shipmentsFromUser || shipmentsFromUser.length === 0) {
    console.warn('[CREATE_BULK_LABELS_WARN] shipmentsFromUser array is empty or null.');
    return {
      status: 'no_shipments_provided',
      labels: [],
      bulk_label_png_url: null,
      bulk_label_pdf_url: null
    };
  }
  
  // Process Individual Labels
  for (const shipmentData of shipmentsFromUser) {
    if (!shipmentData || !shipmentData.easypost_id || !shipmentData.selectedRateId) {
      console.warn('[INDIVIDUAL_SHIPMENT_SKIP] Skipping: missing easypost_id or selectedRateId:', JSON.stringify(shipmentData));
      processedLabelsInfo.push({
        shipment_id: shipmentData?.id || 'unknown',
        status: 'error_missing_input',
        label_urls: {
          png: null
        }
      });
      continue;
    }
    
    try {
      console.log(`[INDIVIDUAL_SHIPMENT_START] Processing your shipment ID ${shipmentData.id} with EP ID: ${shipmentData.easypost_id}`);
      const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.easypost_id}/buy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rate: {
            id: shipmentData.selectedRateId
          }
        })
      });
      
      if (!buyResponse.ok) {
        const errorData = await buyResponse.json().catch(() => ({
          error: { message: "Unknown error reading buy response" }
        }));
        console.error(`[INDIVIDUAL_SHIPMENT_BUY_FAIL] EP ID ${shipmentData.easypost_id}:`, JSON.stringify(errorData));
        processedLabelsInfo.push({
          shipment_id: shipmentData.id,
          status: 'error_buy',
          error: errorData?.error?.message,
          label_urls: { png: null },
          easypost_id: shipmentData.easypost_id
        });
        continue;
      }
      
      const purchasedShipment = await buyResponse.json();
      console.log(`[INDIVIDUAL_SHIPMENT_BOUGHT] EP ID: ${purchasedShipment.id}, Tracking: ${purchasedShipment.tracking_code}`);
      successfullyPurchasedEasypostShipments.push(purchasedShipment);
      
      let individualLabelPngUrl = null;
      const easyPostIndividualLabelLink = purchasedShipment.postage_label?.label_png_url || purchasedShipment.postage_label?.label_url;
      if (purchasedShipment.postage_label && purchasedShipment.tracking_code && easyPostIndividualLabelLink) {
        console.log(`[INDIVIDUAL_LABEL_INFO] Primary EasyPost link for individual label (expected PNG): ${easyPostIndividualLabelLink}`);
        const labelBuffer = await downloadLabelContent(easyPostIndividualLabelLink, `individual_label_${purchasedShipment.tracking_code}`);
        if (labelBuffer) {
          individualLabelPngUrl = await saveLabelBufferToSupabase(
            labelBuffer,
            purchasedShipment.tracking_code,
            'png',
            userId,
            storageFolderForThisRun,
            {
              isConsolidated: false,
              easypost_batch_id: null,
              easypost_shipment_id: purchasedShipment.id,
              tracking_code: purchasedShipment.tracking_code
            }
          );
        }
      }
      
      const dropOffAddress = `${purchasedShipment.from_address?.street1 || ''}, ${purchasedShipment.from_address?.city || ''}, ${purchasedShipment.from_address?.state || ''} ${purchasedShipment.from_address?.zip || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '');
      const trackingUrl = purchasedShipment.tracker?.public_url || `https://tools.usps.com/go/TrackConfirmAction?tLabels=${purchasedShipment.tracking_code}`;
      
      processedLabelsInfo.push({
        shipment_id: shipmentData.id,
        status: individualLabelPngUrl ? 'success_individual_png_saved' : 'warning_individual_png_not_saved',
        recipient_name: purchasedShipment.to_address?.name || shipmentData.details?.to_name || shipmentData.recipient,
        drop_off_address: dropOffAddress,
        tracking_number: purchasedShipment.tracking_code,
        tracking_url: trackingUrl,
        label_urls: {
          pdf: null,
          png: individualLabelPngUrl,
          zpl: null
        },
        carrier: purchasedShipment.selected_rate?.carrier || 'Unknown',
        service: purchasedShipment.selected_rate?.service || 'Unknown',
        rate: purchasedShipment.selected_rate?.rate || 0,
        easypost_id: purchasedShipment.id,
        batch_id_storage_path: storageFolderForThisRun
      });
    } catch (error) {
      console.error(`[INDIVIDUAL_SHIPMENT_ERROR] Processing shipment ${shipmentData.id}:`, error);
      processedLabelsInfo.push({
        shipment_id: shipmentData.id,
        status: 'error_exception',
        error: error.message,
        label_urls: { png: null }
      });
    }
  }
  
  // Consolidated batch label generation
  let finalConsolidatedPngUrl = null;
  let finalConsolidatedPdfUrl = null;
  
  if (successfullyPurchasedEasypostShipments.length > 0) {
    const batchShipmentPayload = successfullyPurchasedEasypostShipments.map((sh) => ({ id: sh.id }));
    
    try {
      console.log(`[CONSOLIDATED_BATCH_CREATE] Attempting to create EasyPost batch with ${batchShipmentPayload.length} shipments.`);
      const createBatchResponse = await fetch(`https://api.easypost.com/v2/batches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch: { shipments: batchShipmentPayload }
        })
      });
      
      if (createBatchResponse.ok) {
        let batch = await createBatchResponse.json();
        const easyPostBatchId = batch.id;
        console.log(`[CONSOLIDATED_BATCH_CREATED] ID: ${easyPostBatchId}`);
        
        const generateLabelResponse = await fetch(`https://api.easypost.com/v2/batches/${easyPostBatchId}/label`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ file_format: "pdf" })
        });
        
        if (generateLabelResponse.ok) {
          batch = await generateLabelResponse.json();
          console.log(`[CONSOLIDATED_LABEL_GENERATE_SUCCESS] Label requested for batch ${easyPostBatchId}`);
          
          // Poll for label URL
          let easyPostConsolidatedLink = null;
          let attempts = 0;
          const maxAttempts = 15;
          const delayMs = 5000;
          
          while (attempts < maxAttempts) {
            if (batch.label_url) {
              easyPostConsolidatedLink = batch.label_url;
              console.log(`[CONSOLIDATED_LABEL_URL_FOUND] EasyPost URL: ${easyPostConsolidatedLink}`);
              break;
            }
            
            if (['failed', 'creation_failed', 'label_generation_failed'].includes(batch.state)) {
              console.error(`[CONSOLIDATED_LABEL_POLL_BATCH_FAILED_STATE] Batch ${easyPostBatchId} failed: ${batch.state}`);
              break;
            }
            
            attempts++;
            if (attempts >= maxAttempts) {
              console.warn(`[CONSOLIDATED_LABEL_POLL_TIMEOUT] Batch ${easyPostBatchId}`);
              break;
            }
            
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            const batchStatusResponse = await fetch(`https://api.easypost.com/v2/batches/${easyPostBatchId}`, {
              headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            
            if (batchStatusResponse.ok) {
              batch = await batchStatusResponse.json();
              console.log(`[CONSOLIDATED_LABEL_POLL_STATUS] Batch ${easyPostBatchId} state: ${batch.state}`);
            }
          }
          
          if (easyPostConsolidatedLink) {
            const consolidatedLabelBuffer = await downloadLabelContent(easyPostConsolidatedLink, `consolidated_batch_${easyPostBatchId}`);
            if (consolidatedLabelBuffer) {
              const dbMeta = {
                isConsolidated: true,
                easypost_batch_id: easyPostBatchId,
                easypost_shipment_id: null,
                tracking_code: null
              };
              
              finalConsolidatedPngUrl = await saveLabelBufferToSupabase(
                consolidatedLabelBuffer,
                `batch_${easyPostBatchId}_consolidated`,
                'png',
                userId,
                storageFolderForThisRun,
                dbMeta
              );
              
              finalConsolidatedPdfUrl = await saveLabelBufferToSupabase(
                consolidatedLabelBuffer,
                `batch_${easyPostBatchId}_consolidated`,
                'pdf',
                userId,
                storageFolderForThisRun,
                dbMeta
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('[CONSOLIDATED_BATCH_ERROR] Unexpected error:', error);
    }
  }
  
  return {
    status: 'finished_processing',
    labels: processedLabelsInfo,
    bulk_label_png_url: finalConsolidatedPngUrl,
    bulk_label_pdf_url: finalConsolidatedPdfUrl,
    total_labels_input: shipmentsFromUser.length,
    total_labels_purchased_successfully_from_easypost: successfullyPurchasedEasypostShipments.length
  };
};

// Main Deno server function
serve(async (req) => {
  console.log(`[REQUEST_RECEIVED] Method: ${req.method}, URL: ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const easyPostApiKey = Deno.env.get('EASYPOST_API_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !easyPostApiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503
      });
    }
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No or invalid authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }
    
    const supabaseForAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabaseForAuth.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication', details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }
    
    const requestBody = await req.json();
    const { shipments, labelOptions = {} } = requestBody;
    
    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or empty shipments data.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    const result = await createEasyPostBulkLabels(shipments, user.id, labelOptions);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error(`[MAIN_HANDLER_ERROR] Uncaught error:`, error);
    return new Response(JSON.stringify({ error: 'Server Error', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
