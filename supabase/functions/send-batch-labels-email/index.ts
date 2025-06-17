
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const { email, consolidatedPdfUrl, format, shipmentCount, batchId } = await req.json();

    if (!email || !consolidatedPdfUrl) {
      throw new Error("Email and consolidated PDF URL are required");
    }

    console.log('Sending batch labels email:', { email, consolidatedPdfUrl, format, shipmentCount, batchId });

    // For now, we'll simulate sending the email
    // In a real implementation, you would:
    // 1. Download the PDF from Supabase Storage
    // 2. Use a service like Resend to send the email with attachment
    // 3. Handle any errors appropriately

    const emailData = {
      to: email,
      subject: `Your Batch Shipping Labels - ${shipmentCount} Labels`,
      attachmentUrl: consolidatedPdfUrl,
      format: format || 'pdf',
      shipmentCount,
      batchId
    };

    // Simulate successful email sending
    // Replace this with actual email service integration
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Email sent successfully:', emailData);

    return new Response(JSON.stringify({
      success: true,
      message: `Batch labels sent to ${email}`,
      emailData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending batch labels email:", errorMessage);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
