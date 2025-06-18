
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

interface PickupRequest {
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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'EasyPost API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const pickupData: PickupRequest = await req.json();
    
    // Validate required address fields
    const { address } = pickupData;
    if (!address.street1 || !address.city || !address.state || !address.zip || !address.country || !address.phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required address fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 1: Get pickup rates from EasyPost
    const ratesResponse = await fetch('https://api.easypost.com/v2/pickup_rates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickup: {
          address: address,
          min_datetime: pickupData.min_datetime,
          max_datetime: pickupData.max_datetime,
          is_account_address: pickupData.is_account_address || false,
          instructions: pickupData.instructions || '',
          shipment: pickupData.shipment_ids ? { ids: pickupData.shipment_ids } : undefined
        }
      })
    });

    if (!ratesResponse.ok) {
      const error = await ratesResponse.text();
      return new Response(
        JSON.stringify({ error: `EasyPost pickup rates error: ${error}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const ratesData = await ratesResponse.json();
    const pickupRates = ratesData.pickup_rates || [];
    
    if (pickupRates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No pickup rates available for this request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Use the first available rate (you can modify this logic)
    const selectedRate = pickupRates[0];
    const pickupCost = parseFloat(selectedRate.rate);

    // Step 2: Process Stripe payment
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // For demo purposes, we'll create a payment intent
    // In production, you'd get customer details from the request
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pickupCost * 100), // Convert to cents
      currency: 'usd',
      description: `Pickup service - ${selectedRate.carrier} ${selectedRate.service}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Step 3: Buy the pickup from EasyPost
    const pickupResponse = await fetch(`https://api.easypost.com/v2/pickups`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickup: {
          address: address,
          min_datetime: pickupData.min_datetime,
          max_datetime: pickupData.max_datetime,
          is_account_address: pickupData.is_account_address || false,
          instructions: pickupData.instructions || '',
          shipment: pickupData.shipment_ids ? { ids: pickupData.shipment_ids } : undefined,
          rate: {
            id: selectedRate.id
          }
        }
      })
    });

    if (!pickupResponse.ok) {
      const error = await pickupResponse.text();
      return new Response(
        JSON.stringify({ error: `EasyPost pickup creation error: ${error}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const pickupResult = await pickupResponse.json();

    return new Response(
      JSON.stringify({
        pickup: pickupResult,
        payment_intent: paymentIntent,
        cost: pickupCost,
        confirmation: pickupResult.confirmation,
        pickup_window: {
          min_datetime: pickupResult.min_datetime,
          max_datetime: pickupResult.max_datetime
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-pickup function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
