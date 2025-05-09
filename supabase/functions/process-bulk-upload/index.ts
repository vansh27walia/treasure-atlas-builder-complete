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
  status: "pending" | "processing" | "error" | "completed";
  row: number;
  recipient: string;
  carrier: string;
  service: string;
  rate: number;
  details: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    parcel_length?: number;
    parcel_width?: number;
    parcel_height?: number;
    parcel_weight?: number;
  }
}

interface ProcessingError {
  row: number;
  error: string;
  details: string;
}

interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  company?: string;
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
    const { csvContent, origin } = await req.json();
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'Missing CSV content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!origin) {
      return new Response(
        JSON.stringify({ error: 'Missing origin address' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process the CSV content
    const rows = csvContent.split('\n');
    const headers = rows[0].toLowerCase().split(',');
    
    // Check if we have data rows (excluding header)
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file must have at least one data row' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate required headers
    const requiredFields = ['name', 'street1', 'city', 'state', 'zip', 'country'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ error: `CSV is missing required fields: ${missingFields.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get the indexes for each field
    const fieldIndexes = {
      name: headers.indexOf('name'),
      company: headers.indexOf('company'),
      street1: headers.indexOf('street1'),
      street2: headers.indexOf('street2'),
      city: headers.indexOf('city'),
      state: headers.indexOf('state'),
      zip: headers.indexOf('zip'),
      country: headers.indexOf('country'),
      phone: headers.indexOf('phone'),
      parcel_length: headers.indexOf('parcel_length'),
      parcel_width: headers.indexOf('parcel_width'),
      parcel_height: headers.indexOf('parcel_height'),
      parcel_weight: headers.indexOf('parcel_weight'),
    };
    
    // Process each data row
    const total = rows.length - 1; // Exclude header row
    const processedShipments: ShipmentResult[] = [];
    const failedShipments: ProcessingError[] = [];
    
    // Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i].split(',');
      
      // Skip empty rows
      if (rowData.join('').trim() === '') continue;
      
      try {
        // Extract address data
        const recipientDetails = {
          name: rowData[fieldIndexes.name],
          company: fieldIndexes.company >= 0 ? rowData[fieldIndexes.company] : undefined,
          street1: rowData[fieldIndexes.street1],
          street2: fieldIndexes.street2 >= 0 ? rowData[fieldIndexes.street2] : undefined,
          city: rowData[fieldIndexes.city],
          state: rowData[fieldIndexes.state],
          zip: rowData[fieldIndexes.zip],
          country: rowData[fieldIndexes.country],
          phone: fieldIndexes.phone >= 0 ? rowData[fieldIndexes.phone] : undefined,
          parcel_length: fieldIndexes.parcel_length >= 0 ? parseFloat(rowData[fieldIndexes.parcel_length]) : 8,
          parcel_width: fieldIndexes.parcel_width >= 0 ? parseFloat(rowData[fieldIndexes.parcel_width]) : 6,
          parcel_height: fieldIndexes.parcel_height >= 0 ? parseFloat(rowData[fieldIndexes.parcel_height]) : 4,
          parcel_weight: fieldIndexes.parcel_weight >= 0 ? parseFloat(rowData[fieldIndexes.parcel_weight]) : 16,
        };
        
        // Validate the address
        if (!recipientDetails.street1 || !recipientDetails.city || !recipientDetails.state || !recipientDetails.zip || !recipientDetails.country) {
          throw new Error('Missing required address fields');
        }
        
        // In a real implementation, we would call EasyPost API here
        // const shipment = await createEasyPostShipment(origin, toAddress, parcelData, apiKey);
        
        // For this demo, we'll generate mock data
        const recipient = recipientDetails.name;
        // Assign a random carrier
        const carriersAndServices = [
          { carrier: 'USPS', service: 'Priority' },
          { carrier: 'USPS', service: 'First-Class' },
          { carrier: 'UPS', service: 'Ground' },
          { carrier: 'UPS', service: '2nd Day Air' },
          { carrier: 'FedEx', service: 'Ground' },
          { carrier: 'FedEx', service: 'Express' },
        ];
        const randomService = carriersAndServices[Math.floor(Math.random() * carriersAndServices.length)];
        
        // Generate a base rate between $5-20 based on package weight
        const weight = recipientDetails.parcel_weight || 1;
        const baseRate = 5 + (weight * 0.2) + (Math.random() * 10);
        
        // Create a mock processed shipment result with label URL and properly typed status
        processedShipments.push({
          id: `ship_${crypto.randomUUID().substring(0, 8)}`,
          tracking_code: `EZ${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
          label_url: 'https://assets.easypost.com/shipping_labels/example_label.png',
          status: "pending", // Using the proper enum value
          row: i,
          recipient,
          carrier: randomService.carrier,
          service: randomService.service,
          rate: parseFloat(baseRate.toFixed(2)),
          details: recipientDetails
        });
      } catch (error) {
        // Add to failed shipments
        failedShipments.push({
          row: i,
          error: error instanceof Error ? 'Validation Error' : 'Processing Error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successful = processedShipments.length;
    const failed = failedShipments.length;
    
    // Calculate total cost based on shipment rates
    const totalCost = processedShipments.reduce((sum, shipment) => sum + shipment.rate, 0);
    
    // Return the results with detailed information
    return new Response(
      JSON.stringify({ 
        total: total,
        successful,
        failed,
        totalCost,
        processedShipments,
        failedShipments,
        message: `Processed ${successful} out of ${total} shipments successfully` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in process-bulk-upload function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
