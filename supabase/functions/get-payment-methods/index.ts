import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data: methods, error } = await supabaseClient
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Also get from Stripe for validation
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get customer ID
    const { data: profile } = await supabaseClient
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let stripeMethods = [];
    if (profile?.stripe_customer_id) {
      const stripePaymentMethods = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: "card"
      });
      stripeMethods = stripePaymentMethods.data;
    }

    // Enrich local data with Stripe data
    const enrichedMethods = methods?.map(method => {
      const stripeMethod = stripeMethods.find(sm => sm.id === method.stripe_payment_method_id);
      return {
        ...method,
        stripe_data: stripeMethod,
        is_valid: !!stripeMethod
      };
    }) || [];

    return new Response(
      JSON.stringify({
        payment_methods: enrichedMethods,
        total_count: enrichedMethods.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});