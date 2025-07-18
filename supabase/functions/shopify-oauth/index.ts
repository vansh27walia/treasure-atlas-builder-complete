
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Invalid user:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'initiate') {
      // Get shop parameter from request body
      const body = await req.json().catch(() => ({}))
      const shop = body.shop || url.searchParams.get('shop')
      
      if (!shop) {
        console.error('No shop parameter provided')
        return new Response(
          JSON.stringify({ error: 'Shop parameter is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate shop format
      const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
      
      // Generate OAuth URL
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY')
      if (!shopifyApiKey) {
        console.error('Shopify API key not configured')
        return new Response(
          JSON.stringify({ error: 'Shopify API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const state = crypto.randomUUID()
      const scopes = 'read_orders,write_orders,read_products,read_fulfillments'
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth?action=callback`
      
      console.log('Generated OAuth URL for shop:', shopDomain)
      console.log('Redirect URI:', redirectUri)
      
      // Store state temporarily for validation
      const { error: insertError } = await supabaseClient
        .from('shopify_oauth_states')
        .insert({
          state,
          user_id: user.id,
          shop: shopDomain,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        })

      if (insertError) {
        console.error('Error storing OAuth state:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to initialize OAuth' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const authUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${shopifyApiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

      console.log('OAuth URL generated successfully')
      return new Response(
        JSON.stringify({ authUrl, shop: shopDomain }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'callback') {
      // Handle both URL params and POST body
      const code = url.searchParams.get('code')
      const shop = url.searchParams.get('shop')
      const state = url.searchParams.get('state')
      const hmac = url.searchParams.get('hmac')

      console.log('Callback received with:', { code: !!code, shop, state: !!state, hmac: !!hmac })

      if (!code || !shop || !state) {
        console.error('Missing required callback parameters')
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate state
      const { data: stateRecord, error: stateError } = await supabaseClient
        .from('shopify_oauth_states')
        .select('*')
        .eq('state', state)
        .single()

      if (stateError || !stateRecord || new Date(stateRecord.expires_at) < new Date()) {
        console.error('Invalid or expired state:', stateError)
        return new Response(
          JSON.stringify({ error: 'Invalid or expired state' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Exchange code for access token
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY')
      const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET')

      if (!shopifyApiKey || !shopifyApiSecret) {
        console.error('Shopify credentials not configured')
        return new Response(
          JSON.stringify({ error: 'Shopify credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Exchanging code for access token...')
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: shopifyApiKey,
          client_secret: shopifyApiSecret,
          code,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token exchange failed:', tokenResponse.status, errorText)
        return new Response(
          JSON.stringify({ error: 'Failed to exchange token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenData = await tokenResponse.json()
      console.log('Token exchange successful')

      // Store the access token securely
      const { error: upsertError } = await supabaseClient
        .from('user_profiles')
        .upsert({
          id: stateRecord.user_id,
          shopify_store_url: shop,
          shopify_access_token: tokenData.access_token,
          updated_at: new Date().toISOString()
        })

      if (upsertError) {
        console.error('Error storing access token:', upsertError)
        return new Response(
          JSON.stringify({ error: 'Failed to store access token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Clean up state record
      await supabaseClient
        .from('shopify_oauth_states')
        .delete()
        .eq('state', state)

      console.log('OAuth process completed successfully')
      
      // Redirect back to the import page with success
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '') || 'http://localhost:3000'}/import?connected=true`
        }
      })
    }

    console.error('Invalid action:', action)
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Shopify OAuth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
