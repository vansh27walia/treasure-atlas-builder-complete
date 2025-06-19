
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the input data structure
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

interface ParcelData {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface ShippingRequestData {
  fromAddress: AddressData;
  toAddress: AddressData;
  parcel: ParcelData;
  options?: Record<string, any>;
  carriers?: string[];
}

// Get markup percentage from environment variable or use default value
const getMarkupPercentage = (): number => {
  const markupStr = Deno.env.get('SHIPPING_MARKUP_PERCENTAGE');
  if (!markupStr) return 15; // Default 15% markup if not set
  
  const markup = parseFloat(markupStr);
  return isNaN(markup) ? 15 : markup;
};

// Apply markup to rates
const applyMarkup = (rates: any[], markupPercentage: number): any[] => {
  return rates.map(rate => {
    // Store original rate
    const originalRate = rate.rate;
    
    // Calculate markup
    const rateValue = parseFloat(rate.rate);
    const markupAmount = rateValue * (markupPercentage / 100);
    const markedUpRate = (rateValue + markupAmount).toFixed(2);
    
    // Return rate with markup applied
    return {
      ...rate,
      original_rate: originalRate, // Store original rate
      rate: markedUpRate.toString() // Update rate with markup
    };
  });
};

// Group rates by carrier for better organization
const organizeRatesByCarrier = (rates: any[]): any[] => {
  // Define carrier order for consistent presentation
  const carrierOrder = ['USPS', 'UPS', 'FedEx', 'DHL'];
  
  // Sort rates by carrier first, then by price within each carrier
  return rates.sort((a, b) => {
    const carrierA = a.carrier.toUpperCase();
    const carrierB = b.carrier.toUpperCase();
    
    // Compare carriers based on predefined order
    const orderA = carrierOrder.indexOf(carrierA);
    const orderB = carrierOrder.indexOf(carrierB);
    
    // If carriers are in our predefined list, sort by that order
    if (orderA >= 0 && orderB >= 0) {
      if (orderA !== orderB) return orderA - orderB;
    } else if (orderA >= 0) {
      return -1; // A is in the list, B is not
    } else if (orderB >= 0) {
      return 1; // B is in the list, A is not
    }
    
    // If carriers are the same or neither is in our list, sort alphabetically
    if (carrierA !== carrierB) {
      return carrierA.localeCompare(carrierB);
    }
    
    // Within same carrier, sort by price
    return parseFloat(a.rate) - parseFloat(b.rate);
  });
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Rate fetching request received');
    
    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('EasyPost API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData: ShippingRequestData = await req.json();
    console.log('Request data received:', JSON.stringify(requestData, null, 2));
    
    // Validate required data
    if (!requestData.fromAddress || !requestData.toAddress || !requestData.parcel) {
      return new Response(
        JSON.stringify({ error: 'Missing required address or parcel data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create shipment request for EasyPost API
    const shipmentRequest = {
      shipment: {
        from_address: {
          name: requestData.fromAddress.name,
          company: requestData.fromAddress.company || '',
          street1: requestData.fromAddress.street1,
          street2: requestData.fromAddress.street2 || '',
          city: requestData.fromAddress.city,
          state: requestData.fromAddress.state,
          zip: requestData.fromAddress.zip,
          country: requestData.fromAddress.country,
          phone: requestData.fromAddress.phone || ''
        },
        to_address: {
          name: requestData.toAddress.name,
          company: requestData.toAddress.company || '',
          street1: requestData.toAddress.street1,
          street2: requestData.toAddress.street2 || '',
          city: requestData.toAddress.city,
          state: requestData.toAddress.state,
          zip: requestData.toAddress.zip,
          country: requestData.toAddress.country,
          phone: requestData.toAddress.phone || ''
        },
        parcel: {
          length: requestData.parcel.length,
          width: requestData.parcel.width,
          height: requestData.parcel.height,
          weight: requestData.parcel.weight
        },
        options: requestData.options || {}
      }
    };
    
    console.log("Sending request to EasyPost API:", JSON.stringify(shipmentRequest, null, 2));
    
    // Create a shipment with EasyPost API
    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentRequest),
    });

    const data = await response.json();
    
    // Check for API errors
    if (!response.ok) {
      console.error('EasyPost API error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to get shipping rates', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    console.log('EasyPost API response received successfully');

    // Get rates from response
    let rates = data.rates || [];
    console.log(`Raw rates returned from EasyPost: ${rates.length}`);
    
    // Ensure we have rates to return
    if (rates.length === 0) {
      console.log('No rates found for the given criteria');
      return new Response(
        JSON.stringify({ 
          rates: [],
          shipmentId: data.id,
          message: 'No rates available for this shipment'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get markup percentage and apply to rates
    const markupPercentage = getMarkupPercentage();
    console.log(`Applying ${markupPercentage}% markup to shipping rates`);
    const markedUpRates = applyMarkup(rates, markupPercentage);
    
    // Organize rates by carrier for better presentation
    const organizedRates = organizeRatesByCarrier(markedUpRates);

    console.log(`Returning ${organizedRates.length} processed rates`);

    // Return the rates from the response
    return new Response(
      JSON.stringify({ 
        rates: organizedRates,
        shipmentId: data.id,
        markupPercentage: markupPercentage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-shipping-rates function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Please check your request data and try again'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
