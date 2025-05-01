
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddressData {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

interface PickupRequestData {
  carrierCode: string;
  shipmentIds: string[];
  pickupAddress: AddressData;
  pickupDate: string;
  pickupTimeWindow: {
    start: string;
    end: string;
  };
  instructions?: string;
  packageCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData: PickupRequestData = await req.json();
    
    // Validate required fields
    if (!requestData.carrierCode || !requestData.pickupAddress || !requestData.pickupDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required pickup information' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // In a real implementation, we would:
    // 1. Format the data for EasyPost's pickup API
    // 2. Call the EasyPost API to schedule the pickup
    // 3. Return the confirmation details
    
    // For this demo, we'll simulate a successful pickup scheduling
    const pickupId = `pu_${Math.random().toString(36).substring(2, 10)}`;
    const confirmationNumber = `PC${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`;
    
    // Return the simulated pickup data
    return new Response(
      JSON.stringify({
        pickupId: pickupId,
        confirmation: confirmationNumber,
        scheduledDate: requestData.pickupDate,
        carrier: requestData.carrierCode.toUpperCase(),
        status: 'scheduled',
        address: {
          name: requestData.pickupAddress.name,
          street1: requestData.pickupAddress.street1,
          city: requestData.pickupAddress.city,
          state: requestData.pickupAddress.state,
          zip: requestData.pickupAddress.zip,
          country: requestData.pickupAddress.country
        },
        timeWindow: requestData.pickupTimeWindow,
        packageCount: requestData.packageCount,
        message: 'Pickup scheduled successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in schedule-pickup function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
