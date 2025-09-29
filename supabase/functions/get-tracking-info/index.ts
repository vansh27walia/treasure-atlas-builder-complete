
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Fetching tracking info for user:', user.id);

    // Fetch from both shipment_records and tracking_records tables
    const { data: shipmentRecords, error: shipmentError } = await supabaseClient
      .from('shipment_records')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: trackingRecords, error: trackingError } = await supabaseClient
      .from('tracking_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (shipmentError) {
      console.error('Error fetching shipment records:', shipmentError);
      throw new Error(shipmentError.message);
    }

    if (trackingError) {
      console.error('Error fetching tracking records:', trackingError);
      throw new Error(trackingError.message);
    }

    // Transform shipment records to expected format
    const shipmentTrackingData = (shipmentRecords || []).map((record) => ({
      id: record.id.toString(),
      tracking_code: record.tracking_code || 'N/A',
      carrier: record.carrier || 'Unknown',
      carrier_code: record.carrier?.toLowerCase() || 'unknown',
      status: record.status || 'created',
      eta: record.est_delivery_date,
      last_update: record.updated_at || record.created_at,
      label_url: record.label_url,
      shipment_id: record.shipment_id || '',
      recipient: record.to_address_json?.name || 'Unknown Recipient',
      recipient_address: record.to_address_json ? 
        `${record.to_address_json.street1}, ${record.to_address_json.city}, ${record.to_address_json.state} ${record.to_address_json.zip}` : 
        'Unknown Address',
      package_details: {
        weight: record.parcel_json?.weight ? `${record.parcel_json.weight} oz` : 'N/A',
        dimensions: record.parcel_json ? 
          `${record.parcel_json.length}x${record.parcel_json.width}x${record.parcel_json.height} in` : 
          'N/A',
        service: record.service || 'Standard'
      },
      estimated_delivery: record.est_delivery_date ? {
        date: record.est_delivery_date,
        time_range: 'By end of day'
      } : null,
      tracking_events: record.tracking_details || []
    }));

    // Transform tracking records to expected format
    const bulkTrackingData = (trackingRecords || []).map((record) => ({
      id: record.id.toString(),
      tracking_code: record.tracking_code,
      carrier: record.carrier || 'Unknown',
      carrier_code: record.carrier?.toLowerCase() || 'unknown',
      status: record.status || 'created',
      eta: null,
      last_update: record.updated_at || record.created_at,
      label_url: record.label_url,
      shipment_id: record.shipment_id || '',
      recipient: record.recipient_name || 'Unknown Recipient',
      recipient_address: record.recipient_address || 'Unknown Address',
      package_details: {
        weight: 'N/A',
        dimensions: 'N/A',
        service: record.service || 'Standard'
      },
      estimated_delivery: null,
      tracking_events: []
    }));

    // Combine both datasets, avoiding duplicates based on tracking_code
    const combinedTrackingData = [...shipmentTrackingData];
    
    // Add bulk tracking data that doesn't already exist in shipment data
    for (const bulkRecord of bulkTrackingData) {
      const exists = shipmentTrackingData.some(shipmentRecord => 
        shipmentRecord.tracking_code === bulkRecord.tracking_code
      );
      if (!exists) {
        combinedTrackingData.push(bulkRecord);
      }
    }

    // Sort by last_update descending
    combinedTrackingData.sort((a, b) => 
      new Date(b.last_update).getTime() - new Date(a.last_update).getTime()
    );

    console.log(`Returning ${combinedTrackingData.length} tracking records for user ${user.id} (${shipmentTrackingData.length} from shipments, ${bulkTrackingData.length} from bulk)`);

    return new Response(
      JSON.stringify(combinedTrackingData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-tracking-info function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
