
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const { rates, adjustmentType, adjustmentValue, api = 'easypost' } = await req.json();
    
    if (!rates || !Array.isArray(rates)) {
      return new Response(
        JSON.stringify({ error: 'Invalid rates data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the rate adjustment settings from database
    let adjustmentSettings;
    try {
      const { data, error } = await supabase
        .from('rate_adjustment_settings')
        .select('*')
        .eq('api', api)
        .single();
        
      if (error) {
        console.log('No settings found in database, using request values');
        // If no settings found, use the values from the request
        adjustmentSettings = {
          adjustment_type: adjustmentType || 'percentage',
          adjustment_value: adjustmentValue || 0,
          api: api
        };
      } else {
        console.log('Found settings in database', data);
        adjustmentSettings = data;
      }
    } catch (error) {
      console.error('Error fetching adjustment settings:', error);
      // Default to request values if there's an error
      adjustmentSettings = {
        adjustment_type: adjustmentType || 'percentage',
        adjustment_value: adjustmentValue || 0,
        api: api
      };
    }

    // Apply the rate adjustments
    const adjustedRates = rates.map(rate => {
      const originalRate = rate.rate;
      let adjustedRate = originalRate;
      
      if (adjustmentSettings.adjustment_type === 'percentage') {
        // Apply percentage increase
        adjustedRate = originalRate * (1 + (adjustmentSettings.adjustment_value / 100));
      } else if (adjustmentSettings.adjustment_type === 'fixed') {
        // Apply fixed amount increase
        adjustedRate = originalRate + adjustmentSettings.adjustment_value;
      }
      
      return {
        ...rate,
        original_rate: originalRate,
        rate: Number(adjustedRate.toFixed(2))
      };
    });

    // Return the adjusted rates
    return new Response(
      JSON.stringify({
        rates: adjustedRates,
        adjustment: {
          type: adjustmentSettings.adjustment_type,
          value: adjustmentSettings.adjustment_value,
          api: adjustmentSettings.api
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in adjust-shipping-rates function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
