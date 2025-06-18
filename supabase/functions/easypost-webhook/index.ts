
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EASYPOST-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    logStep("Webhook body", { eventType: body.description, trackingCode: body.result?.tracking_code });

    // Extract tracking information from webhook
    const tracker = body.result;
    if (!tracker || !tracker.tracking_code) {
      logStep("Invalid webhook data - no tracking code");
      return new Response("Invalid webhook data", { status: 400 });
    }

    // Update tracking information in our database
    const { data: existingRecord, error: findError } = await supabaseClient
      .from('shipment_records')
      .select('*')
      .eq('tracking_code', tracker.tracking_code)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      logStep("Database error finding record", { error: findError.message });
      return new Response("Database error", { status: 500 });
    }

    if (existingRecord) {
      // Update existing record with new tracking status
      const updateData = {
        status: mapEasyPostStatus(tracker.status),
        tracking_details: tracker.tracking_details,
        est_delivery_date: tracker.est_delivery_date,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabaseClient
        .from('shipment_records')
        .update(updateData)
        .eq('tracking_code', tracker.tracking_code);

      if (updateError) {
        logStep("Database update error", { error: updateError.message });
        return new Response("Database update failed", { status: 500 });
      }

      logStep("Updated tracking record", { trackingCode: tracker.tracking_code, newStatus: updateData.status });
    } else {
      logStep("No existing record found for tracking code", { trackingCode: tracker.tracking_code });
    }

    // Here you could also broadcast the update to connected clients via Supabase realtime
    // or trigger any other real-time update mechanisms

    return new Response("Webhook processed successfully", { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed', message: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

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
