import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { UPSService } from "../_shared/ups-service.ts";

// 🎛️ CONFIGURABLE MARKUP PERCENTAGE - Change this value to adjust profit margin
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup - You can change this to 6, 7, 10, etc.

// 🔒 CLIENT AUTHENTICATION KEY - Endpoint is locked if this environment variable is set
const CLIENT_API_KEY = Deno.env.get('CLIENT_API_KEY');

// ------------------------------------
// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Applies a configurable profit markup to the carrier's original rate.
 * NOTE: Logging was removed here and moved to applyCarrierDiscounts for a single, comprehensive log line.
 * @param originalRate The raw cost from the carrier.
 * @returns The rate after applying the profit markup.
 */
const applyRateMarkup = (originalRate: number): number => {
  const markupAmount = originalRate * (RATE_MARKUP_PERCENTAGE / 100);
  return originalRate + markupAmount;
};

/**
 * Checks if the shipment is international.
 * @param fromCountry The country code of the origin address.
 * @param toCountry The country code of the destination address.
 * @returns True if the shipment is international.
 */
const isInternationalShipment = (fromCountry: string, toCountry: string): boolean => {
  // Simple check: international if either country is not 'US'
  return fromCountry !== 'US' || toCountry !== 'US';
};

const getCarrierDiscountConfig = (carrier: string, service: string) => {
  const carrierUpper = carrier.toUpperCase();
  const serviceUpper = service.toUpperCase();
  
  // All carriers use 60-90% discount range for consistency
  switch (carrierUpper) {
    case 'USPS':
      if (serviceUpper.includes('EXPRESS') || serviceUpper.includes('PRIORITY')) {
        return { minDiscount: 70, maxDiscount: 90, inflationMultiplier: 2.8 };
      }
      return { minDiscount: 60, maxDiscount: 80, inflationMultiplier: 2.5 };
      
    case 'UPS':
      if (serviceUpper.includes('NEXT DAY') || serviceUpper.includes('EXPRESS')) {
        return { minDiscount: 75, maxDiscount: 90, inflationMultiplier: 3.2 };
      }
      return { minDiscount: 65, maxDiscount: 85, inflationMultiplier: 3.0 };
      
    case 'FEDEX':
      if (serviceUpper.includes('OVERNIGHT') || serviceUpper.includes('EXPRESS')) {
        return { minDiscount: 75, maxDiscount: 90, inflationMultiplier: 3.5 };
      }
      return { minDiscount: 65, maxDiscount: 85, inflationMultiplier: 2.8 };
      
    case 'DHL':
      return { minDiscount: 70, maxDiscount: 90, inflationMultiplier: 3.0 };
      
    default:
      return { minDiscount: 60, maxDiscount: 80, inflationMultiplier: 2.0 };
  }
};

/**
 * Applies the profit markup, simulates a high discount, calculates a fake 'original_rate',
 * and logs the entire manipulation process in a single, massive log line for intensive tracking.
 * @param rates An array of raw rate objects from EasyPost/UPS.
 * @returns An array of processed ShippingRate objects.
 */
const applyCarrierDiscounts = (rates: any[]): any[] => {
  return rates.map((rate: any) => {
    const config = getCarrierDiscountConfig(rate.carrier, rate.service);
    const carrierOriginalRate = parseFloat(rate.rate);
    
    // 1. Apply our configurable profit markup (Actual Price Paid by Customer)
    const markedUpRate = applyRateMarkup(carrierOriginalRate);
    
    // 2. Generate discount percentage (The number shown to the customer)
    const discountPercentage = Math.random() * (config.maxDiscount - config.minDiscount) + config.minDiscount;
    
    // 3. Calculate the inflated 'original_rate' (The high MSRP/Fake price)
    // Formula: Inflated Price = MarkedUpRate / (1 - DiscountPercentage/100)
    const inflatedRate = markedUpRate / (1 - (discountPercentage / 100));
    
    // 4. Calculate estimated delivery date
    const estimatedDeliveryDate = calculateEstimatedDelivery(rate.delivery_days || 3);
    
    // --- MASSIVE LOG LINE (INTENSIVE LOGGING) ---
    const logMessage = 
      `[RATE_MANIPULATION_LOG] Carrier: ${rate.carrier} (${rate.service}) | ` +
      `1. Carrier Original Cost: $${carrierOriginalRate.toFixed(2)} | ` +
      `2. Final Charged Rate (w/${RATE_MARKUP_PERCENTAGE}% Markup): $${markedUpRate.toFixed(2)} | ` +
      `3. Inflated Display Price ('Original_Rate'): $${inflatedRate.toFixed(2)} | ` +
      `4. Displayed Discount: ${Math.round(discountPercentage)}%`;
    
    console.log(logMessage);
    // --- END MASSIVE LOG LINE ---
    
    return {
      ...rate,
      rate: markedUpRate.toFixed(2),
      original_rate: inflatedRate.toFixed(2),
      retail_rate: inflatedRate.toFixed(2), // 💡 FIX: Added retail_rate for front-end compatibility
      discount_percentage: Math.round(discountPercentage),
      estimated_delivery_date: estimatedDeliveryDate,
      isPremium: rate.delivery_days <= 2 || markedUpRate > 25,
      markup_percentage: RATE_MARKUP_PERCENTAGE
    };
  });
};

