
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
      .select('id, shop, access_token, scopes')
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
          `https://${connection.shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&limit=250`,
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
          continue
        }

        const shopifyData = await shopifyResponse.json()
        console.log(`[SHOPIFY-ORDERS] ${shopifyData.orders?.length || 0} orders from ${connection.shop}`)

        const shopOrders = (shopifyData.orders || []).map((order: any) => {
          const customer = order.customer || {}
          const addr = order.shipping_address || {}
          const addressText = addr.address1
            ? `${addr.address1 || ''}, ${addr.city || ''}, ${addr.province || ''} ${addr.zip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
            : 'No shipping address';

          return {
            order_id: `#${order.order_number || order.id}`,
            order_number: `#${order.order_number || order.id}`,
            customer_name: customer.first_name && customer.last_name
              ? `${customer.first_name} ${customer.last_name}`.trim()
              : customer.email || 'Guest Customer',
            customer_email: customer.email || '',
            shipping_address: addressText,
            shipping_address_json: order.shipping_address || null,
            total_weight: order.total_weight ? parseFloat(order.total_weight) : 0,
            total_price: order.total_price ? parseFloat(order.total_price) : 0,
            financial_status: order.financial_status || 'unknown',
            fulfillment_status: order.fulfillment_status || 'unfulfilled',
            line_items: order.line_items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') || 'No items',
            created_at: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown',
            shopify_order_id: order.id?.toString() || '',
            shop: connection.shop,
            store_id: connection.id,
          }
        })

        // Upsert orders into shopify_orders table
        for (const order of shopOrders) {
          const { error: upsertError } = await supabaseClient
            .from('shopify_orders')
            .upsert({
              user_id: user.id,
              store_id: order.store_id,
              shopify_order_id: order.shopify_order_id,
              order_number: order.order_number,
              customer_name: order.customer_name,
              customer_email: order.customer_email,
              shipping_address: order.shipping_address_json,
              shipping_address_text: order.shipping_address,
              total_price: order.total_price,
              total_weight: order.total_weight,
              financial_status: order.financial_status,
              fulfillment_status: order.fulfillment_status,
              line_items: order.line_items,
              shop: order.shop,
              sync_status: 'synced',
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,shopify_order_id,shop',
              ignoreDuplicates: false,
            })

          if (upsertError) {
            console.error(`[SHOPIFY-ORDERS] Upsert failed for order ${order.shopify_order_id}:`, upsertError.message)
          }
        }

        allOrders.push(...shopOrders)
      } catch (error) {
        console.error(`[SHOPIFY-ORDERS] Error for ${connection.shop}:`, error)
        errors.push({ shop: connection.shop, status: 500, message: String(error) })
      }
    }

    console.log(`[SHOPIFY-ORDERS] Total: ${allOrders.length} orders`)

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
