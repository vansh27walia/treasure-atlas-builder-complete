import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "npm:pdf-lib";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Validate and set defaults for customs data
const validateCustomsData = (customsData: any) => {
  if (!customsData || !customsData.customs_items || customsData.customs_items.length === 0) {
    throw new Error('Customs items are required for international shipments');
  }

  // Set defaults for required fields
  const validatedCustomsData = {
    contents_type: customsData.contents_type || 'merchandise',
    contents_explanation: customsData.contents_explanation || '',
    customs_certify: customsData.customs_certify !== false, // default to true
    customs_signer: customsData.customs_signer || 'Shipper',
    non_delivery_option: customsData.non_delivery_option || 'return',
    restriction_type: customsData.restriction_type || 'none',
    restriction_comments: customsData.restriction_comments || '',
    eel_pfc: customsData.eel_pfc || 'NOEEI 30.37(a)',
    customs_items: customsData.customs_items.map((item: any) => ({
      description: item.description || 'Item',
      quantity: parseInt(item.quantity) || 1,
      weight: parseFloat(item.weight) || 1,
      value: parseFloat(item.value) || 1,
      hs_tariff_number: item.hs_tariff_number || '',
      origin_country: item.origin_country || 'US'
    }))
  };

  // Validate required fields
  validatedCustomsData.customs_items.forEach((item, index) => {
    if (!item.description || item.description.trim() === '') {
      throw new Error(`Item ${index + 1}: Description is required`);
    }
    if (item.value <= 0) {
      throw new Error(`Item ${index + 1}: Value must be greater than 0`);
    }
    if (item.weight <= 0) {
      throw new Error(`Item ${index + 1}: Weight must be greater than 0`);
    }
  });

  if (!validatedCustomsData.customs_signer || validatedCustomsData.customs_signer.trim() === '') {
    throw new Error('Customs signer name is required');
  }

  return validatedCustomsData;
};

// Validate that return address has phone number for international shipments
const validateReturnAddressPhone = async (shipmentId: string) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    // Get shipment details to check from_address
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve shipment details');
    }

    const shipment = await response.json();
    
    if (!shipment.from_address || !shipment.from_address.phone) {
      throw new Error('Sender phone number is required for international shipments. Please add a phone number to your return address.');
    }

    console.log(`✅ Return address phone validation passed for shipment ${shipmentId}`);
    return true;
  } catch (error) {
    console.error(`❌ Return address phone validation failed for shipment ${shipmentId}:`, error);
    throw error;
  }
};

const ensureStorageBucket = async (supabase: any): Promise<string> => {
  try {
    console.log('Using shipping-labels-2 bucket for label storage');
    return 'shipping-labels-2';
  } catch (error) {
    console.error('Error with storage bucket:', error);
    return 'shipping-labels-2';
  }
};

const downloadAndStoreLabel = async (labelUrl: string, shipmentId: string, labelType: string, format: string = 'png'): Promise<string | null> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase URL or Service Role Key is not configured.');
        return null;
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading and storing ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    const bucketName = await ensureStorageBucket(supabase);
    const response = await fetch(labelUrl);

    if (!response.ok) {
      console.error(`Failed to download label from EasyPost: ${response.status} ${response.statusText}`);
      return null;
    }

    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);

    const timestamp = Date.now();
    const fileName = `${labelType}_labels/${labelType}_${shipmentId}_${timestamp}.${format}`;
    let contentType: string;
    switch (format) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'zpl':
      case 'epl':
        contentType = 'text/plain';
        break;
      case 'png':
      default:
        contentType = 'image/png';
        break;
    }

    console.log(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, labelBuffer, {
      contentType: contentType,
      cacheControl: '3600',
      upsert: true
    });

    if (uploadError) {
      console.error(`Failed to upload label to Supabase Storage:`, uploadError);
      return null;
    }

    const { data: urlData } = await supabase.storage.from(bucketName).getPublicUrl(fileName);
    console.log(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error downloading and storing label:', error);
    return null;
  }
};

const storeDirectBinaryLabel = async (labelBuffer: Uint8Array, shipmentId: string, labelType: string, format: string = 'pdf'): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key is not configured.');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Storing direct ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    const bucketName = await ensureStorageBucket(supabase);

    const timestamp = Date.now();
    const fileName = `${labelType}_labels/${labelType}_${shipmentId}_${timestamp}.${format}`;
    let contentType: string;
    switch (format) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'zpl':
      case 'epl':
        contentType = 'text/plain';
        break;
      case 'png':
      default:
        contentType = 'image/png';
        break;
    }

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

