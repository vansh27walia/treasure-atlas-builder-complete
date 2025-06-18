
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PickupAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

interface PickupRateRequest {
  address: PickupAddress;
  min_datetime: string;
  max_datetime: string;
  shipment_ids?: string[];
  is_account_address?: boolean;
  instructions?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'EasyPost API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const requestData: PickupRateRequest = await req.json();
    
    // Validate required address fields
    const { address } = requestData;
    if (!address.street1 || !address.city || !address.state || !address.zip || !address.country || !address.phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required address fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Call EasyPost pickup rates API
    const response = await fetch('https://api.easypost.com/v2/pickup_rates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickup: {
          address: address,
          min_datetime: requestData.min_datetime,
          max_datetime: requestData.max_datetime,
          is_account_address: requestData.is_account_address || false,
          instructions: requestData.instructions || '',
          shipment: requestData.shipment_ids ? { ids: requestData.shipment_ids } : undefined
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `EasyPost pickup rates error: ${error}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        pickup_rates: data.pickup_rates || [],
        pickup: data.pickup || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in get-pickup-rates function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
