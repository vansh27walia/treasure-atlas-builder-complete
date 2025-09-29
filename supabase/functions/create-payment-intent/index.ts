
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Authentication error:", userError?.message);
      throw new Error("User not authenticated");
    }

    console.log("Processing payment with permanently stored payment method for user:", user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const { amount, currency = "usd", payment_method_id, description } = await req.json();

    if (!payment_method_id) {
      throw new Error("Payment method ID is required");
    }

    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required");
    }

    console.log("Processing payment:", { amount, currency, payment_method_id, description });

    // Get permanently stored payment method from database
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

    console.log("Found permanently stored payment method:", paymentMethod.id, "for user:", user.id);

    // Get user's Stripe customer ID
    const { data: userProfile } = await supabaseClient
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let stripeCustomerId = userProfile?.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log("No customer ID found, creating new customer");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Save the customer ID
      await supabaseClient
        .from("user_profiles")
        .upsert({
          id: user.id,
          stripe_customer_id: stripeCustomerId
        });
      
      console.log("Created new Stripe customer:", stripeCustomerId);
    }

    // Verify the permanently stored Stripe payment method exists and is attached
    try {
      const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethod.stripe_payment_method_id);
      if (!stripePaymentMethod) {
        throw new Error("Stripe payment method not found");
      }
      
      // Ensure it's attached to the customer if not already
      if (!stripePaymentMethod.customer) {
        console.log("Re-attaching payment method to customer");
        await stripe.paymentMethods.attach(paymentMethod.stripe_payment_method_id, {
          customer: stripeCustomerId,
        });
      }
      
      console.log("Permanently stored payment method verified:", stripePaymentMethod.id);
    } catch (stripeError) {
      console.error("Stripe payment method verification failed:", stripeError);
      throw new Error("Payment method is no longer valid or has expired");
    }

    // Create payment intent with permanently stored payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: stripeCustomerId,
      payment_method: paymentMethod.stripe_payment_method_id,
      confirmation_method: "automatic",
      confirm: true,
      return_url: `${req.headers.get("origin") || "http://localhost:3000"}/payment-success`,
      description: description || "Shipping Label Purchase",
      metadata: {
        user_id: user.id,
        payment_method_db_id: payment_method_id,
        permanent_storage: "true",
        processed_at: new Date().toISOString()
      }
    });

    console.log("Payment intent created with permanent payment method:", paymentIntent.id, "Status:", paymentIntent.status);

    // Handle different payment statuses
    if (paymentIntent.status === "succeeded") {
      return new Response(
        JSON.stringify({
          success: true,
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (paymentIntent.status === "requires_action") {
      return new Response(
        JSON.stringify({
          requires_action: true,
          payment_intent: {
            id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
          },
          status: paymentIntent.status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      console.error("Unexpected payment status:", paymentIntent.status);
      return new Response(
        JSON.stringify({ 
          error: "Payment failed", 
          status: paymentIntent.status,
          payment_intent_id: paymentIntent.id 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
