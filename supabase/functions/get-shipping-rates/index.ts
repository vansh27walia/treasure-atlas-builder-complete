
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    
    const { fromAddress, toAddress, parcel, carriers = ['usps', 'ups', 'fedex', 'dhl'], options = {} } = requestData;

    // Validate required fields
    if (!fromAddress || !toAddress || !parcel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fromAddress, toAddress, and parcel are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Rate fetching request received');
    console.log('Requested carriers:', carriers.join(', '));

    // Filter carriers for API request
    const validCarriers = ['usps', 'ups', 'fedex', 'dhl'];
    const filteredCarriers = carriers.filter((carrier: string) => validCarriers.includes(carrier.toLowerCase()));
    console.log('Filtered carriers for API request:', filteredCarriers.join(', '));

    // Prepare parcel data
    let parcelData: any = {
      weight: parcel.weight || 16 // Default to 1 lb in oz
    };

    // Handle predefined packages vs custom dimensions
    if (parcel.predefined_package) {
      parcelData.predefined_package = parcel.predefined_package;
      console.log('Using predefined package:', parcel.predefined_package);
    } else {
      // Use custom dimensions
      console.log('Using custom dimensions');
      parcelData.length = parcel.length || 10;
      parcelData.width = parcel.width || 10;
      if (parcel.height) {
        parcelData.height = parcel.height;
      }
    }

    // Prepare the request payload for EasyPost
    const payload = {
      shipment: {
        from_address: {
          name: fromAddress.name || 'Sender',
          company: fromAddress.company || '',
          street1: fromAddress.street1,
          street2: fromAddress.street2 || '',
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country || 'US',
          phone: fromAddress.phone || ''
        },
        to_address: {
          name: toAddress.name || 'Recipient',
          company: toAddress.company || '',
          street1: toAddress.street1,
          street2: toAddress.street2 || '',
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'US',
          phone: toAddress.phone || ''
        },
        parcel: parcelData,
        options: options
      }
    };

    console.log('Sending request to EasyPost API:', JSON.stringify(payload, null, 2));

    // Make the request to EasyPost API
    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('EasyPost API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rates from EasyPost', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    console.log('EasyPost API response received successfully');

    if (!data.rates || !Array.isArray(data.rates)) {
      console.error('No rates returned from EasyPost');
      return new Response(
        JSON.stringify({ error: 'No rates available for this shipment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Filter rates by requested carriers
    const filteredRates = data.rates.filter((rate: any) => {
      const carrierMatch = filteredCarriers.some(carrier => 
        rate.carrier.toLowerCase() === carrier.toLowerCase()
      );
      return carrierMatch;
    });

    console.log('Raw rates returned from EasyPost:', data.rates.length);
    console.log('Filtered to', filteredRates.length, 'rates matching requested carriers');

    // Define carrier-specific markup percentages
    const getMarkupPercentage = (carrier: string, service: string): number => {
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
      } else {
        return 5; // Default 5% for other carriers (FedEx, DHL, etc.)
      }
    };

    console.log('Applying carrier-specific markup to shipping rates');

    // Apply markup to rates and add 5% baseline inflation
    const processedRates = filteredRates.map((rate: any) => {
      const originalRate = parseFloat(rate.rate);
      const markupPercentage = getMarkupPercentage(rate.carrier, rate.service);
      
      // First apply the 5% baseline inflation
      const inflatedRate = originalRate * 1.05;
      
      // Then apply carrier-specific markup
      const markupMultiplier = 1 + (markupPercentage / 100);
      const finalRate = (inflatedRate * markupMultiplier).toFixed(2);
      
      console.log(`Rate processed for ${rate.carrier} ${rate.service}:`);
      console.log(`  Original: $${originalRate.toFixed(2)}`);
      console.log(`  After 5% inflation: $${inflatedRate.toFixed(2)}`);
      console.log(`  After ${markupPercentage}% markup: $${finalRate}`);
      
      return {
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: finalRate,
        currency: rate.currency,
        delivery_days: rate.delivery_days,
        delivery_date: rate.delivery_date,
        list_rate: rate.list_rate,
        retail_rate: rate.retail_rate,
        est_delivery_days: rate.est_delivery_days,
        shipment_id: data.id,
        original_rate: originalRate.toFixed(2),
        markup_percentage: markupPercentage,
        inflated_base_rate: inflatedRate.toFixed(2)
      };
    });

    console.log('Returning', processedRates.length, 'processed rates with 5% baseline inflation + carrier markup');

    // Return the processed rates
    return new Response(
      JSON.stringify({
        rates: processedRates,
        shipmentId: data.id,
        isInternational: fromAddress.country !== toAddress.country
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
