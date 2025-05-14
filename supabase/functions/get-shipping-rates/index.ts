
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
  carrier?: string;
}

// Get markup percentage from environment variable or use default value
const getMarkupPercentage = (): number => {
  const markupStr = Deno.env.get('SHIPPING_MARKUP_PERCENTAGE');
  if (!markupStr) return 15; // Default 15% markup if not set (changed from 2% to 15% as requested)
  
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

// Sort rates by carrier, then by service type
const sortRatesByCarrierAndService = (rates: any[]): any[] => {
  // Define carrier priority order (customize as needed)
  const carrierPriority = {
    'USPS': 1,
    'UPS': 2,
    'FEDEX': 3,
    'DHL': 4
  };
  
  return rates.sort((a, b) => {
    // Normalize carrier names for comparison
    const carrierA = a.carrier.toUpperCase();
    const carrierB = b.carrier.toUpperCase();
    
    // First compare by carrier priority
    const priorityA = carrierPriority[carrierA] || 999;
    const priorityB = carrierPriority[carrierB] || 999;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same carrier, compare by price
    return parseFloat(a.rate) - parseFloat(b.rate);
  });
};

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
    const requestData: ShippingRequestData = await req.json();
    
    // Add carrier specific options if requested
    const carrierAccounts: string[] = [];
    let specificCarrier = '';
    
    if (requestData.carrier && requestData.carrier !== 'all' && requestData.carrier !== 'easypost') {
      // Filter to specific carrier if requested
      specificCarrier = requestData.carrier.toLowerCase();
    }
    
    // Create a shipment with EasyPost API
    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shipment: {
          from_address: requestData.fromAddress,
          to_address: requestData.toAddress,
          parcel: requestData.parcel,
          options: requestData.options || {},
          carrier_accounts: carrierAccounts.length > 0 ? carrierAccounts : undefined,
        }
      }),
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

    // Filter rates by carrier if specified
    let rates = data.rates;
    if (specificCarrier) {
      rates = rates.filter((rate: any) => 
        rate.carrier.toLowerCase().includes(specificCarrier)
      );
    }
    
    // Sort rates by carrier and service type
    rates = sortRatesByCarrierAndService(rates);
    
    // Get markup percentage and apply to rates
    const markupPercentage = getMarkupPercentage();
    console.log(`Applying ${markupPercentage}% markup to shipping rates`);
    const markedUpRates = applyMarkup(rates, markupPercentage);

    // Return the rates from the response
    return new Response(
      JSON.stringify({ 
        rates: markedUpRates,
        shipmentId: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-shipping-rates function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
