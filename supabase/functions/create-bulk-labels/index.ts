
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BULK-LABELS] ${step}${detailsStr}`);
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

    const { shipments } = await req.json();
    
    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
      return new Response(JSON.stringify({ error: 'No shipments provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    logStep("Processing bulk labels", { count: shipments.length, userId: user.id });

    const results = [];
    const trackingRecords = [];

    for (const shipment of shipments) {
      try {
        const { shipmentId, rateId } = shipment;
        
        if (!shipmentId || !rateId) {
          results.push({
            success: false,
            error: 'Missing shipmentId or rateId',
            shipment
          });
          continue;
        }

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
          logStep("EasyPost API error for shipment", { shipmentId, error: errorText });
          results.push({
            success: false,
            error: errorText,
            shipment
          });
          continue;
        }

        const shipmentData = await easypostResponse.json();
        
        results.push({
          success: true,
          labelUrl: shipmentData.postage_label?.label_url,
          trackingCode: shipmentData.tracking_code,
          shipmentId: shipmentData.id,
          shipment
        });

        // Prepare tracking record for batch insert
        trackingRecords.push({
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
        });

        logStep("Label created for shipment", { 
          shipmentId: shipmentData.id, 
          trackingCode: shipmentData.tracking_code 
        });

      } catch (error) {
        logStep("Error processing shipment", { shipment, error: error.message });
        results.push({
          success: false,
          error: error.message,
          shipment
        });
      }
    }

    // Batch insert all tracking records
    if (trackingRecords.length > 0) {
      logStep("Saving bulk tracking records", { count: trackingRecords.length });
      
      const { error: dbError } = await supabaseClient
        .from('shipment_records')
        .insert(trackingRecords);

      if (dbError) {
        logStep("Database error saving bulk tracking records", { error: dbError.message });
        // Continue anyway as we still have the labels
      } else {
        logStep("Bulk tracking records saved successfully");
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logStep("Bulk label creation completed", { 
      total: shipments.length, 
      success: successCount, 
      failed: failureCount 
    });

    return new Response(JSON.stringify({
      results,
      summary: {
        total: shipments.length,
        successful: successCount,
        failed: failureCount
      }
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
