
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get the request data
    const { labelUrl, trackingCode, shipmentId } = await req.json();
    
    if (!labelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing label URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration not found');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user's email
    const { user, error: authError } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '');
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // In a real implementation, you would use an email service like SendGrid or AWS SES
    // For this demo, we'll simulate the email sending
    console.log(`Sending label to email: ${user.email}`);
    console.log(`Label URL: ${labelUrl}`);
    console.log(`Tracking code: ${trackingCode}`);

    // In a real implementation, you would log the email sending in the database
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        user_id: user.id,
        email_type: 'shipping_label',
        recipient: user.email,
        tracking_code: trackingCode,
        shipment_id: shipmentId,
        status: 'sent'
      })
      .select();
      
    if (logError) {
      console.error('Error logging email:', logError);
      // Continue anyway as this is non-critical
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: `Label sent to ${user.email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-shipping-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
