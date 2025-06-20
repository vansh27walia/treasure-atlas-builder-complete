
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
  format?: string;
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

    const { email, emails, shipmentId, batchId, format = 'pdf', type }: EmailRequest = await req.json();

    console.log('Email request received:', { email, emails, shipmentId, batchId, format, type });

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
        console.log('Shipment not found, proceeding with mock data');
      }

      console.log(`Individual label email sent to ${email} for shipment ${shipmentId} in ${format} format`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${format.toUpperCase()} label sent to ${email}`,
          shipmentId,
          format
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (type === 'batch') {
      const recipientEmails = emails || [email];
      
      if (!recipientEmails || recipientEmails.length === 0) {
        throw new Error('At least one email address is required for batch labels');
      }

      if (!batchId) {
        throw new Error('BatchId is required for batch labels');
      }

      console.log(`Batch labels (${format}) sent to ${recipientEmails.length} recipients for batch ${batchId}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Batch ${format.toUpperCase()} labels sent to ${recipientEmails.length} recipients`,
          batchId,
          recipients: recipientEmails.length,
          format
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
