
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LabelOptions {
  format?: string;
  size?: string;
  generateBatch?: boolean;
  generateManifest?: boolean;
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

const downloadAndStoreLabel = async (labelUrl: string, shipmentId: string, labelType: string, format: string = 'png'): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading and storing ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    
    const bucketName = await ensureStorageBucket(supabase);
    
    const response = await fetch(labelUrl);
    if (!response.ok) {
      console.error(`Failed to download label: ${response.status} ${response.statusText}`);
      return labelUrl;
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    const timestamp = Date.now();
    const fileName = `${labelType}_labels/${labelType}_${shipmentId}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';
    
    console.log(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    
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
      return labelUrl;
    }
    
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error downloading and storing label:', error);
    return labelUrl;
  }
};

const generateIndividualLabelsAllFormats = async (shipmentId: string, rateId: string) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  console.log(`Generating individual labels in all formats for shipment ${shipmentId}`);
  
  // First purchase the label in PNG format
  let labelData = await purchaseEasyPostLabel(shipmentId, rateId, 'PNG');
  const labelUrls: Record<string, string> = {};

  // Define desired formats for individual labels
  const formatsToExtract = ['PNG', 'PDF', 'ZPL'];

  for (const format of formatsToExtract) {
    try {
      console.log(`Attempting to fetch ${format} label for shipment ${shipmentId}`);
      let formatLabelUrl = labelData.label_url;

      // If format is not PNG, request specific format from EasyPost
      if (format !== 'PNG') {
        const formatResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            label_format: format,
            label_size: '4x6'
          })
        });

        if (formatResponse.ok) {
          const formatData = await formatResponse.json();
          formatLabelUrl = formatData.postage_label?.label_url || formatData.label_url;
          console.log(`Retrieved ${format} label URL for shipment ${shipmentId}`);
        } else {
          const errorData = await formatResponse.json();
          console.warn(`Could not get ${format} label from EasyPost for shipment ${shipmentId}: ${errorData.error?.message || 'Unknown error'}`);
          continue;
        }
      }

      if (formatLabelUrl) {
        const storedLabelUrl = await downloadAndStoreLabel(formatLabelUrl, shipmentId, 'individual', format.toLowerCase());
        labelUrls[format.toLowerCase()] = storedLabelUrl;
        console.log(`✅ Successfully generated and stored ${format} label for shipment ${shipmentId}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (formatError) {
      console.error(`Failed to generate ${format} label for shipment ${shipmentId}:`, formatError);
    }
  }

  return { ...labelData, label_urls: labelUrls };
};

