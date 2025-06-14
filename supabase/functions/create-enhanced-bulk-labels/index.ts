
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[CREATE-ENHANCED-BULK-LABELS] ${step}${detailsStr}`);
};

const easypostApiKey = Deno.env.get("EASYPOST_API_KEY");

const fetchEasyPost = async (endpoint: string, options: RequestInit) => {
  const response = await fetch(`https://api.easypost.com/v2${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${easypostApiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorData = await response.text();
    logStep(`EasyPost API Error on ${endpoint}`, { status: response.status, error: errorData });
    throw new Error(`EasyPost API Error: ${errorData}`);
  }
  return response.json();
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

    const { shipments, pickupAddress } = await req.json();
    logStep("Request data received", { shipmentsCount: shipments?.length, hasPickupAddress: !!pickupAddress });

    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) throw new Error("No shipments provided");
    if (!pickupAddress) throw new Error("Pickup address is required");
    if (!easypostApiKey) throw new Error("EasyPost API key not configured");

    const easypostShipments = [];
    const shipmentMap = new Map();
    const processingErrors = [];

    logStep("Step 1: Creating EasyPost shipment objects");
    for (const shipment of shipments) {
      try {
        const shipmentPayload = {
          to_address: {
            name: shipment.details.to_name,
            company: shipment.details.to_company,
            street1: shipment.details.to_street1,
            street2: shipment.details.to_street2,
            city: shipment.details.to_city,
            state: shipment.details.to_state,
            zip: shipment.details.to_zip,
            country: shipment.details.to_country,
            phone: shipment.details.to_phone,
            email: shipment.details.to_email,
          },
          from_address: {
            name: pickupAddress.name,
            company: pickupAddress.company,
            street1: pickupAddress.street1,
            street2: pickupAddress.street2,
            city: pickupAddress.city,
            state: pickupAddress.state,
            zip: pickupAddress.zip,
            country: pickupAddress.country,
            phone: pickupAddress.phone,
          },
          parcel: {
            length: shipment.details.length,
            width: shipment.details.width,
            height: shipment.details.height,
            weight: shipment.details.weight,
          },
          reference: shipment.details.reference,
          options: {
             label_format: 'PDF',
             label_size: '4x6'
          }
        };

        const epShipment = await fetchEasyPost("/shipments", {
          method: "POST",
          body: JSON.stringify({ shipment: shipmentPayload }),
        });

        const selectedRate = epShipment.rates.find(r => r.id === shipment.selectedRateId);
        if (!selectedRate) {
           throw new Error(`Could not find selected rate ID ${shipment.selectedRateId} for shipment.`);
        }
        
        // Buy the shipment now to get label data
        const purchasedShipment = await fetchEasyPost(`/shipments/${epShipment.id}/buy`, {
            method: "POST",
            body: JSON.stringify({ rate: { id: selectedRate.id } }),
        });

        shipmentMap.set(purchasedShipment.id, shipment);
        easypostShipments.push(purchasedShipment);

      } catch (error) {
        logStep(`Failed to create/buy shipment for row ${shipment.row}`, { error: error.message });
        processingErrors.push({ shipmentId: shipment.id, error: error.message, row: shipment.row });
      }
    }

    let batchResult = null;
    const processedLabels = [];
    const failedLabelsInfo = [...processingErrors];
    
    if (easypostShipments.length > 0) {
      logStep("Step 2: Creating and processing EasyPost Batch");
      try {
        const batch = await fetchEasyPost('/batches', {
            method: 'POST',
            body: JSON.stringify({ batch: { shipments: easypostShipments.map(s => ({id: s.id})) } }),
        });
        logStep('Batch created', { batchId: batch.id });

        // Generate Scan Form
        await fetchEasyPost(`/batches/${batch.id}/scan_form`, { method: 'POST' });
        logStep('Scan form generation initiated', { batchId: batch.id });
        
        // Generate consolidated labels
        await fetchEasyPost(`/batches/${batch.id}/label`, { method: 'POST', body: JSON.stringify({ file_format: 'pdf' }) });
        await fetchEasyPost(`/batches/${batch.id}/label`, { method: 'POST', body: JSON.stringify({ file_format: 'zpl' }) });
        
        // Retrieve the batch again to get updated URLs
        const updatedBatch = await fetchEasyPost(`/batches/${batch.id}`, { method: 'GET' });
        logStep('Batch retrieved with URLs', { batchId: updatedBatch.id });

        batchResult = {
          batchId: updatedBatch.id,
          consolidatedLabelUrls: {
            pdf: updatedBatch.label_url, // EasyPost provides one primary label_url
            zpl: null, // Specific format URLs are not directly on batch object this way
            epl: null,
          },
          scanFormUrl: updatedBatch.scan_forms?.[0]?.form_url || null,
        };
        
        logStep("Step 3: Processing individual labels from purchased shipments");
        for (const purchasedShipment of easypostShipments) {
            const originalShipment = shipmentMap.get(purchasedShipment.id);
            if(!originalShipment) continue;

            const label_urls = {
                png: purchasedShipment.postage_label.label_url,
                pdf: purchasedShipment.postage_label.label_pdf_url, // PDF is often available directly
                zpl: purchasedShipment.postage_label.label_zpl_url
            };

            processedLabels.push({
                id: purchasedShipment.id,
                original_shipment_id: originalShipment.id,
                row: originalShipment.row,
                recipient: originalShipment.details.to_name,
                customer_name: originalShipment.details.to_name,
                customer_address: `${originalShipment.details.to_street1}, ${originalShipment.details.to_city}`,
                carrier: purchasedShipment.selected_rate.carrier,
                service: purchasedShipment.selected_rate.service,
                rate: parseFloat(purchasedShipment.selected_rate.rate),
                tracking_code: purchasedShipment.tracking_code,
                tracking_number: purchasedShipment.tracking_code,
                label_url: label_urls.pdf || label_urls.png,
                label_urls: label_urls,
                status: 'completed',
                details: originalShipment.details,
                availableRates: originalShipment.availableRates,
                selectedRateId: originalShipment.selectedRateId,
            });
        }
      } catch (error) {
         logStep('Batch processing failed', { error: error.message });
         // Add all shipments to failed if batch fails
         easypostShipments.forEach(s => {
             const o = shipmentMap.get(s.id);
             failedLabelsInfo.push({ shipmentId: o.id, row: o.row, error: `Batch processing failed: ${error.message}`});
         });
      }
    }

    const response = {
      total: shipments.length,
      successful: processedLabels.length,
      failed: failedLabelsInfo.length,
      processedLabels,
      failedLabels: failedLabelsInfo,
      batchResult: batchResult,
    };

    logStep("Function completed", { successful: processedLabels.length, failed: failedLabelsInfo.length });
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("FATAL ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
