
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
};

export async function POST(req: Request) {
  const sig = headers().get('stripe-signature');
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret || !secretKey) {
      console.error('❌ Stripe environment variables not set');
      return new NextResponse('Webhook Error: Environment variables not set', { status: 400 });
  }

  const stripe = getStripe(secretKey);
  let event: Stripe.Event;

  try {
    const rawBody = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);

    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  console.log(`[Webhook] ✅ Event received and verified: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] 💡 Event: ${event.type}. ID: ${subscription.id}, Status: ${subscription.status}`);
        
        let profileUpdate: any = {
            stripe_subscription_status: subscription.status,
        }

        // If a subscription is fully deleted, clear the plan info from the profile.
        if (event.type === 'customer.subscription.deleted') {
            profileUpdate.plan_id = null;
            profileUpdate.stripe_subscription_id = null;
            // Note: We don't reset minutes_balance here. Let it expire or be used.
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update(profileUpdate)
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
            console.error(`❌ Webhook Error: Error updating profile for event ${event.type} on subscription ${subscription.id}:`, error);
        } else {
            console.log(`[Webhook] ✅ Profile updated for event ${event.type} on subscription ${subscription.id}.`);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] 💡 Event: invoice.payment_succeeded. Invoice ID: ${invoice.id}, Reason: ${invoice.billing_reason}`);
        
        // This is the SINGLE SOURCE OF TRUTH for plan assignment and adding minutes.
        if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
            const subscriptionId = invoice.subscription as string;
            if (!subscriptionId) {
               console.log(`[Webhook] ℹ️ Subscription invoice ${invoice.id} is missing subscription ID. Ignoring.`);
               break;
            }
            
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata.user_id;
            const planId = subscription.metadata.plan_id;
            
            if (!userId || !planId) {
                console.error(`❌ Webhook Error: Missing metadata on subscription ${subscriptionId} for invoice ${invoice.id}.`);
                break;
            }

            const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('minutes, title').eq('id', planId).single();
            if (planError || !planData) {
                console.error(`❌ Webhook Error: Plan not found. Plan ID: ${planId}`);
                break;
            }
            
            const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').select('minutes_balance').eq('id', userId).single();
            if (profileError || !profileData) {
                console.error(`❌ Webhook Error: Profile not found. User ID: ${userId}`);
                break;
            }
            
            // On initial creation OR renewal, add minutes and set the plan
            const newBalance = (profileData.minutes_balance || 0) + planData.minutes;
            console.log(`[Webhook] 💰 Subscription payment. User: ${userId}. Plan: ${planId}. Adding ${planData.minutes} minutes. New balance: ${newBalance}`);

            const profileUpdateData = {
                plan_id: planId,
                minutes_balance: newBalance,
                stripe_subscription_id: subscription.id,
                stripe_subscription_status: subscription.status,
            };

            const { error: updateError } = await supabaseAdmin.from('profiles').update(profileUpdateData).eq('id', userId);
            
            if (updateError) {
                console.error(`❌ Webhook Error: Error updating profile for user ${userId}:`, updateError);
            } else {
                console.log(`[Webhook] ✅ Successfully updated profile and added minutes for user ${userId}.`);
            }

            // Create/update invoice record for the renewal
            const invoiceDataForDb = {
                id: invoice.id,
                user_id: userId,
                plan_id: planId,
                plan_title: planData.title,
                date: new Date(invoice.created * 1000).toISOString(),
                amount: invoice.amount_paid / 100,
                status: 'Pago',
            };
            
            console.log(`[Webhook] 🧾 Creating/updating invoice record in DB for invoice ${invoice.id}`);
            const { error: invoiceInsertError } = await supabaseAdmin.from('invoices').upsert(invoiceDataForDb, { onConflict: 'id' });
            if (invoiceInsertError) {
                console.error(`❌ Webhook Error: Failed to upsert invoice record:`, invoiceInsertError);
            } else {
                console.log(`[Webhook] ✅ Successfully created/updated invoice record for ${invoice.id}.`);
            }
        }
        break;
      }
      
      // We don't need to handle checkout.session.completed for plan assignment anymore.

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        console.log(`[Webhook] 💡 Event: invoice.payment_failed. Invoice ID: ${invoice.id}`);
        if (!subscriptionId) break;

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);
        
        if (error) {
            console.error(`❌ Webhook Error: Error updating profile status to 'past_due' for subscription ${subscriptionId}:`, error);
        } else {
            console.log(`[Webhook] 🔔 Marked subscription ${subscriptionId} as 'past_due' due to failed payment.`);
        }
        break;
      }

      default:
        console.log(`[Webhook] ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('⚠️ Webhook handler failed:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}
