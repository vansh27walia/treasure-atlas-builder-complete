
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShipmentRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days?: number;
  delivery_date?: string;
}

interface BulkShipment {
  id: string;
  availableRates?: ShipmentRate[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipments, criteria, availableCarriers } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      throw new Error('Invalid shipments data');
    }

    const recommendations: Array<{ shipmentId: string; rateId: string; reason: string }> = [];
    let optimizedCount = 0;

    for (const shipment of shipments) {
      if (!shipment.availableRates || shipment.availableRates.length === 0) {
        continue;
      }

      let selectedRate: ShipmentRate | null = null;
      let reason = '';

      switch (criteria) {
        case 'fastest':
          // Find the rate with shortest delivery time
          selectedRate = shipment.availableRates.reduce((fastest: ShipmentRate, current: ShipmentRate) => {
            const fastestDays = fastest.delivery_days || 999;
            const currentDays = current.delivery_days || 999;
            return currentDays < fastestDays ? current : fastest;
          });
          reason = `Fastest delivery in ${selectedRate.delivery_days || 'standard'} days`;
          break;

        case 'affordable':
          // Find the cheapest rate
          selectedRate = shipment.availableRates.reduce((cheapest: ShipmentRate, current: ShipmentRate) => {
            return parseFloat(current.rate) < parseFloat(cheapest.rate) ? current : cheapest;
          });
          reason = `Most affordable option at $${selectedRate.rate}`;
          break;

        case '2day':
          // Find best 2-day delivery option
          const twoDayRates = shipment.availableRates.filter(rate => 
            rate.delivery_days === 2 || 
            rate.service.toLowerCase().includes('2day') ||
            rate.service.toLowerCase().includes('2-day')
          );
          if (twoDayRates.length > 0) {
            selectedRate = twoDayRates.reduce((best: ShipmentRate, current: ShipmentRate) => {
              return parseFloat(current.rate) < parseFloat(best.rate) ? current : best;
            });
            reason = 'Best 2-day delivery option';
          } else {
            // Fallback to fastest available
            selectedRate = shipment.availableRates.reduce((fastest: ShipmentRate, current: ShipmentRate) => {
              const fastestDays = fastest.delivery_days || 999;
              const currentDays = current.delivery_days || 999;
              return currentDays < fastestDays ? current : fastest;
            });
            reason = 'Closest to 2-day delivery available';
          }
          break;

        case '3day':
          // Find best 3-day delivery option
          const threeDayRates = shipment.availableRates.filter(rate => 
            rate.delivery_days === 3 || 
            rate.service.toLowerCase().includes('3day') ||
            rate.service.toLowerCase().includes('ground')
          );
          if (threeDayRates.length > 0) {
            selectedRate = threeDayRates.reduce((best: ShipmentRate, current: ShipmentRate) => {
              return parseFloat(current.rate) < parseFloat(best.rate) ? current : best;
            });
            reason = 'Best 3-day delivery option';
          } else {
            // Fallback to most economical
            selectedRate = shipment.availableRates.reduce((cheapest: ShipmentRate, current: ShipmentRate) => {
              return parseFloat(current.rate) < parseFloat(cheapest.rate) ? current : cheapest;
            });
            reason = 'Most economical option available';
          }
          break;

        default:
          // Default to balanced approach (best value)
          selectedRate = shipment.availableRates.reduce((best: ShipmentRate, current: ShipmentRate) => {
            const bestScore = parseFloat(best.rate) * (best.delivery_days || 5);
            const currentScore = parseFloat(current.rate) * (current.delivery_days || 5);
            return currentScore < bestScore ? current : best;
          });
          reason = 'Best value (price vs speed)';
      }

      if (selectedRate) {
        recommendations.push({
          shipmentId: shipment.id,
          rateId: selectedRate.id,
          reason: reason
        });
        optimizedCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      recommendations,
      optimizedCount,
      criteria
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI rate picker:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process AI rate selection' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
