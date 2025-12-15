
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
function getFrontendRedirectUrl(shopDomain: string, hostParam: string | null, path = '/import') {
  // Use the canonical deployed app URL
  const baseFrontendAppUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';

  // Standalone app: ignore host param for redirects (host is for embedded apps)
  const safeShop = shopDomain?.trim() || '';
  const redirectUrl = `${baseFrontendAppUrl}${path}?shop=${encodeURIComponent(safeShop)}`;

  console.log(
    `[SHOPIFY-OAUTH][REDIRECT] base=${baseFrontendAppUrl} path=${path} shop=${safeShop} hostProvided=${!!hostParam} -> ${redirectUrl}`
  );

  return redirectUrl;
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
      const requestId = crypto.randomUUID();
      const startedAt = Date.now();

      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY');
      if (!shopifyApiKey) {
        console.error(`[SHOPIFY-OAUTH][${requestId}][START] Missing SHOPIFY_API_KEY env var`);
        return new Response('Server configuration error', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      // Extract user token from query param (passed from frontend)
      const userToken = url.searchParams.get('token');
      const shopParamRaw = shop;
      let actualUserId = '00000000-0000-0000-0000-000000000000';

      console.log(`[SHOPIFY-OAUTH][${requestId}][START] ===== OAUTH START =====`);
      console.log(`[SHOPIFY-OAUTH][${requestId}][START] req.method=${req.method}`);
      console.log(`[SHOPIFY-OAUTH][${requestId}][START] req.url=${req.url}`);
      console.log(`[SHOPIFY-OAUTH][${requestId}][START] shopParam=${shopParamRaw ?? 'NOT PROVIDED (centralized flow)'}`);
      console.log(`[SHOPIFY-OAUTH][${requestId}][START] tokenProvided=${!!userToken}`);

      if (userToken) {
        try {
          // Decode JWT to extract user id (more reliable than getUser in some edge cases)
          const jwtParts = userToken.split('.');
          if (jwtParts.length >= 2) {
            const payloadJson = atob(jwtParts[1].replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson);
            if (payload?.sub) {
              actualUserId = String(payload.sub);
              console.log(`[SHOPIFY-OAUTH][${requestId}][START] user_id from JWT payload.sub=${actualUserId}`);
            } else {
              console.warn(`[SHOPIFY-OAUTH][${requestId}][START] JWT payload missing sub; payload keys=${Object.keys(payload || {}).join(',')}`);
            }
          } else {
            console.warn(`[SHOPIFY-OAUTH][${requestId}][START] token is not a JWT (unexpected format)`);
          }
        } catch (e) {
          console.warn(`[SHOPIFY-OAUTH][${requestId}][START] Failed to decode JWT token (non-fatal):`, e);
        }

        // Also attempt a verified lookup (best-effort)
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabaseClient.auth.getUser(userToken);
          if (tokenUser && !tokenError) {
            actualUserId = tokenUser.id;
            console.log(`[SHOPIFY-OAUTH][${requestId}][START] Verified user via supabase.auth.getUser: ${actualUserId}`);
          } else {
            console.warn(`[SHOPIFY-OAUTH][${requestId}][START] supabase.auth.getUser failed: ${tokenError?.message || 'unknown'}`);
          }
        } catch (e) {
          console.warn(`[SHOPIFY-OAUTH][${requestId}][START] supabase.auth.getUser threw (non-fatal):`, e);
        }
      }

      // SCOPES: these are the permissions Shopify will show on the install/authorize screen.
      const scopes = 'read_orders,write_orders,read_products,read_customers';
      const redirectUri = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-oauth`;

      console.log(`[SHOPIFY-OAUTH][${requestId}][START] Requested scopes=${scopes}`);
      console.log(`[SHOPIFY-OAUTH][${requestId}][START] Redirect URI=${redirectUri}`);
      console.log(`[SHOPIFY-OAUTH][${requestId}][START] Resolved user_id=${actualUserId}`);

      // Generate state for CSRF protection
      const state = `pending_${crypto.randomUUID()}`;
      console.log(`[SHOPIFY-OAUTH][${requestId}][START] Generated state=${state}`);

      let authUrl: string;
      let shopDomain = 'pending';

      if (shop) {
        shopDomain = shop.trim().toLowerCase();
        if (!shopDomain.includes('.myshopify.com')) {
          shopDomain = `${shopDomain}.myshopify.com`;
        }

        const isValidShop = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shopDomain);
        console.log(`[SHOPIFY-OAUTH][${requestId}][START] Normalized shopDomain=${shopDomain} valid=${isValidShop}`);

        if (!isValidShop) {
          console.error(`[SHOPIFY-OAUTH][${requestId}][START] Invalid shop domain format: ${shopDomain}`);
          return new Response('Invalid shop domain format', {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
          });
        }

        authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
          `client_id=${shopifyApiKey}&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${encodeURIComponent(state)}`;

        console.log(`[SHOPIFY-OAUTH][${requestId}][START] Redirecting to shop-specific OAuth URL=${authUrl}`);
      } else {
        authUrl = `https://admin.shopify.com/admin/oauth/authorize?` +
          `client_id=${shopifyApiKey}&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${encodeURIComponent(state)}`;

        console.log(`[SHOPIFY-OAUTH][${requestId}][START] Redirecting to centralized OAuth URL=${authUrl}`);
      }

      console.log(`[SHOPIFY-OAUTH][${requestId}][START] Storing oauth_states record...`);
      const { error: stateError } = await supabaseClient
        .from('oauth_states')
        .insert({
          user_id: actualUserId,
          state_value: state,
          shop_domain: shop ? shopDomain : 'pending',
          platform: 'shopify',
        });

      if (stateError) {
        console.error(`[SHOPIFY-OAUTH][${requestId}][START] Failed to store oauth state: ${stateError.message}`);
        console.error(`[SHOPIFY-OAUTH][${requestId}][START] State insert error details: ${JSON.stringify(stateError)}`);
        return new Response('Failed to initialize OAuth', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      console.log(`[SHOPIFY-OAUTH][${requestId}][START] OAuth state stored successfully`);
      console.log(`[SHOPIFY-OAUTH][${requestId}][START] DurationMs=${Date.now() - startedAt}`);

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': authUrl },
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

      // SCOPES: Include read_orders, write_orders, read_products, read_customers
      const scopes = 'read_orders,write_orders,read_products,read_customers';
      const redirectUri = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-oauth`;
      
      console.log(`[SHOPIFY-OAUTH][INITIATE] ========== OAUTH INITIATE FLOW ==========`);
      console.log(`[SHOPIFY-OAUTH][INITIATE] Timestamp: ${new Date().toISOString()}`);
      console.log(`[SHOPIFY-OAUTH][INITIATE] Requested scopes: ${scopes}`);
      console.log(`[SHOPIFY-OAUTH][INITIATE] Redirect URI: ${redirectUri}`);
      console.log(`[SHOPIFY-OAUTH][INITIATE] Shop domain: ${shopDomain}`);
      console.log(`[SHOPIFY-OAUTH][INITIATE] User ID: ${user.id}`);
      
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
      
      console.log(`[SHOPIFY-OAUTH][CALLBACK] ========== OAUTH CALLBACK RECEIVED ==========`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Timestamp: ${new Date().toISOString()}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Full callback URL: ${req.url}`);
      
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const hmac = url.searchParams.get('hmac');
      const timestamp = url.searchParams.get('timestamp');

      console.log(`[SHOPIFY-OAUTH][CALLBACK] Parameters received:`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK]   - code: ${code ? code.substring(0, 10) + '...' : 'MISSING'}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK]   - shop: ${shop || 'MISSING'}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK]   - state: ${state || 'MISSING'}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK]   - hmac: ${hmac ? 'PROVIDED' : 'MISSING'}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK]   - timestamp: ${timestamp || 'NOT PROVIDED'}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK]   - host: ${host || 'NOT PROVIDED'}`);

      if (!code || !shop || !state || !hmac) {
        console.error('[SHOPIFY-OAUTH] Missing required callback parameters.');
        const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop || '', host, '/import')
          : `${baseFrontendUrl}/import?shop=${encodeURIComponent(shop || '')}`;
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
          const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
          const frontendUrl = host 
            ? getFrontendRedirectUrl(shop, host, '/import')
            : `${baseFrontendUrl}/import?shop=${encodeURIComponent(shop)}`;
          return new Response(null, {
            status: 302,
            headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=invalid_state` }
          });
        }
      }

      // Verify state against stored records
      // First try exact match, then try matching just by state_value (for centralized flow)
      let stateRecord = null;
      let stateError = null;
      
      // Try matching by state_value and shop_domain first
      const { data: exactMatch, error: exactError } = await supabaseClient
        .from('oauth_states')
        .select('*')
        .eq('state_value', state)
        .eq('shop_domain', shop)
        .single();
      
      if (exactMatch) {
        stateRecord = exactMatch;
      } else {
        // Try matching by state_value with 'pending' shop (centralized flow)
        const { data: pendingMatch, error: pendingError } = await supabaseClient
          .from('oauth_states')
          .select('*')
          .eq('state_value', state)
          .eq('shop_domain', 'pending')
          .single();
        
        if (pendingMatch) {
          stateRecord = pendingMatch;
          console.log('[SHOPIFY-OAUTH] Matched pending state from centralized flow');
        } else {
          stateError = exactError || pendingError;
        }
      }

      if (stateError || !stateRecord) {
        console.error('[SHOPIFY-OAUTH] State validation failed:', stateError?.message || 'No record found for state: ' + state);
        const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `${baseFrontendUrl}/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=state_validation_failed` }
        });
      }
      
      console.log(`[SHOPIFY-OAUTH] State validation successful for shop: ${shop}`);

      // Use the user_id from the state record
      // Check if it's a real user_id or the placeholder
      const placeholderUserId = '00000000-0000-0000-0000-000000000000';
      const storedUserId = stateRecord.user_id;
      const hasRealUser = storedUserId && storedUserId !== placeholderUserId;
      
      if (hasRealUser) {
        userId = storedUserId;
        console.log(`[SHOPIFY-OAUTH] Using stored user_id: ${userId}`);
      } else {
        console.log('[SHOPIFY-OAUTH] No real user_id stored, will redirect as pending');
      }

      // Get Shopify API credentials
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY');
      const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET');

      if (!shopifyApiKey || !shopifyApiSecret) {
        console.error('[SHOPIFY-OAUTH] Shopify API credentials not configured.');
        const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `${baseFrontendUrl}/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=server_configuration` }
        });
      }

      // Validate HMAC signature
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Starting HMAC validation...`);
      const isValidHmac = await validateHmac(url.searchParams, shopifyApiSecret);
      if (!isValidHmac) {
        console.error('[SHOPIFY-OAUTH][CALLBACK] ❌ HMAC validation FAILED');
        console.error('[SHOPIFY-OAUTH][CALLBACK] This could indicate a security issue or misconfigured API secret');
        const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `${baseFrontendUrl}/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=hmac_validation_failed` }
        });
      }

      console.log(`[SHOPIFY-OAUTH][CALLBACK] ✅ HMAC validation SUCCESSFUL for shop: ${shop}`);

      // Exchange code for access token
      console.log(`[SHOPIFY-OAUTH][CALLBACK] ========== TOKEN EXCHANGE ==========`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Exchanging authorization code for access token...`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Token endpoint: https://${shop}/admin/oauth/access_token`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Client ID: ${shopifyApiKey?.substring(0, 8)}...`);
      
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: shopifyApiKey,
          client_secret: shopifyApiSecret,
          code: code
        })
      });

      console.log(`[SHOPIFY-OAUTH][CALLBACK] Token response status: ${tokenResponse.status}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Token response headers: ${JSON.stringify(Object.fromEntries(tokenResponse.headers))}`);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(`[SHOPIFY-OAUTH][CALLBACK] ❌ Token exchange FAILED`);
        console.error(`[SHOPIFY-OAUTH][CALLBACK] Status: ${tokenResponse.status}`);
        console.error(`[SHOPIFY-OAUTH][CALLBACK] Error response: ${errorText}`);
        const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `${baseFrontendUrl}/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=token_exchange_failed` }
        });
      }

      const tokenData = await tokenResponse.json();
      console.log(`[SHOPIFY-OAUTH][CALLBACK] ✅ Token exchange SUCCESSFUL`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Access token received: ${tokenData.access_token ? 'YES (hidden)' : 'NO'}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Scopes granted: ${tokenData.scope || 'NOT PROVIDED'}`);

      // Only treat as pending if we don't have a real user_id
      // (This happens when someone installs directly from Shopify without being logged in)
      const isActuallyPending = !userId || userId === '00000000-0000-0000-0000-000000000000';
      
      if (isActuallyPending) {
        console.log('[SHOPIFY-OAUTH] No real user - redirecting as pending for frontend login');
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `https://app.shippingquick.io/import`;
        
        // Redirect with pending connection info - frontend will handle login and claiming
        return new Response(null, {
          status: 302,
          headers: { 
            ...corsHeaders, 
            'Location': `${frontendUrl}?pending_shop=${encodeURIComponent(shop)}&connected=pending&token_scope=${encodeURIComponent(tokenData.scope || '')}`
          }
        });
      }

      console.log(`[SHOPIFY-OAUTH][CALLBACK] ========== SAVING CONNECTION ==========`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] User ID: ${userId}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Shop: ${shop}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Scopes to save: ${tokenData.scope}`);

      // Store the Shopify connection
      const connectionData = {
        user_id: userId,
        shop: shop,
        access_token: tokenData.access_token,
        scopes: tokenData.scope,
        updated_at: new Date().toISOString()
      };
      
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Upserting connection data...`);
      
      const { error: insertError } = await supabaseClient
        .from('shopify_connections')
        .upsert(connectionData, {
          onConflict: 'user_id,shop'
        });

      if (insertError) {
        console.error(`[SHOPIFY-OAUTH][CALLBACK] ❌ Connection save FAILED`);
        console.error(`[SHOPIFY-OAUTH][CALLBACK] Error: ${insertError.message}`);
        console.error(`[SHOPIFY-OAUTH][CALLBACK] Error details: ${JSON.stringify(insertError)}`);
        const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
        const frontendUrl = host 
          ? getFrontendRedirectUrl(shop, host, '/import')
          : `${baseFrontendUrl}/import?shop=${encodeURIComponent(shop)}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': `${frontendUrl}&error=connection_save_failed` }
        });
      }

      console.log(`[SHOPIFY-OAUTH][CALLBACK] ✅ Connection saved SUCCESSFULLY`);

      // Clean up OAuth state
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Cleaning up OAuth state...`);
      const { error: deleteError } = await supabaseClient.from('oauth_states').delete().eq('state_value', state);
      if (deleteError) {
        console.warn(`[SHOPIFY-OAUTH][CALLBACK] Warning: Could not delete state: ${deleteError.message}`);
      } else {
        console.log(`[SHOPIFY-OAUTH][CALLBACK] OAuth state cleaned up`);
      }

      console.log(`[SHOPIFY-OAUTH][CALLBACK] ========== OAUTH COMPLETE ==========`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] User: ${userId}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Shop: ${shop}`);
      console.log(`[SHOPIFY-OAUTH][CALLBACK] Scopes: ${tokenData.scope}`);

      // Redirect back to frontend
      const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
      const frontendUrl = host 
        ? getFrontendRedirectUrl(shop, host, '/import')
        : `${baseFrontendUrl}/import?shop=${encodeURIComponent(shop)}`;
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
    const baseFrontendUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || 'https://app.shippingquick.io';
    let errorRedirectUrl = `${baseFrontendUrl}/import?error=server_error`;
    
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
