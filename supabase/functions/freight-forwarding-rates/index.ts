
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    )

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
    const { origin, destination, loadDetails } = await req.json()

    console.log('Freight forwarding request:', { origin, destination, loadDetails })

    // Get Freightos API credentials from Supabase secrets
    const freightApiKey = Deno.env.get('FREIGHTOS_API_KEY')
    const freightApiSecret = Deno.env.get('FREIGHTOS_API_SECRET')

    if (!freightApiKey || !freightApiSecret) {
      console.error('Missing Freightos API credentials in Supabase secrets')
      
      return new Response(
        JSON.stringify({ 
          error: 'API credentials not configured',
          message: 'Freightos API credentials are required to get real freight rates. Please contact support to configure your API access.',
          requiresSetup: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Prepare payload for Freightos API
    const freightosPayload = {
      origin: {
        type: origin.locationType,
        country: origin.country,
        address: origin.address
      },
      destination: {
        type: destination.locationType,
        country: destination.country,
        address: destination.address
      },
      loads: loadDetails.loads.map((load: any) => {
        if (loadDetails.type === 'loose-cargo') {
          return {
            type: 'loose_cargo',
            calculate_by: load.calculateBy,
            unit_type: load.unitType,
            quantity: load.quantity,
            dimensions: load.dimensions,
            weight: load.weight,
            total_volume: load.totalVolume
          }
        } else {
          return {
            type: 'container',
            quantity: load.quantity,
            container_size: load.containerSize,
            is_overweight: load.isOverweight
          }
        }
      })
    }

    console.log('Calling Freightos API with payload:', freightosPayload)

    // Call Freightos API
    const freightosResponse = await fetch('https://api.freightos.com/forwarding/rates', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${freightApiKey}:${freightApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(freightosPayload)
    })

    if (!freightosResponse.ok) {
      const errorText = await freightosResponse.text()
      console.error('Freightos API error:', freightosResponse.status, freightosResponse.statusText, errorText)
      
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
      )
    }

    const freightosData = await freightosResponse.json()
    console.log('Freightos API response:', freightosData)

    // Transform Freightos response to our format
    const rates = freightosData.quotes?.map((quote: any) => ({
      carrier: quote.carrier_name,
      serviceType: quote.service_type,
      serviceLevel: quote.service_level,
      transitTime: quote.transit_time,
      totalCost: quote.total_cost,
      currency: quote.currency,
      notes: quote.notes
    })) || []

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
      )
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
    )

  } catch (error) {
    console.error('Error in freight forwarding function:', error)
    
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
    )
  }
})
