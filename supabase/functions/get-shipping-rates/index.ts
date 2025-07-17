
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get carrier-specific discount percentage
const getCarrierDiscountPercentage = (carrier: string, service: string): number => {
  const carrierLower = carrier.toLowerCase();
  const serviceLower = service.toLowerCase();
  
  if (carrierLower === 'usps') {
    if (serviceLower.includes('express') || serviceLower.includes('priority') || serviceLower.includes('next day')) {
      return 63; // USPS next day delivery: 63%
    } else if (serviceLower.includes('first class')) {
      return 86; // USPS first class: 86%
    } else {
      return 45; // Normal USPS: 45%
    }
  } else if (carrierLower === 'ups') {
    if (serviceLower.includes('next day') || serviceLower.includes('express')) {
      return 74.3; // UPS next day delivery: 74.3%
    } else if (serviceLower.includes('2nd day') || serviceLower.includes('second day')) {
      return 75; // UPS second day: 75%
    } else if (serviceLower.includes('ground')) {
      return 77; // UPS ground: 77%
    } else {
      return 70; // Default UPS: 70%
    }
  } else if (carrierLower === 'fedex') {
    return 70; // FedEx: 70%
  } else if (carrierLower === 'dhl') {
    return 72; // DHL: 72%
  }
  
  return 65; // Default discount for other carriers
};

// Apply carrier-specific discounts and create inflated prices
const applyCarrierDiscounts = (rates) => {
  return rates.map((rate) => {
    const originalRate = parseFloat(rate.rate);
    const discountPercentage = getCarrierDiscountPercentage(rate.carrier, rate.service);
    
    // Calculate inflated price (what the price would be without discount)
    const inflatedRate = originalRate / (1 - discountPercentage / 100);
    
    console.log(`Rate processed for ${rate.carrier} ${rate.service}:`);
    console.log(`  Original: $${originalRate.toFixed(2)}`);
    console.log(`  Inflated (showing as crossed out): $${inflatedRate.toFixed(2)}`);
    console.log(`  Discount: ${discountPercentage}%`);
    
    return {
      ...rate,
      rate: originalRate.toFixed(2),
      original_rate: inflatedRate.toFixed(2), // This will show as crossed out
      discount_percentage: discountPercentage
    };
  });
};

// Group rates by carrier for better organization
const organizeRatesByCarrier = (rates) => {
  const carrierOrder = ['USPS', 'UPS', 'FedEx', 'DHL'];
  
  return rates.sort((a, b) => {
    const carrierA = a.carrier.toUpperCase();
    const carrierB = b.carrier.toUpperCase();
    
    const orderA = carrierOrder.indexOf(carrierA);
    const orderB = carrierOrder.indexOf(carrierB);
    
    if (orderA >= 0 && orderB >= 0) {
      if (orderA !== orderB) return orderA - orderB;
    } else if (orderA >= 0) {
      return -1;
    } else if (orderB >= 0) {
      return 1;
    }
    
    if (carrierA !== carrierB) {
      return carrierA.localeCompare(carrierB);
    }
    
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
    
    // Get the EasyPost API key from environment
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('EasyPost API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    console.log('Request data received:', JSON.stringify(requestData, null, 2));
    
    // Validate required data
    if (!requestData.fromAddress || !requestData.toAddress || !requestData.parcel) {
      return new Response(
        JSON.stringify({ error: 'Missing required address or parcel data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process requested carriers
    const specificCarriers = [];
    if (requestData.carriers && requestData.carriers.length > 0) {
      console.log(`Requested carriers: ${requestData.carriers.join(', ')}`);
      requestData.carriers.forEach((carrier) => {
        if (carrier !== 'all' && carrier !== 'easypost') {
          specificCarriers.push(carrier.toLowerCase());
        }
      });
    }
    console.log(`Filtered carriers for API request: ${specificCarriers.join(', ')}`);

    // Build parcel object for EasyPost
    const parcelData = {
      weight: requestData.parcel.weight
    };

    // Add dimensions or predefined package
    if (requestData.parcel.predefined_package) {
      parcelData.predefined_package = requestData.parcel.predefined_package;
      console.log(`Using predefined package: ${requestData.parcel.predefined_package}`);
    } else {
      // Custom dimensions
      if (requestData.parcel.length) parcelData.length = requestData.parcel.length;
      if (requestData.parcel.width) parcelData.width = requestData.parcel.width;
      if (requestData.parcel.height) parcelData.height = requestData.parcel.height;
      console.log('Using custom dimensions');
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
        parcel: parcelData,
        options: requestData.options || {}
      }
    };

    // Add insurance if provided
    if (requestData.insurance && requestData.insurance > 0) {
      shipmentRequest.shipment.insurance = requestData.insurance;
      console.log(`Adding insurance for $${requestData.insurance}`);
    }

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

    // Filter rates by carrier if specified
    let rates = data.rates || [];
    console.log(`Raw rates returned from EasyPost: ${rates.length}`);
    
    if (specificCarriers.length > 0) {
      rates = rates.filter(rate => 
        specificCarriers.some(carrier => 
          rate.carrier.toLowerCase().includes(carrier)
        )
      );
      console.log(`Filtered to ${rates.length} rates matching requested carriers`);
    }

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

    // Apply carrier-specific discounts and create inflated prices
    console.log('Applying carrier-specific discounts to shipping rates');
    const discountedRates = applyCarrierDiscounts(rates);

    // Organize rates by carrier for better presentation
    const organizedRates = organizeRatesByCarrier(discountedRates);

    console.log(`Returning ${organizedRates.length} processed rates with carrier-specific discounts`);

    // Return the rates from the response
    return new Response(
      JSON.stringify({
        rates: organizedRates,
        shipmentId: data.id,
        isInternational: requestData.fromAddress.country !== requestData.toAddress.country
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
