
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { storeName } = await req.json()

    if (!storeName) {
      return new Response(
        JSON.stringify({ error: 'Store name is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user's Shopify access token from user profile
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user profile with Shopify access token
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('shopify_access_token')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.shopify_access_token) {
      return new Response(
        JSON.stringify({ error: 'Shopify not connected' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch orders from Shopify API
    const shopifyApiUrl = `https://${storeName}.myshopify.com/admin/api/2023-10/orders.json?status=open&fulfillment_status=unfulfilled`
    
    const shopifyResponse = await fetch(shopifyApiUrl, {
      headers: {
        'X-Shopify-Access-Token': profile.shopify_access_token,
        'Content-Type': 'application/json'
      }
    })

    if (!shopifyResponse.ok) {
      console.error('Shopify API error:', await shopifyResponse.text())
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders from Shopify' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const shopifyData = await shopifyResponse.json()
    
    // Transform Shopify orders to our format
    const orders = shopifyData.orders.map((order: any) => ({
      id: order.id.toString(),
      order_number: order.name,
      customer_name: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
      customer_email: order.email,
      shipping_address: order.shipping_address,
      line_items: order.line_items.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        quantity: item.quantity,
        weight: item.grams / 453.592, // Convert grams to pounds
        price: item.price
      })),
      total_weight: order.total_weight / 453.592, // Convert grams to pounds
      total_price: order.total_price,
      created_at: order.created_at,
      fulfillment_status: order.fulfillment_status || 'unfulfilled'
    }))

    console.log(`Fetched ${orders.length} orders from Shopify`)

    return new Response(
      JSON.stringify({ orders }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in get-shopify-orders function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
