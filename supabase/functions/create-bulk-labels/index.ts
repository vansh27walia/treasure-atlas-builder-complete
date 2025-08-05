import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'EasyPost API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const requestData = await req.json();
    const { shipments, pickupAddress, labelOptions = {} } = requestData;
    
    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No shipments provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for bulk label creation`);

    const processedLabels = [];
    const failedLabels = [];

    // Batch creation
    let batch;
    if (labelOptions.generateBatch) {
      try {
        const batchResponse = await fetch('https://api.easypost.com/v2/batches', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch: {
              reference: `batch_${Date.now()}`,
              shipments: shipments.map(s => ({ id: s.easypost_id }))
            }
          }),
        });

        if (!batchResponse.ok) {
          const errorData = await batchResponse.json();
          throw new Error(`EasyPost batch creation error: ${JSON.stringify(errorData)}`);
        }

        batch = await batchResponse.json();
        console.log('Batch created:', batch.id);

        // Add shipments to batch
        const addShipmentsResponse = await fetch(`https://api.easypost.com/v2/batches/${batch.id}/add_shipments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipments: shipments.map(s => ({ id: s.easypost_id }))
          }),
        });

        if (!addShipmentsResponse.ok) {
          const errorData = await addShipmentsResponse.json();
          throw new Error(`EasyPost add shipments error: ${JSON.stringify(errorData)}`);
        }

        const addShipmentsData = await addShipmentsResponse.json();
        console.log('Shipments added to batch:', addShipmentsData);

        // Purchase batch
        const purchaseBatchResponse = await fetch(`https://api.easypost.com/v2/batches/${batch.id}/buy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // No body needed
          }),
        });

        if (!purchaseBatchResponse.ok) {
          const errorData = await purchaseBatchResponse.json();
          throw new Error(`EasyPost purchase batch error: ${JSON.stringify(errorData)}`);
        }

        const purchaseBatchData = await purchaseBatchResponse.json();
        console.log('Batch purchased:', purchaseBatchData);

        // Retrieve batch (wait until completed)
        let batchStatus = 'creating';
        let batchResult;
        while (batchStatus !== 'completed') {
          const retrieveBatchResponse = await fetch(`https://api.easypost.com/v2/batches/${batch.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (!retrieveBatchResponse.ok) {
            const errorData = await retrieveBatchResponse.json();
            throw new Error(`EasyPost retrieve batch error: ${JSON.stringify(errorData)}`);
          }

          batchResult = await retrieveBatchResponse.json();
          batchStatus = batchResult.status;
          console.log('Batch status:', batchStatus);

          if (batchStatus !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          }
        }

        console.log('Final batch result:', batchResult);

        // Generate batch label URLs
        const batchLabelUrls = {
          pdfUrl: batchResult.label_url,
          zplUrl: batchResult.zpl_url,
          eplUrl: batchResult.epl2_url
        };

        // Generate scan form
        let scanFormUrl = null;
        if (labelOptions.generateManifest) {
          const scanFormResponse = await fetch('https://api.easypost.com/v2/scan_forms', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              scan_form: {
                batch_id: batch.id
              }
            }),
          });

          if (!scanFormResponse.ok) {
            const errorData = await scanFormResponse.json();
            console.warn(`EasyPost scan form error: ${JSON.stringify(errorData)}`);
          } else {
            const scanFormData = await scanFormResponse.json();
            scanFormUrl = scanFormData.scan_form.status === 'available' ? scanFormData.scan_form.label_url : null;
            console.log('Scan form URL:', scanFormUrl);
          }
        }

        const batchResultForFrontend = {
          batchId: batch.id,
          batchLabelUrls,
          scanFormUrl
        };

        // Return batch result
        return new Response(
          JSON.stringify({
            success: true,
            batchResult: batchResultForFrontend
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error creating batch:', error);
        return new Response(
          JSON.stringify({ error: 'Error creating batch', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      
      try {
        console.log(`Processing shipment ${i + 1}/${shipments.length}: ${shipment.id}`);

        // Build the shipment request payload
        const shipmentRequest = {
          shipment: {
            to_address: shipment.details.to_address,
            from_address: pickupAddress,
            parcel: shipment.details.parcel,
            reference: shipment.details.reference || shipment.id
          }
        };

        // Add customs info for international shipments
        if (shipment.details.customs_info) {
          console.log('Adding customs info for international shipment:', shipment.id);
          shipmentRequest.shipment.customs_info = {
            contents_type: shipment.details.customs_info.contents_type || 'merchandise',
            contents_explanation: shipment.details.customs_info.contents_explanation,
            customs_certify: shipment.details.customs_info.customs_certify !== false,
            customs_signer: shipment.details.customs_info.customs_signer,
            non_delivery_option: shipment.details.customs_info.non_delivery_option || 'return',
            restriction_type: shipment.details.customs_info.restriction_type || 'none',
            restriction_comments: shipment.details.customs_info.restriction_comments,
            eel_pfc: shipment.details.customs_info.eel_pfc || 'NOEEI 30.37(a)',
            customs_items: shipment.details.customs_info.customs_items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              weight: item.weight,
              value: item.value,
              hs_tariff_number: item.hs_tariff_number,
              origin_country: item.origin_country
            }))
          };
        }

        // Buy the label
        const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment.easypost_id}/buy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rate: { id: shipment.selectedRateId },
            ...shipmentRequest
          }),
        });

        const labelData = await buyResponse.json();
        
        if (!buyResponse.ok) {
          throw new Error(`EasyPost error: ${JSON.stringify(labelData)}`);
        }

        const labelUrl = labelData.postage_label?.label_url;
        const trackingCode = labelData.tracking_code;

        processedLabels.push({
          id: shipment.easypost_id,
          original_shipment_id: shipment.id,
          customer_name: shipment.details.to_address.name,
          label_url: labelUrl,
          tracking_code: trackingCode,
          carrier: labelData.carrier,
          service: labelData.service,
          rate: labelData.rate
        });
      } catch (error) {
        console.error(`Error processing shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error.message
        });
      }
    }

    const total = shipments.length;
    const successful = processedLabels.length;
    const failed = failedLabels.length;

    return new Response(
      JSON.stringify({
        success: true,
        total,
        successful,
        failed,
        processedLabels,
        failedLabels
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
