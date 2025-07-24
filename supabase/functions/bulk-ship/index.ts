
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded Shopify warehouse address
const SHOPIFY_WAREHOUSE = {
  name: "Shopify Warehouse",
  company: "Your Company",
  street1: "123 Warehouse St",
  street2: "",
  city: "Los Angeles",
  state: "CA",
  zip: "90210",
  country: "US",
  phone: "555-123-4567"
};

interface RRow {
  recipient_name: string;
  recipient_address1: string;
  recipient_city: string;
  recipient_state: string;
  recipient_zip: string;
  recipient_country: string;
  recipient_phone?: string;
  recipient_email?: string;
  parcel_weight: number;
  parcel_length: number;
  parcel_width: number;
  parcel_height: number;
  order_reference?: string;
}

interface ShopifyRow {
  to_name: string;
  to_street1: string;
  to_city: string;
  to_state: string;
  to_zip: string;
  to_country: string;
  to_phone?: string;
  to_email?: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  reference?: string;
}

interface ProcessedShipment {
  shipmentId: string;
  toAddress: ShopifyRow;
  selectedRate: {
    id: string;
    carrier: string;
    service: string;
    rate: number;
  };
  originalRow: RRow;
}

// Map R-format to Shopify format
function mapRtoShopify(r: RRow): ShopifyRow {
  return {
    to_name: r.recipient_name,
    to_street1: r.recipient_address1,
    to_city: r.recipient_city,
    to_state: r.recipient_state,
    to_zip: r.recipient_zip,
    to_country: r.recipient_country,
    to_phone: r.recipient_phone || '',
    to_email: r.recipient_email || '',
    weight: r.parcel_weight,
    length: r.parcel_length,
    width: r.parcel_width,
    height: r.parcel_height,
    reference: r.order_reference || '',
  };
}

// Fetch rates from EasyPost
async function fetchEasyPostRates(shopifyRow: ShopifyRow) {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  const shipmentRequest = {
    shipment: {
      to_address: {
        name: shopifyRow.to_name,
        street1: shopifyRow.to_street1,
        city: shopifyRow.to_city,
        state: shopifyRow.to_state,
        zip: shopifyRow.to_zip,
        country: shopifyRow.to_country,
        phone: shopifyRow.to_phone || '',
        email: shopifyRow.to_email || '',
      },
      from_address: SHOPIFY_WAREHOUSE,
      parcel: {
        length: shopifyRow.length,
        width: shopifyRow.width,
        height: shopifyRow.height,
        weight: shopifyRow.weight,
      },
      reference: shopifyRow.reference || ''
    }
  };

  const response = await fetch('https://api.easypost.com/v2/shipments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shipmentRequest),
  });

  if (!response.ok) {
    throw new Error(`EasyPost API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    shipmentId: data.id,
    rates: data.rates || []
  };
}

// Select rate based on carrier preference
function selectRate(rates: any[], carrier: string) {
  if (carrier === 'all') {
    // Select cheapest rate
    return rates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0];
  } else {
    // Filter by specific carrier and select cheapest
    const carrierRates = rates.filter(rate => 
      rate.carrier.toLowerCase() === carrier.toLowerCase()
    );
    return carrierRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0];
  }
}

// Send to DRAID Fetching endpoint
async function sendToDRAID(shipmentData: ProcessedShipment) {
  // This would be your internal DRAID endpoint
  const draid_endpoint = Deno.env.get('DRAID_ENDPOINT') || 'https://internal-api.yourcompany.com/draid-fetching';
  
  const response = await fetch(draid_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shipmentId: shipmentData.shipmentId,
      toAddress: shipmentData.toAddress,
      selectedRate: shipmentData.selectedRate
    }),
  });

  if (!response.ok) {
    throw new Error(`DRAID API error: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rows, carrier = 'all' } = await req.json();
    
    if (!rows || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: 'Invalid rows data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${rows.length} rows with carrier preference: ${carrier}`);
    
    const processed: ProcessedShipment[] = [];
    const failed: Array<{ row: RRow; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const rRow = rows[i];
      
      try {
        console.log(`Processing row ${i + 1}/${rows.length}: ${rRow.recipient_name}`);
        
        // Step 1: Map R-format to Shopify format
        const shopifyRow = mapRtoShopify(rRow);
        
        // Step 2: Fetch rates from EasyPost
        const { shipmentId, rates } = await fetchEasyPostRates(shopifyRow);
        
        if (rates.length === 0) {
          throw new Error('No rates available for this shipment');
        }
        
        // Step 3: Select rate based on carrier preference
        const selectedRate = selectRate(rates, carrier);
        
        if (!selectedRate) {
          throw new Error(`No rates found for carrier: ${carrier}`);
        }
        
        // Step 4: Create processed shipment data
        const processedShipment: ProcessedShipment = {
          shipmentId,
          toAddress: shopifyRow,
          selectedRate: {
            id: selectedRate.id,
            carrier: selectedRate.carrier,
            service: selectedRate.service,
            rate: parseFloat(selectedRate.rate)
          },
          originalRow: rRow
        };
        
        // Step 5: Send to DRAID (optional - comment out if not needed)
        try {
          await sendToDRAID(processedShipment);
          console.log(`Successfully sent to DRAID: ${shipmentId}`);
        } catch (draidError) {
          console.log(`DRAID sending failed (continuing): ${draidError.message}`);
          // Continue processing even if DRAID fails
        }
        
        processed.push(processedShipment);
        
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        failed.push({
          row: rRow,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Bulk shipping complete: ${processed.length} processed, ${failed.length} failed`);

    return new Response(
      JSON.stringify({
        processed,
        failed,
        summary: {
          total: rows.length,
          successful: processed.length,
          failed: failed.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bulk-ship function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
