
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LabelOptions {
  format?: string;
  size?: string;
}

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, options: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Purchasing live label for shipment ${shipmentId} with rate ${rateId}`);
    
    // Buy the shipment with selected rate via EasyPost API
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId },
        label_format: options.format || 'PDF',
        label_size: options.size || '4x6',
      }),
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      throw new Error(`EasyPost purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtShipment = await buyResponse.json();
    console.log(`Successfully purchased live label for shipment ${shipmentId}`);
    
    return {
      id: boughtShipment.id,
      tracking_code: boughtShipment.tracking_code,
      label_url: boughtShipment.postage_label?.label_url,
      carrier: boughtShipment.selected_rate?.carrier,
      service: boughtShipment.selected_rate?.service,
      rate: boughtShipment.selected_rate?.rate,
      customer_name: boughtShipment.to_address?.name,
      customer_address: `${boughtShipment.to_address?.street1}, ${boughtShipment.to_address?.city}, ${boughtShipment.to_address?.state} ${boughtShipment.to_address?.zip}`,
      customer_phone: boughtShipment.to_address?.phone,
      customer_email: boughtShipment.to_address?.email,
      customer_company: boughtShipment.to_address?.company,
    };
    
  } catch (error) {
    console.error(`EasyPost label purchase error for shipment ${shipmentId}:`, error);
    throw error;
  }
};

const createEasyPostBatch = async (shipments: any[], labelOptions: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating EasyPost batch for ${shipments.length} shipments`);
    
    // Create batch with shipment IDs
    const batchData = {
      batch: {
        shipments: shipments.map(s => ({ id: s.easypost_id }))
      }
    };

    const batchResponse = await fetch('https://api.easypost.com/v2/batches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });

    if (!batchResponse.ok) {
      const errorData = await batchResponse.json();
      throw new Error(`EasyPost batch creation error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const batch = await batchResponse.json();
    console.log(`Created EasyPost batch with ID: ${batch.id}`);

    // Buy the batch
    const buyBatchResponse = await fetch(`https://api.easypost.com/v2/batches/${batch.id}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!buyBatchResponse.ok) {
      const errorData = await buyBatchResponse.json();
      throw new Error(`EasyPost batch purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtBatch = await buyBatchResponse.json();
    console.log(`Successfully purchased EasyPost batch: ${boughtBatch.id}`);

    return boughtBatch;
    
  } catch (error) {
    console.error('EasyPost batch processing error:', error);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipments, pickupAddress, labelOptions = {}, useBatch = false } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    const processedLabels = [];
    const failedLabels = [];

    if (useBatch && shipments.length > 1 && apiKey) {
      // Use EasyPost Batch API for bulk processing
      try {
        console.log(`Processing ${shipments.length} shipments using EasyPost Batch API`);
        
        const batch = await createEasyPostBatch(shipments, labelOptions);
        
        // Process batch results
        for (const shipment of shipments) {
          try {
            const batchShipment = batch.shipments.find((s: any) => s.id === shipment.easypost_id);
            
            if (batchShipment && batchShipment.postage_label) {
              processedLabels.push({
                ...shipment,
                tracking_code: batchShipment.tracking_code,
                label_url: batchShipment.postage_label.label_url,
                status: 'completed' as const,
                customer_name: batchShipment.to_address?.name,
                customer_address: `${batchShipment.to_address?.street1}, ${batchShipment.to_address?.city}, ${batchShipment.to_address?.state} ${batchShipment.to_address?.zip}`,
                customer_phone: batchShipment.to_address?.phone,
                customer_email: batchShipment.to_address?.email,
                customer_company: batchShipment.to_address?.company,
              });
            } else {
              throw new Error('Label not generated in batch');
            }
          } catch (error) {
            failedLabels.push({
              shipmentId: shipment.id,
              error: error instanceof Error ? error.message : 'Batch processing failed',
            });
          }
        }
        
      } catch (batchError) {
        console.error('Batch processing failed, falling back to individual processing:', batchError);
        // Fall back to individual processing
      }
    }

    // Individual processing (fallback or when batch is not used)
    if (processedLabels.length === 0) {
      for (const shipment of shipments) {
        try {
          let labelData;
          
          if (apiKey && shipment.selectedRateId && shipment.easypost_id) {
            // Purchase real label via EasyPost
            labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, labelOptions);
          } else {
            throw new Error('Missing EasyPost shipment ID or rate ID for live label generation');
          }

          processedLabels.push({
            ...shipment,
            ...labelData,
            status: 'completed' as const,
          });

        } catch (error) {
          console.error(`Failed to create live label for shipment ${shipment.id}:`, error);
          failedLabels.push({
            shipmentId: shipment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Processed ${processedLabels.length} live labels using EasyPost API`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in EasyPost create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'EasyPost Label Creation Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
