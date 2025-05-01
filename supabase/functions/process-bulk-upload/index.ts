
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShipmentResult {
  id: string;
  tracking_code: string;
  label_url: string;
  status: string;
  row: number;
  recipient: string;
  carrier: string;
}

interface ProcessingError {
  row: number;
  error: string;
  details: string;
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

    // Parse request body
    const { csvContent } = await req.json();
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'Missing CSV content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process the CSV content
    const rows = csvContent.split('\n');
    const headers = rows[0].split(',');
    
    // Check if we have data rows (excluding header)
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file must have at least one data row' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // In a real implementation, we would:
    // 1. Parse each row to extract address and package details
    // 2. Create shipments via EasyPost API for each row
    // 3. Purchase and generate labels for each shipment
    // 4. Return the results with tracking codes and label URLs
    
    // For this demo, we'll generate mock data
    const total = rows.length - 1; // Exclude header row
    const successful = Math.floor(total * 0.9); // 90% success rate
    const failed = total - successful;
    
    // Generate mock tracking info and label URLs for successfully processed shipments
    const processedShipments: ShipmentResult[] = [];
    for (let i = 1; i <= successful; i++) {
      const rowData = rows[i].split(',');
      // Create a mock processed shipment result with label URL
      processedShipments.push({
        id: `ship_${crypto.randomUUID().substring(0, 8)}`,
        tracking_code: `EZ${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png',
        status: 'created',
        row: i,
        recipient: rowData[0] || 'Unknown Recipient',
        carrier: Math.random() > 0.5 ? 'USPS' : Math.random() > 0.5 ? 'UPS' : 'FedEx'
      });
    }
    
    // Generate error information for failed shipments
    const failedShipments: ProcessingError[] = [];
    for (let i = successful + 1; i <= total; i++) {
      const errorType = Math.random() > 0.5 ? 'Invalid address' : 
                         Math.random() > 0.5 ? 'Missing zip code' : 'Invalid weight';
      failedShipments.push({
        row: i,
        error: errorType,
        details: `Error processing row ${i}: ${errorType}`
      });
    }
    
    // Return the results with detailed information
    return new Response(
      JSON.stringify({ 
        total,
        successful,
        failed,
        totalCost: successful * 4.99, // Assuming $4.99 per label
        processedShipments,
        failedShipments,
        message: `Processed ${successful} out of ${total} shipments successfully and generated labels` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in process-bulk-upload function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
