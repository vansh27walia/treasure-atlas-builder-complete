
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== BULK LABEL CREATION STARTED ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Auth session missing!' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Parse request body
    const { shipments, pickupAddress, labelOptions } = await req.json();
    
    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No shipments provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!pickupAddress) {
      return new Response(
        JSON.stringify({ error: 'Pickup address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing ${shipments.length} shipments for user: ${user.email}`);

    const easypostApiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!easypostApiKey) {
      return new Response(
        JSON.stringify({ error: 'EasyPost API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const processedLabels = [];
    const failedLabels = [];

    // Process each shipment
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      console.log(`Processing shipment ${i + 1}/${shipments.length}: ${shipment.id}`);

      try {
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing selected rate ID or EasyPost shipment ID');
        }

        // Purchase the label from EasyPost
        const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment.easypost_id}/buy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${easypostApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rate: { id: shipment.selectedRateId }
          }),
        });

        if (!buyResponse.ok) {
          const errorData = await buyResponse.json();
          throw new Error(`EasyPost error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const boughtShipment = await buyResponse.json();
        
        const processedLabel = {
          id: boughtShipment.id,
          original_shipment_id: shipment.id,
          tracking_code: boughtShipment.tracking_code,
          label_url: boughtShipment.postage_label?.label_url,
          label_urls: {
            png: boughtShipment.postage_label?.label_url,
            pdf: boughtShipment.postage_label?.label_pdf_url,
            zpl: boughtShipment.postage_label?.label_zpl_url,
            epl: boughtShipment.postage_label?.label_epl2_url,
          },
          customer_name: shipment.customer_name || shipment.recipient,
          customer_address: shipment.customer_address,
          carrier: boughtShipment.selected_rate?.carrier || shipment.carrier,
          service: boughtShipment.selected_rate?.service || shipment.service,
          rate: parseFloat(boughtShipment.selected_rate?.rate || shipment.rate || '0'),
        };

        processedLabels.push(processedLabel);
        console.log(`✅ Successfully processed shipment ${shipment.id}`);

      } catch (error) {
        console.error(`❌ Failed to process shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error.message || 'Unknown error',
        });

        if (labelOptions?.haltOnFailure) {
          console.log('Halting batch processing due to error');
          return new Response(
            JSON.stringify({ 
              error: `Batch halted. Package #${i + 1} couldn't be processed: ${error.message}` 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }

    // Create batch result if we have processed labels
    let batchResult = null;
    if (processedLabels.length > 0 && labelOptions?.generateBatch) {
      console.log('Creating batch for consolidated labels...');
      
      try {
        const shipmentIds = processedLabels.map(label => ({ id: label.id }));
        
        const createBatchResponse = await fetch('https://api.easypost.com/v2/batches', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${easypostApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch: { shipments: shipmentIds }
          }),
        });

        if (createBatchResponse.ok) {
          const batchData = await createBatchResponse.json();
          console.log('✅ Batch created:', batchData.id);
          
          // Generate consolidated PDF
          const labelResponse = await fetch(`https://api.easypost.com/v2/batches/${batchData.id}/label`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${easypostApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file_format: 'pdf' }),
          });

          if (labelResponse.ok) {
            // Wait a moment for the batch to process
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const finalBatchResponse = await fetch(`https://api.easypost.com/v2/batches/${batchData.id}`, {
              headers: { 'Authorization': `Bearer ${easypostApiKey}` },
            });

            if (finalBatchResponse.ok) {
              const finalBatch = await finalBatchResponse.json();
              batchResult = {
                batchId: batchData.id,
                consolidatedLabelUrls: {
                  pdf: finalBatch.label_url,
                },
                scanFormUrl: null,
              };
              console.log('✅ Consolidated PDF created');
            }
          }
        }
      } catch (batchError) {
        console.error('Error creating batch:', batchError);
      }
    }

    const response = {
      total: shipments.length,
      successful: processedLabels.length,
      failed: failedLabels.length,
      processedLabels,
      failedLabels,
      batchResult,
    };

    console.log('=== BULK LABEL CREATION COMPLETED ===');
    console.log(`Total: ${response.total}, Successful: ${response.successful}, Failed: ${response.failed}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Critical error in bulk label creation:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Check function logs for more information'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(serve_handler);
