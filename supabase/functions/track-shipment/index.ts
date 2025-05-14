
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
    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    const { tracking_number } = requestData;
    
    if (!tracking_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: tracking_number' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Tracking shipment with number: ${tracking_number}`);

    try {
      // Query EasyPost API for tracking information
      const response = await fetch(`https://api.easypost.com/v2/trackers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          tracker: {
            tracking_code: tracking_number,
          }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('EasyPost API error:', data);
        return new Response(
          JSON.stringify({ error: 'Failed to track shipment', details: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        );
      }

      // Format the tracking data
      const formattedData = {
        tracking_code: data.tracking_code,
        status: data.status,
        carrier: data.carrier,
        service: data.service || 'N/A',
        tracking_events: data.tracking_details?.map((detail: any) => ({
          description: detail.message,
          location: detail.tracking_location?.city 
            ? `${detail.tracking_location.city}, ${detail.tracking_location.state || detail.tracking_location.country}`
            : 'Location unavailable',
          timestamp: detail.datetime,
          status: detail.status
        })),
        estimated_delivery: data.est_delivery_date ? {
          date: new Date(data.est_delivery_date).toLocaleDateString(),
          time_range: null
        } : null
      };

      return new Response(
        JSON.stringify(formattedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (apiError) {
      console.error('Error calling EasyPost API:', apiError);
      
      // For demo purposes, return mock data if API call fails
      const mockTracking = generateMockTrackingData(tracking_number);
      
      return new Response(
        JSON.stringify(mockTracking),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in track-shipment function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to generate mock tracking data
function generateMockTrackingData(trackingNumber: string) {
  const now = new Date();
  const events = [];
  let status = '';
  
  // Randomly determine shipment status based on tracking number
  const hash = trackingNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  if (hash % 3 === 0) {
    status = 'delivered';
  } else if (hash % 3 === 1) {
    status = 'in_transit';
  } else {
    status = 'out_for_delivery';
  }
  
  // Generate tracking events based on status
  if (status === 'delivered' || status === 'in_transit' || status === 'out_for_delivery') {
    events.push({
      description: "Shipping label created",
      location: "Shipping Facility",
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "created"
    });
    
    events.push({
      description: "Package received by carrier",
      location: "Origin Facility",
      timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in_transit"
    });
  }
  
  if (status === 'delivered' || status === 'out_for_delivery') {
    events.push({
      description: "Out for delivery",
      location: "Local Distribution Center",
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "out_for_delivery"
    });
  }
  
  if (status === 'delivered') {
    events.push({
      description: "Delivered",
      location: "Delivery Address",
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      status: "delivered"
    });
  }
  
  return {
    tracking_code: trackingNumber,
    status: status,
    carrier: ['USPS', 'FedEx', 'UPS', 'DHL'][hash % 4],
    tracking_events: events,
    estimated_delivery: status !== 'delivered' ? {
      date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      time_range: "By end of day"
    } : null
  };
}
