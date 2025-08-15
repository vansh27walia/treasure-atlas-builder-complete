
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Email function invoked with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user's JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Create a Supabase client with user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    console.log('User authenticated successfully:', user.email);

    // Parse request body
    const requestBody = await req.json();
    console.log('Request body parsed:', JSON.stringify(requestBody, null, 2));

    const { trackingCode, subject, format, toEmails } = requestBody;

    if (!trackingCode || !toEmails || !Array.isArray(toEmails) || toEmails.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields: trackingCode, toEmails' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Get the RESEND_API_KEY from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is missing from environment');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Get the label from the database
    const { data: shipmentRecord, error: recordError } = await supabaseClient
      .from('shipment_records')
      .select('label_url, shipment_data')
      .eq('tracking_code', trackingCode)
      .eq('user_id', user.id)
      .single();

    if (recordError || !shipmentRecord?.label_url) {
      console.error('Shipment record not found:', recordError?.message);
      return new Response(JSON.stringify({ error: 'Shipment record not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    console.log('Processing email request for:', {
      toEmails,
      subject,
      selectedFormats: [format || 'pdf']
    });

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShipAI <noreply@shipai.app>',
        to: toEmails,
        subject: subject || 'Your Shipping Label',
        html: `
          <h2>Your Shipping Label</h2>
          <p>Dear Customer,</p>
          <p>Please find your shipping label attached for tracking number: <strong>${trackingCode}</strong></p>
          <p>You can also download your label directly from this link: <a href="${shipmentRecord.label_url}" target="_blank">Download Label</a></p>
          <p>Thank you for using our shipping service!</p>
          <br>
          <p>Best regards,<br>ShipAI Team</p>
        `,
        attachments: [
          {
            filename: `shipping_label_${trackingCode}.pdf`,
            content_type: 'application/pdf',
            content: shipmentRecord.label_url
          }
        ]
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Label emailed successfully to ${toEmails.length} recipient(s)`,
      emailId: emailResult.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in email-labels function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
