
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[SHOPIFY-ORDERS] No authorization header')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('[SHOPIFY-ORDERS] Invalid user:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[SHOPIFY-ORDERS] Fetching orders for user: ${user.id}`)

    // Get user's Shopify connections from the new table
    const { data: connections, error: connectionsError } = await supabaseClient
      .from('shopify_connections')
      .select('shop, access_token')
      .eq('user_id', user.id)

    if (connectionsError || !connections || connections.length === 0) {
      console.error('[SHOPIFY-ORDERS] No Shopify connections found:', connectionsError)
      return new Response(
        JSON.stringify({ error: 'No Shopify stores connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[SHOPIFY-ORDERS] Found ${connections.length} connected shops for user`)

    const allOrders = []

    // Fetch orders from all connected shops
    for (const connection of connections) {
      try {
        console.log(`[SHOPIFY-ORDERS] Fetching orders from: ${connection.shop}`)

        // Fetch unfulfilled orders from Shopify
        const shopifyResponse = await fetch(
          `https://${connection.shop}/admin/api/2023-10/orders.json?fulfillment_status=unfulfilled&status=open&limit=250`,
          {
            headers: {
              'X-Shopify-Access-Token': connection.access_token,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!shopifyResponse.ok) {
          const errorText = await shopifyResponse.text()
          console.error(`[SHOPIFY-ORDERS] Failed to fetch orders from ${connection.shop}:`, shopifyResponse.status, errorText)
          continue // Skip this shop and continue with others
        }

        const shopifyData = await shopifyResponse.json()
        console.log(`[SHOPIFY-ORDERS] Retrieved ${shopifyData.orders?.length || 0} orders from ${connection.shop}`)

        // Transform orders to our format and add shop identifier
        const shopOrders = (shopifyData.orders || []).map((order: any) => {
          const customer = order.customer || {}
          const shippingAddress = order.shipping_address || {}
          
          return {
            order_id: `#${order.order_number || order.id}`,
            customer_name: customer.first_name && customer.last_name 
              ? `${customer.first_name} ${customer.last_name}`.trim()
              : customer.email || 'Guest Customer',
            shipping_address: shippingAddress.address1 
              ? `${shippingAddress.address1 || ''}, ${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.zip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
              : 'No shipping address',
            total_weight: order.total_weight ? parseFloat(order.total_weight) : 0,
            line_items: order.line_items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') || 'No items',
            created_at: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown',
            shopify_order_id: order.id?.toString() || '',
            shop: connection.shop // Add shop identifier
          }
        })

        allOrders.push(...shopOrders)
      } catch (error) {
        console.error(`[SHOPIFY-ORDERS] Error fetching orders from ${connection.shop}:`, error)
        continue // Skip this shop and continue with others
      }
    }

    console.log(`[SHOPIFY-ORDERS] Total orders retrieved: ${allOrders.length}`)

    return new Response(
      JSON.stringify({ orders: allOrders, success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[SHOPIFY-ORDERS] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
