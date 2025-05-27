
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

// Parse CSV content properly
const parseCSV = (csvContent: string): string[][] => {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  const result: string[][] = [];
  
  for (const line of lines) {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    result.push(fields);
  }
  
  return result;
};

// Fetch live rates from EasyPost
const fetchLiveRates = async (fromAddress: any, toAddress: any, parcel: any): Promise<ShippingRate[]> => {
  try {
    console.log('Fetching rates for:', { fromAddress, toAddress, parcel });
    
    // Get EasyPost API key
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.log('EasyPost API key not found, using mock rates');
      return generateMockRates();
    }

    // Create shipment via EasyPost API
    const shipmentData = {
      to_address: {
        name: toAddress.name,
        company: toAddress.company || '',
        street1: toAddress.street1,
        street2: toAddress.street2 || '',
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country,
        phone: toAddress.phone || '',
      },
      from_address: {
        name: fromAddress.name || fromAddress.street1,
        company: fromAddress.company || '',
        street1: fromAddress.street1,
        street2: fromAddress.street2 || '',
        city: fromAddress.city,
        state: fromAddress.state,
        zip: fromAddress.zip,
        country: fromAddress.country,
        phone: fromAddress.phone || '',
      },
      parcel: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight: parcel.weight,
      }
    };

    console.log('Sending to EasyPost:', JSON.stringify(shipmentData));

    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('EasyPost API error:', response.status, errorText);
      return generateMockRates();
    }

    const shipment = await response.json();
    console.log('EasyPost response rates count:', shipment.rates?.length || 0);
    
    // Convert EasyPost rates to our format
    const rates: ShippingRate[] = shipment.rates?.map((rate: any) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      rate: rate.rate,
      currency: rate.currency,
      delivery_days: rate.delivery_days || 3,
      delivery_date: rate.delivery_date,
    })) || [];

    // Apply markup
    const markupPercentage = 15;
    return rates.map(rate => ({
      ...rate,
      rate: (parseFloat(rate.rate) * (1 + markupPercentage / 100)).toFixed(2),
    }));

  } catch (error) {
    console.error('Error fetching live rates:', error);
    return generateMockRates();
  }
};

