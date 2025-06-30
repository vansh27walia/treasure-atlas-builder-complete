
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SHIPPING ANALYTICS REQUEST ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Auth session missing!' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { timeRange = '30d' } = await req.json();
    
    // Calculate date range
    const now = new Date();
    const daysBack = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange] || 30;
    
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    console.log(`Fetching analytics for user ${user.id} from ${startDate.toISOString()}`);

    // For now, return mock data since we don't have the shipping_history table
    // In a real implementation, you would query actual shipment data
    const mockAnalytics = {
      totalShipments: Math.floor(Math.random() * 200) + 50,
      totalSpent: Math.floor(Math.random() * 3000) + 1000,
      averageCost: Math.floor(Math.random() * 20) + 10,
      popularCarriers: [
        { name: 'USPS', count: Math.floor(Math.random() * 100) + 50, percentage: 45 },
        { name: 'UPS', count: Math.floor(Math.random() * 60) + 30, percentage: 35 },
        { name: 'FedEx', count: Math.floor(Math.random() * 40) + 20, percentage: 20 }
      ],
      monthlyTrends: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).toLocaleDateString('en-US', { month: 'short' }),
        shipments: Math.floor(Math.random() * 40) + 10,
        cost: Math.floor(Math.random() * 600) + 200
      })),
      recentShipments: Array.from({ length: 10 }, (_, i) => ({
        id: `ship_${i + 1}`,
        tracking_code: `1Z999AA${String(i + 1).padStart(10, '0')}`,
        carrier: ['USPS', 'UPS', 'FedEx'][Math.floor(Math.random() * 3)],
        service: ['Ground', 'Priority', 'Express'][Math.floor(Math.random() * 3)],
        cost: Math.floor(Math.random() * 30) + 5,
        status: ['delivered', 'in_transit', 'pending'][Math.floor(Math.random() * 3)],
        created_at: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        recipient: `Customer ${i + 1}`
      }))
    };

    // Calculate derived values
    mockAnalytics.averageCost = mockAnalytics.totalSpent / mockAnalytics.totalShipments;

    return new Response(
      JSON.stringify(mockAnalytics),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(serve_handler);
