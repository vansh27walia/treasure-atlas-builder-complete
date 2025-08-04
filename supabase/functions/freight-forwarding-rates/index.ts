
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get the request body
    const { origin, destination, loadDetails } = await req.json();

    console.log('Freight forwarding request:', { origin, destination, loadDetails });

    // Get Freightos API credentials from Supabase secrets
    const freightApiKey = Deno.env.get('FREIGHTOS_API_KEY');

    if (!freightApiKey) {
      console.error('Missing Freightos API key in Supabase secrets');
      
      return new Response(
        JSON.stringify({ 
          error: 'API credentials not configured',
          message: 'Freightos API key is required to get freight rates.',
          requiresSetup: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Prepare payload for Freightos API based on documentation
    const freightosPayload = {
      load: loadDetails.loads.map((load: any) => ({
        quantity: load.quantity,
        unitType: load.unitType,
        unitWeightKg: load.weight,
        unitVolumeCBM: load.totalVolume,
      })),
      legs: [{
        origin: {
          unLocationCode: origin.unLocationCode,
        },
        destination: {
          unLocationCode: destination.unLocationCode,
        },
      }],
    };

    console.log('Calling Freightos API with payload:', freightosPayload);

    // Call Freightos API
    const freightosResponse = await fetch('https://api.freightos.com/api/v1/freightEstimates', {
      method: 'POST',
      headers: {
        'x-apikey': freightApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(freightosPayload)
    });

    if (!freightosResponse.ok) {
      const errorText = await freightosResponse.text();
      console.error('Freightos API error:', freightosResponse.status, freightosResponse.statusText, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get freight rates',
          message: `API request failed: ${freightosResponse.statusText}`,
          details: errorText,
          statusCode: freightosResponse.status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 502
        }
      );
    }

    const freightosData = await freightosResponse.json();
    console.log('Freightos API response:', freightosData);

    // Transform Freightos response to our format. The new API response format is different from the old one.
    const rates = Object.keys(freightosData).flatMap(mode => {
      return freightosData[mode].priceEstimates ? [{
        mode,
        minPrice: freightosData[mode].priceEstimates.min,
        maxPrice: freightosData[mode].priceEstimates.max,
        minTransitTime: freightosData[mode].transitTime.min,
        maxTransitTime: freightosData[mode].transitTime.max,
      }] : [];
    });

    if (rates.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No rates available',
          message: 'No freight rates were returned for this route. Please check your shipment details and try again.',
          rates: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        rates,
        message: `Found ${rates.length} freight rate(s)`,
        source: 'freightos_api'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in freight forwarding function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
