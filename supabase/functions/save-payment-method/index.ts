
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
      throw new Error("User not authenticated");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const { setup_intent_id, is_default } = await req.json();

    console.log("Saving payment method permanently for user:", user.id, "setup_intent:", setup_intent_id);

    // Retrieve the setup intent to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);
    
    if (!setupIntent.payment_method) {
      throw new Error("No payment method found in setup intent");
    }

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(
      setupIntent.payment_method as string
    );

    console.log("Payment method retrieved for permanent storage:", paymentMethod.id);

    // Ensure the payment method is permanently attached to the customer
    if (!paymentMethod.customer || paymentMethod.customer !== setupIntent.customer) {
      console.log("Permanently attaching payment method to customer");
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: setupIntent.customer as string,
      });
      console.log("Payment method permanently attached to customer");
    }

    // Use service role client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // If this is set as default, update all other payment methods to not default
    if (is_default) {
      await supabaseService
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    // Prepare payment method data for permanent storage
    let paymentMethodData: any = {
      user_id: user.id,
      stripe_payment_method_id: paymentMethod.id,
      is_default: is_default || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Handle different payment method types for permanent storage
    if (paymentMethod.card) {
      paymentMethodData = {
        ...paymentMethodData,
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
      };
    } else if (paymentMethod.us_bank_account) {
      paymentMethodData = {
        ...paymentMethodData,
        brand: 'us_bank_account',
        last4: paymentMethod.us_bank_account.last4,
        exp_month: null,
        exp_year: null,
      };
    } else if (paymentMethod.link) {
      paymentMethodData = {
        ...paymentMethodData,
        brand: 'link',
        last4: paymentMethod.link.email?.slice(-4) || '****',
        exp_month: null,
        exp_year: null,
      };
    } else {
      paymentMethodData = {
        ...paymentMethodData,
        brand: paymentMethod.type,
        last4: '****',
        exp_month: null,
        exp_year: null,
      };
    }

    // Save payment method to database with permanent reference
    const { data, error } = await supabaseService
      .from("payment_methods")
      .insert(paymentMethodData)
      .select()
      .single();

    if (error) {
      console.error("Database error saving payment method:", error);
      throw error;
    }

    console.log("Payment method saved permanently to database:", data.id);

    return new Response(
      JSON.stringify({ success: true, payment_method: data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error saving payment method:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