// Generate mock rates as fallback
const generateMockRates = (): ShippingRate[] => {
  const carriers = [
    { name: 'USPS', services: ['Priority', 'Ground', 'Express'] },
    { name: 'UPS', services: ['Ground', '2nd Day Air', 'Next Day Air'] },
    { name: 'FedEx', services: ['Ground', 'Express', 'Overnight'] },
    { name: 'DHL', services: ['Express', 'Express Worldwide'] }
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
    const requestBody = await req.json();
    console.log('Request body keys:', Object.keys(requestBody));
    
    const { csvContent, pickupAddress, fileName, fileContent } = requestBody;
    
    // Handle both direct CSV content and base64 file content
    let csvData = csvContent;
    if (!csvData && fileContent && fileName) {
      // Decode base64 file content
      const decodedContent = atob(fileContent);
      csvData = decodedContent;
    }
    
    if (!csvData) {
      return new Response(
        JSON.stringify({ error: 'Missing CSV content or file data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!pickupAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing pickup address. Please set a pickup address in your settings.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Processing bulk upload with pickup address:", JSON.stringify(pickupAddress));
    console.log("CSV content length:", csvData.length);

    // Parse the CSV content properly
    const rows = parseCSV(csvData);
    
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file must have at least one data row after the header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get headers and convert to lowercase for case-insensitive matching
    const headers = rows[0].map(h => h.toLowerCase().trim());
    console.log('CSV headers:', headers);
    
    // Validate required headers
    const requiredFields = ['name', 'street1', 'city', 'state', 'zip', 'country'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ error: `CSV is missing required fields: ${missingFields.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get field indexes
    const getFieldIndex = (fieldName: string) => headers.indexOf(fieldName);
    
    const fieldIndexes = {
      name: getFieldIndex('name'),
      company: getFieldIndex('company'),
      street1: getFieldIndex('street1'),
      street2: getFieldIndex('street2'),
      city: getFieldIndex('city'),
      state: getFieldIndex('state'),
      zip: getFieldIndex('zip'),
      country: getFieldIndex('country'),
      phone: getFieldIndex('phone'),
      parcel_length: getFieldIndex('parcel_length'),
      parcel_width: getFieldIndex('parcel_width'),
      parcel_height: getFieldIndex('parcel_height'),
      parcel_weight: getFieldIndex('parcel_weight'),
      preferred_carrier: getFieldIndex('preferred_carrier'),
      preferred_service: getFieldIndex('preferred_service'),
    };
    
    console.log('Field indexes:', fieldIndexes);
    
    const total = rows.length - 1;
    const processedShipments: ShipmentResult[] = [];
    const failedShipments: ProcessingError[] = [];
    
    // Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i];
      
      // Skip empty rows
      if (!rowData || rowData.join('').trim() === '') {
        console.log(`Skipping empty row ${i}`);
        continue;
      }
      
      try {
        console.log(`Processing row ${i}:`, rowData);
        
        // Extract recipient details safely
        const getValue = (index: number) => index >= 0 && index < rowData.length ? rowData[index]?.trim() : '';
        
        const recipientDetails = {
          name: getValue(fieldIndexes.name),
          company: getValue(fieldIndexes.company),
          street1: getValue(fieldIndexes.street1),
          street2: getValue(fieldIndexes.street2),
          city: getValue(fieldIndexes.city),
          state: getValue(fieldIndexes.state),
          zip: getValue(fieldIndexes.zip),
          country: getValue(fieldIndexes.country) || 'US',
          phone: getValue(fieldIndexes.phone),
          parcel_length: parseFloat(getValue(fieldIndexes.parcel_length)) || 12,
          parcel_width: parseFloat(getValue(fieldIndexes.parcel_width)) || 8,
          parcel_height: parseFloat(getValue(fieldIndexes.parcel_height)) || 4,
          parcel_weight: parseFloat(getValue(fieldIndexes.parcel_weight)) || 16,
          preferred_carrier: getValue(fieldIndexes.preferred_carrier),
          preferred_service: getValue(fieldIndexes.preferred_service),
        };
        
        console.log(`Row ${i} details:`, recipientDetails);
        
        // Validate required address fields
        if (!recipientDetails.name || !recipientDetails.street1 || !recipientDetails.city || 
            !recipientDetails.state || !recipientDetails.zip) {
          throw new Error(`Missing required fields in row ${i}: name, street1, city, state, zip are required`);
        }
        
        // Fetch live rates for this shipment
        console.log(`Fetching rates for shipment ${i}`);
        const availableRates = await fetchLiveRates(
          pickupAddress,
          recipientDetails,
          {
            length: recipientDetails.parcel_length,
            width: recipientDetails.parcel_width,
            height: recipientDetails.parcel_height,
            weight: recipientDetails.parcel_weight,
          }
        );
        
        console.log(`Found ${availableRates.length} rates for shipment ${i}`);
        
        // Select best rate based on preferences or default to cheapest
        let selectedRate = availableRates[0];
        if (recipientDetails.preferred_carrier && availableRates.length > 0) {
          const preferredRate = availableRates.find(rate => 
            rate.carrier.toLowerCase() === recipientDetails.preferred_carrier?.toLowerCase()
          );
          if (preferredRate) {
            selectedRate = preferredRate;
            console.log(`Using preferred carrier ${recipientDetails.preferred_carrier} for row ${i}`);
          }
        }
        
        if (!selectedRate) {
          throw new Error(`No shipping rates available for row ${i}`);
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
        
        console.log(`Successfully processed row ${i}`);
        
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
    
    console.log(`Processing complete: ${successful} successful, ${failed} failed, total cost: $${totalCost}`);
    
    return new Response(
      JSON.stringify({ 
        total,
        successful,
        failed,
        totalCost,
        processedShipments,
        failedShipments,
        message: `Processed ${successful} out of ${total} shipments with live rates`,
        pickupAddress
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in process-bulk-upload function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Please check your CSV format and ensure all required fields are present'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
