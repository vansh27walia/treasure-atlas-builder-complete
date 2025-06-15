
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

// Enhanced CSV parsing with better error handling
const parseCSV = (csvContent: string): string[][] => {
  const lines = csvContent.split('\n');
  const result: string[][] = [];
  
  console.log(`🔍 CSV Input Analysis: Total lines found: ${lines.length}`);
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim();
    
    // Skip completely empty lines
    if (line === '') {
      console.log(`⏭️ Skipping empty line at index ${lineIndex}`);
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
        fields.push(current.trim().replace(/^"(.*)"$/, '$1')); // Remove quotes
        current = '';
      } else {
        current += char;
      }
    }
    
    // Don't forget the last field
    fields.push(current.trim().replace(/^"(.*)"$/, '$1'));
    
    console.log(`📊 Line ${lineIndex} processed: ${fields.length} fields found`);
    console.log(`📝 Fields: [${fields.map(f => `"${f}"`).join(', ')}]`);
    result.push(fields);
  }
  
  console.log(`✅ CSV Parsing Complete: ${result.length} total rows parsed`);
  return result;
};

// Enhanced address validation with detailed error reporting
const validateAddressData = (rowData: string[], rowNumber: number, fieldIndexes: any): { isValid: boolean; errors: string[]; toAddress?: any; parcel?: any } => {
  const errors: string[] = [];
  
  const getValue = (index: number, fieldName: string) => {
    if (index >= 0 && index < rowData.length) {
      const value = rowData[index]?.trim();
      return value || '';
    }
    return '';
  };

  // Extract values with proper validation
  const to_name = getValue(fieldIndexes.to_name, 'to_name');
  const to_street1 = getValue(fieldIndexes.to_street1, 'to_street1');
  const to_city = getValue(fieldIndexes.to_city, 'to_city');
  const to_state = getValue(fieldIndexes.to_state, 'to_state');
  const to_zip = getValue(fieldIndexes.to_zip, 'to_zip');
  const to_country = getValue(fieldIndexes.to_country, 'to_country') || 'US';
  
  const weightStr = getValue(fieldIndexes.weight, 'weight');
  const lengthStr = getValue(fieldIndexes.length, 'length');
  const widthStr = getValue(fieldIndexes.width, 'width');
  const heightStr = getValue(fieldIndexes.height, 'height');

  // Validate required fields
  if (!to_name) errors.push('Missing recipient name (to_name)');
  if (!to_street1) errors.push('Missing street address (to_street1)');
  if (!to_city) errors.push('Missing city (to_city)');
  if (!to_state) errors.push('Missing state (to_state)');
  if (!to_zip) errors.push('Missing ZIP code (to_zip)');
  
  // Validate and parse numeric fields
  const weight = parseFloat(weightStr);
  const length = parseFloat(lengthStr);
  const width = parseFloat(widthStr);
  const height = parseFloat(heightStr);
  
  if (!weightStr || isNaN(weight) || weight <= 0) errors.push('Missing or invalid weight');
  if (!lengthStr || isNaN(length) || length <= 0) errors.push('Missing or invalid length');
  if (!widthStr || isNaN(width) || width <= 0) errors.push('Missing or invalid width');
  if (!heightStr || isNaN(height) || height <= 0) errors.push('Missing or invalid height');

  if (errors.length > 0) {
    console.log(`❌ Row ${rowNumber} validation failed:`, errors);
    return { isValid: false, errors };
  }

  const toAddress = {
    to_name,
    to_company: getValue(fieldIndexes.to_company, 'to_company'),
    to_street1,
    to_street2: getValue(fieldIndexes.to_street2, 'to_street2'),
    to_city,
    to_state,
    to_zip,
    to_country,
    to_phone: getValue(fieldIndexes.to_phone, 'to_phone'),
    to_email: getValue(fieldIndexes.to_email, 'to_email'),
  };

  const parcel = {
    weight,
    length,
    width,
    height,
  };

  console.log(`✅ Row ${rowNumber} validation passed`);
  return { isValid: true, errors: [], toAddress, parcel };
};

