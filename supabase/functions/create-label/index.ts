
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-LABEL] ${step}${detailsStr}`);
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

    logStep("User authenticated", { userId: user.id });

    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const { shipmentId, rateId, carrier = 'easypost' } = await req.json();
    
    if (!shipmentId || !rateId) {
      return new Response(JSON.stringify({ error: 'Missing shipmentId or rateId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    logStep("Creating label", { shipmentId, rateId, carrier, userId: user.id });

    // Buy the shipment to create the label
    const easypostResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: "POST",
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ":")}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rate: { id: rateId }
      })
    });

    if (!easypostResponse.ok) {
      const errorText = await easypostResponse.text();
      logStep("EasyPost API error", { status: easypostResponse.status, error: errorText });
      return new Response(JSON.stringify({ error: 'Failed to create label', details: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const shipmentData = await easypostResponse.json();
    logStep("Label created successfully", { trackingCode: shipmentData.tracking_code });

    // Save tracking data to shipment_records table with user_id
    const trackingRecord = {
      user_id: user.id,
      shipment_id: shipmentData.id,
      tracking_code: shipmentData.tracking_code,
      carrier: shipmentData.selected_rate?.carrier || 'Unknown',
      service: shipmentData.selected_rate?.service || 'Standard',
      status: 'created',
      label_url: shipmentData.postage_label?.label_url,
      rate_id: rateId,
      charged_rate: parseFloat(shipmentData.selected_rate?.rate || '0'),
      currency: shipmentData.selected_rate?.currency || 'USD',
      delivery_days: shipmentData.selected_rate?.delivery_days,
      est_delivery_date: shipmentData.selected_rate?.delivery_date,
      from_address_json: shipmentData.from_address,
      to_address_json: shipmentData.to_address,
      parcel_json: shipmentData.parcel,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    logStep("Saving tracking record", { trackingCode: trackingRecord.tracking_code });

    const { error: dbError } = await supabaseClient
      .from('shipment_records')
      .insert(trackingRecord);

    if (dbError) {
      logStep("Database error saving tracking record", { error: dbError.message });
      // Continue anyway as we still have the label
    } else {
      logStep("Tracking record saved successfully");
    }

    return new Response(JSON.stringify({
      labelUrl: shipmentData.postage_label?.label_url,
      trackingCode: shipmentData.tracking_code,
      shipmentId: shipmentData.id
    }), {
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
