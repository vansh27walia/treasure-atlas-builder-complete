import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ZipWriter, Uint8ArrayReader } from "https://deno.land/x/zipjs@v2.7.34/index.js"; // Using @deno/zip was causing issues, trying zipjs
// Note: If zipjs also has issues, may need to find a more stable Deno zipping library or simplify to not use ReadableStream directly if that's the cause.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ENHANCED-BULK-LABELS] ${step}${detailsStr}`);
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

    const { shipments, pickupAddress, labelOptions } = await req.json();
    logStep("Request data received", { shipmentsCount: shipments?.length, hasPickupAddress: !!pickupAddress });

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

    // Enhanced validation before processing
    const invalidShipments = shipments.filter(shipment => {
      const hasSelectedRate = !!shipment.selectedRateId;
      const hasEasypostId = !!shipment.easypost_id;
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      const hasEasypostRateId = !!selectedRate?.easypost_rate_id;
      
      if (!hasSelectedRate || !hasEasypostId || !hasEasypostRateId) {
        logStep(`Invalid shipment ${shipment.id}`, {
          hasSelectedRate,
          hasEasypostId,
          hasEasypostRateId,
          selectedRateId: shipment.selectedRateId,
          availableRatesCount: shipment.availableRates?.length || 0
        });
        return true;
      }
      return false;
    });

    if (invalidShipments.length > 0) {
      throw new Error(`${invalidShipments.length} shipments have invalid or missing rate selections. All shipments must have selected rates with EasyPost rate IDs.`);
    }

    const processedLabels = [];
    const failedLabelsInfo = [];

    logStep(`Processing ${shipments.length} shipments`);

    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      logStep(`Processing shipment ${i + 1}/${shipments.length}`, { shipmentId: shipment.id });

      try {
        const shipmentPayload = {
          to_address: { // ... keep existing code (to_address details)
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
          from_address: { // ... keep existing code (from_address details)
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
          parcel: { // ... keep existing code (parcel details)
            length: shipment.details?.length || 12,
            width: shipment.details?.width || 8,
            height: shipment.details?.height || 4,
            weight: shipment.details?.weight || 1
          }
        };

        const shipmentResponse = await fetch("https://api.easypost.com/v2/shipments", {
          method: "POST",
          headers: { "Authorization": `Bearer ${easypostApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({shipment: shipmentPayload}) // EasyPost expects shipment to be nested
        });

        if (!shipmentResponse.ok) {
          const errorData = await shipmentResponse.text();
          throw new Error(`EasyPost shipment creation failed: ${errorData}`);
        }
        const shipmentData = await shipmentResponse.json();
        logStep(`Shipment created`, { easypostId: shipmentData.id });

        const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
        if (!selectedRate || !selectedRate.easypost_rate_id) {
          throw new Error(`No selected rate or EasyPost rate ID found for shipment ${shipment.id}. Selected rate ID: ${shipment.selectedRateId}, Available rates: ${shipment.availableRates?.length || 0}`);
        }

        logStep(`Using rate for shipment ${shipment.id}`, {
          rateId: selectedRate.id,
          easypostRateId: selectedRate.easypost_rate_id,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate: selectedRate.rate
        });

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

        const labelUrls = {
          png: purchaseData.postage_label?.label_png_url || purchaseData.postage_label?.label_url, // Prefer png_url if available
          pdf: null,
          zpl: null
        };

        // Helper to fetch and update label format
        const fetchLabelFormat = async (format: 'pdf' | 'zpl') => {
          try {
            const formatResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.id}/label`, {
              method: "POST", // Changed to POST
              headers: { "Authorization": `Bearer ${easypostApiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ file_format: format })
            });
            if (formatResponse.ok) {
              const formatData = await formatResponse.json();
              logStep(`${format.toUpperCase()} label generated`, { url: formatData.label_url });
              return formatData.label_url;
            } else {
              const errorText = await formatResponse.text();
              logStep(`${format.toUpperCase()} label request failed`, { status: formatResponse.status, error: errorText });
            }
          } catch (error) {
            logStep(`${format.toUpperCase()} label fetch error`, { error: error.message });
          }
          return null;
        };

        labelUrls.pdf = await fetchLabelFormat('pdf');
        labelUrls.zpl = await fetchLabelFormat('zpl');
        
        // Fallback for PDF if PNG exists and PDF failed
        if (!labelUrls.pdf && labelUrls.png) {
            logStep(`Falling back PDF to PNG URL as PDF generation failed or was not available.`);
            // labelUrls.pdf = labelUrls.png; // This might not be a true PDF. Better to leave null if not a PDF.
        }


        const storedUrls = await storeLabelsInStorage(supabaseClient, labelUrls, shipmentData.id, purchaseData.tracking_code);

        processedLabels.push({
          id: shipmentData.id, // EasyPost shipment ID
          original_shipment_id: shipment.id, // Original client-side/DB shipment ID
          tracking_code: purchaseData.tracking_code,
          customer_name: shipment.customer_name || shipment.recipient,
          customer_address: `${shipment.details?.to_street1 || ''}, ${shipment.details?.to_city || ''}, ${shipment.details?.to_state || ''} ${shipment.details?.to_zip || ''}`,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate: selectedRate.rate,
          label_url: storedUrls.png || labelUrls.png, // Primary display URL
          label_urls: storedUrls, // Contains all stored URLs (png, pdf, zpl)
          status: 'success',
          details: shipment.details // Pass along original details for display
        });

      } catch (error) {
        logStep(`Shipment processing failed`, { shipmentId: shipment.id, error: error.message });
        failedLabelsInfo.push({
          shipmentId: shipment.id,
          error: error.message
        });
      }
    }

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
      failedLabels: failedLabelsInfo, // Ensure this matches frontend expectation
      batchResult: (consolidatedZipUrls.pdf_zip || consolidatedZipUrls.zpl_zip) ? {
        batchId: `batch_zip_${Date.now()}`,
        consolidatedLabelUrls: {
          pdfZip: consolidatedZipUrls.pdf_zip,
          zplZip: consolidatedZipUrls.zpl_zip
        },
        scanFormUrl: null // Scan forms are for actual EasyPost Batches
      } : null
    };

    logStep(`Function completed`, { successful: processedLabels.length, failed: failedLabelsInfo.length });
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

async function storeLabelsInStorage(supabaseClient: any, labelUrls: any, shipmentId: string, trackingCode: string) {
  const storedUrls = { png: null, pdf: null, zpl: null };
  const storageBucket = 'shipping-labels'; // Or your configured bucket name

  const safeTrackingCode = trackingCode ? trackingCode.replace(/[^a-zA-Z0-9]/g, '_') : `shipment_${shipmentId}`;

  // Store PNG
  if (labelUrls.png) {
    try {
      const pngResponse = await fetch(labelUrls.png);
      if (pngResponse.ok) {
        const pngBlob = await pngResponse.blob();
        const pngPath = `labels/${safeTrackingCode}_${shipmentId}.png`;
        const { error } = await supabaseClient.storage.from(storageBucket).upload(pngPath, pngBlob, { contentType: 'image/png', upsert: true });
        if (!error) {
          const { data: urlData } = supabaseClient.storage.from(storageBucket).getPublicUrl(pngPath);
          storedUrls.png = urlData.publicUrl;
           logStep('Stored PNG in Supabase', { url: storedUrls.png });
        } else throw error;
      } else throw new Error(`Failed to fetch PNG: ${pngResponse.status}`);
    } catch (error) { logStep('PNG storage failed', { error: error.message }); }
  }

  // Store PDF
  if (labelUrls.pdf) {
    try {
      const pdfResponse = await fetch(labelUrls.pdf);
      if (pdfResponse.ok) {
        const pdfBlob = await pdfResponse.blob();
        const pdfPath = `labels/${safeTrackingCode}_${shipmentId}.pdf`;
        const { error } = await supabaseClient.storage.from(storageBucket).upload(pdfPath, pdfBlob, { contentType: 'application/pdf', upsert: true });
        if (!error) {
          const { data: urlData } = supabaseClient.storage.from(storageBucket).getPublicUrl(pdfPath);
          storedUrls.pdf = urlData.publicUrl;
          logStep('Stored PDF in Supabase', { url: storedUrls.pdf });
        } else throw error;
      } else throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    } catch (error) { logStep('PDF storage failed', { error: error.message }); }
  }

  // Store ZPL
  if (labelUrls.zpl) {
    try {
      const zplResponse = await fetch(labelUrls.zpl);
      if (zplResponse.ok) {
        const zplBlob = await zplResponse.blob(); // ZPL might be text, ensure blob is fine
        const zplPath = `labels/${safeTrackingCode}_${shipmentId}.zpl`;
        const { error } = await supabaseClient.storage.from(storageBucket).upload(zplPath, zplBlob, { contentType: 'application/zpl', upsert: true }); // Or text/plain
        if (!error) {
          const { data: urlData } = supabaseClient.storage.from(storageBucket).getPublicUrl(zplPath);
          storedUrls.zpl = urlData.publicUrl;
          logStep('Stored ZPL in Supabase', { url: storedUrls.zpl });
        } else throw error;
      } else throw new Error(`Failed to fetch ZPL: ${zplResponse.status}`);
    } catch (error) { logStep('ZPL storage failed', { error: error.message }); }
  }
  return storedUrls;
}


async function createConsolidatedZipFiles(supabaseClient: any, processedLabels: any[]) {
  const storageBucket = 'shipping-labels';
  const timestamp = Date.now();
  const results = { pdf_zip: null, zpl_zip: null };

  const createZip = async (format: 'pdf' | 'zpl') => {
    const zipWriter = new ZipWriter(new Blob([]).stream()); // zip.js needs a WritableStream, Blob stream can work
    let filesAdded = 0;

    for (const label of processedLabels) {
      const url = label.label_urls?.[format];
      if (url) {
        try {
          const response = await fetch(url);
          if (response.ok && response.body) {
            const trackingCode = label.tracking_code ? label.tracking_code.replace(/[^a-zA-Z0-9]/g, '_') : `label_${label.id}`;
            const fileName = `label_${trackingCode}.${format}`;
            // Use Uint8ArrayReader for zip.js
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
    const zipPath = `batches/consolidated_labels_${timestamp}.${format}.zip`;
    
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
