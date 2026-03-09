import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_number } = await req.json();

    if (!tracking_number) {
      return new Response(JSON.stringify({ error: 'Tracking number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find shipment by tracking number
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_code', tracking_number)
      .maybeSingle();

    // Also check shipment_records
    const { data: shipmentRecord } = await supabase
      .from('shipment_records')
      .select('*')
      .eq('tracking_code', tracking_number)
      .maybeSingle();

    const record = shipment || shipmentRecord;

    if (!record) {
      return new Response(JSON.stringify({ error: 'Tracking number not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = record.user_id;

    // Get merchant branding
    const { data: merchantSettings } = await supabase
      .from('merchant_tracking_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Get tracking events
    const { data: trackingEvents } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('tracking_number', tracking_number)
      .order('event_date', { ascending: false });

    // Build response with safe public data only
    const trackingData = {
      tracking_number,
      carrier: record.carrier || 'Unknown',
      service: record.service || null,
      status: record.status || 'unknown',
      estimated_delivery: record.eta || record.est_delivery_date || null,
      created_at: record.created_at,
      recipient_name: shipment?.recipient_name || null,
      events: trackingEvents || [],
      merchant: merchantSettings ? {
        logo_url: merchantSettings.logo_url,
        brand_color: merchantSettings.brand_color,
        support_email: merchantSettings.support_email,
        custom_message: merchantSettings.custom_message,
        banner_message: merchantSettings.banner_message,
      } : null,
    };

    return new Response(JSON.stringify(trackingData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Public tracking error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
