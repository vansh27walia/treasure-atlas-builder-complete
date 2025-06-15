import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "npm:pdf-lib";

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
    
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, labelBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`Failed to upload:`, uploadError);
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

const storeDirectBinaryLabel = async (labelBuffer: Uint8Array, shipmentId: string, labelType: string, format: string = 'pdf'): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Storing ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    
    const bucketName = await ensureStorageBucket(supabase);
    
    const timestamp = Date.now();
    const fileName = `${labelType}_labels/${labelType}_${shipmentId}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';
    
    console.log(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, labelBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`Failed to upload:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error storing label:', error);
    throw error;
  }
};

const convertPngToPdfLocally = async (pngBytes: Uint8Array): Promise<Uint8Array> => {
  try {
    console.log('Converting PNG to PDF locally using pdf-lib');
    
    // Create a new PDF document
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
      height: scaledHeight,
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

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string) => {
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
        rate: { id: rateId }
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
          return existingShipment;
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

const generateAllFormatsForShipment = async (shipment: any) => {
  console.log(`Generating all formats for shipment ${shipment.easypost_id}`);
  
  // Purchase the label first
  const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId);
  
  const labelUrls: Record<string, string> = {};
  
  const postageLabel = labelData.postage_label;

  if (postageLabel) {
    // Store PNG first and get PNG bytes for PDF conversion
    let pngBytes: Uint8Array | null = null;
    
    if (postageLabel.label_url) {
      try {
        console.log(`Downloading PNG for shipment ${shipment.easypost_id}`);
        const pngResponse = await fetch(postageLabel.label_url);
        if (pngResponse.ok) {
          const pngBlob = await pngResponse.blob();
          const pngArrayBuffer = await pngBlob.arrayBuffer();
          pngBytes = new Uint8Array(pngArrayBuffer);
          
          // Store PNG using existing function
          const storedPngUrl = await storeDirectBinaryLabel(pngBytes, shipment.easypost_id, 'individual', 'png');
          labelUrls['png'] = storedPngUrl;
          console.log(`✅ Successfully stored PNG label for shipment ${shipment.easypost_id}`);
        }
      } catch (error) {
        console.error(`Error downloading PNG for ${shipment.easypost_id}:`, error);
      }
    }

    // Convert PNG to PDF locally and store
    if (pngBytes) {
      try {
        console.log(`Converting PNG to PDF locally for shipment ${shipment.easypost_id}`);
        const pdfBytes = await convertPngToPdfLocally(pngBytes);
        const storedPdfUrl = await storeDirectBinaryLabel(pdfBytes, shipment.easypost_id, 'individual', 'pdf');
        labelUrls['pdf'] = storedPdfUrl;
        console.log(`✅ Successfully converted and stored PDF label for shipment ${shipment.easypost_id}`);
      } catch (error) {
        console.error(`Error converting PNG to PDF for ${shipment.easypost_id}:`, error);
      }
    }

    // Store ZPL if available
    if (postageLabel.label_zpl_url) {
      try {
        const storedZplUrl = await downloadAndStoreLabel(postageLabel.label_zpl_url, shipment.easypost_id, 'individual', 'zpl');
        labelUrls['zpl'] = storedZplUrl;
        console.log(`✅ Successfully stored ZPL label for shipment ${shipment.easypost_id}`);
      } catch (error) {
        console.error(`Error storing ZPL label for ${shipment.easypost_id}:`, error);
      }
    }
  } else {
    console.warn(`No postage_label object found for shipment ${shipment.easypost_id}`);
  }

  // Wait between shipments to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    ...labelData,
    label_urls: labelUrls,
    id: labelData.id,
    tracking_code: labelData.tracking_code,
    label_url: labelUrls['pdf'] || labelUrls['png'] || postageLabel?.label_url, // Prioritize PDF
    carrier: labelData.selected_rate?.carrier,
    service: labelData.selected_rate?.service,
    rate: labelData.selected_rate?.rate,
    customer_name: labelData.to_address?.name,
    customer_address: `${labelData.to_address?.street1}, ${labelData.to_address?.city}, ${labelData.to_address?.state} ${labelData.to_address?.zip}`,
    customer_phone: labelData.to_address?.phone,
    customer_email: labelData.to_address?.email,
    customer_company: labelData.to_address?.company,
  };
};

const processEasyPostBatch = async (easyPostShipmentIds: string[]) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  console.log(`Creating batch with ${easyPostShipmentIds.length} shipments`);
  
  // Create batch
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
  const batchId = batchData.id;
  console.log(`Created batch with ID: ${batchId}`);

  // Buy the batch
  console.log(`Purchasing batch ${batchId}`);
  const buyBatchResponse = await fetch(`https://api.easypost.com/v2/batches/${batchId}/buy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!buyBatchResponse.ok) {
    const errorData = await buyBatchResponse.json();
    console.warn(`Failed to buy batch: ${errorData.error?.message || 'Unknown error'}`);
  }

  // Wait for batch to be ready
  console.log(`Waiting for batch ${batchId} to be ready`);
  let batchReady = false;
  let pollAttempts = 0;
  const maxPollAttempts = 30;

  while (!batchReady && pollAttempts < maxPollAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const batchStatusResponse = await fetch(`https://api.easypost.com/v2/batches/${batchId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (batchStatusResponse.ok) {
      const batchStatus = await batchStatusResponse.json();
      console.log(`Batch ${batchId} status: ${batchStatus.state}, num_shipments: ${batchStatus.num_shipments}`);

      if (batchStatus.state === 'purchased' || batchStatus.state === 'label_generated') {
        batchReady = true;
        console.log(`Batch ${batchId} is ready for label generation`);
      } else {
        pollAttempts++;
      }
    } else {
      pollAttempts++;
    }
  }

  if (!batchReady) {
    throw new Error(`Batch ${batchId} did not become ready within expected time`);
  }

  // Generate consolidated labels in different formats
  const consolidatedLabelUrls: Record<string, string> = {};
  const batchFormats = ['pdf', 'zpl', 'epl'];
  
  for (const format of batchFormats) {
    try {
      console.log(`Generating consolidated ${format.toUpperCase()} label for batch ${batchId}`);
      
      const generateLabelResponse = await fetch(`https://api.easypost.com/v2/batches/${batchId}/label`, {
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

      // Wait for label generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get the batch again to retrieve label URL
      const finalBatchResponse = await fetch(`https://api.easypost.com/v2/batches/${batchId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (finalBatchResponse.ok) {
        const finalBatch = await finalBatchResponse.json();
        let consolidatedLabelUrl = finalBatch.label_url;

        if (consolidatedLabelUrl) {
          const storedUrl = await downloadAndStoreLabel(consolidatedLabelUrl, batchId, 'batch', format);
          consolidatedLabelUrls[format] = storedUrl;
          console.log(`✅ Stored consolidated ${format.toUpperCase()} label for batch ${batchId}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (labelError) {
      console.error(`Error generating consolidated ${format.toUpperCase()} label:`, labelError);
    }
  }

  // Generate scan form (manifest)
  let scanFormUrl = null;
  try {
    console.log(`Generating scan form for batch ${batchId}`);
    
    const scanFormResponse = await fetch(`https://api.easypost.com/v2/batches/${batchId}/scan_form`, {
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
    batchId,
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

    // Process individual labels with all formats
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Generate individual labels in all formats
        const labelData = await generateAllFormatsForShipment(shipment);

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

        // Add delay between shipments to avoid rate limiting
        if (i < shipments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay
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

    // Generate batch/consolidated labels if requested and we have successful labels
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
        message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels with local PDF conversion`,
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
