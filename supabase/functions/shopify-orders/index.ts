
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
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's Shopify credentials
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('shopify_store_url, shopify_access_token')
      .eq('id', user.id)
      .single()

    if (!profile?.shopify_access_token || !profile?.shopify_store_url) {
      return new Response(
        JSON.stringify({ error: 'Shopify not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch orders from Shopify
    const shopifyResponse = await fetch(
      `https://${profile.shopify_store_url}/admin/api/2023-04/orders.json?status=unfulfilled&limit=200`,
      {
        headers: {
          'X-Shopify-Access-Token': profile.shopify_access_token,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!shopifyResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders from Shopify' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const shopifyData = await shopifyResponse.json()

    // Transform orders to our format
    const orders = shopifyData.orders.map((order: any) => ({
      order_id: `#${order.order_number || order.id}`,
      customer_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Guest',
      shipping_address: order.shipping_address ? 
        `${order.shipping_address.address1 || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.province || ''} ${order.shipping_address.zip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') : 
        'No address',
      total_weight: order.total_weight ? parseFloat(order.total_weight) : 0,
      line_items: order.line_items.map((item: any) => `${item.quantity}x ${item.name}`).join(', '),
      created_at: new Date(order.created_at).toLocaleDateString(),
      shopify_order_id: order.id
    }))

    return new Response(
      JSON.stringify({ orders }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Shopify orders error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
