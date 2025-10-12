import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { UPSService } from "../_shared/ups-service.ts";

// 🎛️ CONFIGURABLE MARKUP PERCENTAGE - Change this value to adjust profit margin
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup - You can change this to 6, 7, 10, etc.

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Apply configurable markup to rates
const applyRateMarkup = (originalRate: number): number => {
  const markupAmount = originalRate * (RATE_MARKUP_PERCENTAGE / 100);
  const finalRate = originalRate + markupAmount;
  
  console.log(`Rate markup applied: Original: $${originalRate.toFixed(2)}, Markup (${RATE_MARKUP_PERCENTAGE}%): $${markupAmount.toFixed(2)}, Final: $${finalRate.toFixed(2)}`);
  
  return finalRate;
};

// Check if shipment is international
const isInternationalShipment = (fromCountry: string, toCountry: string): boolean => {
  return fromCountry !== 'US' || toCountry !== 'US';
};

// Carrier-specific discount configurations
const getCarrierDiscountConfig = (carrier: string, service: string) => {
  const carrierUpper = carrier.toUpperCase();
  const serviceUpper = service.toUpperCase();
  
  switch (carrierUpper) {
    case 'USPS':
      if (serviceUpper.includes('EXPRESS') || serviceUpper.includes('PRIORITY')) {
        return { minDiscount: 68, maxDiscount: 86, inflationMultiplier: 2.8 };
      }
      return { minDiscount: 45, maxDiscount: 75, inflationMultiplier: 2.5 };
      
    case 'UPS':
      if (serviceUpper.includes('NEXT DAY') || serviceUpper.includes('EXPRESS')) {
        return { minDiscount: 77, maxDiscount: 82, inflationMultiplier: 3.2 };
      }
      return { minDiscount: 74.3, maxDiscount: 77, inflationMultiplier: 3.0 };
      
    case 'FEDEX':
      if (serviceUpper.includes('OVERNIGHT') || serviceUpper.includes('EXPRESS')) {
        return { minDiscount: 75, maxDiscount: 85, inflationMultiplier: 3.5 };
      }
      return { minDiscount: 70, maxDiscount: 80, inflationMultiplier: 2.8 };
      
    case 'DHL':
      return { minDiscount: 72, maxDiscount: 85, inflationMultiplier: 3.0 };
      
    default:
      return { minDiscount: 60, maxDiscount: 75, inflationMultiplier: 2.0 };
  }
};

// Apply carrier-specific markup and discount logic
const applyCarrierDiscounts = (rates: any[]): any[] => {
  return rates.map((rate: any) => {
    const config = getCarrierDiscountConfig(rate.carrier, rate.service);
    
    // Apply our markup first to the actual rate
    const actualRate = parseFloat(rate.rate);
    const markedUpRate = applyRateMarkup(actualRate);
    
    // Generate discount percentage within carrier-specific range
    const discountPercentage = Math.random() * (config.maxDiscount - config.minDiscount) + config.minDiscount;
    
    // Calculate inflated rate based on marked up rate and discount
    const inflatedRate = markedUpRate / (1 - (discountPercentage / 100));
    
    // Calculate estimated delivery date
    const estimatedDeliveryDate = calculateEstimatedDelivery(rate.delivery_days || 3);
    
    return {
      ...rate,
      rate: markedUpRate.toFixed(2), // Show the marked up rate as the actual rate
      original_rate: inflatedRate.toFixed(2), // Show inflated rate as "original"
      discount_percentage: Math.round(discountPercentage),
      estimated_delivery_date: estimatedDeliveryDate,
      isPremium: rate.delivery_days <= 2 || markedUpRate > 25,
      markup_percentage: RATE_MARKUP_PERCENTAGE
    };
  });
};

// Calculate estimated delivery date
const calculateEstimatedDelivery = (deliveryDays: number) => {
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + deliveryDays);
  return deliveryDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
};

