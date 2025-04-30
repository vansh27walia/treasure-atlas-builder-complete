
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock function to simulate detailed tracking events
function generateTrackingEvents(status: string, trackingNumber: string) {
  const now = new Date();
  const events = [];
  
  // Base events all packages have
  events.push({
    description: "Shipping label created",
    location: "Origin Facility",
    timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "created"
  });
  
  events.push({
    description: "Package received by carrier",
    location: "Origin Facility",
    timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_transit"
  });
  
  if (status === 'in_transit' || status === 'out_for_delivery' || status === 'delivered') {
    events.push({
      description: "Package departed from origin facility",
      location: "Origin Facility",
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in_transit"
    });
    
    events.push({
      description: "Package arrived at sort facility",
      location: "Regional Hub",
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in_transit"
    });
    
    events.push({
      description: "Package departed from sort facility",
      location: "Regional Hub",
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in_transit"
    });
  }
  
  if (status === 'out_for_delivery' || status === 'delivered') {
    events.push({
      description: "Package arrived at local facility",
      location: "Local Distribution Center",
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in_transit"
    });
    
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
  
  // Add unique identifier for each event
  return events.map((event, index) => ({
    ...event,
    id: `evt_${trackingNumber}_${index}`
  }));
}

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

    // In a real application, we would fetch tracking data from the EasyPost API
    // For this demo, we'll simulate the response with more realistic data
    const demoTrackingData = [
      {
        id: 'trk_1',
        tracking_code: 'EZ1000000001',
        carrier: 'USPS',
        carrier_code: 'usps',
        status: 'in_transit',
        eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        last_update: new Date().toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png',
        shipment_id: 'shp_1000000001',
        recipient: 'John Smith',
        recipient_address: '123 Main St, San Francisco, CA 94105',
        package_details: {
          weight: '2.5 lbs',
          dimensions: '12 x 8 x 2 in',
          service: 'Priority Mail'
        },
        estimated_delivery: {
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          time_range: '10:00 AM - 2:00 PM'
        }
      },
      {
        id: 'trk_2',
        tracking_code: 'EZ1000000002',
        carrier: 'FedEx',
        carrier_code: 'fedex',
        status: 'delivered',
        eta: null,
        last_update: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png',
        shipment_id: 'shp_1000000002',
        recipient: 'Jane Doe',
        recipient_address: '456 Oak St, New York, NY 10001',
        package_details: {
          weight: '1.2 lbs',
          dimensions: '10 x 7 x 1 in',
          service: 'FedEx Express'
        },
        estimated_delivery: null
      },
      {
        id: 'trk_3',
        tracking_code: 'EZ1000000003',
        carrier: 'UPS',
        carrier_code: 'ups',
        status: 'out_for_delivery',
        eta: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        last_update: new Date().toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png',
        shipment_id: 'shp_1000000003',
        recipient: 'Robert Johnson',
        recipient_address: '789 Pine St, Chicago, IL 60007',
        package_details: {
          weight: '5.0 lbs',
          dimensions: '15 x 12 x 10 in',
          service: 'UPS Ground'
        },
        estimated_delivery: {
          date: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          time_range: 'By end of day'
        }
      },
      {
        id: 'trk_4',
        tracking_code: 'EZ1000000004',
        carrier: 'USPS',
        carrier_code: 'usps',
        status: 'delivered',
        eta: null,
        last_update: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png',
        shipment_id: 'shp_1000000004',
        recipient: 'Sarah Miller',
        recipient_address: '321 Maple Ave, Los Angeles, CA 90001',
        package_details: {
          weight: '3.2 lbs',
          dimensions: '9 x 6 x 4 in',
          service: 'First Class Mail'
        },
        estimated_delivery: null
      },
      {
        id: 'trk_5',
        tracking_code: 'EZ1000000005',
        carrier: 'DHL',
        carrier_code: 'dhl',
        status: 'in_transit',
        eta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        last_update: new Date().toISOString(),
        label_url: 'https://assets.easypost.com/shipping_labels/example_label.png',
        shipment_id: 'shp_1000000005',
        recipient: 'Michael Brown',
        recipient_address: '567 Cedar Blvd, Miami, FL 33101',
        package_details: {
          weight: '4.7 lbs',
          dimensions: '14 x 11 x 6 in',
          service: 'DHL Express'
        },
        estimated_delivery: {
          date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          time_range: '9:00 AM - 5:00 PM'
        }
      }
    ];

    // Add detailed tracking events to each shipment
    const enhancedData = demoTrackingData.map(item => ({
      ...item,
      tracking_events: generateTrackingEvents(item.status, item.tracking_code)
    }));

    // Return the tracking data
    return new Response(JSON.stringify(enhancedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in get-tracking-info function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
