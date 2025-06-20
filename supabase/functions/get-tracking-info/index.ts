
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current user from auth context
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    logStep("User authenticated", { user_id: user.id });

    // Get user-specific shipments only
    const { data: shipments, error: shipmentsError } = await supabaseClient
      .from('shipments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (shipmentsError) {
      logStep("Error fetching shipments", { error: shipmentsError });
      throw new Error('Failed to fetch shipments');
    }

    if (!shipments || shipments.length === 0) {
      logStep("No shipments found for user");
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep("Processing shipment records", { count: shipments.length });

    const trackingData = shipments.map(shipment => ({
      id: shipment.id,
      tracking_code: shipment.tracking_code,
      carrier: shipment.carrier || 'Unknown',
      carrier_code: shipment.carrier?.toLowerCase() || 'unknown',
      status: shipment.status || 'unknown',
      eta: shipment.eta,
      last_update: shipment.updated_at || shipment.created_at,
      label_url: shipment.label_url,
      shipment_id: shipment.shipment_id || '',
      recipient: shipment.recipient_name || 'Unknown',
      recipient_address: shipment.recipient_address || 'Unknown',
      package_details: shipment.package_details || {
        weight: 'Unknown',
        dimensions: 'Unknown',
        service: 'Unknown'
      },
      estimated_delivery: shipment.eta ? {
        date: shipment.eta,
        time_range: 'End of day'
      } : null,
      tracking_events: shipment.tracking_history?.events || []
    }));

    logStep("Returning tracking records", { count: trackingData.length });

    return new Response(JSON.stringify(trackingData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
