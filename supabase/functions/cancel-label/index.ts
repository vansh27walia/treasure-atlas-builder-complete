import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-LABEL] ${step}${detailsStr}`);
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

    const { shipment_id } = await req.json();
    if (!shipment_id) {
      return new Response(JSON.stringify({ error: 'Missing shipment_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    logStep("Retrieving shipment", { shipment_id, userId: user.id });

    // Retrieve the shipment from EasyPost
    const shipmentResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment_id}`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!shipmentResponse.ok) {
      const errorText = await shipmentResponse.text();
      logStep("EasyPost API error retrieving shipment", { status: shipmentResponse.status, error: errorText });
      return new Response(JSON.stringify({ error: 'Failed to retrieve shipment', details: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const shipmentData = await shipmentResponse.json();
    logStep("Shipment retrieved", { 
      status: shipmentData.status, 
      refund_status: shipmentData.refund_status 
    });

    // Check if already refunded or submitted
    if (shipmentData.refund_status === 'submitted' || shipmentData.refund_status === 'refunded') {
      return new Response(JSON.stringify({ 
        error: 'Refund already requested or completed',
        refund_status: shipmentData.refund_status 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Check if shipment is in eligible status for refund
    const eligibleStatuses = ['pre_transit', 'unknown'];
    if (!eligibleStatuses.includes(shipmentData.status)) {
      return new Response(JSON.stringify({ 
        error: 'Cannot cancel label in current shipment status',
        status: shipmentData.status 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    logStep("Requesting refund from EasyPost");

    // Request refund from EasyPost
    const refundResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment_id}/refund`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!refundResponse.ok) {
      const errorText = await refundResponse.text();
      logStep("EasyPost refund API error", { status: refundResponse.status, error: errorText });
      return new Response(JSON.stringify({ error: 'Failed to request refund', details: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const refundData = await refundResponse.json();
    logStep("Refund requested successfully", { refund_status: refundData.refund_status });

    // Get shipment details before updating
    const { data: shipmentDetails, error: fetchError } = await supabaseClient
      .from('shipment_records')
      .select('*')
      .eq('shipment_id', shipment_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      logStep("Error fetching shipment details", { error: fetchError.message });
    }

    // Update the shipment record in database
    const { error: dbError } = await supabaseClient
      .from('shipment_records')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('shipment_id', shipment_id)
      .eq('user_id', user.id);

    if (dbError) {
      logStep("Database error updating shipment record", { error: dbError.message });
      // Continue anyway as we still have the refund data
    }

    return new Response(JSON.stringify({
      success: true,
      refund_status: refundData.refund_status,
      shipment_id: shipment_id,
      shipment_details: shipmentDetails,
      message: 'Label cancelled successfully. Refund will be processed within 48 hours.'
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
