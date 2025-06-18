
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
    const { tracking_number } = await req.json()
    
    if (!tracking_number?.trim()) {
      throw new Error('Tracking number is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Searching for tracking number:', tracking_number)

    // Step 1: Check user's shipments table first
    const { data: userShipment, error: shipmentError } = await supabaseClient
      .from('shipments')
      .select('*')
      .eq('tracking_code', tracking_number.trim())
      .single()

    if (!shipmentError && userShipment) {
      console.log('Found in user shipments:', userShipment)
      return new Response(
        JSON.stringify({
          source: 'user_shipment',
          tracking_code: userShipment.tracking_code,
          carrier: userShipment.carrier,
          carrier_code: userShipment.carrier?.toLowerCase(),
          status: userShipment.status,
          eta: userShipment.eta,
          last_update: userShipment.updated_at,
          label_url: userShipment.label_url,
          shipment_id: userShipment.shipment_id,
          recipient: userShipment.recipient_name,
          recipient_address: userShipment.recipient_address,
          package_details: userShipment.package_details,
          estimated_delivery: userShipment.eta ? {
            date: userShipment.eta,
            time_range: 'End of day'
          } : null,
          tracking_events: userShipment.tracking_history?.events || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Check external_trackings table
    const { data: externalTracking, error: externalError } = await supabaseClient
      .from('external_trackings')
      .select('*')
      .eq('tracking_code', tracking_number.trim())
      .single()

    if (!externalError && externalTracking) {
      // Check if data is stale (older than 1 hour)
      const lastFetched = new Date(externalTracking.last_fetched)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      if (lastFetched > oneHourAgo) {
        console.log('Found fresh data in external trackings:', externalTracking)
        return new Response(
          JSON.stringify({
            source: 'external_cache',
            ...externalTracking.tracking_data,
            tracking_code: externalTracking.tracking_code,
            carrier: externalTracking.carrier,
            status: externalTracking.status,
            estimated_delivery: externalTracking.estimated_delivery,
            tracking_events: externalTracking.tracking_events
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Step 3: Fetch from EasyPost API
    const easypostApiKey = Deno.env.get('EASYPOST_API_KEY')
    if (!easypostApiKey) {
      throw new Error('EasyPost API key not configured')
    }

    console.log('Fetching from EasyPost API for:', tracking_number)

    const easypostResponse = await fetch('https://api.easypost.com/v2/trackers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${easypostApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tracker: {
          tracking_code: tracking_number.trim()
        }
      })
    })

    if (!easypostResponse.ok) {
      throw new Error(`EasyPost API error: ${easypostResponse.statusText}`)
    }

    const easypostData = await easypostResponse.json()
    console.log('EasyPost response:', easypostData)

    // Format the tracking data
    const formattedData = {
      source: 'easypost_live',
      id: easypostData.id,
      tracking_code: easypostData.tracking_code,
      carrier: easypostData.carrier,
      carrier_code: easypostData.carrier_detail?.service || easypostData.carrier,
      status: easypostData.status,
      eta: easypostData.est_delivery_date,
      last_update: easypostData.updated_at,
      label_url: null,
      shipment_id: easypostData.shipment_id,
      recipient: 'Unknown',
      recipient_address: 'Unknown',
      package_details: {
        weight: 'Unknown',
        dimensions: 'Unknown',
        service: easypostData.carrier_detail?.service || 'Standard'
      },
      estimated_delivery: easypostData.est_delivery_date ? {
        date: easypostData.est_delivery_date,
        time_range: 'End of day'
      } : null,
      tracking_events: easypostData.tracking_details?.map((detail: any) => ({
        id: detail.object + '_' + detail.datetime,
        description: detail.message || detail.status,
        location: detail.tracking_location?.city || 'Unknown',
        timestamp: detail.datetime,
        status: detail.status
      })) || []
    }

    // Save to external_trackings table for future cache
    const { error: saveError } = await supabaseClient
      .from('external_trackings')
      .upsert({
        tracking_code: tracking_number.trim(),
        carrier: easypostData.carrier,
        status: easypostData.status,
        tracking_data: formattedData,
        estimated_delivery: formattedData.estimated_delivery,
        tracking_events: formattedData.tracking_events,
        last_fetched: new Date().toISOString()
      })

    if (saveError) {
      console.error('Error saving to external_trackings:', saveError)
    }

    return new Response(
      JSON.stringify(formattedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Enhanced tracking search error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        tracking_code: null,
        status: 'error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
