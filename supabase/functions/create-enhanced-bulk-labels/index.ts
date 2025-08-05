import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShipmentResult {
  id: string;
  easypost_id: string;
  tracking_code: string;
  label_url: string;
  status: "pending" | "processing" | "error" | "completed";
  row: number;
  recipient: string;
  carrier: string;
  service: string;
  rate: number;
  availableRates: ShippingRate[];
  selectedRateId: string;
  details: {
    to_name: string;
    to_company?: string;
    to_street1: string;
    to_street2?: string;
    to_city: string;
    to_state: string;
    to_zip: string;
    to_country: string;
    to_phone?: string;
    to_email?: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    reference?: string;
  };
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_company?: string;
  customsInfo?: CustomsInfo;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string | null;
  shipment_id: string;
  carrier_account_id?: string;
  list_rate?: string;
  retail_rate?: string;
}

interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number; // Weight in ounces
  hs_tariff_number?: string;
  origin_country?: string;
}

interface CustomsInfo {
  eel_pfc?: string; // E.g., "NOEEI 30.37(a)"
  customs_certify?: boolean;
  customs_signer?: string;
  contents_type?: 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample' | 'other';
  restriction_type?: 'none' | 'other' | 'quarantine' | 'sanitary_phytosanitary_inspection';
  non_delivery_option?: 'return' | 'abandon';
  customs_items: CustomsItem[];
}

// Create shipment and buy label with customs support
const createLabelWithCustoms = async (shipment: any, pickupAddress: any, labelOptions: any) => {
  try {
    console.log(`Creating label for shipment ${shipment.id} with customs:`, shipment.customsInfo ? 'Yes' : 'No');
    
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      throw new Error('EasyPost API key not configured');
    }

    // Build the buy request
    const buyRequest: any = {
      rate: { id: shipment.selectedRateId }
    };

    // Add customs info if present (for international shipments)
    if (shipment.customsInfo && shipment.customsInfo.customs_items && shipment.customsInfo.customs_items.length > 0) {
      console.log('Adding customs info to label creation request');
      
      buyRequest.customs_info = {
        eel_pfc: shipment.customsInfo.eel_pfc || "NOEEI 30.37(a)",
        customs_certify: shipment.customsInfo.customs_certify || true,
        customs_signer: shipment.customsInfo.customs_signer,
        contents_type: shipment.customsInfo.contents_type || "merchandise",
        restriction_type: shipment.customsInfo.restriction_type || "none",
        non_delivery_option: shipment.customsInfo.non_delivery_option || "return",
        customs_items: shipment.customsInfo.customs_items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          value: item.value,
          weight: item.weight,
          hs_tariff_number: item.hs_tariff_number || "",
          origin_country: item.origin_country || "US"
        }))
      };
    }

    console.log('Sending buy request to EasyPost:', JSON.stringify(buyRequest, null, 2));

    // Buy the label
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipment.easypost_id}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buyRequest),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('EasyPost API error:', JSON.stringify(data, null, 2));
      throw new Error(`EasyPost API error: ${data.error?.message || 'Unknown error'}`);
    }

    console.log(`Label created successfully for shipment ${shipment.id}`);
    
    return {
      ...shipment,
      tracking_code: data.tracking_code,
      label_url: data.postage_label?.label_url,
      status: 'label_purchased',
      carrier: data.selected_rate?.carrier,
      service: data.selected_rate?.service,
      rate: parseFloat(data.selected_rate?.rate || '0'),
      easypost_data: data
    };

  } catch (error) {
    console.error(`Error creating label for shipment ${shipment.id}:`, error);
    return {
      ...shipment,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
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

    // Create a Supabase client with user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const requestBody = await req.json();

    const { shipments, pickupAddress, labelOptions = {} } = requestBody;
    
    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No shipments provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for label creation`);
    console.log('Shipments with customs data:', shipments.filter(s => s.customsInfo).length);

    // Process each shipment
    const processedLabels = [];
    const failedLabels = [];

    for (const shipment of shipments) {
      if (!shipment.selectedRateId) {
        console.log(`Skipping shipment ${shipment.id} - no rate selected`);
        failedLabels.push({
          ...shipment,
          status: 'error',
          error: 'No shipping rate selected'
        });
        continue;
      }

      try {
        const result = await createLabelWithCustoms(shipment, pickupAddress, labelOptions);
        
        if (result.status === 'error') {
          failedLabels.push(result);
        } else {
          processedLabels.push(result);

          // Save to database with customs info if present
          const shipmentRecord = {
            user_id: user.id,
            shipment_id: result.easypost_id,
            rate_id: shipment.selectedRateId,
            tracking_code: result.tracking_code,
            label_url: result.label_url,
            status: 'created',
            carrier: result.carrier,
            service: result.service,
            delivery_days: null,
            charged_rate: result.rate,
            easypost_rate: result.rate,
            currency: 'USD',
            label_format: labelOptions.format || 'PDF',
            label_size: labelOptions.size || '4x6',
            is_international: !!(shipment.customsInfo),
            customs_info: shipment.customsInfo ? JSON.stringify(shipment.customsInfo) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: dbError } = await supabaseClient
            .from('shipment_records')
            .insert(shipmentRecord);
            
          if (dbError) {
            console.error('Error saving shipment record:', dbError);
          } else {
            console.log('Successfully saved shipment record with customs info');
          }
        }
      } catch (error) {
        console.error(`Error processing shipment ${shipment.id}:`, error);
        failedLabels.push({
          ...shipment,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successful = processedLabels.length;
    const failed = failedLabels.length;

    // TODO: Implement batch label consolidation if needed
    // For now, return individual labels
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${processedLabels.length} labels with customs support`,
        successful: processedLabels.length,
        failed: failedLabels.length,
        processedLabels: [...processedLabels, ...failedLabels],
        failedLabels,
        batchResult: null // Will be populated if batch consolidation is implemented
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-enhanced-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
