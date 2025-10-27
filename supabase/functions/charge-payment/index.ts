import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Input validation schema
    const paymentSchema = z.object({
      payment_method_id: z.string().optional(),
      amount: z.number().positive("Amount must be positive").max(50000, "Amount exceeds maximum limit"),
      currency: z.string().length(3).default("usd"),
      description: z.string().max(500, "Description too long").default("Shipping Payment"),
      transaction_type: z.string().max(50).default("normal"),
      shipping_details: z.record(z.any()).default({}),
      automatic_payment_methods: z.boolean().default(false)
    }).refine(
      (data) => data.payment_method_id || data.automatic_payment_methods,
      { message: "Payment method ID is required when automatic payment methods are disabled" }
    );

    const requestBody = await req.json();
    const validatedData = paymentSchema.parse(requestBody);
    
    const { 
      payment_method_id, 
      amount, 
      currency, 
      description,
      transaction_type,
      shipping_details,
      automatic_payment_methods
    } = validatedData;

    // Get customer ID from user profile
    const { data: profile } = await supabaseClient
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
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

    // Create payment intent
    const paymentIntentData: any = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      description,
      metadata: {
        user_id: user.id,
        transaction_type,
        shipping_details: JSON.stringify(shipping_details)
      },
      automatic_payment_methods: {
        enabled: automatic_payment_methods
      }
    };

    if (payment_method_id) {
      paymentIntentData.payment_method = payment_method_id;
      paymentIntentData.confirmation_method = "manual";
      paymentIntentData.confirm = true;
      paymentIntentData.return_url = `${req.headers.get("origin")}/payment-success`;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        requires_action: paymentIntent.status === "requires_action",
        next_action: paymentIntent.next_action,
        success: paymentIntent.status === "succeeded"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});