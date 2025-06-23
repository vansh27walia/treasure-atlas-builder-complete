
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ZipWriter, Uint8ArrayReader } from "https://deno.land/x/zipjs@v2.7.34/index.js";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ENHANCED-BULK-LABELS] ${step}${detailsStr}`);
};

// Storage functions for individual labels
const storeDirectBinaryLabel = async (supabaseClient: any, labelBuffer: Uint8Array, shipmentId: string, labelType: string, format = 'pdf') => {
  try {
    const bucketName = 'shipping-labels';
    logStep(`Storing ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    
    const timestamp = Date.now();
    const fileName = `${labelType}_labels/${labelType}_${shipmentId}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';
    
    logStep(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    
    const { error: uploadError } = await supabaseClient.storage
      .from(bucketName)
      .upload(fileName, labelBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      logStep(`Failed to upload`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    const { data: urlData } = supabaseClient.storage.from(bucketName).getPublicUrl(fileName);
    logStep(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    logStep('Error storing label', { error: error.message });
    throw error;
  }
};

const downloadAndStoreLabel = async (supabaseClient: any, labelUrl: string, shipmentId: string, labelType: string, format = 'png') => {
  try {
    logStep(`Downloading and storing ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    
    const response = await fetch(labelUrl);
    if (!response.ok) {
      logStep(`Failed to download label: ${response.status} ${response.statusText}`);
      return labelUrl;
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    return await storeDirectBinaryLabel(supabaseClient, labelBuffer, shipmentId, labelType, format);
  } catch (error) {
    logStep('Error downloading and storing label', { error: error.message });
    return labelUrl;
  }
};

