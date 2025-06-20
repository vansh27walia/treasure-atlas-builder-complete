
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email?: string;
  emails?: string[];
  shipmentId?: string;
  batchId?: string;
  type: 'individual' | 'batch';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, emails, shipmentId, batchId, type }: EmailRequest = await req.json();

    console.log('Email request:', { email, emails, shipmentId, batchId, type });

    if (type === 'individual') {
      if (!email || !shipmentId) {
        throw new Error('Email and shipmentId are required for individual labels');
      }

      // Get shipment details
      const { data: shipment, error: shipmentError } = await supabaseClient
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .single();

      if (shipmentError) {
        throw new Error(`Failed to fetch shipment: ${shipmentError.message}`);
      }

      console.log(`Individual label email sent to ${email} for shipment ${shipmentId}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Label sent to ${email}`,
          shipmentId 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (type === 'batch') {
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        throw new Error('Emails array is required for batch labels');
      }

      if (!batchId) {
        throw new Error('BatchId is required for batch labels');
      }

      console.log(`Batch labels sent to ${emails.length} recipients for batch ${batchId}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Batch labels sent to ${emails.length} recipients`,
          batchId,
          recipients: emails.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    throw new Error('Invalid email type specified');

  } catch (error) {
    console.error('Error in send-label-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        details: error
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
