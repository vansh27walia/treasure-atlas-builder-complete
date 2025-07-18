
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// HMAC validation function
function validateHmac(query: URLSearchParams, secret: string): boolean {
  const hmac = query.get('hmac')
  if (!hmac) return false

  // Remove hmac and signature from query for validation
  const params = new URLSearchParams(query)
  params.delete('hmac')
  params.delete('signature')

  // Sort parameters and create message string
  const message = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  // Generate HMAC
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, messageData)
  ).then(signature => {
    const hash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return hash === hmac
  }).catch(() => false)
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
      // Get user authentication
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        console.error('[SHOPIFY-OAUTH] No authorization header')
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      
      if (userError || !user) {
        console.error('[SHOPIFY-OAUTH] Invalid user:', userError)
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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

      // Validate shop domain format
      if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
        console.error('[SHOPIFY-OAUTH] Invalid shop domain format:', shopDomain)
        return new Response(
          JSON.stringify({ error: 'Invalid shop domain format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[SHOPIFY-OAUTH] Processing shop: ${shopDomain} for user: ${user.id}`)

      // Get Shopify credentials
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY')
      if (!shopifyApiKey) {
        console.error('[SHOPIFY-OAUTH] Shopify API key not configured')
        return new Response(
          JSON.stringify({ error: 'Shopify API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate state for CSRF protection (include user ID for validation)
      const state = `${user.id}_${crypto.randomUUID()}`
      const scopes = 'read_orders,read_products,read_customers'
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth?action=callback`
      
      console.log(`[SHOPIFY-OAUTH] Redirect URI: ${redirectUri}`)
      
      // Build Shopify OAuth URL with proper parameters
      const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
        `client_id=${shopifyApiKey}&` +
        `scope=${scopes}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `grant_options[]=per-user`

      console.log(`[SHOPIFY-OAUTH] Generated auth URL for shop: ${shopDomain}`)
      
      return new Response(
        JSON.stringify({ 
          authUrl, 
          shop: shopDomain,
          state,
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

      console.log(`[SHOPIFY-OAUTH] Callback received - Code: ${!!code}, Shop: ${shop}, State: ${!!state}, HMAC: ${!!hmac}`)

      if (!code || !shop || !state || !hmac) {
        console.error('[SHOPIFY-OAUTH] Missing required callback parameters')
        return new Response(
          JSON.stringify({ error: 'Invalid callback parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Extract user ID from state
      const [userId] = state.split('_')
      if (!userId) {
        console.error('[SHOPIFY-OAUTH] Invalid state format')
        return new Response(
          JSON.stringify({ error: 'Invalid state parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get Shopify credentials
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY')
      const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET')

      if (!shopifyApiKey || !shopifyApiSecret) {
        console.error('[SHOPIFY-OAUTH] Shopify credentials not configured')
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate HMAC
      const isValidHmac = await validateHmac(url.searchParams, shopifyApiSecret)
      if (!isValidHmac) {
        console.error('[SHOPIFY-OAUTH] HMAC validation failed')
        return new Response(
          JSON.stringify({ error: 'Request validation failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[SHOPIFY-OAUTH] HMAC validation successful for shop: ${shop}`)

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
          JSON.stringify({ error: 'Failed to exchange authorization code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenData = await tokenResponse.json()
      console.log('[SHOPIFY-OAUTH] Token exchange successful')

      // Store the connection in the new shopify_connections table
      const { error: insertError } = await supabaseClient
        .from('shopify_connections')
        .upsert({
          user_id: userId,
          shop: shop,
          access_token: tokenData.access_token,
          scopes: tokenData.scope,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,shop'
        })

      if (insertError) {
        console.error('[SHOPIFY-OAUTH] Error storing connection:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to save connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[SHOPIFY-OAUTH] Connection saved successfully for user:', userId)
      
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
