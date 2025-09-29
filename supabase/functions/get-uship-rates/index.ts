
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
    console.log('Received shipment data:', JSON.stringify(shipmentData, null, 2));

    // Get uShip API key from environment
    const ushipApiKey = Deno.env.get('USHIP_API_KEY');
    
    if (!ushipApiKey) {
      console.error('USHIP_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'uShip API key not configured. Please contact administrator.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('uShip API key found, length:', ushipApiKey.length);

    // Validate required fields
    if (!shipmentData.shipment_type || !shipmentData.origin || !shipmentData.destination) {
      console.error('Missing required shipment data');
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

    console.log('Constructed payload:', JSON.stringify(ushipPayload, null, 2));
    console.log('Making request to uShip API...');
    
    // Make request to uShip API - using the correct endpoint
    const ushipResponse = await fetch('https://api.uship.com/v2/quotes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ushipApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Lovable-Shipping-App/1.0'
      },
      body: JSON.stringify(ushipPayload)
    });

    console.log('uShip API response status:', ushipResponse.status);
    console.log('uShip API response headers:', Object.fromEntries(ushipResponse.headers.entries()));

    if (!ushipResponse.ok) {
      const errorText = await ushipResponse.text();
      console.error('uShip API error response:', errorText);
      
      // Return specific error messages based on status codes
      let errorMessage = 'Failed to fetch rates from uShip API';
      if (ushipResponse.status === 401) {
        errorMessage = 'Invalid API key. Please check your uShip API credentials.';
      } else if (ushipResponse.status === 403) {
        errorMessage = 'Access denied. Please verify your uShip API permissions.';
      } else if (ushipResponse.status === 404) {
        errorMessage = 'uShip API endpoint not found. Please contact support.';
      } else if (ushipResponse.status >= 500) {
        errorMessage = 'uShip service is temporarily unavailable. Please try again later.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `Status: ${ushipResponse.status}`,
          api_response: errorText
        }),
        { 
          status: ushipResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const ushipData = await ushipResponse.json();
    console.log('uShip API success response:', JSON.stringify(ushipData, null, 2));

    // Transform uShip response to our format
    const transformedRates = ushipData.quotes?.map((quote: any, index: number) => ({
      id: quote.id || `uship_${index}`,
      carrier: quote.carrier?.name || 'uShip Carrier',
      service: quote.service_level || quote.equipment_type || 'Standard',
      rate: parseFloat(quote.total_cost || quote.price || '0'),
      currency: quote.currency || 'USD',
      delivery_days: quote.transit_time || quote.delivery_days || 'Contact carrier',
      delivery_date: quote.estimated_delivery_date,
      rate_id: quote.quote_id || quote.id
    })) || [];

    console.log('Transformed rates:', JSON.stringify(transformedRates, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        rates: transformedRates,
        shipment_type: shipmentData.shipment_type,
        mock_data: false
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
