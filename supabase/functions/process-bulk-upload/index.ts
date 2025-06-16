
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShipmentResult {
  id: string;
  easypost_id: string;
  tracking_code: string;
  label_url: string;
  status: "pending" | "processing" | "error" | "completed";
  row: number;
  recipient: string;
  carrier: string;
  service: string;
  rate: number;
  availableRates: ShippingRate[];
  selectedRateId: string;
  details: {
    to_name: string;
    to_company?: string;
    to_street1: string;
    to_street2?: string;
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
  };
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_company?: string;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string | null;
  shipment_id: string;
  carrier_account_id?: string;
  list_rate?: string;
  retail_rate?: string;
}

interface ProcessingError {
  row: number;
  error: string;
  details: string;
}

// Parse CSV content following EasyPost format - FIXED to handle all rows properly
const parseCSV = (csvContent: string): string[][] => {
  const lines = csvContent.split('\n');
  const result: string[][] = [];
  
  console.log(`Total lines in CSV: ${lines.length}`);
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim();
    
    // Skip completely empty lines
    if (line === '') {
      console.log(`Skipping empty line at index ${lineIndex}`);
      continue;
    }
    
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
    
    // Don't forget the last field
    fields.push(current.trim());
    
    console.log(`Line ${lineIndex}: parsed ${fields.length} fields:`, fields);
    result.push(fields);
  }
  
  console.log(`Parsed CSV into ${result.length} rows total`);
  return result;
};

