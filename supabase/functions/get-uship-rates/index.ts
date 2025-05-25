
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UShipLTLPayload {
  shipment_type: 'LTL';
  origin: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  destination: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  pickup_date: string;
  delivery_date?: string;
  packages: Array<{
    length: number;
    width: number;
    height: number;
    weight: number;
    freight_class: string;
    quantity: number;
  }>;
}

interface UShipFTLPayload {
  shipment_type: 'FTL';
  origin: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  destination: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  pickup_date: string;
  delivery_date?: string;
  truck_type: string;
  load_weight: number;
  load_type: string;
  special_requirements?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipmentData } = await req.json();
    console.log('Received shipment data:', shipmentData);

    // Get uShip API key from environment
    const ushipApiKey = Deno.env.get('USHIP_API_KEY');
    if (!ushipApiKey) {
      console.error('uShip API key not found');
      return new Response(
        JSON.stringify({ error: 'uShip API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required fields
    if (!shipmentData.shipment_type || !shipmentData.origin || !shipmentData.destination) {
      return new Response(
        JSON.stringify({ error: 'Missing required shipment data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construct the appropriate payload based on shipment type
    let ushipPayload: UShipLTLPayload | UShipFTLPayload;

    if (shipmentData.shipment_type === 'LTL') {
      ushipPayload = {
        shipment_type: 'LTL',
        origin: {
          street: shipmentData.origin.street,
          city: shipmentData.origin.city,
          state: shipmentData.origin.state,
          zip: shipmentData.origin.zip,
          country: shipmentData.origin.country || 'US'
        },
        destination: {
          street: shipmentData.destination.street,
          city: shipmentData.destination.city,
          state: shipmentData.destination.state,
          zip: shipmentData.destination.zip,
          country: shipmentData.destination.country || 'US'
        },
        pickup_date: shipmentData.pickup_date,
        delivery_date: shipmentData.delivery_date,
        packages: shipmentData.packages || []
      };
    } else if (shipmentData.shipment_type === 'FTL') {
      ushipPayload = {
        shipment_type: 'FTL',
        origin: {
          street: shipmentData.origin.street,
          city: shipmentData.origin.city,
          state: shipmentData.origin.state,
          zip: shipmentData.origin.zip,
          country: shipmentData.origin.country || 'US'
        },
        destination: {
          street: shipmentData.destination.street,
          city: shipmentData.destination.city,
          state: shipmentData.destination.state,
          zip: shipmentData.destination.zip,
          country: shipmentData.destination.country || 'US'
        },
        pickup_date: shipmentData.pickup_date,
        delivery_date: shipmentData.delivery_date,
        truck_type: shipmentData.truck_type,
        load_weight: shipmentData.load_weight,
        load_type: shipmentData.load_type,
        special_requirements: shipmentData.special_requirements
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid shipment type. Must be LTL or FTL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Sending payload to uShip:', ushipPayload);

    // Make request to uShip API
    const ushipResponse = await fetch('https://api.uship.com/v1/rates/quote', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ushipApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(ushipPayload)
    });

    if (!ushipResponse.ok) {
      const errorText = await ushipResponse.text();
      console.error('uShip API error:', ushipResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch rates from uShip',
          details: errorText,
          status: ushipResponse.status
        }),
        { 
          status: ushipResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const ushipData = await ushipResponse.json();
    console.log('uShip API response:', ushipData);

    // Transform uShip response to our format
    const transformedRates = ushipData.rates?.map((rate: any) => ({
      id: rate.id || Math.random().toString(),
      carrier: rate.carrier_name || 'uShip Carrier',
      service: rate.service_type || rate.truck_type || 'Standard',
      rate: parseFloat(rate.total_price || rate.price || '0'),
      currency: rate.currency || 'USD',
      delivery_days: rate.transit_days || rate.delivery_days || 'N/A',
      delivery_date: rate.estimated_delivery_date,
      rate_id: rate.rate_id || rate.id
    })) || [];

    return new Response(
      JSON.stringify({ 
        success: true, 
        rates: transformedRates,
        shipment_type: shipmentData.shipment_type
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-uship-rates function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
