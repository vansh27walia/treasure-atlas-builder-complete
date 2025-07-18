
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
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('[SHOPIFY-ORDERS] Invalid user:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[SHOPIFY-ORDERS] Fetching orders for user: ${user.id}`)

    // Get user's Shopify credentials
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('shopify_store_url, shopify_access_token')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.shopify_access_token || !profile?.shopify_store_url) {
      console.error('[SHOPIFY-ORDERS] Shopify not connected:', profileError)
      return new Response(
        JSON.stringify({ error: 'Shopify not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[SHOPIFY-ORDERS] Fetching orders from: ${profile.shopify_store_url}`)

    // Fetch unfulfilled orders from Shopify
    const shopifyResponse = await fetch(
      `https://${profile.shopify_store_url}/admin/api/2023-10/orders.json?fulfillment_status=unfulfilled&status=open&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': profile.shopify_access_token,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text()
      console.error('[SHOPIFY-ORDERS] Failed to fetch orders from Shopify:', shopifyResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders from Shopify' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const shopifyData = await shopifyResponse.json()
    console.log(`[SHOPIFY-ORDERS] Retrieved ${shopifyData.orders?.length || 0} orders from Shopify`)

    // Transform orders to our format
    const orders = (shopifyData.orders || []).map((order: any) => {
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
        shopify_order_id: order.id?.toString() || ''
      }
    })

    console.log(`[SHOPIFY-ORDERS] Transformed ${orders.length} orders successfully`)

    return new Response(
      JSON.stringify({ orders, success: true }),
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
