
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

    console.log(`[SHOPIFY-OAUTH] Action: ${action}`)

    if (action === 'initiate') {
      // Get shop parameter from request body
      const body = await req.json().catch(() => ({}))
      const shop = body.shop || url.searchParams.get('shop')
      
      if (!shop) {
        console.error('[SHOPIFY-OAUTH] No shop parameter provided')
        return new Response(
          JSON.stringify({ error: 'Shop parameter is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate and format shop domain
      let shopDomain = shop.trim().toLowerCase()
      if (!shopDomain.includes('.myshopify.com')) {
        shopDomain = `${shopDomain}.myshopify.com`
      }

      console.log(`[SHOPIFY-OAUTH] Processing shop: ${shopDomain}`)

      // Get Shopify credentials
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY')
      if (!shopifyApiKey) {
        console.error('[SHOPIFY-OAUTH] Shopify API key not configured')
        return new Response(
          JSON.stringify({ error: 'Shopify API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate state for CSRF protection
      const state = crypto.randomUUID()
      const scopes = 'read_orders,read_products,read_customers'
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth?action=callback`
      
      console.log(`[SHOPIFY-OAUTH] Redirect URI: ${redirectUri}`)
      
      // Store state temporarily for validation (expires in 10 minutes)
      const { error: insertError } = await supabaseClient
        .from('shopify_oauth_states')
        .insert({
          state,
          shop: shopDomain,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        })

      if (insertError) {
        console.error('[SHOPIFY-OAUTH] Error storing OAuth state:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to initialize OAuth' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Build Shopify OAuth URL
      const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
        `client_id=${shopifyApiKey}&` +
        `scope=${scopes}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`

      console.log(`[SHOPIFY-OAUTH] Generated auth URL for shop: ${shopDomain}`)
      
      return new Response(
        JSON.stringify({ 
          authUrl, 
          shop: shopDomain,
          success: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code')
      const shop = url.searchParams.get('shop')
      const state = url.searchParams.get('state')
      const hmac = url.searchParams.get('hmac')

      console.log(`[SHOPIFY-OAUTH] Callback received - Code: ${!!code}, Shop: ${shop}, State: ${!!state}`)

      if (!code || !shop || !state) {
        console.error('[SHOPIFY-OAUTH] Missing required callback parameters')
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate state to prevent CSRF
      const { data: stateRecord, error: stateError } = await supabaseClient
        .from('shopify_oauth_states')
        .select('*')
        .eq('state', state)
        .single()

      if (stateError || !stateRecord || new Date(stateRecord.expires_at) < new Date()) {
        console.error('[SHOPIFY-OAUTH] Invalid or expired state:', stateError)
        return new Response(
          JSON.stringify({ error: 'Invalid or expired state' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get Shopify credentials
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY')
      const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET')

      if (!shopifyApiKey || !shopifyApiSecret) {
        console.error('[SHOPIFY-OAUTH] Shopify credentials not configured')
        return new Response(
          JSON.stringify({ error: 'Shopify credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[SHOPIFY-OAUTH] Exchanging code for access token for shop: ${shop}`)

      // Exchange code for access token
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
        console.error('[SHOPIFY-OAUTH] Token exchange failed:', tokenResponse.status, errorText)
        return new Response(
          JSON.stringify({ error: 'Failed to exchange token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenData = await tokenResponse.json()
      console.log('[SHOPIFY-OAUTH] Token exchange successful')

      // Get shop info to store additional details
      const shopInfoResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': tokenData.access_token,
        },
      })

      let shopInfo = null
      if (shopInfoResponse.ok) {
        const shopData = await shopInfoResponse.json()
        shopInfo = shopData.shop
      }

      // Store the access token and shop info in user profile
      const { error: upsertError } = await supabaseClient
        .from('user_profiles')
        .upsert({
          shopify_store_url: shop,
          shopify_access_token: tokenData.access_token,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shopify_store_url'
        })

      if (upsertError) {
        console.error('[SHOPIFY-OAUTH] Error storing access token:', upsertError)
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

      console.log('[SHOPIFY-OAUTH] OAuth process completed successfully')
      
      // Redirect back to the import page with success
      const frontendUrl = Deno.env.get('SUPABASE_URL')?.replace('https://adhegezdzqlnqqnymvps.supabase.co', 'https://cdn.gpteng.co/lovable') || 'http://localhost:3000'
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${frontendUrl}/import?connected=true&shop=${encodeURIComponent(shop)}`
        }
      })
    }

    console.error('[SHOPIFY-OAUTH] Invalid action:', action)
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[SHOPIFY-OAUTH] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
