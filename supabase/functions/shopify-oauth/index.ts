
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Validates the HMAC signature from Shopify's redirect.
 * This ensures the request genuinely came from Shopify.
 * @param {URLSearchParams} query - The URL's query parameters.
 * @param {string} secret - Your Shopify API Secret Key.
 * @returns {Promise<boolean>} True if HMAC is valid, false otherwise.
 */
async function validateHmac(query: URLSearchParams, secret: string): Promise<boolean> {
  const hmac = query.get('hmac');
  if (!hmac) return false;
  
  // Remove hmac and signature from query for validation
  const params = new URLSearchParams(query);
  params.delete('hmac');
  params.delete('signature'); // Shopify might send 'signature' for older versions, good to remove
  
  // Sort parameters alphabetically and create message string
  const message = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    // Convert ArrayBuffer to hex string
    const hash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    
    return hash === hmac;
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

/**
 * Dynamically constructs the frontend redirect URL based on Shopify's host parameter.
 * This is crucial for embedded apps to redirect back into the Shopify admin.
 */
function getFrontendRedirectUrl(shopDomain: string, hostParam: string, path = '/import') {
  let decodedHost = '';
  try {
    // Shopify's 'host' parameter is base64 encoded
    decodedHost = atob(hostParam);
  } catch (e) {
    console.error('[SHOPIFY-OAUTH] Failed to decode host parameter:', e);
    return `https://${shopDomain}${path}`; // Simple fallback to shop domain
  }
  
  const baseFrontendAppUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || `https://app.vvapglobal.com`;
  return `${baseFrontendAppUrl}${path}?shop=${encodeURIComponent(shopDomain)}&host=${encodeURIComponent(hostParam)}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[SHOPIFY-OAUTH] Missing Supabase configuration environment variables.');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    let action = null;
    let shop = null;
    let host = null;
    let requestBody = {};

    // Attempt to parse request body if it's a POST request
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
      } catch (e) {
        console.warn('[SHOPIFY-OAUTH] Could not parse request body as JSON:', e);
      }
    }

    // Determine the action based on URL parameters
    // Priority: code (callback) > action param > shop param only (start flow from Shopify)
    if (url.searchParams.get('code')) {
      action = 'callback';
    } else if (url.searchParams.get('action') || (requestBody as any).action) {
      action = url.searchParams.get('action') || (requestBody as any).action;
    } else if (url.searchParams.get('shop') && req.method === 'GET') {
      // This is the Shopify install flow - shop param without code means start OAuth
      action = 'start';
    }

    // Determine the shop domain and host
    shop = url.searchParams.get('shop');
    host = url.searchParams.get('host');
    if (!shop && (requestBody as any).shop) {
      shop = (requestBody as any).shop;
    }
    if (!host && (requestBody as any).host) {
      host = (requestBody as any).host;
    }

    console.log(`[SHOPIFY-OAUTH] Processing Action: ${action}, Shop: ${shop}, Host: ${host}`);

    // Handle 'start' action - Direct Shopify install flow
    // Supports TWO cases:
    // 1. Shop is known (from Shopify App Store or install link) - redirect to shop-specific OAuth
    // 2. Shop is UNKNOWN (user clicks Connect button) - redirect to centralized admin.shopify.com
    if (action === 'start') {
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY');
      if (!shopifyApiKey) {
        console.error('[SHOPIFY-OAUTH] Shopify API key environment variable not configured.');
        return new Response('Server configuration error', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      const scopes = 'read_orders,read_products,read_customers';
      const redirectUri = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-oauth`;
      
      // Generate state for CSRF protection
      const state = `pending_${crypto.randomUUID()}`;
      
      let authUrl: string;
      let shopDomain = 'unknown'; // Placeholder for centralized flow

      if (shop) {
        // Case 1: Shop is known - use shop-specific OAuth URL
        shopDomain = shop.trim().toLowerCase();
        if (!shopDomain.includes('.myshopify.com')) {
          shopDomain = `${shopDomain}.myshopify.com`;
        }

        if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
          console.error('[SHOPIFY-OAUTH] Invalid shop domain format:', shopDomain);
          return new Response('Invalid shop domain format', {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }

        authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
          `client_id=${shopifyApiKey}&` +
          `scope=${scopes}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${state}`;
        
        console.log(`[SHOPIFY-OAUTH] Redirecting to shop-specific OAuth: ${authUrl}`);
      } else {
        // Case 2: Shop is UNKNOWN - use centralized admin.shopify.com
        // Shopify will prompt user to log in and select their store
        authUrl = `https://admin.shopify.com/admin/oauth/authorize?` +
          `client_id=${shopifyApiKey}&` +
          `scope=${scopes}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${state}`;
        
        console.log(`[SHOPIFY-OAUTH] Redirecting to centralized Shopify OAuth: ${authUrl}`);
      }

      // Store state in database
      const { error: stateError } = await supabaseClient
        .from('oauth_states')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder, will be updated during callback
          state_value: state,
          shop_domain: shopDomain,
          platform: 'shopify'
        });

      if (stateError) {
        console.error('[SHOPIFY-OAUTH] Error storing OAuth state in database:', stateError.message);
        return new Response('Failed to initialize OAuth', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Redirect directly to Shopify OAuth screen
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': authUrl }
      });
    }

    // Handle 'initiate' action - REQUIRES AUTHENTICATION (legacy flow for manual shop input)
    if (action === 'initiate') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        console.error('[SHOPIFY-OAUTH] No authorization header provided for initiate action.');
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError || !user) {
        console.error('[SHOPIFY-OAUTH] Invalid user authentication:', userError?.message || 'User not found.');
        return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!shop) {
        console.error('[SHOPIFY-OAUTH] No shop parameter provided for initiate action.');
        return new Response(JSON.stringify({ error: 'Shop parameter is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate and format shop domain
      let shopDomain = shop.trim().toLowerCase();
      if (!shopDomain.includes('.myshopify.com')) {
        shopDomain = `${shopDomain}.myshopify.com`;
      }

      if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
        console.error('[SHOPIFY-OAUTH] Invalid shop domain format:', shopDomain);
        return new Response(JSON.stringify({ error: 'Invalid shop domain format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[SHOPIFY-OAUTH] Preparing OAuth for shop: ${shopDomain} for user: ${user.id}`);

      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY');
      if (!shopifyApiKey) {
        console.error('[SHOPIFY-OAUTH] Shopify API key environment variable not configured.');
        return new Response(JSON.stringify({ error: 'Shopify API key not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate state for CSRF protection
      const state = `${user.id}_${crypto.randomUUID()}`;
      
      // Store state in database
      const { error: stateError } = await supabaseClient
        .from('oauth_states')
        .insert({
          user_id: user.id,
          state_value: state,
          shop_domain: shopDomain
        });

      if (stateError) {
        console.error('[SHOPIFY-OAUTH] Error storing OAuth state in database:', stateError.message);
        return new Response(JSON.stringify({ error: 'Failed to initialize OAuth' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const scopes = 'read_orders,read_products,read_customers';
      const redirectUri = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-oauth`;
      
      console.log(`[SHOPIFY-OAUTH] Generated Shopify Redirect URI: ${redirectUri}`);

      const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
        `client_id=${shopifyApiKey}&` +
        `scope=${scopes}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `grant_options[]=per-user`;

      console.log(`[SHOPIFY-OAUTH] Generated Shopify Auth URL: ${authUrl}`);

      return new Response(JSON.stringify({
        authUrl,
        shop: shopDomain,
        state,
        success: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'callback') {
      // CALLBACK DOES NOT REQUIRE AUTHORIZATION HEADER
      // This is a direct redirect from Shopify, not from our authenticated frontend
      
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const hmac = url.searchParams.get('hmac');

      console.log(`[SHOPIFY-OAUTH] Callback received - Code: ${!!code}, Shop: ${shop}, State: ${!!state}, HMAC: ${!!hmac}, Host: ${!!host}`);

      if (!code || !shop || !state || !hmac) {
        console.error('[SHOPIFY-OAUTH] Missing required callback parameters.');
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `https://app.vvapglobal.com/import?shop=${encodeURIComponent(shop || '')}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=missing_parameters` }
        });
      }

      // Check if this is a pending state (from 'start' flow) or user-specific state (from 'initiate' flow)
      const isPendingState = state.startsWith('pending_');
      let userId: string | null = null;

      if (isPendingState) {
        // For 'start' flow, we need to redirect user to login first if not authenticated
        // For now, we'll create a temporary connection that can be claimed later
        // or prompt the user to log in on the frontend
        console.log('[SHOPIFY-OAUTH] Processing pending state from direct install flow');
      } else {
        // Extract user ID from state for 'initiate' flow
        [userId] = state.split('_');
        if (!userId) {
          console.error('[SHOPIFY-OAUTH] Invalid state format (missing user ID).');
          const frontendUrl = host 
            ? getFrontendRedirectUrl(shop, host, '/import')
            : `https://app.vvapglobal.com/import?shop=${encodeURIComponent(shop)}`;
          return new Response(null, {
            status: 302,
            headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=invalid_state` }
          });
        }
      }

      // Verify state against stored records
      const { data: stateRecord, error: stateError } = await supabaseClient
        .from('oauth_states')
        .select('*')
        .eq('state_value', state)
        .eq('shop_domain', shop)
        .single();

      if (stateError || !stateRecord) {
        console.error('[SHOPIFY-OAUTH] State validation failed:', stateError?.message || 'No record found.');
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `https://app.vvapglobal.com/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=state_validation_failed` }
        });
      }

      // Use the user_id from the state record if available and not pending
      if (!isPendingState && stateRecord.user_id) {
        userId = stateRecord.user_id;
      }

      // Get Shopify API credentials
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY');
      const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET');

      if (!shopifyApiKey || !shopifyApiSecret) {
        console.error('[SHOPIFY-OAUTH] Shopify API credentials not configured.');
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `https://app.vvapglobal.com/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=server_configuration` }
        });
      }

      // Validate HMAC signature
      const isValidHmac = await validateHmac(url.searchParams, shopifyApiSecret);
      if (!isValidHmac) {
        console.error('[SHOPIFY-OAUTH] HMAC validation failed.');
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `https://app.vvapglobal.com/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=hmac_validation_failed` }
        });
      }

      console.log(`[SHOPIFY-OAUTH] HMAC validation successful for shop: ${shop}`);

      // Exchange code for access token
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: shopifyApiKey,
          client_secret: shopifyApiSecret,
          code: code
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[SHOPIFY-OAUTH] Token exchange failed:', tokenResponse.status, errorText);
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `https://app.vvapglobal.com/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=token_exchange_failed` }
        });
      }

      const tokenData = await tokenResponse.json();
      console.log('[SHOPIFY-OAUTH] Token exchange successful');

      // For pending states (direct install), redirect to frontend with token info
      // The frontend will then prompt for login and claim the connection
      if (isPendingState || !userId) {
        // Store token temporarily and redirect to frontend for user to log in and claim
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `https://app.vvapglobal.com/import`;
        
        // Redirect with pending connection info - frontend will handle login and claiming
        return new Response(null, {
          status: 302,
          headers: { 
            ...corsHeaders, 
            'Location': `${frontendUrl}?pending_shop=${encodeURIComponent(shop)}&connected=pending&token_scope=${encodeURIComponent(tokenData.scope || '')}`
          }
        });
      }

      // Store the Shopify connection
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
        });

      if (insertError) {
        console.error('[SHOPIFY-OAUTH] Error storing connection:', insertError.message);
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `https://app.vvapglobal.com/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=connection_save_failed` }
        });
      }

      // Clean up OAuth state
      await supabaseClient.from('oauth_states').delete().eq('state_value', state);

      console.log('[SHOPIFY-OAUTH] Connection saved successfully for user:', userId);

      // Redirect back to frontend
      const frontendUrl = host 
        ? getFrontendRedirectUrl(shop, host, '/import')
        : `https://app.vvapglobal.com/import?shop=${encodeURIComponent(shop)}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': `${frontendUrl}&connected=true` }
      });
    }

    console.error('[SHOPIFY-OAUTH] Invalid or missing action parameter:', action);
    return new Response(JSON.stringify({ error: 'Invalid action or missing parameters for redirect' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SHOPIFY-OAUTH] Unexpected internal server error:', error);
    let errorRedirectUrl = 'https://app.vvapglobal.com/import?error=server_error';
    
    try {
      const url = new URL(req.url);
      const shopFromUrl = url.searchParams.get('shop');
      const hostFromUrl = url.searchParams.get('host');
      if (shopFromUrl && hostFromUrl) {
        errorRedirectUrl = getFrontendRedirectUrl(shopFromUrl, hostFromUrl, '/import');
      }
    } catch (e) {
      console.warn('[SHOPIFY-OAUTH] Could not construct error redirect URL:', e);
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      redirect: errorRedirectUrl
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Location': errorRedirectUrl }
    });
  }
});
