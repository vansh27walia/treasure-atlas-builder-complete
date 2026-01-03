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

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const body = await req.json();
    const {
      mode = "setup",
      amount = null,
      currency = "usd",
      description = "Payment Setup",
      payment_method_types,
    } = body;

    const allowedPaymentMethodTypes = new Set([
      "card",
      "us_bank_account",
      "sepa_debit",
      "link",
    ]);

    const normalizedPaymentMethodTypes = Array.isArray(payment_method_types)
      ? payment_method_types
          .filter((t: unknown): t is string => typeof t === "string")
          .filter((t) => allowedPaymentMethodTypes.has(t))
      : undefined;
    // Get or create customer
    let customerId;
    const { data: profile } = await supabaseClient
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      // Create customer if doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;

      // Update user profile with customer ID
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseService
        .from("user_profiles")
        .upsert({
          id: user.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        });
    }

    // Use the production domain or fallback to origin
    const productionDomain = "https://app.shippingquick.io";
    const origin = req.headers.get("origin") || productionDomain;
    const baseUrl = origin.includes("localhost") ? origin : productionDomain;

    let sessionConfig: any = {
      customer: customerId,
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings?canceled=true`,
      // Default to card + bank transfer unless the client explicitly asks for something else.
      payment_method_types:
        normalizedPaymentMethodTypes && normalizedPaymentMethodTypes.length > 0
          ? normalizedPaymentMethodTypes
          : ["card", "us_bank_account"],
    };

    if (mode === "setup") {
      // Setup mode for saving payment methods
      sessionConfig.mode = "setup";
      sessionConfig.success_url = `${baseUrl}/settings?session_id={CHECKOUT_SESSION_ID}&setup=true`;
    } else if (mode === "payment" && amount) {
      // Payment mode for immediate charges
      sessionConfig.mode = "payment";
      sessionConfig.line_items = [
        {
          price_data: {
            currency,
            product_data: {
              name: description
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ];
      sessionConfig.metadata = {
        user_id: user.id,
        description
      };
    } else {
      throw new Error("Invalid mode or missing amount for payment");
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({
        session_id: session.id,
        url: session.url,
        customer_id: customerId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});