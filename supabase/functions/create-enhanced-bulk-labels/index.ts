import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

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

    const processedLabels = [];
    const failedLabels = [];
    const easypostShipments = [];

    logStep(`Processing ${shipments.length} shipments`);

    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      logStep(`Processing shipment ${i + 1}/${shipments.length}`, { shipmentId: shipment.id });

      try {
        // Create EasyPost shipment
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

        // Create shipment
        const shipmentResponse = await fetch("https://api.easypost.com/v2/shipments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${easypostApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(shipmentPayload)
        });

        if (!shipmentResponse.ok) {
          const errorData = await shipmentResponse.text();
          throw new Error(`EasyPost shipment creation failed: ${errorData}`);
        }

        const shipmentData = await shipmentResponse.json();
        logStep(`Shipment created`, { easypostId: shipmentData.id });

        // Buy the selected rate
        const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
        if (!selectedRate) {
          throw new Error(`No selected rate found for shipment ${shipment.id}`);
        }

        const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.id}/buy`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${easypostApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ rate: { id: selectedRate.easypost_rate_id } })
        });

        if (!buyResponse.ok) {
          const errorData = await buyResponse.text();
          throw new Error(`EasyPost rate purchase failed: ${errorData}`);
        }

        const purchaseData = await buyResponse.json();
        easypostShipments.push(purchaseData);
        logStep(`Rate purchased`, { trackingCode: purchaseData.tracking_code });

        // Get label URLs in different formats
        const labelUrls = {
          png: purchaseData.postage_label?.label_url,
          pdf: null,
          zpl: null
        };

        // Request PDF format
        try {
          const pdfResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.id}/label?file_format=pdf`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${easypostApiKey}`,
            }
          });
          if (pdfResponse.ok) {
            const pdfData = await pdfResponse.json();
            labelUrls.pdf = pdfData.label_url;
          }
        } catch (error) {
          logStep(`PDF label request failed`, { error: error.message });
        }

        // Request ZPL format
        try {
          const zplResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.id}/label?file_format=zpl`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${easypostApiKey}`,
            }
          });
          if (zplResponse.ok) {
            const zplData = await zplResponse.json();
            labelUrls.zpl = zplData.label_url;
          }
        } catch (error) {
          logStep(`ZPL label request failed`, { error: error.message });
        }

        // Download and store labels in Supabase Storage
        const storedUrls = await storeLabelsInStorage(supabaseClient, labelUrls, shipmentData.id);

        processedLabels.push({
          id: shipmentData.id,
          shipment_id: shipment.id,
          tracking_code: purchaseData.tracking_code,
          customer_name: shipment.customer_name || shipment.recipient,
          customer_address: `${shipment.details?.to_street1 || ''}, ${shipment.details?.to_city || ''}, ${shipment.details?.to_state || ''} ${shipment.details?.to_zip || ''}`,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate: selectedRate.rate,
          label_url: storedUrls.png || labelUrls.png,
          label_urls: storedUrls,
          status: 'success'
        });

      } catch (error) {
        logStep(`Shipment processing failed`, { shipmentId: shipment.id, error: error.message });
        failedLabels.push({
          shipmentId: shipment.id,
          error: error.message
        });
      }
    }

    // Create consolidated PDF if there are successful labels
    let consolidatedPdfUrl = null;
    if (processedLabels.length > 0) {
      try {
        consolidatedPdfUrl = await createConsolidatedPdf(supabaseClient, processedLabels);
        logStep(`Consolidated PDF created`, { url: consolidatedPdfUrl });
      } catch (error) {
        logStep(`Consolidated PDF creation failed`, { error: error.message });
      }
    }

    // Create Scan Form (Manifest)
    let scanFormUrl = null;
    if (easypostShipments.length > 0) {
        try {
            const scanFormResponse = await fetch("https://api.easypost.com/v2/scan_forms", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${easypostApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ shipments: easypostShipments })
            });

            if (!scanFormResponse.ok) {
                const errorData = await scanFormResponse.text();
                throw new Error(`EasyPost scan form creation failed: ${errorData}`);
            }

            const scanFormData = await scanFormResponse.json();
            scanFormUrl = scanFormData.form_url;
            logStep(`Scan form created`, { url: scanFormUrl });
        } catch (error) {
            logStep(`Scan form creation failed`, { error: error.message });
        }
    }

    const response = {
      total: shipments.length,
      successful: processedLabels.length,
      failed: failedLabels.length,
      processedLabels,
      failedLabels,
      consolidatedPdfUrl, // for backward compatibility if something expects it directly
      batchResult: (consolidatedPdfUrl || scanFormUrl) ? {
        batchId: `batch_${Date.now()}`,
        consolidatedLabelUrls: {
          pdf: consolidatedPdfUrl
        },
        scanFormUrl: scanFormUrl
      } : null
    };

    logStep(`Function completed`, { 
      successful: processedLabels.length, 
      failed: failedLabels.length 
    });

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

async function storeLabelsInStorage(supabaseClient: any, labelUrls: any, shipmentId: string) {
  const storedUrls = {
    png: null,
    pdf: null,
    zpl: null
  };

  try {
    // Store PNG
    if (labelUrls.png) {
      const pngResponse = await fetch(labelUrls.png);
      if (pngResponse.ok) {
        const pngBlob = await pngResponse.blob();
        const pngPath = `labels/${shipmentId}_label.png`;
        
        const { data: pngData, error: pngError } = await supabaseClient.storage
          .from('shipping-labels')
          .upload(pngPath, pngBlob, {
            contentType: 'image/png',
            upsert: true
          });

        if (!pngError) {
          const { data: pngUrl } = supabaseClient.storage
            .from('shipping-labels')
            .getPublicUrl(pngPath);
          storedUrls.png = pngUrl.publicUrl;
        }
      }
    }

    // Store PDF
    if (labelUrls.pdf) {
      const pdfResponse = await fetch(labelUrls.pdf);
      if (pdfResponse.ok) {
        const pdfBlob = await pdfResponse.blob();
        const pdfPath = `labels/${shipmentId}_label.pdf`;
        
        const { error: pdfError } = await supabaseClient.storage
          .from('shipping-labels')
          .upload(pdfPath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (!pdfError) {
          const { data: pdfUrlData } = supabaseClient.storage
            .from('shipping-labels')
            .getPublicUrl(pdfPath);
          storedUrls.pdf = pdfUrlData.publicUrl;
        }
      }
    }

    // Store ZPL
    if (labelUrls.zpl) {
      const zplResponse = await fetch(labelUrls.zpl);
      if (zplResponse.ok) {
        const zplBlob = await zplResponse.blob();
        const zplPath = `labels/${shipmentId}_label.zpl`;
        
        const { data: zplData, error: zplError } = await supabaseClient.storage
          .from('shipping-labels')
          .upload(zplPath, zplBlob, {
            contentType: 'text/plain',
            upsert: true
          });

        if (!zplError) {
          const { data: zplUrl } = supabaseClient.storage
            .from('shipping-labels')
            .getPublicUrl(zplPath);
          storedUrls.zpl = zplUrl.publicUrl;
        }
      }
    }

  } catch (error) {
    logStep(`Storage operation failed`, { error: error.message });
  }

  return storedUrls;
}

async function createConsolidatedPdf(supabaseClient: any, processedLabels: any[]) {
  try {
    const pdfDoc = await PDFDocument.create();
    const pdfUrls = processedLabels
      .map(label => label.label_urls?.pdf)
      .filter(Boolean);

    if (pdfUrls.length === 0) {
      logStep("No PDF labels found to consolidate");
      return null;
    }

    for (const url of pdfUrls) {
      const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
      const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
      const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
      copiedPages.forEach((page) => pdfDoc.addPage(page));
    }
    
    const pdfBytes = await pdfDoc.save();
    const consolidatedPath = `batches/batch_consolidated_label_${Date.now()}.pdf`;

    const { error } = await supabaseClient.storage
      .from('shipping-labels')
      .upload(consolidatedPath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      logStep('Consolidated PDF upload error', { error: error.message });
      throw error;
    }

    const { data: urlData } = supabaseClient.storage
      .from('shipping-labels')
      .getPublicUrl(consolidatedPath);
      
    return urlData.publicUrl;

  } catch (error) {
    logStep(`Consolidated PDF creation failed`, { error: error.message });
  }
  
  return null;
}
