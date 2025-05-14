
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  delivery_days: number;
  [key: string]: any;
}

interface AdjustmentConfig {
  api: string;
  type: 'fixed' | 'percentage';
  value: number;
  minRate?: number;
  maxRate?: number;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rates, adjustmentConfigs } = await req.json()

    if (!rates || !Array.isArray(rates)) {
      return new Response(
        JSON.stringify({ error: 'Shipping rates array is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Default adjustment configs if none provided
    // Higher markup percentages as requested
    const defaultAdjustments: Record<string, AdjustmentConfig> = {
      'easypost': { api: 'easypost', type: 'percentage', value: 20, minRate: 0.5 }, // 20% markup (increased)
      'ups': { api: 'ups', type: 'fixed', value: 2.5 }, // $2.50 markup (increased)
      'fedex': { api: 'fedex', type: 'percentage', value: 25 }, // 25% markup (increased)
      'usps': { api: 'usps', type: 'fixed', value: 3.0 }, // $3.00 markup (increased)
      'default': { api: 'default', type: 'percentage', value: 15 } // 15% markup (increased)
    }

    const configs = adjustmentConfigs || defaultAdjustments

    // Apply rate adjustments
    const adjustedRates = rates.map((rate: ShippingRate) => {
      // Determine which configuration to use based on carrier or API source
      const apiSource = rate.api_source?.toLowerCase() || 
                        rate.carrier?.toLowerCase() || 
                        'default'
                        
      // Find the specific config or use the default
      let config = configs[apiSource] || configs['default']

      // Clone the rate object to avoid modifying the original
      const adjustedRate = { ...rate }

      // Calculate the adjusted rate
      if (config.type === 'fixed') {
        adjustedRate.original_rate = rate.rate  // Store the original rate
        adjustedRate.rate = rate.rate + config.value
        adjustedRate.adjustment_type = 'fixed'
        adjustedRate.adjustment_value = config.value
      } else if (config.type === 'percentage') {
        adjustedRate.original_rate = rate.rate  // Store the original rate
        adjustedRate.rate = rate.rate * (1 + (config.value / 100))
        adjustedRate.adjustment_type = 'percentage'
        adjustedRate.adjustment_value = config.value
      }

      // Apply minimum rate if configured
      if (config.minRate && adjustedRate.rate < config.minRate) {
        adjustedRate.rate = config.minRate
      }

      // Apply maximum rate if configured
      if (config.maxRate && adjustedRate.rate > config.maxRate) {
        adjustedRate.rate = config.maxRate
      }

      // Round to 2 decimal places for currency
      adjustedRate.rate = parseFloat(adjustedRate.rate.toFixed(2))

      return adjustedRate
    })

    return new Response(
      JSON.stringify({
        rates: adjustedRates,
        message: 'Rates adjusted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error adjusting shipping rates:', error)

    return new Response(
      JSON.stringify({ error: 'Failed to adjust shipping rates' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
