
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_API_VERSION = '2024-01';
const MAX_RETRIES = 3;

interface FulfillmentRequest {
  shipment_record_id: number;
  shopify_order_id: string;
  shopify_shop: string;
  tracking_number: string;
  carrier_name: string;
  tracking_url?: string;
  notify_customer?: boolean;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || attempt === retries) return response;
      
      // Retry on 429 (rate limit) or 5xx
      if (response.status === 429 || response.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000; // exponential backoff
        console.log(`[SHOPIFY-FULFILL] Retry ${attempt}/${retries} after ${delay}ms (status ${response.status})`);
        await sleep(delay);
        continue;
      }
      return response; // non-retryable error
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[SHOPIFY-FULFILL] Retry ${attempt}/${retries} after ${delay}ms (network error)`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: FulfillmentRequest = await req.json();
    const {
      shipment_record_id,
      shopify_order_id,
      shopify_shop,
      tracking_number,
      carrier_name,
      tracking_url,
      notify_customer = true,
    } = body;

    console.log(`[SHOPIFY-FULFILL] User: ${user.id}, Order: ${shopify_order_id}, Shop: ${shopify_shop}`);

    // Validate inputs
    if (!shopify_order_id || !shopify_shop || !tracking_number) {
      return new Response(JSON.stringify({ error: 'Missing required fields: shopify_order_id, shopify_shop, tracking_number' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate fulfillment
    if (shipment_record_id) {
      const { data: existing } = await supabaseClient
        .from('shipment_records')
        .select('shopify_fulfillment_id, synced_to_shopify')
        .eq('id', shipment_record_id)
        .single();

      if (existing?.synced_to_shopify && existing?.shopify_fulfillment_id) {
        console.log(`[SHOPIFY-FULFILL] Already fulfilled: ${existing.shopify_fulfillment_id}`);
        return new Response(JSON.stringify({
          success: true,
          already_synced: true,
          fulfillment_id: existing.shopify_fulfillment_id,
          message: 'Order already fulfilled in Shopify',
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get Shopify access token using service role for reading
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: connection, error: connError } = await serviceClient
      .from('shopify_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('shop', shopify_shop)
      .single();

    if (connError || !connection) {
      console.error(`[SHOPIFY-FULFILL] No connection for shop ${shopify_shop}:`, connError?.message);
      return new Response(JSON.stringify({ error: 'Shopify store not connected', details: connError?.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = connection.access_token;
    const shopifyHeaders = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    };

    // STEP 1: Get fulfillment orders for this order
    console.log(`[SHOPIFY-FULFILL] Fetching fulfillment orders for order ${shopify_order_id}`);
    const foResponse = await fetchWithRetry(
      `https://${shopify_shop}/admin/api/${SHOPIFY_API_VERSION}/orders/${shopify_order_id}/fulfillment_orders.json`,
      { headers: shopifyHeaders }
    );

    if (!foResponse.ok) {
      const errorText = await foResponse.text();
      console.error(`[SHOPIFY-FULFILL] Failed to get fulfillment orders: ${foResponse.status} ${errorText}`);

      // Update sync status to failed
      if (shipment_record_id) {
        await supabaseClient.from('shipment_records').update({
          shopify_sync_status: 'failed',
          synced_to_shopify: false,
        }).eq('id', shipment_record_id);
      }

      return new Response(JSON.stringify({
        error: 'Failed to get fulfillment orders from Shopify',
        status: foResponse.status,
        details: errorText,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const foData = await foResponse.json();
    const fulfillmentOrders = foData.fulfillment_orders || [];

    if (fulfillmentOrders.length === 0) {
      console.error(`[SHOPIFY-FULFILL] No fulfillment orders found for order ${shopify_order_id}`);
      return new Response(JSON.stringify({ error: 'No fulfillment orders found. Order may already be fulfilled or cancelled.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter to open/in_progress fulfillment orders
    const openFOs = fulfillmentOrders.filter((fo: any) =>
      ['open', 'in_progress', 'scheduled'].includes(fo.status)
    );

    if (openFOs.length === 0) {
      console.log(`[SHOPIFY-FULFILL] All fulfillment orders already fulfilled/closed`);

      if (shipment_record_id) {
        await supabaseClient.from('shipment_records').update({
          shopify_sync_status: 'already_fulfilled',
          synced_to_shopify: true,
          shopify_sync_timestamp: new Date().toISOString(),
        }).eq('id', shipment_record_id);
      }

      return new Response(JSON.stringify({
        success: true,
        already_synced: true,
        message: 'Order is already fulfilled in Shopify',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STEP 2: Create fulfillment
    const lineItemsByFO = openFOs.map((fo: any) => ({
      fulfillment_order_id: fo.id,
    }));

    const fulfillmentPayload = {
      fulfillment: {
        message: 'Your order has been shipped.',
        notify_customer: notify_customer,
        tracking_info: {
          number: tracking_number,
          company: carrier_name,
          url: tracking_url || `https://track.easypost.com/${tracking_number}`,
        },
        line_items_by_fulfillment_order: lineItemsByFO,
      },
    };

    console.log(`[SHOPIFY-FULFILL] Creating fulfillment with payload:`, JSON.stringify(fulfillmentPayload, null, 2));

    const fulfillResponse = await fetchWithRetry(
      `https://${shopify_shop}/admin/api/${SHOPIFY_API_VERSION}/fulfillments.json`,
      {
        method: 'POST',
        headers: shopifyHeaders,
        body: JSON.stringify(fulfillmentPayload),
      }
    );

    const fulfillData = await fulfillResponse.json();

    if (!fulfillResponse.ok) {
      console.error(`[SHOPIFY-FULFILL] Fulfillment creation failed: ${fulfillResponse.status}`, fulfillData);

      if (shipment_record_id) {
        await supabaseClient.from('shipment_records').update({
          shopify_sync_status: 'failed',
          synced_to_shopify: false,
        }).eq('id', shipment_record_id);
      }

      return new Response(JSON.stringify({
        error: 'Failed to create fulfillment in Shopify',
        status: fulfillResponse.status,
        details: fulfillData,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fulfillmentId = fulfillData.fulfillment?.id;
    console.log(`[SHOPIFY-FULFILL] ✅ Fulfillment created: ${fulfillmentId}`);

    // STEP 3: Update shipment_records table
    if (shipment_record_id) {
      const { error: updateError } = await supabaseClient
        .from('shipment_records')
        .update({
          shopify_fulfillment_id: fulfillmentId?.toString(),
          synced_to_shopify: true,
          shopify_sync_status: 'fulfilled',
          shopify_sync_timestamp: new Date().toISOString(),
          status: 'fulfilled',
        })
        .eq('id', shipment_record_id);

      if (updateError) {
        console.error(`[SHOPIFY-FULFILL] shipment_records update failed:`, updateError);
      } else {
        console.log(`[SHOPIFY-FULFILL] ✅ shipment_records updated for record ${shipment_record_id}`);
      }
    }

    // STEP 4: Update shopify_orders table with fulfillment data
    const { error: orderUpdateError } = await supabaseClient
      .from('shopify_orders')
      .update({
        order_status: 'fulfilled',
        fulfillment_status: 'fulfilled',
        sync_status: 'synced',
        synced_to_shopify: true,
        tracking_number: tracking_number,
        tracking_url: tracking_url || `https://track.easypost.com/${tracking_number}`,
        carrier: carrier_name,
        shopify_fulfillment_id: fulfillmentId?.toString(),
        shipment_record_id: shipment_record_id || null,
      })
      .eq('shopify_order_id', shopify_order_id)
      .eq('user_id', user.id);

    if (orderUpdateError) {
      console.error(`[SHOPIFY-FULFILL] shopify_orders update failed:`, orderUpdateError);
    } else {
      console.log(`[SHOPIFY-FULFILL] ✅ shopify_orders updated for order ${shopify_order_id}`);
    }

    return new Response(JSON.stringify({
      success: true,
      fulfillment_id: fulfillmentId,
      message: notify_customer
        ? 'Order fulfilled and customer notified with tracking'
        : 'Order fulfilled (customer not notified)',
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SHOPIFY-FULFILL] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
