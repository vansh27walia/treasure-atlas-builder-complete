
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const easypostApiKey = Deno.env.get('EASYPOST_API_KEY');
    
    if (!easypostApiKey) {
      throw new Error('EasyPost API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting tracking data sync...');

    // Get all shipment records with tracking codes
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipment_records')
      .select('id, tracking_code, shipment_id, status')
      .not('tracking_code', 'is', null)
      .neq('status', 'delivered'); // Only sync non-delivered shipments

    if (shipmentsError) {
      throw new Error(`Failed to fetch shipments: ${shipmentsError.message}`);
    }

    console.log(`Found ${shipments?.length || 0} shipments to sync`);

    const updatePromises = shipments?.map(async (shipment) => {
      try {
        // Fetch tracking data from EasyPost
        const easypostResponse = await fetch(`https://api.easypost.com/v2/trackers/${shipment.tracking_code}`, {
          headers: {
            'Authorization': `Bearer ${easypostApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!easypostResponse.ok) {
          console.log(`Failed to track ${shipment.tracking_code}: ${easypostResponse.status}`);
          return null;
        }

        const trackerData = await easypostResponse.json();
        
        // Update shipment record with latest tracking data
        const { error: updateError } = await supabase
          .from('shipment_records')
          .update({
            status: trackerData.status,
            // Store tracking details as JSON
            tracking_details: trackerData.tracking_details,
            est_delivery_date: trackerData.est_delivery_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', shipment.id);

        if (updateError) {
          console.error(`Failed to update shipment ${shipment.id}:`, updateError);
          return null;
        }

        console.log(`Updated tracking for ${shipment.tracking_code}: ${trackerData.status}`);
        return shipment.tracking_code;

      } catch (error) {
        console.error(`Error syncing ${shipment.tracking_code}:`, error);
        return null;
      }
    }) || [];

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(Boolean).length;

    console.log(`Sync completed. Successfully updated ${successCount} shipments`);

    return new Response(JSON.stringify({ 
      success: true, 
      updated_count: successCount,
      total_shipments: shipments?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in sync-tracking-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to sync tracking data', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