const convertPngToPdfLocally = async (pngBytes: Uint8Array): Promise<Uint8Array> => {
  try {
    console.log('Converting PNG to PDF locally using pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([288, 432]);

    const pngImage = await pdfDoc.embedPng(pngBytes);
    const pngDims = pngImage.scale(1);

    const pageWidth = 288;
    const pageHeight = 432;
    const scaleX = pageWidth / pngDims.width;
    const scaleY = pageHeight / pngDims.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = pngDims.width * scale;
    const scaledHeight = pngDims.height * scale;
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    page.drawImage(pngImage, {
      x: x,
      y: y,
      width: scaledWidth,
      height: scaledHeight
    });

    const pdfBytes = await pdfDoc.save();
    console.log('✅ Successfully converted PNG to PDF locally');
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error converting PNG to PDF locally:', error);
    throw error;
  }
};

// Create CustomsInfo Object in EasyPost
const createCustomsInfoInEasyPost = async (customsData: any): Promise<string> => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    // Validate and set defaults for customs data
    const validatedCustomsData = validateCustomsData(customsData);
    
    console.log('Creating CustomsInfo object in EasyPost with validated data:', JSON.stringify(validatedCustomsData, null, 2));
    
    const customsInfoPayload = {
      customs_info: validatedCustomsData
    };

    console.log('Sending CustomsInfo payload to EasyPost:', JSON.stringify(customsInfoPayload, null, 2));

    const response = await fetch('https://api.easypost.com/v2/customs_infos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customsInfoPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create CustomsInfo in EasyPost:', errorData);
      throw new Error(`CustomsInfo creation failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const customsInfoResponse = await response.json();
    console.log('✅ Successfully created CustomsInfo in EasyPost with ID:', customsInfoResponse.id);
    return customsInfoResponse.id;
  } catch (error) {
    console.error('Error creating CustomsInfo in EasyPost:', error);
    throw error;
  }
};

// Attach CustomsInfo to Shipment
const attachCustomsInfoToShipment = async (shipmentId: string, customsInfoId: string): Promise<any> => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Attaching CustomsInfo ${customsInfoId} to shipment ${shipmentId}`);
    
    const shipmentUpdatePayload = {
      customs_info: {
        id: customsInfoId
      }
    };

    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentUpdatePayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to attach CustomsInfo to shipment ${shipmentId}:`, errorData);
      throw new Error(`Shipment update with CustomsInfo failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const updatedShipment = await response.json();
    console.log(`✅ Successfully attached CustomsInfo to shipment ${shipmentId}`);
    return updatedShipment;
  } catch (error) {
    console.error(`Error attaching CustomsInfo to shipment ${shipmentId}:`, error);
    throw error;
  }
};

// Main customs processing workflow
const processCustomsForInternationalShipment = async (shipmentId: string, customsData: any) => {
  try {
    console.log(`🌍 Starting international customs processing for shipment ${shipmentId}`);
    
    // Step 1: Validate return address has phone number
    await validateReturnAddressPhone(shipmentId);
    
    // Step 2: Create CustomsInfo object with validated data
    const customsInfoId = await createCustomsInfoInEasyPost(customsData);
    
    // Step 3: Attach CustomsInfo to shipment
    await attachCustomsInfoToShipment(shipmentId, customsInfoId);
    
    console.log(`✅ International customs processing completed for shipment ${shipmentId}`);
    return { success: true, customsInfoId };
  } catch (error) {
    console.error(`❌ International customs processing failed for shipment ${shipmentId}:`, error);
    throw error;
  }
};

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, customsInfo?: any): Promise<any> => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    // Process customs for international shipments BEFORE purchasing label
    if (customsInfo && customsInfo.customs_items && customsInfo.customs_items.length > 0) {
      console.log(`🌍 Processing international customs for shipment ${shipmentId}`);
      await processCustomsForInternationalShipment(shipmentId, customsInfo);
    }

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

