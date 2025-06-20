
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-TRACKING-INFO] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get the user's JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
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

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      logStep("User authentication failed", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    logStep("User authenticated", { userId: user.id });

    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get shipment records from our database - ONLY for the authenticated user
    const { data: shipmentRecords, error: dbError } = await supabaseClient
      .from('shipment_records')
      .select('*')
      .eq('user_id', user.id) // Filter by user_id
      .not('tracking_code', 'is', null)
      .order('created_at', { ascending: false });

    if (dbError) {
      logStep("Database error", { error: dbError.message });
      return new Response(
        JSON.stringify({ error: `Database error: ${dbError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    logStep(`Found ${shipmentRecords?.length || 0} user-specific shipment records`);

    const trackingData = [];

    // Process each shipment record with live EasyPost data
    if (shipmentRecords && shipmentRecords.length > 0) {
      for (const record of shipmentRecords) {
        try {
          // Fetch live tracking data from EasyPost
          const easypostResponse = await fetch("https://api.easypost.com/v2/trackers", {
            method: "POST",
            headers: {
              'Authorization': `Basic ${btoa(apiKey + ":")}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tracker: {
                tracking_code: record.tracking_code
              }
            })
          });

          let trackingInfo;

          if (easypostResponse.ok) {
            const trackerData = await easypostResponse.json();
            
            // Transform EasyPost data to our format
            trackingInfo = {
              id: record.id.toString(),
              tracking_code: record.tracking_code,
              carrier: record.carrier || trackerData.carrier || 'Unknown',
              carrier_code: (record.carrier || trackerData.carrier || 'unknown').toLowerCase(),
              status: mapEasyPostStatus(trackerData.status),
              eta: trackerData.est_delivery_date || record.est_delivery_date,
              last_update: trackerData.updated_at || record.updated_at || new Date().toISOString(),
              label_url: record.label_url,
              shipment_id: record.shipment_id || trackerData.shipment_id,
              recipient: extractRecipientInfo(record),
              recipient_address: extractRecipientAddress(record),
              package_details: extractPackageDetails(record),
              estimated_delivery: trackerData.est_delivery_date ? {
                date: trackerData.est_delivery_date,
                time_range: 'By end of day'
              } : null,
              tracking_events: transformTrackingEvents(trackerData.tracking_details || [])
            };
          } else {
            // Fallback to stored data if EasyPost API fails
            logStep(`EasyPost API failed for tracking ${record.tracking_code}, using stored data`);
            trackingInfo = {
              id: record.id.toString(),
              tracking_code: record.tracking_code,
              carrier: record.carrier || 'Unknown',
              carrier_code: (record.carrier || 'unknown').toLowerCase(),
              status: record.status || 'in_transit',
              eta: record.est_delivery_date,
              last_update: record.updated_at || new Date().toISOString(),
              label_url: record.label_url,
              shipment_id: record.shipment_id,
              recipient: extractRecipientInfo(record),
              recipient_address: extractRecipientAddress(record),
              package_details: extractPackageDetails(record),
              estimated_delivery: record.est_delivery_date ? {
                date: record.est_delivery_date,
                time_range: 'By end of day'
              } : null,
              tracking_events: generateFallbackEvents(record)
            };
          }

          trackingData.push(trackingInfo);
        } catch (error) {
          logStep(`Error processing tracking for ${record.tracking_code}`, { error: error.message });
        }
      }
    }

    logStep(`Returning ${trackingData.length} user-specific tracking records`);

    return new Response(JSON.stringify(trackingData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper functions
function mapEasyPostStatus(easypostStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'pre_transit': 'created',
    'in_transit': 'in_transit',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'available_for_pickup': 'out_for_delivery',
    'return_to_sender': 'in_transit',
    'failure': 'failed',
    'cancelled': 'cancelled',
    'error': 'failed'
  };
  
  return statusMap[easypostStatus?.toLowerCase()] || 'in_transit';
}

function extractRecipientInfo(record: any): string {
  try {
    const toAddress = typeof record.to_address_json === 'string' 
      ? JSON.parse(record.to_address_json) 
      : record.to_address_json;
    return toAddress?.name || 'Unknown Recipient';
  } catch {
    return 'Unknown Recipient';
  }
}

function extractRecipientAddress(record: any): string {
  try {
    const toAddress = typeof record.to_address_json === 'string' 
      ? JSON.parse(record.to_address_json) 
      : record.to_address_json;
    if (toAddress) {
      return `${toAddress.street1 || ''}, ${toAddress.city || ''}, ${toAddress.state || ''} ${toAddress.zip || ''}`.trim();
    }
  } catch {}
  return 'Unknown Address';
}

function extractPackageDetails(record: any): any {
  try {
    const parcel = typeof record.parcel_json === 'string' 
      ? JSON.parse(record.parcel_json) 
      : record.parcel_json;
    return {
      weight: parcel?.weight ? `${parcel.weight} oz` : 'N/A',
      dimensions: parcel?.length && parcel?.width && parcel?.height 
        ? `${parcel.length} x ${parcel.width} x ${parcel.height} in`
        : 'N/A',
      service: record.service || 'Standard'
    };
  } catch {
    return {
      weight: 'N/A',
      dimensions: 'N/A',
      service: record.service || 'Standard'
    };
  }
}

function transformTrackingEvents(easypostEvents: any[]): any[] {
  if (!easypostEvents || easypostEvents.length === 0) return [];
  
  return easypostEvents.map((event, index) => ({
    id: `evt_${Date.now()}_${index}`,
    description: event.message || event.description || 'Package update',
    location: event.location || 'Unknown Location',
    timestamp: event.datetime || new Date().toISOString(),
    status: mapEasyPostStatus(event.status || 'in_transit')
  })).reverse();
}

function generateFallbackEvents(record: any): any[] {
  const now = new Date();
  const events = [];
  
  events.push({
    id: `evt_fallback_${record.id}_1`,
    description: "Shipping label created",
    location: "Origin Facility",
    timestamp: record.created_at || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    status: "created"
  });
  
  if (record.status !== 'created') {
    events.push({
      id: `evt_fallback_${record.id}_2`,
      description: "Package in transit",
      location: "Distribution Center",
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      status: record.status || "in_transit"
    });
  }
  
  return events;
}
