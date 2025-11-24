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

    const { payment_method_id, amount, currency = "usd", description, shipping_details } = await req.json();

    if (!payment_method_id || !amount) {
      throw new Error("Payment method ID and amount are required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get customer ID from user profile
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile } = await supabaseService
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      throw new Error("No Stripe customer found for user");
    }

    // Verify payment method belongs to customer
    const { data: paymentMethodRecord } = await supabaseService
      .from("payment_methods")
      .select("stripe_payment_method_id")
      .eq("id", payment_method_id)
      .eq("user_id", user.id)
      .single();

    if (!paymentMethodRecord) {
      throw new Error("Payment method not found or doesn't belong to user");
    }

    // Verify and fix payment method customer association in Stripe
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentMethodRecord.stripe_payment_method_id
      );

      // If payment method belongs to a different customer, re-attach it
      if (paymentMethod.customer && paymentMethod.customer !== profile.stripe_customer_id) {
        console.log(`Re-attaching payment method ${paymentMethod.id} from customer ${paymentMethod.customer} to ${profile.stripe_customer_id}`);
        
        // Detach from old customer
        await stripe.paymentMethods.detach(paymentMethod.id);
        
        // Attach to current customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: profile.stripe_customer_id,
        });
        
        console.log("Payment method successfully re-attached to current customer");
      } else if (!paymentMethod.customer) {
        // If not attached to any customer, attach it now
        console.log(`Attaching unattached payment method ${paymentMethod.id} to ${profile.stripe_customer_id}`);
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: profile.stripe_customer_id,
        });
      }
    } catch (pmError) {
      console.error("Error verifying/fixing payment method:", pmError);
      throw new Error("Invalid payment method. Please re-add your payment method.");
    }

    // Create and confirm payment intent off-session  
    // Limit metadata to avoid Stripe's 500 character limit
    let limitedShippingDetails = null;
    if (shipping_details) {
      const detailsString = JSON.stringify(shipping_details);
      if (detailsString.length > 400) { // Leave room for other metadata
        // Create a summary of shipping details that fits in metadata
        const summary = {
          shipmentCount: shipping_details.shipmentCount || 0,
          totalCost: shipping_details.totalCost || 0,
          pickupAddress: shipping_details.pickupAddress?.name || 'Unknown'
        };
        limitedShippingDetails = JSON.stringify(summary);
      } else {
        limitedShippingDetails = detailsString;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      customer: profile.stripe_customer_id,
      payment_method: paymentMethodRecord.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: description || "Shipping payment",
      metadata: {
        user_id: user.id,
        transaction_type: "shipping",
        shipping_summary: limitedShippingDetails
      }
    });

    // Record payment in database
    await supabaseService
      .from("payment_records")
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        user_id: user.id,
        amount: amount,
        currency: currency,
        status: paymentIntent.status,
        transaction_type: "shipping",
        shipping_details: shipping_details,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: amount,
          currency: currency
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing shipping payment:", error);
    
    // Handle specific Stripe errors
    if (error && typeof error === 'object' && 'type' in error && error.type === "StripeCardError") {
      return new Response(
        JSON.stringify({ 
          error: "Your card was declined. Please try a different payment method.",
          code: (error as any).code,
          decline_code: (error as any).decline_code
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});