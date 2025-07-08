
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

    console.log("Creating setup intent for permanent storage, user:", user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let stripeCustomerId = null;
    
    // Check if user already has a Stripe customer ID
    const { data: userProfile } = await supabaseClient
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (userProfile?.stripe_customer_id) {
      stripeCustomerId = userProfile.stripe_customer_id;
      console.log("Using existing Stripe customer:", stripeCustomerId);
      
      // Verify the customer still exists in Stripe
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        console.log("Stripe customer not found, creating new one");
        stripeCustomerId = null;
      }
    }

    if (!stripeCustomerId) {
      console.log("Creating new Stripe customer for permanent payment method storage");
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        metadata: {
          user_id: user.id,
          created_at: new Date().toISOString(),
          storage_type: "permanent"
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Save the customer ID permanently to user_profiles
      const { error: profileError } = await supabaseClient
        .from("user_profiles")
        .upsert({
          id: user.id,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error("Error saving customer ID:", profileError);
      }
      
      console.log("Created and saved new Stripe customer for permanent storage:", stripeCustomerId);
    }

    const { payment_method_types = ["card"] } = await req.json();

    // Create setup intent for permanent payment method storage
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: "off_session", // Critical: enables permanent storage for future payments
      payment_method_types: payment_method_types,
      metadata: {
        user_id: user.id,
        purpose: "permanent_payment_method_storage",
        created_at: new Date().toISOString()
      }
    });

    console.log("Setup intent created for permanent storage:", setupIntent.id);

    return new Response(
      JSON.stringify({
        client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id,
        customer_id: stripeCustomerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating setup intent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
