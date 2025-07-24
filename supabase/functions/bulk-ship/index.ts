
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

// Convert Shopify rows to EasyPost CSV format
function generateEasyPostCSV(shopifyRows: ShopifyRow[]): string {
  const headers = [
    'to_name', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country',
    'weight', 'length', 'width', 'height', 'to_company', 'to_street2',
    'to_phone', 'to_email', 'reference'
  ];
  
  const csvRows = [headers.join(',')];
  
  shopifyRows.forEach(row => {
    const csvRow = [
      `"${row.to_name}"`,
      `"${row.to_street1}"`,
      `"${row.to_city}"`,
      `"${row.to_state}"`,
      `"${row.to_zip}"`,
      `"${row.to_country}"`,
      `"${row.weight}"`,
      `"${row.length}"`,
      `"${row.width}"`,
      `"${row.height}"`,
      `""`, // to_company
      `""`, // to_street2
      `"${row.to_phone || ''}"`,
      `"${row.to_email || ''}"`,
      `"${row.reference || ''}"`
    ];
    csvRows.push(csvRow.join(','));
  });
  
  return csvRows.join('\n');
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

    console.log(`Processing ${rows.length} Shopify orders for bulk shipping`);
    
    // Step 1: Transform R-format to Shopify format
    const shopifyRows: ShopifyRow[] = rows.map(rRow => mapRtoShopify(rRow));
    
    // Step 2: Generate EasyPost CSV
    const csvContent = generateEasyPostCSV(shopifyRows);
    
    console.log('Generated CSV content for batch label creation');
    
    // Step 3: Return CSV content for frontend to upload
    return new Response(
      JSON.stringify({
        success: true,
        csvContent,
        rowCount: rows.length,
        message: `Processed ${rows.length} Shopify orders and generated CSV for batch label creation`
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
