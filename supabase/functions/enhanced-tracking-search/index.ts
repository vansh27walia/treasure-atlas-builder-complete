
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-TRACKING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tracking_number } = await req.json()
    
    if (!tracking_number?.trim()) {
      throw new Error('Tracking number is required')
    }

    logStep("Starting enhanced tracking search", { tracking_number });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current user from auth context
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    logStep("User authenticated", { user_id: user.id });

    // Step 1: Check user's shipments table first (user-specific)
    const { data: userShipment, error: shipmentError } = await supabaseClient
      .from('shipments')
      .select('*')
      .eq('tracking_code', tracking_number.trim())
      .eq('user_id', user.id)
      .single()

    if (!shipmentError && userShipment) {
      logStep("Found in user shipments", { shipment_id: userShipment.id });
      return new Response(
        JSON.stringify({
          source: 'user_shipment',
          tracking_code: userShipment.tracking_code,
          carrier: userShipment.carrier,
          carrier_code: userShipment.carrier?.toLowerCase(),
          status: userShipment.status,
          eta: userShipment.eta,
          last_update: userShipment.updated_at,
          label_url: userShipment.label_url,
          shipment_id: userShipment.shipment_id,
          recipient: userShipment.recipient_name,
          recipient_address: userShipment.recipient_address,
          package_details: userShipment.package_details,
          estimated_delivery: userShipment.eta ? {
            date: userShipment.eta,
            time_range: 'End of day'
          } : null,
          tracking_events: userShipment.tracking_history?.events || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Try EasyPost API if not found in user shipments
    const apiKey = Deno.env.get('EASYPOST_API_KEY')
    if (!apiKey) {
      throw new Error('EasyPost API key not configured')
    }

    logStep("Fetching from EasyPost API", { tracking_number });

    try {
      const easypostResponse = await fetch("https://api.easypost.com/v2/trackers", {
        method: "POST",
        headers: {
          'Authorization': `Basic ${btoa(apiKey + ":")}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tracker: {
            tracking_code: tracking_number.trim()
          }
        })
      });

      if (!easypostResponse.ok) {
        const errorText = await easypostResponse.text();
        logStep("EasyPost API error", { status: easypostResponse.status, error: errorText });
        
        // If EasyPost fails, try to save the tracking number for the user anyway
        await supabaseClient
          .from('shipments')
          .insert({
            user_id: user.id,
            tracking_code: tracking_number.trim(),
            carrier: 'Unknown',
            status: 'unknown',
            recipient_name: 'Unknown',
            recipient_address: 'Unknown',
            package_details: {
              weight: 'Unknown',
              dimensions: 'Unknown',
              service: 'Unknown'
            },
            tracking_history: {
              events: [],
              last_checked: new Date().toISOString()
            }
          });

        return new Response(
          JSON.stringify({
            source: 'manual_entry',
            tracking_code: tracking_number.trim(),
            carrier: 'Unknown',
            carrier_code: 'unknown',
            status: 'unknown',
            eta: null,
            last_update: new Date().toISOString(),
            label_url: null,
            shipment_id: '',
            recipient: 'Unknown',
            recipient_address: 'Unknown',
            package_details: {
              weight: 'Unknown',
              dimensions: 'Unknown',
              service: 'Unknown'
            },
            estimated_delivery: null,
            tracking_events: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const trackerData = await easypostResponse.json();
      logStep("EasyPost tracker created", { trackerId: trackerData.id, status: trackerData.status });

      // Save to user's shipments for future reference
      await supabaseClient
        .from('shipments')
        .insert({
          user_id: user.id,
          tracking_code: trackerData.tracking_code,
          carrier: trackerData.carrier || 'Unknown',
          status: mapEasyPostStatus(trackerData.status),
          recipient_name: extractRecipientFromDetails(trackerData.tracking_details),
          recipient_address: extractAddressFromDetails(trackerData.tracking_details),
          package_details: {
            weight: 'N/A',
            dimensions: 'N/A',
            service: trackerData.carrier || 'Standard'
          },
          tracking_history: {
            events: transformTrackingEvents(trackerData.tracking_details || []),
            last_checked: new Date().toISOString()
          },
          eta: trackerData.est_delivery_date
        });

      // Transform EasyPost response
      const transformedData = {
        source: 'easypost_api',
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (easypostError) {
      logStep("EasyPost API failed, creating manual entry", { error: easypostError.message });
      
      // If EasyPost fails, create a manual entry for the user
      await supabaseClient
        .from('shipments')
        .insert({
          user_id: user.id,
          tracking_code: tracking_number.trim(),
          carrier: 'Unknown',
          status: 'unknown',
          recipient_name: 'Unknown',
          recipient_address: 'Unknown',
          package_details: {
            weight: 'Unknown',
            dimensions: 'Unknown',
            service: 'Unknown'
          },
          tracking_history: {
            events: [],
            last_checked: new Date().toISOString()
          }
        });

      return new Response(
        JSON.stringify({
          source: 'manual_entry',
          tracking_code: tracking_number.trim(),
          carrier: 'Unknown',
          carrier_code: 'unknown',
          status: 'unknown',
          eta: null,
          last_update: new Date().toISOString(),
          label_url: null,
          shipment_id: '',
          recipient: 'Unknown',
          recipient_address: 'Unknown',
          package_details: {
            weight: 'Unknown',
            dimensions: 'Unknown',
            service: 'Unknown'
          },
          estimated_delivery: null,
          tracking_events: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
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

function extractRecipientFromDetails(trackingDetails: any[]): string {
  if (!trackingDetails || trackingDetails.length === 0) return 'Unknown Recipient';
  
  const deliveryEvent = trackingDetails.find(event => 
    event.message?.toLowerCase().includes('delivered') || 
    event.status?.toLowerCase().includes('delivered')
  );
  
  if (deliveryEvent && deliveryEvent.location) {
    return deliveryEvent.location.split(',')[0] || 'Unknown Recipient';
  }
  
  return 'Unknown Recipient';
}

function extractAddressFromDetails(trackingDetails: any[]): string {
  if (!trackingDetails || trackingDetails.length === 0) return 'Unknown Address';
  
  const recentEvent = trackingDetails[trackingDetails.length - 1];
  return recentEvent?.location || 'Unknown Address';
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
