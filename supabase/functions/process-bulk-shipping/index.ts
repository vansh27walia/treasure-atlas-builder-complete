
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShipmentData {
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

interface RateData {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string | null;
  shipment_id: string;
  insurance_cost?: number;
  total_cost?: number;
}

interface ProcessedShipment {
  id: string;
  shipment_data: ShipmentData;
  rates: RateData[];
  selected_rate_id?: string;
  insurance_amount?: number;
  insurance_cost?: number;
  total_cost: number;
  status: 'pending' | 'rates_fetched' | 'ready' | 'error';
  error_message?: string;
}

// Function to fetch rates from EasyPost API
const fetchShipmentRates = async (shipmentData: ShipmentData, fromAddress: any) => {
  try {
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      throw new Error('EasyPost API key not configured');
    }

    const shipmentRequest = {
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
      throw new Error(`EasyPost API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      shipment_id: data.id,
      rates: data.rates || []
    };
  } catch (error) {
    console.error('Error fetching rates:', error);
    throw error;
  }
};

// Function to calculate insurance cost
const calculateInsuranceCost = (declaredValue: number, carrier: string): number => {
  // Standard insurance rates by carrier
  const insuranceRates: Record<string, number> = {
    'USPS': 0.0075, // 0.75% of declared value
    'UPS': 0.0085,  // 0.85% of declared value
    'FedEx': 0.009, // 0.9% of declared value
    'DHL': 0.01,    // 1% of declared value
  };

  const carrierKey = (carrier || '').toUpperCase();
  const rate = insuranceRates[carrierKey as keyof typeof insuranceRates] ?? 0.01;
  const minInsurance = 2.00; // Minimum insurance cost
  
  return Math.max(declaredValue * rate, minInsurance);
};

// Function to save processed shipments to Supabase
const saveToSupabase = async (supabase: any, userId: string, shipments: ProcessedShipment[]) => {
  try {
    const { data, error } = await supabase
      .from('bulk_shipments')
      .insert(
        shipments.map(shipment => ({
          id: shipment.id,
          user_id: userId,
          shipment_data: shipment.shipment_data,
          rates: shipment.rates,
          selected_rate_id: shipment.selected_rate_id,
          insurance_amount: shipment.insurance_amount,
          insurance_cost: shipment.insurance_cost,
          total_cost: shipment.total_cost,
          status: shipment.status,
          error_message: shipment.error_message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      );

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }

    console.log(`Successfully saved ${shipments.length} shipments to Supabase`);
    return data;
  } catch (error) {
    console.error('Error in saveToSupabase:', error);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvContent, fromAddress, insuranceOptions = {} } = await req.json();
    
    if (!csvContent || !fromAddress) {
      return new Response(
        JSON.stringify({ error: 'CSV content and from address are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get user ID from JWT token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`Processing bulk shipments for user: ${userData.user.id}`);

    // Parse CSV content
    const lines = csvContent.split('\n').filter((line: string) => line.trim() !== '');
    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
    
    const processedShipments: ProcessedShipment[] = [];
    
    // Process each shipment
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      try {
        // Create shipment data object
        const shipmentData: ShipmentData = {
          to_name: row[headers.indexOf('to_name')] || '',
          to_company: row[headers.indexOf('to_company')] || '',
          to_street1: row[headers.indexOf('to_street1')] || '',
          to_street2: row[headers.indexOf('to_street2')] || '',
          to_city: row[headers.indexOf('to_city')] || '',
          to_state: row[headers.indexOf('to_state')] || '',
          to_zip: row[headers.indexOf('to_zip')] || '',
          to_country: row[headers.indexOf('to_country')] || 'US',
          to_phone: row[headers.indexOf('to_phone')] || '',
          to_email: row[headers.indexOf('to_email')] || '',
          weight: parseFloat(row[headers.indexOf('weight')]) || 1.0,
          length: parseFloat(row[headers.indexOf('length')]) || 12,
          width: parseFloat(row[headers.indexOf('width')]) || 8,
          height: parseFloat(row[headers.indexOf('height')]) || 4,
          reference: row[headers.indexOf('reference')] || '',
        };

        // Fetch rates for this shipment
        const rateData = await fetchShipmentRates(shipmentData, fromAddress);
        
        // Process rates and add insurance calculations
        const rates: RateData[] = rateData.rates.map((rate: any) => {
          const baseRate = parseFloat(rate.rate);
          const insuranceAmount = insuranceOptions.declaredValue || 0;
          const insuranceCost = insuranceAmount > 0 ? calculateInsuranceCost(insuranceAmount, rate.carrier) : 0;
          
          return {
            id: rate.id,
            carrier: rate.carrier,
            service: rate.service,
            rate: rate.rate,
            currency: rate.currency,
            delivery_days: rate.delivery_days || 3,
            delivery_date: rate.delivery_date,
            shipment_id: rateData.shipment_id,
            insurance_cost: insuranceCost,
            total_cost: baseRate + insuranceCost,
          };
        });

        // Select cheapest rate by default
        const selectedRate = rates.sort((a, b) => a.total_cost - b.total_cost)[0];
        
        const processedShipment: ProcessedShipment = {
          id: `bulk_${crypto.randomUUID()}`,
          shipment_data: shipmentData,
          rates: rates,
          selected_rate_id: selectedRate?.id,
          insurance_amount: insuranceOptions.declaredValue || 0,
          insurance_cost: selectedRate?.insurance_cost || 0,
          total_cost: selectedRate?.total_cost || 0,
          status: 'rates_fetched',
        };

        processedShipments.push(processedShipment);
        console.log(`Processed shipment ${i}/${lines.length - 1}: ${shipmentData.to_name}`);
        
      } catch (error) {
        console.error(`Error processing shipment ${i}:`, error);
        
        const failedShipment: ProcessedShipment = {
          id: `bulk_${crypto.randomUUID()}`,
          shipment_data: {} as ShipmentData,
          rates: [],
          total_cost: 0,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        };
        
        processedShipments.push(failedShipment);
      }
    }

    // Save all processed shipments to Supabase
    await saveToSupabase(supabase, userData.user.id, processedShipments);

    const successful = processedShipments.filter(s => s.status === 'rates_fetched').length;
    const failed = processedShipments.filter(s => s.status === 'error').length;
    const totalCost = processedShipments.reduce((sum, s) => sum + s.total_cost, 0);

    console.log(`Bulk processing complete: ${successful} successful, ${failed} failed, total cost: $${totalCost}`);

    return new Response(
      JSON.stringify({
        success: true,
        total: processedShipments.length,
        successful,
        failed,
        totalCost,
        processedShipments,
        message: `Processed ${successful} shipments successfully with rates and insurance`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-bulk-shipping:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
