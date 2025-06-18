
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ZipWriter, Uint8ArrayReader } from "https://deno.land/x/zipjs@v2.7.34/index.js";

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

    // Extract user ID from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Invalid authentication");

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

    logStep(`Processing ${shipments.length} shipments`);

    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      logStep(`Processing shipment ${i + 1}/${shipments.length}`, { shipmentId: shipment.id });

      try {
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

        const labelUrls = {
          png: purchaseData.postage_label?.label_png_url || purchaseData.postage_label?.label_url,
          pdf: null,
          zpl: null
        };

        // Helper to fetch and update label format
        const fetchLabelFormat = async (format: 'pdf' | 'zpl') => {
          try {
            const formatResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.id}/label`, {
              method: "POST",
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

        const storedUrls = await storeLabelsInStorage(supabaseClient, labelUrls, shipmentData.id, purchaseData.tracking_code);

        // Save shipment record to database for tracking
        try {
          const { error: insertError } = await supabaseClient
            .from('shipment_records')
            .insert({
              user_id: user.id,
              tracking_code: purchaseData.tracking_code,
              carrier: selectedRate.carrier,
              service: selectedRate.service,
              status: 'pre_transit',
              shipment_id: shipmentData.id,
              label_url: storedUrls.png || labelUrls.png,
              charged_rate: selectedRate.rate,
              to_address_json: shipmentPayload.to_address,
              from_address_json: shipmentPayload.from_address,
              parcel_json: shipmentPayload.parcel,
              tracking_details: [{
                id: 'initial',
                description: 'Shipping label created',
                location: pickupAddress.city,
                timestamp: new Date().toISOString(),
                status: 'pre_transit'
              }]
            });

          if (insertError) {
            logStep(`Failed to save shipment record`, { error: insertError.message });
          } else {
            logStep(`Shipment record saved for tracking`, { trackingCode: purchaseData.tracking_code });
          }
        } catch (dbError) {
          logStep(`Database error saving shipment`, { error: dbError.message });
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
          label_url: storedUrls.png || labelUrls.png,
          label_urls: storedUrls,
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

    let consolidatedUrls = { pdf: null, zpl: null, epl: null };
    if (processedLabels.length > 0) {
      try {
        consolidatedUrls = await createConsolidatedFiles(supabaseClient, processedLabels);
        logStep(`Consolidated files created`, { urls: consolidatedUrls });
      } catch (error) {
        logStep(`Consolidated file creation failed`, { error: error.message });
      }
    }

    const response = {
      total: shipments.length,
      successful: processedLabels.length,
      failed: failedLabelsInfo.length,
      processedLabels,
      failedLabels: failedLabelsInfo,
      batchResult: (consolidatedUrls.pdf || consolidatedUrls.zpl || consolidatedUrls.epl) ? {
        batchId: `batch_${Date.now()}`,
        consolidatedLabelUrls: {
          pdf: consolidatedUrls.pdf,
          zpl: consolidatedUrls.zpl,
          epl: consolidatedUrls.epl
        },
        scanFormUrl: null
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
  const storageBucket = 'shipping-labels-2';

  const safeTrackingCode = trackingCode ? trackingCode.replace(/[^a-zA-Z0-9]/g, '_') : `shipment_${shipmentId}`;

  // Store PNG
  if (labelUrls.png) {
    try {
      const pngResponse = await fetch(labelUrls.png);
      if (pngResponse.ok) {
        const pngBlob = await pngResponse.blob();
        const pngPath = `individual_labels/${safeTrackingCode}_${shipmentId}.png`;
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
        const pdfPath = `individual_labels/${safeTrackingCode}_${shipmentId}.pdf`;
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
        const zplBlob = await zplResponse.blob();
        const zplPath = `individual_labels/${safeTrackingCode}_${shipmentId}.zpl`;
        const { error } = await supabaseClient.storage.from(storageBucket).upload(zplPath, zplBlob, { contentType: 'application/zpl', upsert: true });
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

async function createConsolidatedFiles(supabaseClient: any, processedLabels: any[]) {
  const storageBucket = 'shipping-labels-2';
  const timestamp = Date.now();
  const results = { pdf: null, zpl: null, epl: null };

  // Create consolidated files for PDF, ZPL, and EPL
  for (const format of ['pdf', 'zpl', 'epl']) {
    try {
      let consolidatedContent = '';
      let contentType = 'text/plain';
      let filesFound = 0;

      if (format === 'pdf') {
        // For PDF, we'll create a simple text file listing all tracking numbers
        // In a real implementation, you'd merge PDFs
        contentType = 'text/plain';
        consolidatedContent = `Consolidated PDF Labels - Batch ${timestamp}\n\n`;
        consolidatedContent += 'Tracking Numbers:\n';
        processedLabels.forEach(label => {
          if (label.tracking_code) {
            consolidatedContent += `${label.tracking_code} - ${label.customer_name}\n`;
            filesFound++;
          }
        });
      } else {
        // For ZPL and EPL, concatenate the label content
        for (const label of processedLabels) {
          const url = label.label_urls?.[format];
          if (url) {
            try {
              const response = await fetch(url);
              if (response.ok) {
                const content = await response.text();
                consolidatedContent += content + '\n';
                filesFound++;
              }
            } catch (e) {
              logStep(`Error fetching ${format} for consolidation`, { url, error: e.message });
            }
          }
        }
      }

      if (filesFound > 0) {
        const filePath = `batch_labels/batch_${timestamp}.${format}`;
        const blob = new Blob([consolidatedContent], { type: contentType });
        
        const { error } = await supabaseClient.storage
          .from(storageBucket)
          .upload(filePath, blob, { contentType, upsert: true });

        if (!error) {
          const { data: urlData } = supabaseClient.storage.from(storageBucket).getPublicUrl(filePath);
          results[format] = urlData.publicUrl;
          logStep(`Uploaded ${format.toUpperCase()} consolidated file`, { url: urlData.publicUrl, filesIncluded: filesFound });
        } else {
          logStep(`Failed to upload ${format.toUpperCase()} consolidated file`, { error });
        }
      }
    } catch (error) {
      logStep(`Error creating ${format.toUpperCase()} consolidated file`, { error: error.message });
    }
  }

  return results;
}
