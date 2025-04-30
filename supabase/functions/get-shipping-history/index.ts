
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // In a real application, this would fetch actual shipping history data
    // For this demo, we'll use realistic sample data
    
    // Monthly shipping data (last 6 months)
    const monthlyData = [
      { month: 'Jan', spend: 320, count: 12 },
      { month: 'Feb', spend: 450, count: 19 },
      { month: 'Mar', spend: 280, count: 10 },
      { month: 'Apr', spend: 390, count: 15 },
      { month: 'May', spend: 480, count: 22 },
      { month: 'Jun', spend: 520, count: 24 },
    ];
    
    // Carrier breakdown
    const carrierBreakdown = [
      { name: 'USPS', value: 45 },
      { name: 'UPS', value: 28 },
      { name: 'FedEx', value: 18 },
      { name: 'DHL', value: 9 },
    ];
    
    // Return the shipping history data
    return new Response(
      JSON.stringify({
        monthlyData,
        carrierBreakdown,
        totalSpend: 2440,
        totalShipments: 102,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in get-shipping-history function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
