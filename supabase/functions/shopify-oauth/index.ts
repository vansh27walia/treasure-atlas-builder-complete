
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
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'initiate') {
      // Generate OAuth URL
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY')
      if (!shopifyApiKey) {
        return new Response(
          JSON.stringify({ error: 'Shopify API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const state = crypto.randomUUID()
      const scopes = 'read_orders,write_orders,read_products'
      const redirectUri = `${url.origin}/shopify-callback`
      
      // Store state temporarily for validation
      await supabaseClient
        .from('shopify_oauth_states')
        .insert({
          state,
          user_id: user.id,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        })

      const authUrl = `https://admin.shopify.com/oauth/authorize?client_id=${shopifyApiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

      return new Response(
        JSON.stringify({ authUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'callback') {
      const { code, shop, state } = await req.json()

      // Validate state
      const { data: stateRecord } = await supabaseClient
        .from('shopify_oauth_states')
        .select('*')
        .eq('state', state)
        .eq('user_id', user.id)
        .single()

      if (!stateRecord || new Date(stateRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired state' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Exchange code for access token
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY')
      const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET')

      if (!shopifyApiKey || !shopifyApiSecret) {
        return new Response(
          JSON.stringify({ error: 'Shopify credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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
        return new Response(
          JSON.stringify({ error: 'Failed to exchange token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenData = await tokenResponse.json()

      // Store the access token securely
      await supabaseClient
        .from('user_profiles')
        .upsert({
          id: user.id,
          shopify_store_url: shop,
          shopify_access_token: tokenData.access_token,
          updated_at: new Date().toISOString()
        })

      // Clean up state record
      await supabaseClient
        .from('shopify_oauth_states')
        .delete()
        .eq('state', state)

      return new Response(
        JSON.stringify({ success: true, shop }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
