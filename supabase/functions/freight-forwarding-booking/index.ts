
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
    const { rate, origin, destination, loadDetails } = await req.json()

    console.log('Freight booking request:', { rate, origin, destination, loadDetails })

    // Get Freightos API credentials from Supabase secrets
    const freightApiKey = Deno.env.get('FREIGHTOS_API_KEY')
    const freightApiSecret = Deno.env.get('FREIGHTOS_API_SECRET')

    if (!freightApiKey || !freightApiSecret) {
      console.error('Missing Freightos API credentials, cannot process booking')
      
      return new Response(
        JSON.stringify({ 
          error: 'API credentials not configured',
          message: 'Freightos API credentials are required to process freight bookings. Please contact support to configure your API access.',
          requiresSetup: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Prepare payload for Freightos booking API
    const bookingPayload = {
      rate_id: rate.id || `rate_${Date.now()}`,
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
      }),
      carrier: rate.carrier,
      service_type: rate.serviceType,
      total_cost: rate.totalCost
    }

    console.log('Calling Freightos booking API with payload:', bookingPayload)

    // Call Freightos booking API
    const freightosResponse = await fetch('https://api.freightos.com/forwarding/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${freightApiKey}:${freightApiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingPayload)
    })

    if (!freightosResponse.ok) {
      const errorText = await freightosResponse.text()
      console.error('Freightos booking API error:', freightosResponse.status, freightosResponse.statusText, errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'Booking failed',
          message: `Failed to process booking: ${freightosResponse.statusText}`,
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
    console.log('Freightos booking API response:', freightosData)
    
    const bookingResponse = {
      bookingReference: freightosData.booking_reference || `FF-${Date.now()}`,
      status: freightosData.status || 'confirmed',
      carrier: rate.carrier,
      serviceType: rate.serviceType,
      totalCost: rate.totalCost,
      currency: rate.currency || 'USD',
      transitTime: rate.transitTime,
      origin: origin,
      destination: destination,
      loadDetails: loadDetails,
      bookingDate: new Date().toISOString(),
      expectedDelivery: freightosData.expected_delivery || new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)).toISOString()
    }

    // Save booking record to database
    const { error: dbError } = await supabaseClient
      .from('freight_bookings')
      .insert({
        user_id: user.id,
        booking_reference: bookingResponse.bookingReference,
        carrier: bookingResponse.carrier,
        service_type: bookingResponse.serviceType,
        total_cost: bookingResponse.totalCost,
        currency: bookingResponse.currency,
        transit_time: bookingResponse.transitTime,
        origin_data: origin,
        destination_data: destination,
        load_details: loadDetails,
        booking_status: bookingResponse.status,
        booking_date: bookingResponse.bookingDate,
        expected_delivery: bookingResponse.expectedDelivery,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Error saving booking to database:', dbError);
      // Continue anyway as the booking was successful
    }

    return new Response(
      JSON.stringify({
        ...bookingResponse,
        message: 'Booking completed successfully',
        source: 'freightos_api'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in freight booking function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your booking.',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
