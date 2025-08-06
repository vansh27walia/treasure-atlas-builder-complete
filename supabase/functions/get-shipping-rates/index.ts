
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate markup percentage - configurable
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup for profit

interface Address {
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

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface CustomsInfo {
  contents_type: string;
  customs_certify: boolean;
  customs_signer: string;
  eel_pfc?: string;
  restriction_type?: string;
  restriction_comments: string;
  customs_items: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hs_tariff_number: string;
    origin_country: string;
  }>;
}

const validateAddress = (address: Address, type: 'from' | 'to'): Address => {
  return {
    name: address.name || 'Default Name',
    company: address.company || '',
    street1: address.street1 || 'Unknown Street',
    street2: address.street2 || '',
    city: address.city || 'Unknown City',
    state: address.state || 'CA',
    zip: address.zip || '90210',
    country: address.country || 'US',
    // Always provide a fallback phone number
    phone: address.phone || '+1-800-555-0199',
  };
};

const standardizeCarrierName = (carrierName: string): string => {
  const name = carrierName.toUpperCase();
  if (name.includes('USPS')) return 'USPS';
  if (name.includes('UPS')) return 'UPS';
  if (name.includes('FEDEX')) return 'FedEx';
  if (name.includes('DHL')) return 'DHL';
  if (name.includes('CANADA POST') || name.includes('CANADAPOST')) return 'Canada Post';
  return carrierName;
};

const applyRateMarkup = (originalRate: number): number => {
  return originalRate * (1 + RATE_MARKUP_PERCENTAGE / 100);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fromAddress, toAddress, parcel, customsInfo } = await req.json();
    
    console.log('Getting shipping rates request:', { fromAddress, toAddress, parcel, customsInfo });

    if (!fromAddress || !toAddress || !parcel) {
      return new Response(
        JSON.stringify({ error: 'fromAddress, toAddress, and parcel are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      throw new Error('EasyPost API key not configured');
    }

    // Validate and ensure phone numbers are present
    const validFromAddress = validateAddress(fromAddress, 'from');
    const validToAddress = validateAddress(toAddress, 'to');

    console.log('Validated addresses:', { validFromAddress, validToAddress });

    // Build shipment request
    const shipmentRequest: any = {
      shipment: {
        to_address: validToAddress,
        from_address: validFromAddress,
        parcel: {
          length: parcel.length,
          width: parcel.width,
          height: parcel.height,
          weight: parcel.weight,
        },
      }
    };

    // Add customs info for international shipments
    if (customsInfo && (validToAddress.country !== 'US' || validFromAddress.country !== 'US')) {
      console.log('Adding customs info for international shipment');
      shipmentRequest.shipment.customs_info = {
        contents_type: customsInfo.contents_type || 'merchandise',
        customs_certify: customsInfo.customs_certify || true,
        customs_signer: customsInfo.customs_signer || validFromAddress.name,
        eel_pfc: customsInfo.eel_pfc || 'NOEEI 30.37(a)',
        restriction_type: customsInfo.restriction_type || 'none',
        restriction_comments: customsInfo.restriction_comments || '',
        customs_items: customsInfo.customs_items || [{
          description: 'General Merchandise',
          quantity: 1,
          value: 50,
          weight: parcel.weight,
          hs_tariff_number: '9999.99.9999',
          origin_country: validFromAddress.country,
        }],
      };
    }

    console.log('Final shipment request:', JSON.stringify(shipmentRequest, null, 2));

    // Make request to EasyPost
    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('EasyPost API error:', JSON.stringify(data, null, 2));
      
      let errorMessage = 'Failed to get shipping rates';
      if (data.error) {
        errorMessage = data.error.message || errorMessage;
        if (data.error.errors && data.error.errors.length > 0) {
          errorMessage += ` - ${data.error.errors.map((e: any) => e.message).join(', ')}`;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: data,
          requestData: shipmentRequest 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('EasyPost response received:', data.id);

    if (!data.rates || data.rates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No shipping rates available for this route' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Process and enhance rates
    const processedRates = data.rates.map((rate: any) => {
      const originalRate = parseFloat(rate.rate);
      const markedUpRate = applyRateMarkup(originalRate);
      
      return {
        id: rate.id,
        carrier: standardizeCarrierName(rate.carrier),
        service: rate.service,
        rate: markedUpRate.toFixed(2), // This is what customer pays
        original_rate: originalRate.toFixed(2), // Store original for internal use
        list_rate: rate.retail_rate || rate.list_rate || (originalRate * 1.4).toFixed(2), // Use actual list rate or estimate
        currency: rate.currency,
        delivery_days: rate.delivery_days || null,
        delivery_date: rate.delivery_date || null,
        delivery_date_guaranteed: rate.delivery_date_guaranteed || false,
        est_delivery_days: rate.est_delivery_days || rate.delivery_days || null,
        shipment_id: data.id,
      };
    });

    // Sort rates by price (cheapest first)
    processedRates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate));

    console.log(`Processed ${processedRates.length} rates for shipment ${data.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        rates: processedRates,
        shipmentId: data.id,
        rateMarkupPercentage: RATE_MARKUP_PERCENTAGE,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-shipping-rates:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