const convertPngToPdfLocally = async (pngBytes: Uint8Array) => {
  try {
    logStep('Converting PNG to PDF locally using pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([288, 432]); // 4x6 inches
    
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
    logStep('✅ Successfully converted PNG to PDF locally');
    return new Uint8Array(pdfBytes);
  } catch (error) {
    logStep('Error converting PNG to PDF locally', { error: error.message });
    throw error;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { shipments, pickupAddress, labelOptions } = await req.json();
    logStep("Request data received", { shipmentsCount: shipments?.length, hasPickupAddress: !!pickupAddress, userId: user.id });

    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
      throw new Error("No shipments provided");
    }
    if (!pickupAddress) {
      throw new Error("Pickup address is required");
    }
    const easypostApiKey = Deno.env.get("EASYPOST_API_KEY");
    if (!easypostApiKey) {
      throw new Error("EasyPost API key not configured");
    }

    const processedLabels = [];
    const failedLabelsInfo = [];

    logStep(`Processing ${shipments.length} shipments for user ${user.id}`);

    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      logStep(`Processing shipment ${i + 1}/${shipments.length}`, { shipmentId: shipment.id });

      try {
        // Create shipment payload
        const shipmentPayload = {
          to_address: {
            name: shipment.customer_name || shipment.recipient || 'Unknown',
            street1: shipment.details?.to_street1 || '',
            street2: shipment.details?.to_street2 || '',
            city: shipment.details?.to_city || '',
            state: shipment.details?.to_state || '',
            zip: shipment.details?.to_zip || '',
            country: shipment.details?.to_country || 'US',
            phone: shipment.details?.to_phone || '',
            email: shipment.details?.to_email || ''
          },
          from_address: {
            name: pickupAddress.name || '',
            company: pickupAddress.company || '',
            street1: pickupAddress.street1,
            street2: pickupAddress.street2 || '',
            city: pickupAddress.city,
            state: pickupAddress.state,
            zip: pickupAddress.zip,
            country: pickupAddress.country || 'US',
            phone: pickupAddress.phone || '',
            email: pickupAddress.email || ''
          },
          parcel: {
            length: shipment.details?.length || 12,
            width: shipment.details?.width || 8,
            height: shipment.details?.height || 4,
            weight: shipment.details?.weight || 1
          }
        };

        const shipmentResponse = await fetch("https://api.easypost.com/v2/shipments", {
          method: "POST",
          headers: { "Authorization": `Bearer ${easypostApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({shipment: shipmentPayload})
        });

        if (!shipmentResponse.ok) {
          const errorData = await shipmentResponse.text();
          throw new Error(`EasyPost shipment creation failed: ${errorData}`);
        }
        const shipmentData = await shipmentResponse.json();
        logStep(`Shipment created`, { easypostId: shipmentData.id });

        const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
        if (!selectedRate || !selectedRate.easypost_rate_id) {
          throw new Error(`No selected rate or EasyPost rate ID found for shipment ${shipment.id}`);
        }

        const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.id}/buy`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${easypostApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ rate: { id: selectedRate.easypost_rate_id } })
        });

        if (!buyResponse.ok) {
          const errorData = await buyResponse.text();
          throw new Error(`EasyPost rate purchase failed: ${errorData}`);
        }
        const purchaseData = await buyResponse.json();
        logStep(`Rate purchased`, { trackingCode: purchaseData.tracking_code });

        // Save tracking record to database
        if (purchaseData.tracking_code) {
          const trackingRecord = {
            user_id: user.id,
            tracking_code: purchaseData.tracking_code,
            carrier: selectedRate.carrier || 'Unknown',
            service: selectedRate.service || 'Standard',
            status: 'created',
            recipient_name: shipment.customer_name || shipment.recipient || 'Unknown',
            recipient_address: `${shipment.details?.to_street1 || ''}, ${shipment.details?.to_city || ''}, ${shipment.details?.to_state || ''} ${shipment.details?.to_zip || ''}`,
            label_url: null, // Will be updated after storage
            shipment_id: shipmentData.id,
            easypost_id: shipmentData.id
          };

          const { error: trackingError } = await supabaseClient
            .from('tracking_records')
            .insert(trackingRecord);

          if (trackingError) {
            logStep('Failed to save tracking record', { error: trackingError, trackingCode: purchaseData.tracking_code });
          } else {
            logStep('Tracking record saved successfully', { trackingCode: purchaseData.tracking_code, userId: user.id });
          }
        }

        // Store labels in all formats
        const labelUrls = { png: null, pdf: null, zpl: null };
        const postageLabel = purchaseData.postage_label;
        
        if (postageLabel) {
          // Store PNG first and get PNG bytes for PDF conversion
          let pngBytes = null;
          if (postageLabel.label_url) {
            try {
              logStep(`Downloading PNG for shipment ${shipmentData.id}`);
              const pngResponse = await fetch(postageLabel.label_url);
              if (pngResponse.ok) {
                const pngBlob = await pngResponse.blob();
                const pngArrayBuffer = await pngBlob.arrayBuffer();
                pngBytes = new Uint8Array(pngArrayBuffer);
                
                // Store PNG
                const storedPngUrl = await storeDirectBinaryLabel(supabaseClient, pngBytes, shipmentData.id, 'individual', 'png');
                labelUrls.png = storedPngUrl;
                logStep(`✅ Successfully stored PNG label for shipment ${shipmentData.id}`);
              }
            } catch (error) {
              logStep(`Error downloading PNG for ${shipmentData.id}`, { error: error.message });
            }
          }

          // Convert PNG to PDF locally and store
          if (pngBytes) {
            try {
              logStep(`Converting PNG to PDF locally for shipment ${shipmentData.id}`);
              const pdfBytes = await convertPngToPdfLocally(pngBytes);
              const storedPdfUrl = await storeDirectBinaryLabel(supabaseClient, pdfBytes, shipmentData.id, 'individual', 'pdf');
              labelUrls.pdf = storedPdfUrl;
              logStep(`✅ Successfully converted and stored PDF label for shipment ${shipmentData.id}`);
            } catch (error) {
              logStep(`Error converting PNG to PDF for ${shipmentData.id}`, { error: error.message });
            }
          }

          // Store ZPL if available
          if (postageLabel.label_zpl_url) {
            try {
              const storedZplUrl = await downloadAndStoreLabel(supabaseClient, postageLabel.label_zpl_url, shipmentData.id, 'individual', 'zpl');
              labelUrls.zpl = storedZplUrl;
              logStep(`✅ Successfully stored ZPL label for shipment ${shipmentData.id}`);
            } catch (error) {
              logStep(`Error storing ZPL label for ${shipmentData.id}`, { error: error.message });
            }
          }

          // Update tracking record with label URL
          if (purchaseData.tracking_code && (labelUrls.pdf || labelUrls.png)) {
            const { error: updateError } = await supabaseClient
              .from('tracking_records')
              .update({ label_url: labelUrls.pdf || labelUrls.png })
              .eq('tracking_code', purchaseData.tracking_code)
              .eq('user_id', user.id);

            if (updateError) {
              logStep('Failed to update tracking record with label URL', { error: updateError });
            }
          }
        }

        processedLabels.push({
          id: shipmentData.id,
          original_shipment_id: shipment.id,
          tracking_code: purchaseData.tracking_code,
          customer_name: shipment.customer_name || shipment.recipient,
          customer_address: `${shipment.details?.to_street1 || ''}, ${shipment.details?.to_city || ''}, ${shipment.details?.to_state || ''} ${shipment.details?.to_zip || ''}`,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate: selectedRate.rate,
          label_url: labelUrls.png || postageLabel?.label_url,
          label_urls: labelUrls,
          status: 'success',
          details: shipment.details
        });

      } catch (error) {
        logStep(`Shipment processing failed`, { shipmentId: shipment.id, error: error.message });
        failedLabelsInfo.push({
          shipmentId: shipment.id,
          error: error.message
        });
      }
    }

    // Create consolidated batch labels if we have successful labels
    let consolidatedZipUrls = { pdf_zip: null, zpl_zip: null };
    if (processedLabels.length > 0) {
      try {
        consolidatedZipUrls = await createConsolidatedZipFiles(supabaseClient, processedLabels);
        logStep(`Consolidated ZIP files created`, { urls: consolidatedZipUrls });
      } catch (error) {
        logStep(`Consolidated ZIP creation failed`, { error: error.message });
      }
    }

    const response = {
      total: shipments.length,
      successful: processedLabels.length,
      failed: failedLabelsInfo.length,
      processedLabels,
      failedLabels: failedLabelsInfo,
      batchResult: (consolidatedZipUrls.pdf_zip || consolidatedZipUrls.zpl_zip) ? {
        batchId: `batch_zip_${Date.now()}`,
        consolidatedLabelUrls: {
          pdfZip: consolidatedZipUrls.pdf_zip,
          zplZip: consolidatedZipUrls.zpl_zip
        },
        scanFormUrl: null
      } : null
    };

    logStep(`Function completed`, { successful: processedLabels.length, failed: failedLabelsInfo.length, trackingRecordsSaved: processedLabels.length });
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function createConsolidatedZipFiles(supabaseClient: any, processedLabels: any[]) {
  const storageBucket = 'shipping-labels';
  const timestamp = Date.now();
  const results = { pdf_zip: null, zpl_zip: null };

  const createZip = async (format: 'pdf' | 'zpl') => {
    const zipWriter = new ZipWriter(new Blob([]).stream());
    let filesAdded = 0;

    for (const label of processedLabels) {
      const url = label.label_urls?.[format];
      if (url) {
        try {
          const response = await fetch(url);
          if (response.ok && response.body) {
            const trackingCode = label.tracking_code ? label.tracking_code.replace(/[^a-zA-Z0-9]/g, '_') : `label_${label.id}`;
            const fileName = `label_${trackingCode}.${format}`;
            const labelData = await response.arrayBuffer();
            zipWriter.add(fileName, new Uint8ArrayReader(new Uint8Array(labelData)));
            filesAdded++;
            logStep(`Added ${fileName} to ${format} ZIP`);
          } else {
            logStep(`Failed to fetch ${format} label for ZIP: ${url}`, { status: response.status });
          }
        } catch (e) {
          logStep(`Error fetching/adding ${format} label ${url} to ZIP`, { error: e.message });
        }
      }
    }

    if (filesAdded === 0) {
      logStep(`No ${format} files to add to ZIP.`);
      return null;
    }
    
    const zipBlob = await zipWriter.close();
    const zipPath = `bulk_batches/consolidated_labels_${timestamp}.${format}.zip`;
    
    const { error } = await supabaseClient.storage
      .from(storageBucket)
      .upload(zipPath, zipBlob, { contentType: 'application/zip', upsert: true });

    if (error) {
      logStep(`Failed to upload ${format} ZIP to Supabase`, { error });
      return null;
    }
    
    const { data: urlData } = supabaseClient.storage.from(storageBucket).getPublicUrl(zipPath);
    logStep(`Uploaded ${format} ZIP to Supabase`, { url: urlData.publicUrl });
    return urlData.publicUrl;
  };

  results.pdf_zip = await createZip('pdf');
  results.zpl_zip = await createZip('zpl');

  return results;
}