// Create EasyPost shipment and fetch live rates with enhanced carrier information
const createShipmentAndFetchRates = async (fromAddress: any, toAddress: any, parcel: any, reference?: string): Promise<{ shipment: any, rates: ShippingRate[] }> => {
  try {
    console.log('Creating EasyPost shipment for live rate fetching');
    
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      throw new Error('EasyPost API key not configured');
    }

    // Create shipment via EasyPost API
    const shipmentData = {
      shipment: {
        to_address: {
          name: toAddress.to_name,
          company: toAddress.to_company || '',
          street1: toAddress.to_street1,
          street2: toAddress.to_street2 || '',
          city: toAddress.to_city,
          state: toAddress.to_state,
          zip: toAddress.to_zip,
          country: toAddress.to_country,
          phone: toAddress.to_phone || '',
          email: toAddress.to_email || '',
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
        },
        reference: reference || ''
      }
    };

    console.log('Sending shipment request to EasyPost:', JSON.stringify(shipmentData));

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
      console.error('EasyPost API error:', response.status, errorText);
      throw new Error(`EasyPost API error: ${response.status} - ${errorText}`);
    }

    const shipment = await response.json();
    console.log('EasyPost shipment created with ID:', shipment.id);
    console.log('Available live rates count:', shipment.rates?.length || 0);
    
    if (!shipment.rates || shipment.rates.length === 0) {
      throw new Error('No live rates returned from EasyPost API');
    }
    
    // Convert EasyPost rates to our format with enhanced carrier information
    const rates: ShippingRate[] = shipment.rates.map((rate: any) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      rate: parseFloat(rate.rate).toFixed(2),
      currency: rate.currency,
      delivery_days: rate.delivery_days || 3,
      delivery_date: rate.delivery_date,
      shipment_id: shipment.id,
      carrier_account_id: rate.carrier_account_id,
      list_rate: rate.list_rate ? parseFloat(rate.list_rate).toFixed(2) : undefined,
      retail_rate: rate.retail_rate ? parseFloat(rate.retail_rate).toFixed(2) : undefined,
    }));

    console.log(`Successfully created shipment and fetched ${rates.length} live rates with full carrier details`);
    return { shipment, rates };

  } catch (error) {
    console.error('Error creating shipment and fetching live rates:', error);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body keys:', Object.keys(requestBody));
    
    const { csvContent, pickupAddress } = requestBody;
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'Missing CSV content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!pickupAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing pickup address. Please set a pickup address in your settings.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Processing EasyPost bulk upload with pickup address:", pickupAddress.name);
    console.log("CSV content length:", csvContent.length);

    // Parse the CSV content following EasyPost format
    const rows = parseCSV(csvContent);
    
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file must have at least one data row after the header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get headers - EasyPost format
    const headers = rows[0].map(h => h.toLowerCase().trim());
    console.log('CSV headers:', headers);
    
    // Validate required headers for EasyPost format
    const requiredFields = ['to_name', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country', 'weight', 'length', 'width', 'height'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ error: `CSV is missing required EasyPost fields: ${missingFields.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get field indexes for EasyPost format
    const getFieldIndex = (fieldName: string) => headers.indexOf(fieldName);
    
    const fieldIndexes = {
      to_name: getFieldIndex('to_name'),
      to_company: getFieldIndex('to_company'),
      to_street1: getFieldIndex('to_street1'),
      to_street2: getFieldIndex('to_street2'),
      to_city: getFieldIndex('to_city'),
      to_state: getFieldIndex('to_state'),
      to_zip: getFieldIndex('to_zip'),
      to_country: getFieldIndex('to_country'),
      to_phone: getFieldIndex('to_phone'),
      to_email: getFieldIndex('to_email'),
      weight: getFieldIndex('weight'),
      length: getFieldIndex('length'),
      width: getFieldIndex('width'),
      height: getFieldIndex('height'),
      reference: getFieldIndex('reference'),
    };
    
    console.log('EasyPost field indexes:', fieldIndexes);
    
    // FIXED: Process ALL data rows, not missing any
    const dataRows = rows.slice(1); // Get all rows except header
    const total = dataRows.length;
    console.log(`Processing ${total} data rows (excluding header)`);
    
    const processedShipments: ShipmentResult[] = [];
    const failedShipments: ProcessingError[] = [];
    
    // Process each data row following EasyPost workflow
    for (let i = 0; i < dataRows.length; i++) {
      const rowData = dataRows[i];
      const actualRowNumber = i + 1; // For display purposes (row 1, 2, 3...)
      
      // Skip empty rows
      if (!rowData || rowData.join('').trim() === '') {
        console.log(`Skipping empty data row ${actualRowNumber}`);
        continue;
      }
      
      try {
        console.log(`Processing EasyPost data row ${actualRowNumber}:`, rowData);
        
        // Extract recipient details safely following EasyPost format
        const getValue = (index: number) => index >= 0 && index < rowData.length ? rowData[index]?.trim() : '';
        
        const toAddress = {
          to_name: getValue(fieldIndexes.to_name),
          to_company: getValue(fieldIndexes.to_company),
          to_street1: getValue(fieldIndexes.to_street1),
          to_street2: getValue(fieldIndexes.to_street2),
          to_city: getValue(fieldIndexes.to_city),
          to_state: getValue(fieldIndexes.to_state),
          to_zip: getValue(fieldIndexes.to_zip),
          to_country: getValue(fieldIndexes.to_country) || 'US',
          to_phone: getValue(fieldIndexes.to_phone),
          to_email: getValue(fieldIndexes.to_email),
        };

        const parcel = {
          weight: parseFloat(getValue(fieldIndexes.weight)) || 1.0,
          length: parseFloat(getValue(fieldIndexes.length)) || 12,
          width: parseFloat(getValue(fieldIndexes.width)) || 8,
          height: parseFloat(getValue(fieldIndexes.height)) || 4,
        };

        const reference = getValue(fieldIndexes.reference);
        
        console.log(`Data row ${actualRowNumber} to_address:`, toAddress);
        console.log(`Data row ${actualRowNumber} parcel:`, parcel);
        
        // Validate required address fields
        if (!toAddress.to_name || !toAddress.to_street1 || !toAddress.to_city || 
            !toAddress.to_state || !toAddress.to_zip) {
          throw new Error(`Missing required fields in data row ${actualRowNumber}: to_name, to_street1, to_city, to_state, to_zip are required`);
        }
        
        // Create EasyPost shipment and fetch live rates
        console.log(`Creating EasyPost shipment for data row ${actualRowNumber}`);
        const { shipment, rates } = await createShipmentAndFetchRates(
          pickupAddress,
          toAddress,
          parcel,
          reference
        );
        
        console.log(`Created shipment ${shipment.id} with ${rates.length} live rates for data row ${actualRowNumber}`);
        
        // Select cheapest rate by default
        const selectedRate = rates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0];
        
        if (!selectedRate) {
          throw new Error(`No shipping rates available for data row ${actualRowNumber}`);
        }
        
        // Create shipment result with proper customer details
        const shipmentResult: ShipmentResult = {
          id: `ship_${crypto.randomUUID().substring(0, 8)}`,
          easypost_id: shipment.id,
          tracking_code: '',
          label_url: '',
          status: "completed",
          row: actualRowNumber,
          recipient: toAddress.to_name,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate: parseFloat(selectedRate.rate),
          availableRates: rates,
          selectedRateId: selectedRate.id,
          details: {
            to_name: toAddress.to_name,
            to_company: toAddress.to_company,
            to_street1: toAddress.to_street1,
            to_street2: toAddress.to_street2,
            to_city: toAddress.to_city,
            to_state: toAddress.to_state,
            to_zip: toAddress.to_zip,
            to_country: toAddress.to_country,
            to_phone: toAddress.to_phone,
            to_email: toAddress.to_email,
            weight: parcel.weight,
            length: parcel.length,
            width: parcel.width,
            height: parcel.height,
            reference
          },
          customer_name: toAddress.to_name,
          customer_address: `${toAddress.to_street1}, ${toAddress.to_city}, ${toAddress.to_state} ${toAddress.to_zip}`,
          customer_phone: toAddress.to_phone,
          customer_email: toAddress.to_email,
          customer_company: toAddress.to_company,
        };
        
        processedShipments.push(shipmentResult);
        console.log(`Successfully processed EasyPost data row ${actualRowNumber}`);
        
      } catch (error) {
        console.error(`Error processing data row ${actualRowNumber}:`, error);
        failedShipments.push({
          row: actualRowNumber,
          error: 'EasyPost Processing Error',
          details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
    
    const successful = processedShipments.length;
    const failed = failedShipments.length;
    const totalCost = processedShipments.reduce((sum, shipment) => sum + shipment.rate, 0);
    
    console.log(`EasyPost processing complete: ${successful} successful, ${failed} failed, total cost: $${totalCost}`);
    console.log(`VERIFICATION: Expected ${total} rows, processed ${successful + failed} rows`);
    
    return new Response(
      JSON.stringify({ 
        total,
        successful,
        failed,
        totalCost,
        processedShipments,
        failedShipments,
        message: `Processed ${successful} out of ${total} shipments using live EasyPost API with full carrier details`,
        pickupAddress: pickupAddress.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in EasyPost process-bulk-upload function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'EasyPost Processing Error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Please check your CSV format follows EasyPost structure and ensure all required fields are present'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
