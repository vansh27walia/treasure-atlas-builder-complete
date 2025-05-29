
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
    console.log(`Checking shipment ${shipmentId} status before purchase`);
    
    // First, check if the shipment already has postage
    const checkResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!checkResponse.ok) {
      throw new Error(`Failed to check shipment status: ${checkResponse.status}`);
    }

    const existingShipment = await checkResponse.json();
    
    // If shipment already has postage, return existing label info
    if (existingShipment.postage_label && existingShipment.tracking_code) {
      console.log(`Shipment ${shipmentId} already has postage, returning existing label`);
      return {
        id: existingShipment.id,
        tracking_code: existingShipment.tracking_code,
        label_url: existingShipment.postage_label?.label_url,
        carrier: existingShipment.selected_rate?.carrier,
        service: existingShipment.selected_rate?.service,
        rate: existingShipment.selected_rate?.rate,
        customer_name: existingShipment.to_address?.name,
        customer_address: `${existingShipment.to_address?.street1}, ${existingShipment.to_address?.city}, ${existingShipment.to_address?.state} ${existingShipment.to_address?.zip}`,
        customer_phone: existingShipment.to_address?.phone,
        customer_email: existingShipment.to_address?.email,
        customer_company: existingShipment.to_address?.company,
      };
    }
    
    console.log(`Purchasing new label for shipment ${shipmentId} with rate ${rateId}`);
    
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
      
      // If conflict error, try to get the existing shipment data
      if (buyResponse.status === 409 || errorData.error?.code === 'SHIPMENT.POSTAGE.EXISTS') {
        console.log(`Postage exists for ${shipmentId}, fetching existing data`);
        return {
          id: existingShipment.id,
          tracking_code: existingShipment.tracking_code || 'TRACKING_PENDING',
          label_url: existingShipment.postage_label?.label_url || '',
          carrier: existingShipment.selected_rate?.carrier || 'Unknown',
          service: existingShipment.selected_rate?.service || 'Unknown',
          rate: existingShipment.selected_rate?.rate || '0',
          customer_name: existingShipment.to_address?.name,
          customer_address: `${existingShipment.to_address?.street1}, ${existingShipment.to_address?.city}, ${existingShipment.to_address?.state} ${existingShipment.to_address?.zip}`,
          customer_phone: existingShipment.to_address?.phone,
          customer_email: existingShipment.to_address?.email,
          customer_company: existingShipment.to_address?.company,
        };
      }
      
      throw new Error(`EasyPost purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtShipment = await buyResponse.json();
    console.log(`Successfully purchased new label for shipment ${shipmentId}`);
    
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipments, pickupAddress, labelOptions = {} } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for label creation`);
    
    const processedLabels = [];
    const failedLabels = [];

    // Process each shipment individually to ensure we get all labels
    for (const shipment of shipments) {
      try {
        console.log(`Processing label for shipment ${shipment.id} with EasyPost ID ${shipment.easypost_id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for live label generation');
        }

        // Purchase label via EasyPost
        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, labelOptions);

        // Ensure we preserve all customer details
        const processedLabel = {
          ...shipment,
          ...labelData,
          status: 'completed' as const,
          customer_name: labelData.customer_name || shipment.details?.to_name || shipment.recipient,
          customer_address: labelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
          customer_phone: labelData.customer_phone || shipment.details?.to_phone,
          customer_email: labelData.customer_email || shipment.details?.to_email,
          customer_company: labelData.customer_company || shipment.details?.to_company,
        };

        processedLabels.push(processedLabel);
        console.log(`Successfully processed label for shipment ${shipment.id}`);

      } catch (error) {
        console.error(`Failed to create label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`Label processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed`);

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
