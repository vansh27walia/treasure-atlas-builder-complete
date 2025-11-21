import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Input validation schema
const TrackingRequestSchema = z.object({
  tracking_number: z.string()
    .min(1, 'Tracking number is required')
    .max(100, 'Tracking number too long')
    .regex(/^[A-Z0-9\-]+$/i, 'Invalid tracking number format')
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-SHIPMENT] ${step}${detailsStr}`);
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

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      logStep("User authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const body = await req.json();
    
    // Validate input
    const validationResult = TrackingRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input', 
        details: validationResult.error.errors 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    const { tracking_number } = validationResult.data;

    logStep("Creating tracker for tracking number", { tracking_number, userId: user.id });

    // Create tracker with EasyPost - let EasyPost auto-detect the carrier
    const easypostResponse = await fetch("https://api.easypost.com/v2/trackers", {
      method: "POST",
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ":")}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tracker: {
          tracking_code: tracking_number
        }
      })
    });

    if (!easypostResponse.ok) {
      const errorText = await easypostResponse.text();
      logStep("EasyPost API error", { status: easypostResponse.status, error: errorText });
      return new Response(JSON.stringify({ error: 'Failed to fetch tracking info', details: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const trackerData = await easypostResponse.json();
    logStep("EasyPost tracker created", { trackerId: trackerData.id, status: trackerData.status });

    // Save the tracking record to our database with user_id
    const trackingRecord = {
      user_id: user.id, // Associate with the authenticated user
      tracking_code: trackerData.tracking_code,
      carrier: trackerData.carrier || 'Unknown',
      status: mapEasyPostStatus(trackerData.status),
      est_delivery_date: trackerData.est_delivery_date,
      tracking_details: trackerData.tracking_details || [],
      shipment_id: trackerData.shipment_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert or update the tracking record
    const { error: dbError } = await supabaseClient
      .from('shipment_records')
      .upsert(trackingRecord, { 
        onConflict: 'tracking_code,user_id',
        ignoreDuplicates: false 
      });

    if (dbError) {
      logStep("Database error saving tracking record", { error: dbError.message });
      // Continue anyway as we still have the tracking data
    }

    // Transform EasyPost response to match our frontend expected format
    const transformedData = {
      id: trackerData.id,
      tracking_code: trackerData.tracking_code,
      carrier: trackerData.carrier || 'Unknown',
      carrier_code: trackerData.carrier?.toLowerCase() || 'unknown',
      status: mapEasyPostStatus(trackerData.status),
      eta: trackerData.est_delivery_date,
      last_update: trackerData.updated_at || new Date().toISOString(),
      label_url: null,
      shipment_id: trackerData.shipment_id,
      recipient: extractRecipientFromDetails(trackerData.tracking_details),
      recipient_address: extractAddressFromDetails(trackerData.tracking_details),
      package_details: {
        weight: 'N/A',
        dimensions: 'N/A',
        service: trackerData.carrier || 'Standard'
      },
      estimated_delivery: trackerData.est_delivery_date ? {
        date: trackerData.est_delivery_date,
        time_range: 'By end of day'
      } : null,
      tracking_events: transformTrackingEvents(trackerData.tracking_details || [])
    };

    logStep("Response transformed", { eventsCount: transformedData.tracking_events.length });

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Helper function to map EasyPost status to our frontend status
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

// Helper function to extract recipient from tracking details
function extractRecipientFromDetails(trackingDetails: any[]): string {
  if (!trackingDetails || trackingDetails.length === 0) return 'Unknown Recipient';
  
  // Look for delivery event or last event
  const deliveryEvent = trackingDetails.find(event => 
    event.message?.toLowerCase().includes('delivered') || 
    event.status?.toLowerCase().includes('delivered')
  );
  
  if (deliveryEvent && deliveryEvent.location) {
    return deliveryEvent.location.split(',')[0] || 'Unknown Recipient';
  }
  
  return 'Unknown Recipient';
}

// Helper function to extract address from tracking details
function extractAddressFromDetails(trackingDetails: any[]): string {
  if (!trackingDetails || trackingDetails.length === 0) return 'Unknown Address';
  
  // Get the most recent location or delivery location
  const recentEvent = trackingDetails[trackingDetails.length - 1];
  return recentEvent?.location || 'Unknown Address';
}

// Helper function to transform EasyPost tracking events to our format
function transformTrackingEvents(easypostEvents: any[]): any[] {
  if (!easypostEvents || easypostEvents.length === 0) return [];
  
  return easypostEvents.map((event, index) => ({
    id: `evt_${Date.now()}_${index}`,
    description: event.message || event.description || 'Package update',
    location: event.location || 'Unknown Location',
    timestamp: event.datetime || new Date().toISOString(),
    status: mapEasyPostStatus(event.status || 'in_transit')
  })).reverse(); // Reverse to show most recent first
}