const processEasyPostBatch = async (easyPostShipmentIds: string[], easyPostBatchId?: string) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  let batchIdToProcess = easyPostBatchId;

  // Create batch if not provided
  if (!batchIdToProcess && easyPostShipmentIds?.length > 0) {
    console.log(`Creating new batch with ${easyPostShipmentIds.length} shipments`);
    const createBatchResponse = await fetch('https://api.easypost.com/v2/batches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        batch: {
          shipments: easyPostShipmentIds.map(id => ({ id }))
        }
      })
    });

    if (!createBatchResponse.ok) {
      const errorData = await createBatchResponse.json();
      throw new Error(`Failed to create batch: ${errorData.error?.message || 'Unknown error'}`);
    }

    const batchData = await createBatchResponse.json();
    batchIdToProcess = batchData.id;
    console.log(`Created batch with ID: ${batchIdToProcess}`);
  }

  if (!batchIdToProcess) {
    throw new Error('No batch ID available for processing');
  }

  // Poll batch status until ready
  console.log(`Polling batch status for batch ${batchIdToProcess}`);
  let batchReady = false;
  let pollAttempts = 0;
  const maxPollAttempts = 30;

  while (!batchReady && pollAttempts < maxPollAttempts) {
    const batchStatusResponse = await fetch(`https://api.easypost.com/v2/batches/${batchIdToProcess}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (batchStatusResponse.ok) {
      const batchStatus = await batchStatusResponse.json();
      console.log(`Batch ${batchIdToProcess} status: ${batchStatus.state}`);

      if (batchStatus.state === 'purchased' || batchStatus.state === 'label_generated') {
        batchReady = true;
        console.log(`Batch ${batchIdToProcess} is ready for label generation`);
      } else {
        pollAttempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      pollAttempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (!batchReady) {
    throw new Error(`Batch ${batchIdToProcess} did not become ready within expected time`);
  }

  // Generate consolidated labels in all formats
  const consolidatedLabelUrls: Record<string, string> = {};
  const batchFormats = ['PDF', 'PNG', 'ZPL', 'EPL2'];
  
  for (const format of batchFormats) {
    try {
      console.log(`Generating consolidated ${format} label for batch ${batchIdToProcess}`);
      
      const generateLabelResponse = await fetch(`https://api.easypost.com/v2/batches/${batchIdToProcess}/label`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_format: format
        })
      });

      if (!generateLabelResponse.ok) {
        const errorData = await generateLabelResponse.json();
        console.warn(`Failed to generate consolidated ${format} label: ${errorData.error?.message || 'Unknown error'}`);
        continue;
      }

      // Re-fetch batch to get label URL
      const finalBatchResponse = await fetch(`https://api.easypost.com/v2/batches/${batchIdToProcess}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (finalBatchResponse.ok) {
        const finalBatch = await finalBatchResponse.json();
        let consolidatedLabelUrl;

        if (finalBatch.label_url) {
          consolidatedLabelUrl = finalBatch.label_url;
        }

        if (consolidatedLabelUrl) {
          const storedUrl = await downloadAndStoreLabel(consolidatedLabelUrl, batchIdToProcess, 'batch', format.toLowerCase());
          consolidatedLabelUrls[format.toLowerCase()] = storedUrl;
          console.log(`✅ Stored consolidated ${format} label for batch ${batchIdToProcess}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (labelError) {
      console.error(`Error generating consolidated ${format} label:`, labelError);
    }
  }

  // Generate scan form (manifest)
  let scanFormUrl = null;
  try {
    console.log(`Generating scan form for batch ${batchIdToProcess}`);
    
    const scanFormResponse = await fetch(`https://api.easypost.com/v2/batches/${batchIdToProcess}/scan_form`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (scanFormResponse.ok) {
      const scanFormData = await scanFormResponse.json();
      if (scanFormData.form_url) {
        scanFormUrl = await downloadAndStoreLabel(scanFormData.form_url, scanFormData.id, 'scan_form', 'pdf');
        console.log(`✅ Successfully generated and stored scan form: ${scanFormUrl}`);
      }
    } else {
      const errorData = await scanFormResponse.json();
      console.warn(`Failed to generate scan form: ${errorData.error?.message || 'Unknown error'}`);
    }
  } catch (scanFormError) {
    console.error(`Error generating scan form:`, scanFormError);
  }

  return {
    batchId: batchIdToProcess,
    consolidatedLabelUrls,
    scanFormUrl
  };
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
    let batchResult = null;

    // Process individual labels with all formats (PNG, PDF, ZPL)
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Generate individual labels in all formats
        const labelData = await generateIndividualLabelsAllFormats(shipment.easypost_id, shipment.selectedRateId);

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
        console.log(`✅ Successfully processed shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);

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

    // Generate batch/consolidated labels if requested
    if (labelOptions.generateBatch && processedLabels.length > 0) {
      try {
        console.log('Generating batch/consolidated labels and manifest');
        const easyPostIds = processedLabels.map(label => label.id);
        batchResult = await processEasyPostBatch(easyPostIds);
        console.log('✅ Successfully generated batch labels and manifest');
      } catch (batchError) {
        console.error('❌ Failed to generate batch labels:', batchError);
      }
    }

    console.log(`✅ Processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        batchResult,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels with multiple formats`,
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