const processAndStoreLabel = async (easypostShipmentData: any): Promise<any> => {
  const labelUrls: { [key: string]: string | null } = {};
  const postageLabel = easypostShipmentData.postage_label;

  if (postageLabel && postageLabel.label_url) {
    let pngBytes: Uint8Array | null = null;
    try {
      console.log(`Downloading PNG from EasyPost for shipment ${easypostShipmentData.id}`);
      const pngResponse = await fetch(postageLabel.label_url);
      if (pngResponse.ok) {
        const pngBlob = await pngResponse.blob();
        const pngArrayBuffer = await pngBlob.arrayBuffer();
        pngBytes = new Uint8Array(pngArrayBuffer);

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

    if (postageLabel.label_epl2_url) {
      try {
        const storedEplUrl = await downloadAndStoreLabel(postageLabel.label_epl2_url, easypostShipmentData.id, 'individual', 'epl');
        if (storedEplUrl) {
          labelUrls['epl'] = storedEplUrl;
          console.log(`✅ Stored EPL label for shipment ${easypostShipmentData.id}`);
        }
      } catch (error) {
        console.error(`Error storing EPL label for ${easypostShipmentData.id}:`, error);
      }
    }
  } else {
    console.warn(`No postage_label or label_url found in EasyPost response for shipment ${easypostShipmentData.id}. Label files will not be stored.`);
  }

  return {
    ...easypostShipmentData,
    label_urls: labelUrls,
    stored_label_url: labelUrls['pdf'] || labelUrls['png'] || easypostShipmentData.postage_label?.label_url,
  };
};

const processEasyPostBatch = async (easyPostShipmentIds: string[]): Promise<any> => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  console.log(`Creating batch with ${easyPostShipmentIds.length} shipments`);
  const createBatchResponse = await fetch('https://api.easypost.com/v2/batches', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      batch: {
        shipments: easyPostShipmentIds.map((id) => ({ id }))
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
    console.warn(`Failed to buy batch: ${errorData.error?.message || 'Unknown error'}. Continuing to poll for status.`);
  }

  console.log(`Waiting for batch ${batchId} to be ready`);
  let batchReady = false;
  let pollAttempts = 0;
  const maxPollAttempts = 30;
  while (!batchReady && pollAttempts < maxPollAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const batchStatusResponse = await fetch(`https://api.easypost.com/v2/batches/${batchId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (batchStatusResponse.ok) {
      const batchStatus = await batchStatusResponse.json();
      console.log(`Batch ${batchId} status: ${batchStatus.state}, num_shipments: ${batchStatus.num_shipments}, num_errors: ${batchStatus.num_errors}`);
      if (batchStatus.state === 'purchased' || batchStatus.state === 'label_generated') {
        batchReady = true;
        console.log(`Batch ${batchId} is ready for label generation`);
      } else {
        pollAttempts++;
      }
    } else {
      console.warn(`Failed to get batch status (attempt ${pollAttempts + 1}): ${batchStatusResponse.status} ${batchStatusResponse.statusText}`);
      pollAttempts++;
    }
  }

  if (!batchReady) {
    throw new Error(`Batch ${batchId} did not become ready within expected time after ${maxPollAttempts} attempts.`);
  }

  const consolidatedLabelUrls: { [key: string]: string | null } = {};
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

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const finalBatchResponse = await fetch(`https://api.easypost.com/v2/batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (finalBatchResponse.ok) {
        const finalBatch = await finalBatchResponse.json();
        const consolidatedLabelUrl = finalBatch.label_url;
        
        if (consolidatedLabelUrl) {
          const storedUrl = await downloadAndStoreLabel(consolidatedLabelUrl, batchId, 'batch', format);
          if (storedUrl) {
             consolidatedLabelUrls[format] = storedUrl;
             console.log(`✅ Stored consolidated ${format.toUpperCase()} label for batch ${batchId}`);
          }
        } else {
            console.warn(`No label_url found on batch ${batchId} after requesting ${format} label.`);
        }
      } else {
        console.warn(`Failed to re-fetch batch ${batchId} after requesting ${format} label.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (labelError) {
      console.error(`Error generating consolidated ${format.toUpperCase()} label for batch ${batchId}:`, labelError);
    }
  }

  let scanFormUrl: string | null = null;
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
      } else {
        console.warn(`Scan form generated for batch ${batchId}, but no form_url found in response.`);
      }
    } else {
      const errorData = await scanFormResponse.json();
      console.warn(`Failed to generate scan form for batch ${batchId}: ${errorData.error?.message || 'Unknown error'}`);
    }
  } catch (scanFormError) {
    console.error(`Error generating scan form for batch ${batchId}:`, scanFormError);
  }

  return {
    batchId,
    consolidatedLabelUrls,
    scanFormUrl
  };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

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

    const { shipments, labelOptions = {} } = await req.json();

    if (!shipments || !Array.isArray(shipments)) {
      return new Response(JSON.stringify({
        error: 'Invalid shipments data: shipments array is missing or malformed'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }

    console.log(`Processing ${shipments.length} shipments for label creation for user: ${user.id}`);

    const processedLabels: any[] = [];
    const failedLabels: any[] = [];

    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id} for user: ${user.id}`);
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Check if shipment is international and has customs info
        const isInternational = shipment.details?.to_country && 
          shipment.details.to_country.toUpperCase() !== 'US' && 
          shipment.details.to_country.toUpperCase() !== 'USA' && 
          shipment.details.to_country.toUpperCase() !== 'UNITED STATES';

        let customsInfo = null;
        if (isInternational && shipment.customsInfo) {
          customsInfo = shipment.customsInfo;
          console.log(`Using customs info for international shipment ${shipment.id} to ${shipment.details.to_country}:`, JSON.stringify(customsInfo, null, 2));
        }

        const easypostLabelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, customsInfo);
        const labelWithStoredUrls = await processAndStoreLabel(easypostLabelData);

        const shipmentRecord = {
          user_id: user.id,
          shipment_id: shipment.easypost_id,
          rate_id: shipment.selectedRateId,
          tracking_code: labelWithStoredUrls.tracking_code,
          label_url: labelWithStoredUrls.stored_label_url,
          status: 'created',
          carrier: labelWithStoredUrls.selected_rate?.carrier,
          service: labelWithStoredUrls.selected_rate?.service,
          delivery_days: labelWithStoredUrls.selected_rate?.delivery_days || null,
          charged_rate: labelWithStoredUrls.selected_rate?.rate || null,
          easypost_rate: labelWithStoredUrls.selected_rate?.rate || null,
          currency: labelWithStoredUrls.selected_rate?.currency || 'USD',
          label_format: labelOptions.label_format || (labelWithStoredUrls.label_urls['pdf'] ? "PDF" : (labelWithStoredUrls.label_urls['png'] ? "PNG" : "UNKNOWN")),
          label_size: labelOptions.label_size || "4x6",
          is_international: isInternational,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: dbError } = await supabaseClient.from('shipment_records').insert(shipmentRecord);
        if (dbError) {
          console.error('Error saving individual shipment record to Supabase DB:', dbError);
          failedLabels.push({
            shipmentId: shipment.id,
            error: `DB save failed: ${dbError.message}`,
            originalShipment: shipment,
            labelData: labelWithStoredUrls
          });
          continue;
        } else {
          console.log(`Successfully saved tracking record for shipment ${shipment.id} to DB.`);
        }

        const processedLabel = {
          ...shipment,
          ...labelWithStoredUrls,
          status: 'completed',
          customer_name: labelWithStoredUrls.to_address?.name || shipment.details?.to_name || shipment.recipient,
          customer_address: `${labelWithStoredUrls.to_address?.street1 || shipment.details?.to_street1}, ${labelWithStoredUrls.to_address?.city || shipment.details?.to_city}, ${labelWithStoredUrls.to_address?.state || shipment.details?.to_state} ${labelWithStoredUrls.to_address?.zip || shipment.details?.to_zip}`,
          stored_label_url: labelWithStoredUrls.stored_label_url,
        };
        processedLabels.push(processedLabel);

        console.log(`✅ Successfully processed shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);

        if (i < shipments.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ FAILED to process label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          originalShipment: shipment
        });
      }
    }

    let batchResult = null;
    if (processedLabels.length > 0) {
      try {
        console.log('Initiating batch/consolidated label and manifest generation...');
        const successfulEasyPostIds = processedLabels.map((label) => label.easypost_id);
        batchResult = await processEasyPostBatch(successfulEasyPostIds);
        console.log('✅ Successfully generated batch labels and manifest');
      } catch (batchError) {
        console.error('❌ Failed to generate batch labels or manifest:', batchError);
        batchResult = { error: batchError instanceof Error ? batchError.message : 'Unknown batch error' };
      }
    }

    console.log(`✅ Bulk processing complete for user ${user.id}: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(JSON.stringify({
      success: true,
      processedLabels,
      failedLabels,
      batchResult,
      total: shipments.length,
      successful: processedLabels.length,
      failed: failedLabels.length,
      message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels with Supabase Storage and tracking. Check 'batchResult' for consolidated labels if requested.`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in create-enhanced-bulk-labels function (overall handler):', error);
    return new Response(JSON.stringify({
      error: 'Label Creation Error',
      message: error instanceof Error ? error.message : 'An unknown server error occurred'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
