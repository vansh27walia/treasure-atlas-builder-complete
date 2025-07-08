
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client with proper authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Authentication error:", userError?.message);
      throw new Error("User not authenticated");
    }

    console.log("Authenticated user:", user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const { amount, currency = "usd", payment_method_id, description } = await req.json();

    if (!payment_method_id) {
      throw new Error("Payment method ID is required");
    }

    console.log("Looking for payment method:", payment_method_id, "for user:", user.id);

    // Get payment method from database with proper user authentication
    const { data: paymentMethod, error } = await supabaseClient
      .from("payment_methods")
      .select("*")
      .eq("id", payment_method_id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Database error fetching payment method:", error);
      throw new Error(`Payment method not found: ${error.message}`);
    }

    if (!paymentMethod) {
      console.error("No payment method found for ID:", payment_method_id, "and user:", user.id);
      throw new Error("Payment method not found for this user");
    }

    console.log("Found payment method:", paymentMethod.id, "for user:", user.id);

    // Verify the Stripe payment method exists and is attached to customer
    try {
      const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethod.stripe_payment_method_id);
      if (!stripePaymentMethod) {
        throw new Error("Stripe payment method not found");
      }
      console.log("Stripe payment method verified:", stripePaymentMethod.id);
    } catch (stripeError) {
      console.error("Stripe payment method verification failed:", stripeError);
      throw new Error("Payment method is no longer valid");
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method: paymentMethod.stripe_payment_method_id,
      confirmation_method: "manual",
      confirm: true,
      return_url: `${req.headers.get("origin")}/payment-success`,
      description,
      metadata: {
        user_id: user.id,
        payment_method_db_id: payment_method_id
      }
    });

    console.log("Payment intent created successfully:", paymentIntent.id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        requires_action: paymentIntent.status === "requires_action",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
