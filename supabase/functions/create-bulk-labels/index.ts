
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const requestData = await req.json();
    const { shipments, pickupAddress } = requestData;
    
    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
      console.error('No shipments provided');
      return new Response(
        JSON.stringify({ error: 'No shipments provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Creating labels for ${shipments.length} shipments`);

    const processedShipments = [];
    const labelUrls = [];

    for (const shipment of shipments) {
      try {
        console.log(`Processing shipment ${shipment.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          console.error(`Shipment ${shipment.id} missing rate or shipment ID`);
          processedShipments.push({
            ...shipment,
            status: 'error',
            error: 'Missing rate selection or shipment ID'
          });
          continue;
        }

        // Determine if this is an international shipment
        const isInternational = shipment.details?.to_address?.country !== 'US';
        console.log(`Shipment ${shipment.id} is ${isInternational ? 'international' : 'domestic'}`);

        // For international shipments, use the create-international-label function
        if (isInternational) {
          console.log(`Creating international label for shipment ${shipment.id}`);
          
          const { data: labelData, error: labelError } = await supabaseClient.functions.invoke('create-international-label', {
            body: {
              shipmentId: shipment.easypost_id,
              rateId: shipment.selectedRateId,
              options: {
                label_format: "PDF",
                label_size: "4x6"
              }
            }
          });

          if (labelError) {
            console.error(`International label creation error for ${shipment.id}:`, labelError);
            processedShipments.push({
              ...shipment,
              status: 'error',
              error: `International label error: ${labelError.message}`
            });
            continue;
          }

          processedShipments.push({
            ...shipment,
            status: 'completed',
            tracking_code: labelData.trackingCode,
            label_url: labelData.labelUrl,
            label_urls: {
              pdf: labelData.labelUrl
            }
          });

          if (labelData.labelUrl) {
            labelUrls.push(labelData.labelUrl);
          }

        } else {
          // Domestic shipment - use regular EasyPost API
          console.log(`Creating domestic label for shipment ${shipment.id}`);
          
          const response = await fetch(`https://api.easypost.com/v2/shipments/${shipment.easypost_id}/buy`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rate: { id: shipment.selectedRateId }
            }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            console.error(`EasyPost API error for shipment ${shipment.id}:`, JSON.stringify(data, null, 2));
            processedShipments.push({
              ...shipment,
              status: 'error',
              error: `EasyPost error: ${data.error?.message || 'Unknown error'}`
            });
            continue;
          }

          // Save domestic label to Supabase Storage
          let storedLabelUrl = data.postage_label?.label_url;
          
          if (data.postage_label?.label_url) {
            try {
              const labelResponse = await fetch(data.postage_label.label_url);
              if (labelResponse.ok) {
                const labelBlob = await labelResponse.blob();
                const safeTrackingCode = data.tracking_code ? data.tracking_code.replace(/[^a-zA-Z0-9]/g, '_') : `shipment_${shipment.easypost_id}`;
                const fileName = `bulk_labels/${safeTrackingCode}_${shipment.easypost_id}.pdf`;
                
                const { error: uploadError } = await supabaseClient.storage
                  .from('shipping-labels')
                  .upload(fileName, labelBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                  });
                
                if (!uploadError) {
                  const { data: urlData } = supabaseClient.storage
                    .from('shipping-labels')
                    .getPublicUrl(fileName);
                  
                  storedLabelUrl = urlData.publicUrl;
                  console.log('Domestic label saved to Supabase storage:', storedLabelUrl);
                }
              }
            } catch (error) {
              console.error('Error saving domestic label to storage:', error);
            }
          }

          // Save the shipping record
          const shipmentRecord = {
            user_id: user.id,
            shipment_id: shipment.easypost_id,
            rate_id: shipment.selectedRateId,
            tracking_code: data.tracking_code,
            label_url: storedLabelUrl,
            status: 'created',
            carrier: data.selected_rate?.carrier,
            service: data.selected_rate?.service,
            delivery_days: data.selected_rate?.delivery_days || null,
            charged_rate: data.selected_rate?.rate || null,
            easypost_rate: data.selected_rate?.rate || null,
            currency: data.selected_rate?.currency || 'USD',
            label_format: "PDF",
            label_size: "4x6",
            is_international: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: dbError } = await supabaseClient
            .from('shipment_records')
            .insert(shipmentRecord);
            
          if (dbError) {
            console.error('Error saving domestic shipment record:', dbError);
          }

          // Save to tracking_records table
          if (data.tracking_code) {
            const trackingRecord = {
              user_id: user.id,
              tracking_code: data.tracking_code,
              carrier: data.selected_rate?.carrier || 'Unknown',
              service: data.selected_rate?.service || 'Standard',
              status: 'created',
              recipient_name: shipment.details?.to_name || 'Unknown',
              recipient_address: `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
              label_url: storedLabelUrl,
              shipment_id: shipment.easypost_id,
              easypost_id: shipment.easypost_id
            };

            const { error: trackingError } = await supabaseClient
              .from('tracking_records')
              .insert(trackingRecord);

            if (trackingError) {
              console.error('Failed to save domestic tracking record:', trackingError);
            }
          }

          processedShipments.push({
            ...shipment,
            status: 'completed',
            tracking_code: data.tracking_code,
            label_url: storedLabelUrl,
            label_urls: {
              pdf: storedLabelUrl,
              png: data.postage_label?.label_png_url,
              zpl: data.postage_label?.label_zpl_url
            }
          });

          if (storedLabelUrl) {
            labelUrls.push(storedLabelUrl);
          }
        }

        console.log(`Successfully processed shipment ${shipment.id}`);

      } catch (error) {
        console.error(`Error processing shipment ${shipment.id}:`, error);
        processedShipments.push({
          ...shipment,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Create consolidated labels if we have multiple labels
    let consolidatedLabelUrls = null;
    if (labelUrls.length > 0) {
      try {
        console.log(`Creating consolidated PDF from ${labelUrls.length} labels`);
        
        // For now, we'll use the first label URL as the consolidated URL
        // In a full implementation, you might want to merge PDFs
        consolidatedLabelUrls = {
          pdf: labelUrls[0], // This should be a merged PDF in production
          png: labelUrls[0], // Convert to PNG if needed
        };
      } catch (error) {
        console.error('Error creating consolidated labels:', error);
      }
    }

    const successful = processedShipments.filter(s => s.status === 'completed').length;
    const failed = processedShipments.filter(s => s.status === 'error').length;
    const totalCost = processedShipments
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.rate || 0), 0);

    console.log(`Bulk label creation complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        total: shipments.length,
        successful,
        failed,
        totalCost,
        processedShipments,
        bulk_label_pdf_url: consolidatedLabelUrls?.pdf,
        batchResult: {
          batchId: `batch_${Date.now()}`,
          consolidatedLabelUrls: consolidatedLabelUrls || {},
          scanFormUrl: null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
