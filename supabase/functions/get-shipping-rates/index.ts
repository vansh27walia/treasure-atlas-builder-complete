
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the input data structure
interface AddressData {
  name?: string;
  company?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
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

// New function to complete address using Google Maps Geocoding API
async function completeAddressFromZip(zip: string, country: string): Promise<AddressData | null> {
  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('Google Places API key not configured');
      return null;
    }

    // Call Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)}&components=country:${country}&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Geocoding API failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || data.results.length === 0) {
      console.error('No results found for ZIP code:', zip, 'Status:', data.status);
      return null;
    }
    
    // Get the first result (most relevant)
    const result = data.results[0];
    console.log('Geocoding result:', result);
    
    // Extract address components
    let street = '';
    let city = '';
    let state = '';
    
    // Parse address components
    for (const component of result.address_components) {
      const types = component.types;
      
      if (types.includes('street_number')) {
        street = component.long_name + ' ';
      }
      if (types.includes('route')) {
        street += component.long_name;
      }
      if (types.includes('locality') || types.includes('postal_town')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
    }
    
    // If we couldn't find a street address, use a generic one based on the formatted address
    if (!street) {
      // Extract the first line which usually contains the street
      const formattedParts = result.formatted_address.split(',');
      street = formattedParts[0] || 'Unknown Street';
    }
    
    // Return the completed address
    return {
      street1: street,
      city: city,
      state: state,
      zip: zip,
      country: country,
      name: "Address from ZIP",
      phone: "555-555-5555" // Default phone as required by EasyPost
    };
  } catch (error) {
    console.error('Error completing address from ZIP:', error);
    return null;
  }
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
    const requestData: ShippingRequestData = await req.json();
    
    // Set up carrier account options for EasyPost
    let specificCarriers: string[] = [];
    
    // Process requested carriers - make sure we're correctly handling the carriers parameter
    if (requestData.carriers && requestData.carriers.length > 0) {
      console.log(`Requested carriers: ${requestData.carriers.join(', ')}`);
      specificCarriers = requestData.carriers.filter(carrier => 
        carrier !== 'all' && carrier !== 'easypost'
      ).map(carrier => carrier.toLowerCase());
    }
    
    console.log(`Filtered carriers for API request: ${specificCarriers.join(', ')}`);
    
    // Complete addresses if only ZIP codes are provided
    let fromAddressComplete = requestData.fromAddress;
    let toAddressComplete = requestData.toAddress;
    
    // Check if we need to complete the from address
    if (!fromAddressComplete.street1 || !fromAddressComplete.city || !fromAddressComplete.state) {
      console.log('Completing FROM address using ZIP code:', fromAddressComplete.zip);
      const completedFromAddress = await completeAddressFromZip(fromAddressComplete.zip, fromAddressComplete.country);
      if (completedFromAddress) {
        fromAddressComplete = {
          ...fromAddressComplete,
          street1: completedFromAddress.street1 || "Default Street",
          city: completedFromAddress.city || "Default City",
          state: completedFromAddress.state || "Default State",
          name: fromAddressComplete.name || completedFromAddress.name,
          phone: fromAddressComplete.phone || completedFromAddress.phone
        };
      }
    }
    
    // Check if we need to complete the to address
    if (!toAddressComplete.street1 || !toAddressComplete.city || !toAddressComplete.state) {
      console.log('Completing TO address using ZIP code:', toAddressComplete.zip);
      const completedToAddress = await completeAddressFromZip(toAddressComplete.zip, toAddressComplete.country);
      if (completedToAddress) {
        toAddressComplete = {
          ...toAddressComplete,
          street1: completedToAddress.street1 || "Default Street",
          city: completedToAddress.city || "Default City",
          state: completedToAddress.state || "Default State",
          name: toAddressComplete.name || completedToAddress.name,
          phone: toAddressComplete.phone || completedToAddress.phone
        };
      }
    }
    
    console.log('Completed FROM address:', fromAddressComplete);
    console.log('Completed TO address:', toAddressComplete);
    
    // Create shipment request for EasyPost API
    const shipmentRequest = {
      shipment: {
        from_address: fromAddressComplete,
        to_address: toAddressComplete,
        parcel: requestData.parcel,
        options: requestData.options || {},
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
        JSON.stringify({ 
          error: 'Failed to get shipping rates', 
          details: data,
          completedAddresses: {
            from: fromAddressComplete,
            to: toAddressComplete
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Filter rates by carrier if specified
    let rates = data.rates || [];
    console.log(`Raw rates returned from EasyPost: ${rates.length}`);
    
    if (specificCarriers.length > 0) {
      // Converting requested carriers to lowercase for case-insensitive comparison
      const lowercaseCarriers = specificCarriers.map(c => c.toLowerCase());
      
      // Filter rates based on carrier
      rates = rates.filter((rate: any) => 
        lowercaseCarriers.some(carrier => 
          rate.carrier.toLowerCase().includes(carrier)
        )
      );
      console.log(`Filtered to ${rates.length} rates matching requested carriers`);
      
      // If no rates match our filter but we have rates, it might be a carrier name mismatch
      if (rates.length === 0 && data.rates.length > 0) {
        console.log("No rates matched the carrier filter. Available carriers:", 
          [...new Set(data.rates.map((r: any) => r.carrier.toLowerCase()))].join(', '));
        
        // Return all rates if filter results in no matches
        rates = data.rates;
        console.log("Returning all available rates instead of empty result");
      }
    }
    
    // Get markup percentage and apply to rates
    const markupPercentage = getMarkupPercentage();
    console.log(`Applying ${markupPercentage}% markup to shipping rates`);
    const markedUpRates = applyMarkup(rates, markupPercentage);
    
    // Organize rates by carrier for better presentation
    const organizedRates = organizeRatesByCarrier(markedUpRates);

    // Return the rates from the response
    return new Response(
      JSON.stringify({ 
        rates: organizedRates,
        shipmentId: data.id,
        markupPercentage: markupPercentage, // Include markup percentage for transparency
        completedAddresses: {
          from: fromAddressComplete,
          to: toAddressComplete
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-shipping-rates function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
