
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { apiKey, testMode } = await req.json()

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Test the uShip API connection
    const baseUrl = testMode 
      ? 'https://api.sandbox.uship.com' 
      : 'https://api.uship.com'

    // Make a simple API call to test the connection
    const testResponse = await fetch(`${baseUrl}/v2/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Lovable-Shipping-App/1.0'
      }
    })

    console.log('uShip API test response status:', testResponse.status)

    if (testResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'API key is valid',
          testMode: testMode
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      const errorText = await testResponse.text()
      console.error('uShip API test failed:', errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API key validation failed',
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

  } catch (error) {
    console.error('Error testing uShip credentials:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to test API credentials',
        details: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
