
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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the request body
    const { origin, destination, loadDetails } = await req.json()

    console.log('Freight forwarding request:', { origin, destination, loadDetails })

    // Get Freightos API credentials from environment
    const freightApiKey = Deno.env.get('FREIGHT_API_KEY')
    const freightApiSecret = Deno.env.get('FREIGHT_API_SECRET')

    if (!freightApiKey || !freightApiSecret) {
      console.error('Missing Freightos API credentials')
      
      // Return mock data for development/testing
      const mockRates = [
        {
          carrier: "Maersk Line",
          serviceType: "ocean",
          serviceLevel: "standard",
          transitTime: "15-20 days",
          totalCost: 2850,
          currency: "USD",
          notes: "Port-to-port service. Customs clearance not included."
        },
        {
          carrier: "CMA CGM",
          serviceType: "ocean",
          serviceLevel: "express",
          transitTime: "12-15 days",
          totalCost: 3200,
          currency: "USD",
          notes: "Expedited service with priority loading."
        },
        {
          carrier: "DHL Global Forwarding",
          serviceType: "air",
          serviceLevel: "standard",
          transitTime: "3-5 days",
          totalCost: 4500,
          currency: "USD",
          notes: "Airport-to-airport service. Door delivery available."
        },
        {
          carrier: "Kuehne + Nagel",
          serviceType: "multimodal",
          serviceLevel: "economy",
          transitTime: "18-25 days",
          totalCost: 2400,
          currency: "USD",
          notes: "Combination of ocean and land transport for cost efficiency."
        }
      ]

      return new Response(
        JSON.stringify({ rates: mockRates }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
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
      console.error('Freightos API error:', freightosResponse.status, freightosResponse.statusText)
      throw new Error(`Freightos API error: ${freightosResponse.status}`)
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

    return new Response(
      JSON.stringify({ rates }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in freight forwarding function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get freight rates',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
