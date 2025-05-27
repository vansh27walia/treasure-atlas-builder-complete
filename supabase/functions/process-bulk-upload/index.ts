
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
  availableRates: ShippingRate[];
  selectedRateId?: string;
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
    email?: string;
    preferred_carrier?: string;
    preferred_service?: string;
    package_type?: string;
    delivery_confirmation?: string;
    insurance_value?: number;
  };
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string | null;
}

interface ProcessingError {
  row: number;
  error: string;
  details: string;
}

// Parse CSV content more reliably
const parseCSV = (csvContent: string): string[][] => {
  const lines = csvContent.trim().split('\n');
  return lines.map(line => {
    // Handle both comma-separated and properly quoted CSV
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  });
};

// Generate mock rates as fallback
const generateMockRates = (): ShippingRate[] => {
  const carriers = [
    { name: 'USPS', services: ['Priority', 'Ground', 'Express'] },
    { name: 'UPS', services: ['Ground', '2nd Day Air', 'Next Day Air'] },
    { name: 'FedEx', services: ['Ground', 'Express', 'Overnight'] },
  ];

  const rates: ShippingRate[] = [];
  
  carriers.forEach(carrier => {
    carrier.services.forEach((service, index) => {
      const baseRate = 8 + Math.random() * 15;
      const markup = baseRate * 0.15;
      
      rates.push({
        id: `rate_${carrier.name.toLowerCase()}_${service.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
        carrier: carrier.name,
        service: service,
        rate: (baseRate + markup).toFixed(2),
        currency: 'USD',
        delivery_days: Math.floor(Math.random() * 5) + 1,
        delivery_date: null,
      });
    });
  });

  return rates;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { fileName, fileContent, pickupAddress } = body;
    
    if (!fileContent) {
      return new Response(
        JSON.stringify({ error: 'Missing file content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!pickupAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing pickup address' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Processing bulk upload with pickup address:", JSON.stringify(pickupAddress));

    // Decode base64 content
    const csvContent = atob(fileContent);
    console.log("CSV Content:", csvContent.substring(0, 200) + "...");

    // Parse CSV with improved parser
    const rows = parseCSV(csvContent);
    
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file must have at least one data row' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Clean and normalize headers
    const headers = rows[0].map(h => h.toLowerCase().trim());
    console.log("Parsed headers:", headers);
    
    // Validate required headers
    const requiredFields = ['name', 'street1', 'city', 'state', 'zip', 'country'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: `CSV is missing required columns: ${missingFields.join(', ')}`,
          details: `Found columns: ${headers.join(', ')}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get field indexes
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
      preferred_carrier: headers.indexOf('preferred_carrier'),
      preferred_service: headers.indexOf('preferred_service'),
    };
    
    const total = rows.length - 1;
    const processedShipments: ShipmentResult[] = [];
    const failedShipments: ProcessingError[] = [];
    
    // Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i];
      
      // Skip empty rows
      if (rowData.join('').trim() === '') continue;
      
      try {
        // Extract recipient details with better validation
        const name = rowData[fieldIndexes.name]?.trim();
        const street1 = rowData[fieldIndexes.street1]?.trim();
        const city = rowData[fieldIndexes.city]?.trim();
        const state = rowData[fieldIndexes.state]?.trim();
        const zip = rowData[fieldIndexes.zip]?.trim();
        const country = rowData[fieldIndexes.country]?.trim() || 'US';

        // Validate required fields
        if (!name || !street1 || !city || !state || !zip) {
          throw new Error(`Row ${i}: Missing required address fields (name, street1, city, state, zip)`);
        }

        const recipientDetails = {
          name,
          company: fieldIndexes.company >= 0 ? rowData[fieldIndexes.company]?.trim() : undefined,
          street1,
          street2: fieldIndexes.street2 >= 0 ? rowData[fieldIndexes.street2]?.trim() : undefined,
          city,
          state,
          zip,
          country,
          phone: fieldIndexes.phone >= 0 ? rowData[fieldIndexes.phone]?.trim() : undefined,
          parcel_length: fieldIndexes.parcel_length >= 0 ? parseFloat(rowData[fieldIndexes.parcel_length]) || 8 : 8,
          parcel_width: fieldIndexes.parcel_width >= 0 ? parseFloat(rowData[fieldIndexes.parcel_width]) || 6 : 6,
          parcel_height: fieldIndexes.parcel_height >= 0 ? parseFloat(rowData[fieldIndexes.parcel_height]) || 4 : 4,
          parcel_weight: fieldIndexes.parcel_weight >= 0 ? parseFloat(rowData[fieldIndexes.parcel_weight]) || 16 : 16,
          preferred_carrier: fieldIndexes.preferred_carrier >= 0 ? rowData[fieldIndexes.preferred_carrier]?.trim() : undefined,
          preferred_service: fieldIndexes.preferred_service >= 0 ? rowData[fieldIndexes.preferred_service]?.trim() : undefined,
        };
        
        // Generate rates for this shipment
        const availableRates = generateMockRates();
        
        // Select best rate based on preferences or default to cheapest
        let selectedRate = availableRates.reduce((prev, curr) => 
          parseFloat(prev.rate) < parseFloat(curr.rate) ? prev : curr
        );
        
        if (recipientDetails.preferred_carrier) {
          const preferredRate = availableRates.find(rate => 
            rate.carrier.toLowerCase() === recipientDetails.preferred_carrier?.toLowerCase()
          );
          if (preferredRate) selectedRate = preferredRate;
        }
        
        processedShipments.push({
          id: `ship_${crypto.randomUUID().substring(0, 8)}`,
          tracking_code: '',
          label_url: '',
          status: "pending",
          row: i,
          recipient: recipientDetails.name,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate: parseFloat(selectedRate.rate),
          availableRates,
          selectedRateId: selectedRate.id,
          details: recipientDetails
        });
        
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        failedShipments.push({
          row: i,
          error: 'Processing Error',
          details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
    
    const successful = processedShipments.length;
    const failed = failedShipments.length;
    const totalCost = processedShipments.reduce((sum, shipment) => sum + shipment.rate, 0);
    
    console.log(`Processed ${successful} successful, ${failed} failed shipments`);
    
    return new Response(
      JSON.stringify({ 
        total,
        successful,
        failed,
        totalCost,
        processedShipments,
        failedShipments,
        message: `Processed ${successful} out of ${total} shipments successfully`,
        pickupAddress
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in process-bulk-upload function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Processing failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Please check your CSV format and try again'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
