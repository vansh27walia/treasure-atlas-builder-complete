
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

// Mock rate generator for testing since uShip API might not be available
const generateMockRates = (shipmentType: string, origin: any, destination: any) => {
  const baseRates = shipmentType === 'LTL' ? [
    { carrier: 'FedEx Freight', service: 'LTL Standard', baseRate: 350, transitDays: 3 },
    { carrier: 'UPS Freight', service: 'LTL Express', baseRate: 425, transitDays: 2 },
    { carrier: 'Old Dominion', service: 'LTL Economy', baseRate: 295, transitDays: 5 },
    { carrier: 'XPO Logistics', service: 'LTL Priority', baseRate: 380, transitDays: 3 },
    { carrier: 'YRC Freight', service: 'LTL Standard', baseRate: 320, transitDays: 4 }
  ] : [
    { carrier: 'Schneider', service: 'Dry Van', baseRate: 1850, transitDays: 2 },
    { carrier: 'J.B. Hunt', service: 'Flatbed', baseRate: 2100, transitDays: 3 },
    { carrier: 'Swift Transportation', service: 'Dry Van', baseRate: 1750, transitDays: 2 },
    { carrier: 'Werner Enterprises', service: 'Reefer', baseRate: 2350, transitDays: 3 },
    { carrier: 'Knight-Swift', service: 'Dry Van', baseRate: 1900, transitDays: 2 }
  ];

  return baseRates.map((rate, index) => {
    const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
    const finalRate = Math.round(rate.baseRate * (1 + variation));
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + rate.transitDays);
    
    return {
      id: `rate_${Date.now()}_${index}`,
      carrier: rate.carrier,
      service: rate.service,
      rate: finalRate,
      currency: 'USD',
      delivery_days: rate.transitDays,
      delivery_date: deliveryDate.toISOString().split('T')[0],
      rate_id: `uship_${Math.random().toString(36).substr(2, 9)}`
    };
  });
};

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
    console.log('uShip API key available:', !!ushipApiKey);

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

    let transformedRates = [];

    // Try uShip API first, fallback to mock data if it fails
    if (ushipApiKey) {
      try {
        console.log('Attempting to call uShip API...');
        
        // Make request to uShip API
        const ushipResponse = await fetch('https://api.uship.com/v2/shipments/quotes', {
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
        
        if (ushipResponse.ok) {
          const ushipData = await ushipResponse.json();
          console.log('uShip API response:', JSON.stringify(ushipData, null, 2));

          // Transform uShip response to our format
          transformedRates = ushipData.quotes?.map((quote: any, index: number) => ({
            id: quote.id || `uship_${index}`,
            carrier: quote.carrier?.name || 'uShip Carrier',
            service: quote.service_level || quote.equipment_type || 'Standard',
            rate: parseFloat(quote.total_cost || quote.price || '0'),
            currency: quote.currency || 'USD',
            delivery_days: quote.transit_time || quote.delivery_days || 'N/A',
            delivery_date: quote.estimated_delivery_date,
            rate_id: quote.quote_id || quote.id
          })) || [];
        } else {
          const errorText = await ushipResponse.text();
          console.error('uShip API error:', ushipResponse.status, errorText);
          throw new Error(`uShip API error: ${ushipResponse.status}`);
        }
      } catch (error) {
        console.error('Error calling uShip API:', error);
        console.log('Falling back to mock data...');
        transformedRates = generateMockRates(shipmentData.shipment_type, shipmentData.origin, shipmentData.destination);
      }
    } else {
      console.log('No uShip API key found, using mock data...');
      transformedRates = generateMockRates(shipmentData.shipment_type, shipmentData.origin, shipmentData.destination);
    }

    console.log('Final transformed rates:', JSON.stringify(transformedRates, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        rates: transformedRates,
        shipment_type: shipmentData.shipment_type,
        mock_data: !ushipApiKey || transformedRates.length === 0
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