/**
 * Calculates a future estimated delivery date based on delivery days.
 * @param deliveryDays The number of days until delivery.
 * @returns The estimated delivery date in 'YYYY-MM-DD' format.
 */
const calculateEstimatedDelivery = (deliveryDays: number) => {
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + deliveryDays);
  return deliveryDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
};

/**
 * Sorts rates primarily by carrier preference, then by price.
 * @param rates The array of processed ShippingRate objects.
 * @returns The sorted array of ShippingRate objects.
 */
const organizeRatesByCarrier = (rates: any[]): any[] => {
  const carrierOrder = ['USPS', 'UPS', 'FEDEX', 'DHL'];
  
  return rates.sort((a: any, b: any) => {
    const carrierA = a.carrier.toUpperCase();
    const carrierB = b.carrier.toUpperCase();
    
    const orderA = carrierOrder.indexOf(carrierA);
    const orderB = carrierOrder.indexOf(carrierB);
    
    // Sort by preferred carrier order
    if (orderA >= 0 && orderB >= 0) {
      if (orderA !== orderB) return orderA - orderB;
    } else if (orderA >= 0) {
      return -1; // Keep known carrier first
    } else if (orderB >= 0) {
      return 1; // Push unknown carrier back
    }
    
    // Secondary sort by carrier name alphabetically if both are unknown or same
    if (carrierA !== carrierB) {
      return carrierA.localeCompare(carrierB);
    }
    
    // Tertiary sort by price (lowest first)
    return parseFloat(a.rate) - parseFloat(b.rate);
  });
};

