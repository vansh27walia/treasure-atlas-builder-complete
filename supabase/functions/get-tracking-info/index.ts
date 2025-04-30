
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // In a real application, we would fetch tracking data from the EasyPost API
    // For this demo, we'll simulate the response with realistic data
    const demoTrackingData = [
      {
        id: 'trk_1',
        tracking_code: 'EZ1000000001',
        carrier: 'USPS',
        status: 'in_transit',
        eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        last_update: new Date().toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png'
      },
      {
        id: 'trk_2',
        tracking_code: 'EZ1000000002',
        carrier: 'FedEx',
        status: 'delivered',
        eta: null,
        last_update: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png'
      },
      {
        id: 'trk_3',
        tracking_code: 'EZ1000000003',
        carrier: 'UPS',
        status: 'in_transit',
        eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        last_update: new Date().toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png'
      },
      {
        id: 'trk_4',
        tracking_code: 'EZ1000000004',
        carrier: 'USPS',
        status: 'delivered',
        eta: null,
        last_update: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png'
      },
      {
        id: 'trk_5',
        tracking_code: 'EZ1000000005',
        carrier: 'DHL',
        status: 'in_transit',
        eta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        last_update: new Date().toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png'
      }
    ];

    // Return the tracking data
    return new Response(JSON.stringify(demoTrackingData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in get-tracking-info function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
