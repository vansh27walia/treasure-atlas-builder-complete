
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates the HMAC signature from Shopify's redirect.
 */
async function validateHmac(query: URLSearchParams, secret: string): Promise<boolean> {
  const hmac = query.get('hmac');
  if (!hmac) return false;

  const params = new URLSearchParams(query);
  params.delete('hmac');
  params.delete('signature');

  const message = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  try {
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hash = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return hash === hmac;
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

const BASE_FRONTEND_URL = 'https://app.shippingquick.io';
const SHOPIFY_API_VERSION = '2025-01';
// Offline access tokens persist until the app is uninstalled — no per-user approval needed
const SCOPES = 'read_orders,write_orders,read_fulfillments,write_fulfillments,read_products,write_products,read_customers';

function getFrontendRedirectUrl(shopDomain: string, hostParam: string | null, path = '/import') {
  const baseFrontendAppUrl = Deno.env.get('FRONTEND_APP_BASE_URL') || BASE_FRONTEND_URL;
  const redirectUrl = `${baseFrontendAppUrl}${path}?shop=${encodeURIComponent(shopDomain)}${hostParam ? '&host=' + encodeURIComponent(hostParam) : ''}`;
  console.log(`[SHOPIFY-OAUTH] Redirect URL: ${redirectUrl}`);
  return redirectUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    let requestBody: Record<string, unknown> = {};

    if (req.method === 'POST') {
      try { requestBody = await req.json(); } catch (_) { /* ignore */ }
    }

    // Determine action
    let action: string | null = null;
    if (url.searchParams.get('code')) {
      action = 'callback';
    } else if (url.searchParams.get('action') || (requestBody as any).action) {
      action = (url.searchParams.get('action') || (requestBody as any).action) as string;
    } else if (url.searchParams.get('shop') && req.method === 'GET') {
      action = 'start';
    }

    const shop = url.searchParams.get('shop') || (requestBody as any).shop as string | null;
    const host = url.searchParams.get('host') || (requestBody as any).host as string | null;

    console.log(`[SHOPIFY-OAUTH] Action: ${action}, Shop: ${shop}`);

    // ─────────────────────────── START ───────────────────────────
    if (action === 'start') {
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY');
      if (!shopifyApiKey) {
        return new Response('Server configuration error', { status: 500, headers: corsHeaders });
      }

      // Get user from token query param
      const userToken = url.searchParams.get('token');
      let actualUserId = '00000000-0000-0000-0000-000000000000';

      if (userToken) {
        const { data: { user: tokenUser }, error: tokenError } = await supabaseClient.auth.getUser(userToken);
        if (tokenUser && !tokenError) {
          actualUserId = tokenUser.id;
          console.log(`[SHOPIFY-OAUTH] Verified user: ${actualUserId}`);
        }
      }

      const redirectUri = `${supabaseUrl}/functions/v1/shopify-oauth`;
      const state = `pending_${crypto.randomUUID()}`;

      let authUrl: string;
      let shopDomain = 'pending';

      if (shop) {
        shopDomain = shop.trim().toLowerCase();
        if (!shopDomain.includes('.myshopify.com')) shopDomain = `${shopDomain}.myshopify.com`;
        if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
          return new Response('Invalid shop domain', { status: 400, headers: corsHeaders });
        }
        // Shop-specific OAuth — request OFFLINE access (default, no grant_options needed)
        authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
          `client_id=${shopifyApiKey}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      } else {
        // Centralized OAuth via admin.shopify.com — also offline access
        authUrl = `https://admin.shopify.com/admin/oauth/authorize?` +
          `client_id=${shopifyApiKey}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      }

      console.log(`[SHOPIFY-OAUTH] OAuth URL: ${authUrl}`);

      // Store state
      const { error: stateError } = await supabaseClient.from('oauth_states').insert({
        user_id: actualUserId,
        state_value: state,
        shop_domain: shopDomain,
        platform: 'shopify',
      });

      if (stateError) {
        console.error('[SHOPIFY-OAUTH] State store error:', stateError.message);
        return new Response('Failed to initialize OAuth', { status: 500, headers: corsHeaders });
      }

      return new Response(null, { status: 302, headers: { ...corsHeaders, Location: authUrl } });
    }

    // ─────────────────────────── CALLBACK ───────────────────────────
    if (action === 'callback') {
      console.log(`[SHOPIFY-OAUTH][CB] ========== CALLBACK ==========`);

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const hmac = url.searchParams.get('hmac');

      if (!code || !shop || !state || !hmac) {
        const redir = `${BASE_FRONTEND_URL}/import?error=missing_parameters`;
        return new Response(null, { status: 302, headers: { ...corsHeaders, Location: redir } });
      }

      // Look up state
      const { data: stateMatches, error: stateQueryError } = await supabaseClient
        .from('oauth_states')
        .select('*')
        .eq('state_value', state);

      if (stateQueryError || !stateMatches || stateMatches.length === 0) {
        console.error('[SHOPIFY-OAUTH][CB] State validation failed');
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: `${BASE_FRONTEND_URL}/import?error=state_validation_failed` },
        });
      }

      const stateRecord = stateMatches[0];
      const placeholderUserId = '00000000-0000-0000-0000-000000000000';
      let userId = stateRecord.user_id !== placeholderUserId ? stateRecord.user_id : null;

      // Validate HMAC
      const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET');
      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY');

      if (!shopifyApiKey || !shopifyApiSecret) {
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: `${BASE_FRONTEND_URL}/import?error=server_configuration` },
        });
      }

      const isValidHmac = await validateHmac(url.searchParams, shopifyApiSecret);
      if (!isValidHmac) {
        console.error('[SHOPIFY-OAUTH][CB] HMAC validation FAILED');
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: `${BASE_FRONTEND_URL}/import?error=hmac_validation_failed` },
        });
      }

      console.log(`[SHOPIFY-OAUTH][CB] HMAC valid for ${shop}`);

      // Exchange code for OFFLINE access token
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: shopifyApiKey, client_secret: shopifyApiSecret, code }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(`[SHOPIFY-OAUTH][CB] Token exchange failed: ${tokenResponse.status} ${errorText}`);
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: `${BASE_FRONTEND_URL}/import?error=token_exchange_failed` },
        });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const grantedScopes = tokenData.scope || '';

      console.log(`[SHOPIFY-OAUTH][CB] Token received. Scopes: ${grantedScopes}`);

      if (!userId) {
        // No authenticated user — redirect as pending
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: `${BASE_FRONTEND_URL}/import?pending_shop=${encodeURIComponent(shop)}&connected=pending`,
          },
        });
      }

      // Delete existing connection for this user+shop, then insert fresh
      await supabaseClient.from('shopify_connections').delete().eq('user_id', userId).eq('shop', shop);

      const { error: insertError } = await supabaseClient.from('shopify_connections').insert({
        user_id: userId,
        shop,
        access_token: accessToken,
        scopes: grantedScopes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error(`[SHOPIFY-OAUTH][CB] Save failed: ${insertError.message}`);
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: `${BASE_FRONTEND_URL}/import?error=connection_save_failed` },
        });
      }

      console.log(`[SHOPIFY-OAUTH][CB] Connection saved for ${shop}`);

      // Clean up state
      await supabaseClient.from('oauth_states').delete().eq('state_value', state);

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${BASE_FRONTEND_URL}/import?shop=${encodeURIComponent(shop)}&connected=true` },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SHOPIFY-OAUTH] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
