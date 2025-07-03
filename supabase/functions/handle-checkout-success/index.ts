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

    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("Session ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      throw new Error("Invalid session");
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (session.mode === "setup") {
      // Handle setup mode - save payment method
      const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent as string);
      
      if (setupIntent.status === "succeeded" && setupIntent.payment_method) {
        const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string);
        
        // Check if this is the user's first payment method to set as default
        const { data: existingMethods } = await supabaseService
          .from("payment_methods")
          .select("id")
          .eq("user_id", user.id);

        const isFirstMethod = !existingMethods || existingMethods.length === 0;

        // Save payment method to database
        const { error } = await supabaseService
          .from("payment_methods")
          .insert({
            user_id: user.id,
            stripe_payment_method_id: paymentMethod.id,
            brand: paymentMethod.card?.brand || paymentMethod.type,
            last4: paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4 || "****",
            exp_month: paymentMethod.card?.exp_month || null,
            exp_year: paymentMethod.card?.exp_year || null,
            is_default: isFirstMethod,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error("Error saving payment method:", error);
          throw new Error("Failed to save payment method");
        }

        return new Response(
          JSON.stringify({
            success: true,
            payment_method: {
              id: paymentMethod.id,
              brand: paymentMethod.card?.brand || paymentMethod.type,
              last4: paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4,
              is_default: isFirstMethod
            }
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    } else if (session.mode === "payment") {
      // Handle payment mode - record payment
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
      
      if (paymentIntent.status === "succeeded") {
        await supabaseService
          .from("payment_records")
          .upsert({
            stripe_payment_intent_id: paymentIntent.id,
            user_id: user.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: "succeeded",
            transaction_type: "checkout",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        return new Response(
          JSON.stringify({
            success: true,
            payment_intent: {
              id: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
              status: paymentIntent.status
            }
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    throw new Error("Setup or payment was not successful");

  } catch (error) {
    console.error("Error handling checkout success:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});