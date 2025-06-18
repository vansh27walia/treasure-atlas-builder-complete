
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const webhookData = await req.json()
    console.log('Received tracking webhook:', webhookData)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract tracking information from webhook
    const trackingCode = webhookData.result?.tracking_code || webhookData.tracking_code
    const status = webhookData.result?.status || webhookData.status
    const eta = webhookData.result?.est_delivery_date || webhookData.est_delivery_date
    const trackingDetails = webhookData.result?.tracking_details || webhookData.tracking_details || []

    if (!trackingCode) {
      console.log('No tracking code in webhook data')
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // Update shipments table if this tracking code exists there
    const { data: shipment, error: shipmentError } = await supabaseClient
      .from('shipments')
      .select('*')
      .eq('tracking_code', trackingCode)
      .single()

    if (!shipmentError && shipment) {
      console.log('Updating shipment:', trackingCode)
      
      const updatedTrackingHistory = {
        ...shipment.tracking_history,
        events: trackingDetails.map((detail: any) => ({
          id: detail.object + '_' + detail.datetime,
          description: detail.message || detail.status,
          location: detail.tracking_location?.city || 'Unknown',
          timestamp: detail.datetime,
          status: detail.status
        })),
        last_webhook_update: new Date().toISOString()
      }

      const { error: updateError } = await supabaseClient
        .from('shipments')
        .update({
          status: status,
          eta: eta,
          tracking_history: updatedTrackingHistory,
          updated_at: new Date().toISOString()
        })
        .eq('tracking_code', trackingCode)

      if (updateError) {
        console.error('Error updating shipment:', updateError)
      } else {
        console.log('Successfully updated shipment:', trackingCode)
      }
    }

    // Also update external_trackings if it exists
    const { data: externalTracking, error: externalError } = await supabaseClient
      .from('external_trackings')
      .select('*')
      .eq('tracking_code', trackingCode)
      .single()

    if (!externalError && externalTracking) {
      console.log('Updating external tracking:', trackingCode)
      
      const updatedTrackingEvents = trackingDetails.map((detail: any) => ({
        id: detail.object + '_' + detail.datetime,
        description: detail.message || detail.status,
        location: detail.tracking_location?.city || 'Unknown',
        timestamp: detail.datetime,
        status: detail.status
      }))

      const { error: updateExternalError } = await supabaseClient
        .from('external_trackings')
        .update({
          status: status,
          tracking_events: updatedTrackingEvents,
          estimated_delivery: eta ? {
            date: eta,
            time_range: 'End of day'
          } : null,
          last_fetched: new Date().toISOString()
        })
        .eq('tracking_code', trackingCode)

      if (updateExternalError) {
        console.error('Error updating external tracking:', updateExternalError)
      } else {
        console.log('Successfully updated external tracking:', trackingCode)
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
