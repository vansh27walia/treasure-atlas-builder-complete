
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('Rate request received:', requestBody)

    const { fromAddress, toAddress, parcel, options = {} } = requestBody

    if (!fromAddress || !toAddress || !parcel) {
      throw new Error('Missing required fields: fromAddress, toAddress, and parcel are required')
    }

    const easypostApiKey = Deno.env.get('EASYPOST_API_KEY')
    if (!easypostApiKey) {
      throw new Error('EasyPost API key not configured')
    }

    // Ensure weight is in ounces for EasyPost (weight conversion should already be done in frontend)
    let weightInOz = parseFloat(parcel.weight) || 1;
    
    // Handle weight unit conversion if still needed
    if (parcel.weightUnit === 'lbs') {
      weightInOz = weightInOz * 16;
    } else if (parcel.weightUnit === 'kg') {
      weightInOz = weightInOz * 35.274;
    }

    // Create shipment for rates
    const shipmentData = {
      shipment: {
        from_address: {
          name: fromAddress.name || 'Sender',
          street1: fromAddress.street1,
          street2: fromAddress.street2 || '',
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country || 'US',
          phone: fromAddress.phone || '',
          company: fromAddress.company || ''
        },
        to_address: {
          name: toAddress.name || 'Recipient',
          street1: toAddress.street1,
          street2: toAddress.street2 || '',
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'US',
          phone: toAddress.phone || '',
          company: toAddress.company || ''
        },
        parcel: {
          length: parseFloat(parcel.length) || 1,
          width: parseFloat(parcel.width) || 1,
          height: parseFloat(parcel.height) || 1,
          weight: weightInOz
        },
        options: {
          ...options
        }
      }
    }

    console.log('Sending to EasyPost:', JSON.stringify(shipmentData, null, 2))

    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${easypostApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentData)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('EasyPost API error:', errorData)
      throw new Error(`EasyPost API error: ${response.status} - ${errorData}`)
    }

    const shipmentResponse = await response.json()
    console.log('EasyPost response received:', JSON.stringify(shipmentResponse, null, 2))

    if (!shipmentResponse.rates || shipmentResponse.rates.length === 0) {
      throw new Error('No shipping rates available for this shipment')
    }

    // Format rates for frontend
    let formattedRates = shipmentResponse.rates.map((rate: any) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      rate: parseFloat(rate.rate),
      currency: rate.currency,
      delivery_days: rate.delivery_days,
      delivery_date: rate.delivery_date,
      delivery_date_guaranteed: rate.delivery_date_guaranteed,
      est_delivery_days: rate.est_delivery_days,
      shipment_id: shipmentResponse.id,
      carrier_account_id: rate.carrier_account_id,
      list_rate: rate.list_rate,
      retail_rate: rate.retail_rate
    }))

    // Filter by selected carriers if specified
    if (options.carriers && Array.isArray(options.carriers) && !options.carriers.includes('all')) {
      formattedRates = formattedRates.filter((rate: any) => 
        options.carriers.some((carrier: string) => 
          rate.carrier.toLowerCase().includes(carrier.toLowerCase())
        )
      )
    }

    // Sort by price (lowest first)
    formattedRates.sort((a: any, b: any) => a.rate - b.rate)

    return new Response(
      JSON.stringify({
        success: true,
        shipment_id: shipmentResponse.id,
        rates: formattedRates,
        from_address: shipmentResponse.from_address,
        to_address: shipmentResponse.to_address,
        parcel: shipmentResponse.parcel
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Rate fetching error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        rates: []
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