// Create EasyPost shipment and fetch live rates with enhanced carrier information
const createShipmentAndFetchRates = async (fromAddress: any, toAddress: any, parcel: any, reference?: string): Promise<{ shipment: any, rates: ShippingRate[] }> => {
  try {
    console.log('🚀 Creating EasyPost shipment for live rate fetching');
    
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

    console.log('📤 Sending shipment request to EasyPost');

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
      console.error('❌ EasyPost API error:', response.status, errorText);
      throw new Error(`EasyPost API error: ${response.status} - ${errorText}`);
    }

    const shipment = await response.json();
    console.log('✅ EasyPost shipment created with ID:', shipment.id);
    console.log('📦 Available live rates count:', shipment.rates?.length || 0);
    
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

    console.log(`🎯 Successfully created shipment and fetched ${rates.length} live rates`);
    return { shipment, rates };

  } catch (error) {
    console.error('💥 Error creating shipment and fetching live rates:', error);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📥 Request received with keys:', Object.keys(requestBody));
    
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

    console.log("🎯 Processing EasyPost bulk upload with pickup address:", pickupAddress.name);
    console.log("📄 CSV content length:", csvContent.length);

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
    console.log('📋 CSV headers found:', headers);
    
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
    
    console.log('🗺️ Field mapping established:', fieldIndexes);
    
    // Process ALL data rows - ensure no data is lost
    const dataRows = rows.slice(1); // All rows except header
    const total = dataRows.length;
    console.log(`🔄 Processing ${total} data rows (excluding header row)`);
    
    const processedShipments: ShipmentResult[] = [];
    const failedShipments: ProcessingError[] = [];
    
    // Process each data row with enhanced error handling
    for (let i = 0; i < dataRows.length; i++) {
      const rowData = dataRows[i];
      const actualRowNumber = i + 2; // Row 2, 3, 4... (accounting for header)
      
      console.log(`\n🔍 Processing data row ${actualRowNumber}:`, rowData);
      
      // Skip completely empty rows
      if (!rowData || rowData.every(cell => !cell || cell.trim() === '')) {
        console.log(`⏭️ Skipping completely empty data row ${actualRowNumber}`);
        failedShipments.push({
          row: actualRowNumber,
          error: 'Empty Row',
          details: 'This row contains no data and was skipped'
        });
        continue;
      }
      
      try {
        // Validate address data first
        const validation = validateAddressData(rowData, actualRowNumber, fieldIndexes);
        
        if (!validation.isValid) {
          console.log(`❌ Row ${actualRowNumber} failed validation:`, validation.errors);
          failedShipments.push({
            row: actualRowNumber,
            error: 'Data Validation Failed',
            details: `Missing required data: ${validation.errors.join(', ')}`
          });
          continue;
        }

        const { toAddress, parcel } = validation;
        const reference = fieldIndexes.reference >= 0 ? rowData[fieldIndexes.reference]?.trim() : '';
        
        console.log(`✅ Row ${actualRowNumber} - Address validation passed`);
        console.log(`📍 To Address: ${toAddress.to_name}, ${toAddress.to_street1}, ${toAddress.to_city}, ${toAddress.to_state}`);
        console.log(`📦 Package: ${parcel.weight}lbs, ${parcel.length}x${parcel.width}x${parcel.height}in`);
        
        // Create EasyPost shipment and fetch live rates
        console.log(`🚀 Creating EasyPost shipment for row ${actualRowNumber}`);
        const { shipment, rates } = await createShipmentAndFetchRates(
          pickupAddress,
          toAddress,
          parcel,
          reference
        );
        
        console.log(`✅ Created shipment ${shipment.id} with ${rates.length} rates for row ${actualRowNumber}`);
        
        // Select cheapest rate by default
        const selectedRate = rates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0];
        
        if (!selectedRate) {
          throw new Error(`No shipping rates available for row ${actualRowNumber}`);
        }
        
        // Create shipment result
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
        console.log(`🎉 Successfully processed row ${actualRowNumber}`);
        
      } catch (error) {
        console.error(`💥 Error processing row ${actualRowNumber}:`, error);
        failedShipments.push({
          row: actualRowNumber,
          error: 'Processing Error',
          details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
    
    const successful = processedShipments.length;
    const failed = failedShipments.length;
    const totalCost = processedShipments.reduce((sum, shipment) => sum + shipment.rate, 0);
    
    console.log(`\n🎯 FINAL RESULTS:`);
    console.log(`📊 Total rows in file: ${total}`);
    console.log(`✅ Successfully processed: ${successful}`);
    console.log(`❌ Failed processing: ${failed}`);
    console.log(`💰 Total estimated cost: $${totalCost.toFixed(2)}`);
    
    // Ensure we account for ALL rows
    if (successful + failed !== total) {
      console.error(`🚨 DATA LOSS DETECTED! Expected ${total} rows, processed ${successful + failed}`);
    }
    
    return new Response(
      JSON.stringify({ 
        total,
        successful,
        failed,
        totalCost,
        processedShipments,
        failedShipments,
        message: `Processed ${successful} out of ${total} shipments using live EasyPost API`,
        pickupAddress: pickupAddress.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('💥 Error in EasyPost process-bulk-upload function:', error);
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
