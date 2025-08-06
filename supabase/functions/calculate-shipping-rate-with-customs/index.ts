
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomsItem {
  description: string;
  quantity: number;
  weight: number;
  value: number;
  hs_tariff_number: string;
  origin_country: string;
}

interface CustomsData {
  customs_certify: boolean;
  customs_signer: string;
  contents_type: string;
  eel_pfc: string;
  non_delivery_option: string;
  restriction_type: string;
  restriction_comments?: string;
  customs_items: CustomsItem[];
  phone_number: string;
}

interface ShippingRequest {
  fromAddress: any;
  toAddress: any;
  parcel: any;
  customsData?: CustomsData;
}

// Apply 5% markup to rates - internal billing logic
const applyRateMarkup = (originalRate: number): number => {
  const markupPercentage = 0.05; // 5%
  return originalRate + (originalRate * markupPercentage);
};

// Validate customs data structure
const validateCustomsData = (customsData: CustomsData) => {
  const errors: string[] = [];

  if (!customsData.customs_signer?.trim()) {
    errors.push('Customs signer name is required');
  }

  if (!customsData.phone_number?.trim()) {
    errors.push('Phone number is required');
  }

  if (!customsData.customs_items || customsData.customs_items.length === 0) {
    errors.push('At least one customs item is required');
  } else {
    customsData.customs_items.forEach((item, index) => {
      if (!item.description?.trim()) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (!item.value || item.value <= 0) {
        errors.push(`Item ${index + 1}: Value must be greater than 0`);
      }
      if (!item.weight || item.weight <= 0) {
        errors.push(`Item ${index + 1}: Weight must be greater than 0`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
    });
  }

  return errors;
};

// Get shipping rates from EasyPost
const fetchShippingRates = async (requestData: ShippingRequest) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    // Create shipment to get rates
    const shipmentPayload = {
      shipment: {
        to_address: requestData.toAddress,
        from_address: requestData.fromAddress,
        parcel: requestData.parcel
      }
    };

    console.log('Creating shipment for rates:', JSON.stringify(shipmentPayload, null, 2));

    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('EasyPost shipment creation error:', errorData);
      throw new Error(`EasyPost API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const shipmentData = await response.json();
    console.log('Shipment created successfully:', shipmentData.id);

    // Process and markup rates
    const processedRates = shipmentData.rates?.map((rate: any) => {
      const originalRate = parseFloat(rate.rate);
      const markedUpRate = applyRateMarkup(originalRate);
      
      console.log(`Rate processing - Original: $${originalRate.toFixed(2)}, Marked up: $${markedUpRate.toFixed(2)}`);
      
      return {
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: markedUpRate.toFixed(2), // Return marked up rate
        original_rate: originalRate.toFixed(2), // Store original for reference
        currency: rate.currency || 'USD',
        delivery_days: rate.delivery_days,
        delivery_date: rate.delivery_date,
        delivery_date_guaranteed: rate.delivery_date_guaranteed,
        est_delivery_days: rate.est_delivery_days,
        list_rate: rate.list_rate,
        retail_rate: rate.retail_rate,
        shipment_id: shipmentData.id
      };
    }) || [];

    return {
      rates: processedRates,
      shipment_id: shipmentData.id,
      customs_validated: !!requestData.customsData
    };

  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user's JWT token from the Authorization header
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

    // Parse the request body
    const requestData: ShippingRequest = await req.json();
    console.log('Received shipping request for user:', user.id);

    // Validate customs data if provided (for international shipments)
    if (requestData.customsData) {
      const validationErrors = validateCustomsData(requestData.customsData);
      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Customs validation failed', 
          details: validationErrors 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      console.log('Customs data validated successfully');
    }

    // Fetch shipping rates with markup applied
    const rateData = await fetchShippingRates(requestData);

    console.log(`Successfully processed ${rateData.rates.length} rates with 5% markup for user ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      ...rateData,
      message: 'Shipping rates calculated successfully with markup applied'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in calculate-shipping-rate-with-customs function:', error);
    return new Response(JSON.stringify({ 
      error: 'Rate calculation failed', 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
