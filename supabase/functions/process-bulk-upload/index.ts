
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedShipmentData {
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
}

const isInternational = (fromCountry: string, toCountry: string): boolean => {
  return fromCountry !== toCountry;
};

const createEasyPostShipment = async (shipmentData: ParsedShipmentData, fromAddress: any, includeCustoms: boolean = false) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  const shipmentRequest: any = {
    shipment: {
      to_address: {
        name: shipmentData.to_name,
        company: shipmentData.to_company || '',
        street1: shipmentData.to_street1,
        street2: shipmentData.to_street2 || '',
        city: shipmentData.to_city,
        state: shipmentData.to_state,
        zip: shipmentData.to_zip,
        country: shipmentData.to_country,
        phone: shipmentData.to_phone || '',
        email: shipmentData.to_email || '',
      },
      from_address: {
        name: fromAddress.name,
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
        length: shipmentData.length,
        width: shipmentData.width,
        height: shipmentData.height,
        weight: shipmentData.weight,
      },
      reference: shipmentData.reference || ''
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
    const errorData = await response.json();
    console.error('EasyPost shipment creation error:', errorData);
    throw new Error(`EasyPost API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const { fileName, fileContent, pickupAddress } = await req.json();

    if (!fileContent || !pickupAddress) {
      return new Response(JSON.stringify({ 
        error: 'File content and pickup address are required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`Processing bulk upload for user: ${user.id}, file: ${fileName}`);

    // Parse CSV content
    const lines = fileContent.split('\n').filter((line: string) => line.trim() !== '');
    if (lines.length < 2) {
      throw new Error('CSV file must contain headers and at least one data row');
    }

    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
    console.log('CSV headers:', headers);

    const processedShipments = [];
    let successCount = 0;
    let failCount = 0;

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((cell: string) => cell.trim().replace(/"/g, ''));
      
      try {
        console.log(`Processing row ${i}:`, row);

        const shipmentData: ParsedShipmentData = {
          to_name: row[headers.indexOf('to_name')] || row[headers.indexOf('name')] || '',
          to_company: row[headers.indexOf('to_company')] || row[headers.indexOf('company')] || '',
          to_street1: row[headers.indexOf('to_street1')] || row[headers.indexOf('street1')] || row[headers.indexOf('address')] || '',
          to_street2: row[headers.indexOf('to_street2')] || row[headers.indexOf('street2')] || '',
          to_city: row[headers.indexOf('to_city')] || row[headers.indexOf('city')] || '',
          to_state: row[headers.indexOf('to_state')] || row[headers.indexOf('state')] || '',
          to_zip: row[headers.indexOf('to_zip')] || row[headers.indexOf('zip')] || row[headers.indexOf('postal_code')] || '',
          to_country: row[headers.indexOf('to_country')] || row[headers.indexOf('country')] || 'US',
          to_phone: row[headers.indexOf('to_phone')] || row[headers.indexOf('phone')] || '',
          to_email: row[headers.indexOf('to_email')] || row[headers.indexOf('email')] || '',
          weight: parseFloat(row[headers.indexOf('weight')]) || 1.0,
          length: parseFloat(row[headers.indexOf('length')]) || 12,
          width: parseFloat(row[headers.indexOf('width')]) || 8,
          height: parseFloat(row[headers.indexOf('height')]) || 4,
          reference: row[headers.indexOf('reference')] || '',
        };

        // Validate required fields
        if (!shipmentData.to_name || !shipmentData.to_street1 || !shipmentData.to_city || !shipmentData.to_zip) {
          throw new Error(`Missing required address fields for row ${i}`);
        }

        // Check if international
        const international = isInternational(pickupAddress.country, shipmentData.to_country);
        console.log(`Shipment ${i} is ${international ? 'international' : 'domestic'} (${pickupAddress.country} -> ${shipmentData.to_country})`);

        // Create EasyPost shipment
        const easypostShipment = await createEasyPostShipment(shipmentData, pickupAddress, international);
        console.log(`Created EasyPost shipment ${easypostShipment.id} for row ${i}`);

        // Process rates
        const rates = (easypostShipment.rates || []).map((rate: any) => ({
          id: rate.id,
          easypost_rate_id: rate.id,
          carrier: rate.carrier,
          service: rate.service,
          rate: parseFloat(rate.rate),
          formattedRate: `$${parseFloat(rate.rate).toFixed(2)}`,
          delivery_days: rate.delivery_days,
          est_delivery_days: rate.est_delivery_days,
          shipment_id: easypostShipment.id,
          carrier_account_id: rate.carrier_account_id,
          retail_rate: rate.retail_rate,
          list_rate: rate.list_rate
        }));

        const processedShipment = {
          id: `bulk_${crypto.randomUUID()}`,
          row: i,
          easypost_id: easypostShipment.id,
          recipient: shipmentData.to_name,
          customer_name: shipmentData.to_name,
          customer_address: `${shipmentData.to_street1}, ${shipmentData.to_city}, ${shipmentData.to_state} ${shipmentData.to_zip}`,
          customer_phone: shipmentData.to_phone,
          customer_email: shipmentData.to_email,
          customer_company: shipmentData.to_company,
          details: {
            from_address: pickupAddress,
            to_address: {
              name: shipmentData.to_name,
              company: shipmentData.to_company,
              street1: shipmentData.to_street1,
              street2: shipmentData.to_street2,
              city: shipmentData.to_city,
              state: shipmentData.to_state,
              zip: shipmentData.to_zip,
              country: shipmentData.to_country,
              phone: shipmentData.to_phone,
              email: shipmentData.to_email,
              is_residential: true
            },
            parcel: {
              length: shipmentData.length,
              width: shipmentData.width,
              height: shipmentData.height,
              weight: shipmentData.weight
            }
          },
          availableRates: rates,
          selectedRateId: rates.length > 0 ? rates[0].id : null,
          status: rates.length > 0 ? 'rates_fetched' : 'error',
          error: rates.length === 0 ? 'No rates available' : null,
          rate: rates.length > 0 ? rates[0].rate : 0,
          carrier: rates.length > 0 ? rates[0].carrier : null,
          service: rates.length > 0 ? rates[0].service : null,
          is_international: international,
          customs_info: international ? null : undefined // Will be set later via UI
        };

        processedShipments.push(processedShipment);
        successCount++;
        console.log(`✅ Successfully processed shipment ${i}: ${shipmentData.to_name}`);

      } catch (error) {
        console.error(`❌ Error processing row ${i}:`, error);
        
        const failedShipment = {
          id: `bulk_${crypto.randomUUID()}`,
          row: i,
          recipient: 'Error',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {},
          availableRates: [],
          rate: 0
        };

        processedShipments.push(failedShipment);
        failCount++;
      }
    }

    const totalCost = processedShipments
      .filter(s => s.status === 'rates_fetched')
      .reduce((sum, s) => sum + (s.rate || 0), 0);

    console.log(`✅ Bulk processing complete: ${successCount} successful, ${failCount} failed, total cost: $${totalCost.toFixed(2)}`);

    return new Response(JSON.stringify({
      success: true,
      total: processedShipments.length,
      successful: successCount,
      failed: failCount,
      totalCost: Number(totalCost.toFixed(2)),
      processedShipments,
      uploadStatus: 'editing',
      message: `Successfully processed ${successCount} out of ${processedShipments.length} shipments`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in process-bulk-upload function:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
