
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_API_VERSION = '2025-01';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[SHOPIFY-ORDERS] User: ${user.id}`)

    const { data: connections, error: connectionsError } = await supabaseClient
      .from('shopify_connections')
      .select('shop, access_token, scopes')
      .eq('user_id', user.id)

    if (connectionsError || !connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Shopify stores connected', orders: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[SHOPIFY-ORDERS] ${connections.length} shop(s) connected`)

    const allOrders: any[] = []
    const errors: Array<{ shop: string; status: number; message: string }> = []

    for (const connection of connections) {
      try {
        console.log(`[SHOPIFY-ORDERS] Fetching from ${connection.shop} (scopes: ${connection.scopes || 'unknown'})`)

        const shopifyResponse = await fetch(
          `https://${connection.shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json?fulfillment_status=unfulfilled&status=open&limit=250`,
          {
            headers: {
              'X-Shopify-Access-Token': connection.access_token,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!shopifyResponse.ok) {
          const errorText = await shopifyResponse.text()
          console.error(`[SHOPIFY-ORDERS] ${connection.shop}: ${shopifyResponse.status} ${errorText}`)
          errors.push({ shop: connection.shop, status: shopifyResponse.status, message: errorText })
          // Do NOT delete the connection here — it causes a connect/disconnect loop.
          // Instead, let the frontend show a reconnect banner via the needs_reconnect flag.
          continue
        }

        const shopifyData = await shopifyResponse.json()
        console.log(`[SHOPIFY-ORDERS] ${shopifyData.orders?.length || 0} orders from ${connection.shop}`)

        const shopOrders = (shopifyData.orders || []).map((order: any) => {
          const customer = order.customer || {}
          const addr = order.shipping_address || {}
          return {
            order_id: `#${order.order_number || order.id}`,
            customer_name: customer.first_name && customer.last_name
              ? `${customer.first_name} ${customer.last_name}`.trim()
              : customer.email || 'Guest Customer',
            shipping_address: addr.address1
              ? `${addr.address1 || ''}, ${addr.city || ''}, ${addr.province || ''} ${addr.zip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
              : 'No shipping address',
            total_weight: order.total_weight ? parseFloat(order.total_weight) : 0,
            line_items: order.line_items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') || 'No items',
            created_at: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown',
            shopify_order_id: order.id?.toString() || '',
            shop: connection.shop,
          }
        })

        allOrders.push(...shopOrders)
      } catch (error) {
        console.error(`[SHOPIFY-ORDERS] Error for ${connection.shop}:`, error)
        errors.push({ shop: connection.shop, status: 500, message: String(error) })
      }
    }

    console.log(`[SHOPIFY-ORDERS] Total: ${allOrders.length} orders`)

    // If all shops failed with scope errors, tell frontend to reconnect
    if (allOrders.length === 0 && errors.length > 0) {
      const scopeError = errors.find(e => e.status === 403 && e.message.includes('merchant approval'))
      if (scopeError) {
        return new Response(
          JSON.stringify({
            error: 'Shopify access expired. Please reconnect your store.',
            needs_reconnect: true,
            orders: [],
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ orders: allOrders, success: true, errors: errors.length ? errors : undefined }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[SHOPIFY-ORDERS] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
