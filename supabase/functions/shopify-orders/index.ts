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
      .select('shop, access_token, scopes, id')
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
          continue
        }

        const shopifyData = await shopifyResponse.json()
        console.log(`[SHOPIFY-ORDERS] ${shopifyData.orders?.length || 0} orders from ${connection.shop}`)

        const shopOrders = (shopifyData.orders || []).map((order: any) => {
          const customer = order.customer || {}
          const addr = order.shipping_address || {}
          const customerName = customer.first_name && customer.last_name
            ? `${customer.first_name} ${customer.last_name}`.trim()
            : customer.email || 'Guest Customer';
          const addressText = addr.address1
            ? `${addr.address1 || ''}, ${addr.city || ''}, ${addr.province || ''} ${addr.zip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
            : 'No shipping address';

          return {
            order_id: `#${order.order_number || order.id}`,
            customer_name: customerName,
            shipping_address: addressText,
            total_weight: order.total_weight ? parseFloat(order.total_weight) : 0,
            line_items: order.line_items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') || 'No items',
            created_at: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown',
            shopify_order_id: order.id?.toString() || '',
            shop: connection.shop,
            // Extra fields for DB upsert
            _db_record: {
              shopify_order_id: order.id?.toString() || '',
              order_number: `#${order.order_number || order.id}`,
              customer_name: customerName,
              customer_email: customer.email || null,
              shipping_address_text: addressText,
              shipping_address: addr || null,
              total_weight: order.total_weight ? parseFloat(order.total_weight) : 0,
              total_price: order.total_price ? parseFloat(order.total_price) : null,
              line_items: order.line_items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') || null,
              financial_status: order.financial_status || null,
              fulfillment_status: order.fulfillment_status || 'unfulfilled',
              shop: connection.shop,
              store_id: connection.id,
              user_id: user.id,
            },
          }
        })

        allOrders.push(...shopOrders)

        // Upsert orders into shopify_orders table for persistence
        if (shopOrders.length > 0) {
          const dbRecords = shopOrders.map((o: any) => o._db_record);
          
          // Upsert in batches of 50
          for (let i = 0; i < dbRecords.length; i += 50) {
            const batch = dbRecords.slice(i, i + 50);
            const { error: upsertError } = await supabaseClient
              .from('shopify_orders')
              .upsert(batch, {
                onConflict: 'shopify_order_id,user_id',
                ignoreDuplicates: false,
              });

            if (upsertError) {
              console.error(`[SHOPIFY-ORDERS] Upsert error for batch:`, upsertError.message);
              // Try individual inserts as fallback (some may already exist without the unique constraint)
              for (const record of batch) {
                const { error: singleError } = await supabaseClient
                  .from('shopify_orders')
                  .upsert(record, { onConflict: 'shopify_order_id,user_id', ignoreDuplicates: false });
                if (singleError) {
                  // Try simple insert if upsert fails (constraint might not exist)
                  const { data: existing } = await supabaseClient
                    .from('shopify_orders')
                    .select('id')
                    .eq('shopify_order_id', record.shopify_order_id)
                    .eq('user_id', record.user_id)
                    .maybeSingle();
                  
                  if (existing) {
                    // Update existing — don't overwrite fulfillment data
                    await supabaseClient
                      .from('shopify_orders')
                      .update({
                        customer_name: record.customer_name,
                        customer_email: record.customer_email,
                        shipping_address_text: record.shipping_address_text,
                        shipping_address: record.shipping_address,
                        total_weight: record.total_weight,
                        total_price: record.total_price,
                        line_items: record.line_items,
                        financial_status: record.financial_status,
                      })
                      .eq('id', existing.id);
                  } else {
                    // Insert new
                    await supabaseClient.from('shopify_orders').insert(record);
                  }
                }
              }
            } else {
              console.log(`[SHOPIFY-ORDERS] Upserted ${batch.length} orders into DB`);
            }
          }
        }
      } catch (error) {
        console.error(`[SHOPIFY-ORDERS] Error for ${connection.shop}:`, error)
        errors.push({ shop: connection.shop, status: 500, message: String(error) })
      }
    }

    // Strip _db_record from response to keep payload clean
    const cleanOrders = allOrders.map(({ _db_record, ...rest }) => rest);

    console.log(`[SHOPIFY-ORDERS] Total: ${cleanOrders.length} orders`)

    // If all shops failed with scope errors, tell frontend to reconnect
    if (cleanOrders.length === 0 && errors.length > 0) {
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
      JSON.stringify({ orders: cleanOrders, success: true, errors: errors.length ? errors : undefined }),
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
