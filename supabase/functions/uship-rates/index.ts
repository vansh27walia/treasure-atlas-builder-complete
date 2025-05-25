
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user and their API credentials
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get user's uShip credentials
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('uship_api_key, uship_test_mode')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.uship_api_key) {
      return new Response(
        JSON.stringify({ error: 'uShip API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { shipmentData } = await req.json()

    // Determine API endpoint based on test mode
    const baseUrl = profile.uship_test_mode 
      ? 'https://api.sandbox.uship.com' 
      : 'https://api.uship.com'

    // Make the rates request to uShip API
    const ratesResponse = await fetch(`${baseUrl}/v2/shipments/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.uship_api_key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Lovable-Shipping-App/1.0'
      },
      body: JSON.stringify(shipmentData)
    })

    console.log('uShip rates response status:', ratesResponse.status)

    if (!ratesResponse.ok) {
      const errorText = await ratesResponse.text()
      console.error('uShip rates API error:', errorText)
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rates from uShip API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const ratesData = await ratesResponse.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        rates: ratesData.rates || [],
        testMode: profile.uship_test_mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in uship-rates function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