// Group rates by carrier for better organization
const organizeRatesByCarrier = (rates: any[]): any[] => {
  const carrierOrder = ['USPS', 'UPS', 'FedEx', 'DHL'];
  
  return rates.sort((a: any, b: any) => {
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`🎛️ Using rate markup: ${RATE_MARKUP_PERCENTAGE}%`);
    console.log('Rate fetching request received');
    
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('EasyPost API key not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const requestData = await req.json();
    console.log('Request data received:', JSON.stringify(requestData, null, 2));

    if (!requestData.fromAddress || !requestData.toAddress || !requestData.parcel) {
      return new Response(JSON.stringify({ error: 'Missing required address or parcel data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const fromCountry = requestData.fromAddress.country || 'US';
    const toCountry = requestData.toAddress.country || 'US';
    const isInternational = isInternationalShipment(fromCountry, toCountry);

    console.log(`Shipment type: ${isInternational ? 'International' : 'Domestic'} (From: ${fromCountry}, To: ${toCountry})`);

    const parcelData: any = { weight: requestData.parcel.weight };
    
    if (requestData.parcel.predefined_package) {
      parcelData.predefined_package = requestData.parcel.predefined_package;
    } else {
      if (requestData.parcel.length) parcelData.length = requestData.parcel.length;
      if (requestData.parcel.width) parcelData.width = requestData.parcel.width;
      if (requestData.parcel.height) {
        parcelData.height = requestData.parcel.height;
      } else {
        // Set minimum height for envelopes or when height is not provided
        parcelData.height = 0.1;
      }
    }

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

    // Add insurance if requested (EasyPost expects insured value amount)
    if (requestData.insurance && requestData.insurance > 0) {
      (shipmentRequest.shipment as any).insurance = requestData.insurance;
    }

    // Include customs info for international shipments when provided
    if (isInternational && requestData.customs_info) {
      (shipmentRequest.shipment as any).customs_info = requestData.customs_info;
    }

    console.log("Sending request to EasyPost API:", JSON.stringify(shipmentRequest, null, 2));

    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentRequest)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('EasyPost API error:', data);
      return new Response(JSON.stringify({ error: 'Failed to get shipping rates', details: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status
      });
    }

    console.log('EasyPost API response received successfully');

    let allRates = data.rates || [];
    
    // Always try to fetch UPS rates (not just for international shipments)
    try {
      console.log('Fetching UPS rates...');
      
      const upsClientId = Deno.env.get('UPS_CLIENT_ID');
      const upsClientSecret = Deno.env.get('UPS_CLIENT_SECRET');
      const upsAccountNumber = Deno.env.get('UPS_ACCOUNT_NUMBER');
      
      if (upsClientId && upsClientSecret && upsAccountNumber) {
        const upsService = new UPSService(upsClientId, upsClientSecret, upsAccountNumber, false);
        const upsResponse = await upsService.getRates(requestData);
        const upsRates = upsService.formatRatesForFrontend(upsResponse);
        
        console.log(`Received ${upsRates.length} UPS rates`);
        
        // Add UPS rates to the total rates
        allRates = [...allRates, ...upsRates];
      } else {
        console.log('UPS credentials not configured, skipping UPS rates');
      }
    } catch (error) {
      console.error('Error fetching UPS rates:', error);
      // Continue with EasyPost rates only if UPS fails
    }
    
    if (allRates.length === 0) {
      return new Response(JSON.stringify({
        rates: [],
        shipmentId: data.id,
        message: 'No rates available for this shipment'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Apply carrier-specific discounts and organize rates with markup
    const processedRates = applyCarrierDiscounts(allRates);
    const organizedRates = organizeRatesByCarrier(processedRates);

    console.log(`Returning ${organizedRates.length} processed rates with ${RATE_MARKUP_PERCENTAGE}% markup and carrier-specific discounts (including UPS rates if available)`);

    return new Response(JSON.stringify({
      rates: organizedRates,
      shipmentId: data.id,
      markup_applied: `${RATE_MARKUP_PERCENTAGE}%`,
      includes_ups: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-shipping-rates function:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
