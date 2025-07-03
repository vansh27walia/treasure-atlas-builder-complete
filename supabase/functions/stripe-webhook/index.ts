import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    switch (event.type) {
      case "setup_intent.succeeded":
        const setupIntent = event.data.object as Stripe.SetupIntent;
        console.log("Setup intent succeeded:", setupIntent.id);
        break;

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);
        
        // Update payment record in database
        if (paymentIntent.metadata?.user_id) {
          await supabaseService
            .from("payment_records")
            .upsert({
              stripe_payment_intent_id: paymentIntent.id,
              user_id: paymentIntent.metadata.user_id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
              status: "succeeded",
              transaction_type: paymentIntent.metadata.transaction_type || "normal",
              shipping_details: paymentIntent.metadata.shipping_details ? 
                JSON.parse(paymentIntent.metadata.shipping_details) : null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", failedPayment.id);
        
        if (failedPayment.metadata?.user_id) {
          await supabaseService
            .from("payment_records")
            .upsert({
              stripe_payment_intent_id: failedPayment.id,
              user_id: failedPayment.metadata.user_id,
              amount: failedPayment.amount / 100,
              currency: failedPayment.currency,
              status: "failed",
              error_message: failedPayment.last_payment_error?.message,
              transaction_type: failedPayment.metadata.transaction_type || "normal",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
        break;

      case "payment_method.attached":
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log("Payment method attached:", paymentMethod.id);
        break;

      case "payment_intent.processing":
        const processingPayment = event.data.object as Stripe.PaymentIntent;
        console.log("Payment processing:", processingPayment.id);
        
        if (processingPayment.metadata?.user_id) {
          await supabaseService
            .from("payment_records")
            .upsert({
              stripe_payment_intent_id: processingPayment.id,
              user_id: processingPayment.metadata.user_id,
              amount: processingPayment.amount / 100,
              currency: processingPayment.currency,
              status: "processing",
              transaction_type: processingPayment.metadata.transaction_type || "normal",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
        break;

      case "charge.failed":
        const failedCharge = event.data.object as Stripe.Charge;
        console.log("Charge failed:", failedCharge.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});