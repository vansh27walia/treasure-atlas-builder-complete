
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
      console.error('Supabase configuration not found');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const { rates, type = 'shipping' } = await req.json();
    
    if (!rates || !Array.isArray(rates)) {
      return new Response(
        JSON.stringify({ error: 'Invalid rates data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch rate adjustment settings from database
    const { data: rateSettings, error: settingsError } = await supabase
      .from('rate_settings')
      .select('*')
      .eq('type', type)
      .single();
      
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching rate settings:', settingsError);
      // Continue with default settings if there's an error
    }
    
    // Default values if no settings are found
    const markupPercentage = rateSettings?.markup_percentage || 10; // Default 10%
    const markupFixed = rateSettings?.markup_fixed || 0; // Default $0 fixed markup
    const minimumRate = rateSettings?.minimum_rate || 0; // Default no minimum
    
    console.log(`Applying rate adjustments: ${markupPercentage}% + $${markupFixed} (min $${minimumRate})`);
    
    // Apply rate adjustments to each rate
    const adjustedRates = rates.map((rate) => {
      // Store the original rate for display purposes
      const originalRate = parseFloat(rate.rate);
      
      // Apply percentage markup
      let adjustedAmount = originalRate * (1 + markupPercentage / 100);
      
      // Apply fixed markup
      adjustedAmount += markupFixed;
      
      // Apply minimum rate if needed
      adjustedAmount = Math.max(adjustedAmount, minimumRate);
      
      // Round to 2 decimal places
      adjustedAmount = Math.round(adjustedAmount * 100) / 100;
      
      return {
        ...rate,
        original_rate: originalRate.toString(),
        rate: adjustedAmount.toString(),
        // Add flag to indicate the rate has been adjusted
        is_adjusted: true,
        adjustment: {
          percentage: markupPercentage,
          fixed: markupFixed,
          original: originalRate
        }
      };
    });
    
    return new Response(
      JSON.stringify({ rates: adjustedRates, adjustments_applied: { markupPercentage, markupFixed, minimumRate } }),
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