// --- MAIN SERVER FUNCTION ---
serve(async (req) => {
  const startTime = Date.now();
  const requestUrl = new URL(req.url);
  
  console.log(`\n--- Request Start: ${new Date().toISOString()} ---`);
  console.log(`Method: ${req.method}, Path: ${requestUrl.pathname}`);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Client Authentication Check (The "Login" Lock)
  if (CLIENT_API_KEY) {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('🔒 Authorization failed: Missing or invalid Authorization header.');
      const duration = Date.now() - startTime;
      console.log(`--- Request End: Unauthorized (Duration: ${duration}ms) ---`);
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }
    
    const clientToken = authHeader.split(' ')[1];
    
    if (clientToken !== CLIENT_API_KEY) {
      console.warn('🔒 Authorization failed: Invalid client token.');
      const duration = Date.now() - startTime;
      console.log(`--- Request End: Forbidden (Duration: ${duration}ms) ---`);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid credentials' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }
    
    console.log('✅ Client Authorization successful.');
  } else {
    console.warn('⚠️ CLIENT_API_KEY is not set. Endpoint is unsecured.');
  }

  try {
    console.log(`🎛️ Using rate markup: ${RATE_MARKUP_PERCENTAGE}%`);
    
    // 2. Environment and External API Key Checks
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('EasyPost API key not configured');
      const duration = Date.now() - startTime;
      console.log(`--- Request End: Internal Error (Duration: ${duration}ms) ---`);
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // 3. Parse Request Data
    const requestData = await req.json();
    console.log('Request data received (Parcel Weight/Dims only):', JSON.stringify({
      fromCountry: requestData.fromAddress?.country,
      toCountry: requestData.toAddress?.country,
      parcel: requestData.parcel
    }, null, 2));

    if (!requestData.fromAddress || !requestData.toAddress || !requestData.parcel) {
      const duration = Date.now() - startTime;
      console.log(`--- Request End: Bad Request (Duration: ${duration}ms) ---`);
      return new Response(JSON.stringify({ error: 'Missing required address or parcel data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const fromCountry = requestData.fromAddress.country || 'US';
    const toCountry = requestData.toAddress.country || 'US';
    const isInternational = isInternationalShipment(fromCountry, toCountry);

    console.log(`Shipment type: ${isInternational ? 'International' : 'Domestic'} (From: ${fromCountry}, To: ${toCountry})`);

    // 4. Construct EasyPost Parcel Data
    const parcelData: any = { weight: requestData.parcel.weight };
    
    if (requestData.parcel.predefined_package) {
      parcelData.predefined_package = requestData.parcel.predefined_package;
    } else {
      // Dimensions are required unless a predefined package is used
      if (requestData.parcel.length) parcelData.length = requestData.parcel.length;
      if (requestData.parcel.width) parcelData.width = requestData.parcel.width;
      // Ensure height has a minimum value for non-predefined packages
      if (requestData.parcel.height) {
        parcelData.height = requestData.parcel.height;
      } else {
        parcelData.height = 0.1; // Minimum height for envelopes or when missing
      }
    }

    // 5. Construct EasyPost Shipment Request Body
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

    // Add insurance if requested
    if (requestData.insurance && requestData.insurance > 0) {
      (shipmentRequest.shipment as any).insurance = requestData.insurance;
    }

    // Include customs info for international shipments when provided
    if (isInternational && requestData.customs_info) {
      (shipmentRequest.shipment as any).customs_info = requestData.customs_info;
    }

    // 6. Fetch Rates from EasyPost
    console.log("Sending request to EasyPost API...");
    const easypostResponse = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentRequest)
    });

    const easyPostData = await easypostResponse.json();

    if (!easypostResponse.ok) {
      console.error('EasyPost API error (Status: ' + easypostResponse.status + '):', easyPostData);
      const duration = Date.now() - startTime;
      console.log(`--- Request End: EasyPost Error (Duration: ${duration}ms) ---`);
      return new Response(JSON.stringify({ error: 'Failed to get shipping rates from EasyPost', details: easyPostData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: easypostResponse.status
      });
    }

    console.log('EasyPost API response received successfully');

    let allRates = easyPostData.rates || [];
    let includesUps = false;

    // 7. Fetch Rates from Custom UPS Service
    try {
      console.log('Fetching UPS rates...');
      
      const upsClientId = Deno.env.get('UPS_CLIENT_ID');
      const upsClientSecret = Deno.env.get('UPS_CLIENT_SECRET');
      const upsAccountNumber = Deno.env.get('UPS_ACCOUNT_NUMBER');
      
      if (upsClientId && upsClientSecret && upsAccountNumber) {
        // The last parameter 'false' indicates non-production environment
        const upsService = new UPSService(upsClientId, upsClientSecret, upsAccountNumber, false);
        const upsResponse = await upsService.getRates(requestData);
        
        // Assuming formatRatesForFrontend exists and correctly converts the UPS format
        const upsRates = upsService.formatRatesForFrontend(upsResponse);
        
        console.log(`Received ${upsRates.length} UPS rates`);
        
        allRates = [...allRates, ...upsRates];
        includesUps = true;
      } else {
        console.log('UPS credentials not configured, skipping UPS rates');
      }
    } catch (error) {
      console.error('Error fetching UPS rates:', error);
      // Continue with EasyPost rates if UPS fails
    }

    // 8. Filter and Process Rates
    // Filter out any rates that came back with null or missing price data
    const validRates = allRates.filter((rate: any) => 
      rate.rate !== null && rate.rate !== undefined && parseFloat(rate.rate) > 0
    );

    if (validRates.length === 0) {
      const duration = Date.now() - startTime;
      console.log(`--- Request End: No Rates Found (Duration: ${duration}ms) ---`);
      return new Response(JSON.stringify({
        rates: [],
        shipmentId: easyPostData.id,
        message: 'No rates available for this shipment after filtering'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Apply carrier-specific discounts and organize rates with markup
    const processedRates = applyCarrierDiscounts(validRates);
    const organizedRates = organizeRatesByCarrier(processedRates);

    console.log(`Returning ${organizedRates.length} processed rates with ${RATE_MARKUP_PERCENTAGE}% markup (Includes UPS: ${includesUps})`);

    // 9. Return Final Response
    const finalResponse = new Response(JSON.stringify({
      rates: organizedRates,
      shipmentId: easyPostData.id,
      markup_applied: `${RATE_MARKUP_PERCENTAGE}%`,
      includes_ups: includesUps
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    const duration = Date.now() - startTime;
    console.log(`--- Request End: Success (Duration: ${duration}ms) ---`);
    return finalResponse;

  } catch (error) {
    // 10. Handle General Server Errors
    const duration = Date.now() - startTime;
    console.error('CRITICAL ERROR in get-shipping-rates function:', error);
    console.log(`--- Request End: Internal Server Error (Duration: ${duration}ms) ---`);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
