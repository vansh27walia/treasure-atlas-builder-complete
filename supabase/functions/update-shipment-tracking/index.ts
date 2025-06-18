
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipment_id, tracking_code } = await req.json();
    
    if (!tracking_code) {
      return new Response(
        JSON.stringify({ error: 'Tracking code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const easypostApiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!easypostApiKey) {
      return new Response(
        JSON.stringify({ error: 'EasyPost API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch tracking data from EasyPost
    const easypostResponse = await fetch(`https://api.easypost.com/v2/trackers/${tracking_code}`, {
      headers: {
        'Authorization': `Bearer ${easypostApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!easypostResponse.ok) {
      throw new Error(`EasyPost API error: ${easypostResponse.status}`);
    }

    const trackerData = await easypostResponse.json();

    // Update shipment record with latest tracking data
    const { error: updateError } = await supabase
      .from('shipment_records')
      .update({
        status: trackerData.status,
        tracking_details: trackerData.tracking_details,
        est_delivery_date: trackerData.est_delivery_date,
      })
      .eq('tracking_code', tracking_code);

    if (updateError) {
      throw new Error(`Failed to update shipment: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      status: trackerData.status,
      tracking_details: trackerData.tracking_details
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error updating shipment tracking:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update tracking', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
