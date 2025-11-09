
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

// This config is crucial. It tells Next.js not to parse the body,
// leaving it raw for Stripe's signature verification.
export const config = {
  api: {
    bodyParser: false,
  },
};

const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
};

async function manageSubscriptionStatusChange(supabaseAdmin: any, subscription: Stripe.Subscription) {
    const userId = subscription.metadata.user_id;
    const planId = subscription.metadata.plan_id;
    const customerId = subscription.customer as string;

    if (!userId || !planId) {
        console.error(`❌ Webhook Error: Missing metadata on subscription ${subscription.id}: user_id or plan_id`);
        return;
    }

    console.log(`[Webhook] 💡 Processing subscription ${subscription.id} for User: ${userId}, Plan: ${planId}, Status: ${subscription.status}`);
    
    const profileUpdateData = {
        plan_id: planId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        stripe_cancel_at_period_end: subscription.cancel_at_period_end,
        stripe_subscription_cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    };
    
    console.log(`[Webhook] 👤 Attempting to update profile for user ${userId} with data:`, profileUpdateData);

    const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

    if (updateProfileError) {
        console.error(`❌ Webhook Error: Error updating profile for user ${userId}:`, updateProfileError);
    } else {
        console.log(`[Webhook] ✅ Successfully updated profile for user ${userId} with new subscription details.`);
    }
}


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
    const buf = await req.arrayBuffer();
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  console.log(`[Webhook] ✅ Event received and verified: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] 💡 Event: ${event.type}. ID: ${subscription.id}, Status: ${subscription.status}`);
        await manageSubscriptionStatusChange(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] 💡 Event: customer.subscription.deleted. ID: ${subscription.id}`);
        
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_id: null,
            stripe_subscription_id: null,
            stripe_subscription_status: 'canceled',
            stripe_cancel_at_period_end: true,
          })
          .eq('stripe_subscription_id', subscription.id);
        if (error) {
            console.error(`❌ Webhook Error: Error updating profile on subscription delete for ${subscription.id}:`, error);
        } else {
            console.log(`[Webhook] ✅ Profile updated for canceled subscription ${subscription.id}.`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] 💡 Event: invoice.payment_succeeded. Invoice ID: ${invoice.id}, Reason: ${invoice.billing_reason}`);
        
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

            const newBalance = (profileData.minutes_balance || 0) + planData.minutes;
            console.log(`[Webhook] 💰 Subscription payment. Adding ${planData.minutes} minutes to user ${userId}. New balance: ${newBalance}`);
            const { error: updateError } = await supabaseAdmin.from('profiles').update({ minutes_balance: newBalance }).eq('id', userId);
            
            if (updateError) {
                console.error(`❌ Webhook Error: Error adding minutes for user ${userId}:`, updateError);
            } else {
                console.log(`[Webhook] ✅ Successfully added minutes for user ${userId}.`);
            }

            const invoiceDataForDb = {
                id: invoice.id,
                user_id: userId,
                plan_id: planId,
                plan_title: planData.title,
                date: new Date(invoice.created * 1000).toISOString(),
                amount: invoice.amount_paid / 100,
                status: invoice.status,
            };
            
            console.log(`[Webhook] 🧾 Creating invoice record in DB for invoice ${invoice.id}`);
            const { error: invoiceInsertError } = await supabaseAdmin.from('invoices').insert(invoiceDataForDb);
            if (invoiceInsertError) {
                console.error(`❌ Webhook Error: Failed to insert invoice record:`, invoiceInsertError);
            } else {
                console.log(`[Webhook] ✅ Successfully created invoice record for ${invoice.id}.`);
            }
        }
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Webhook] 💡 Event: payment_intent.succeeded. PI_ID: ${paymentIntent.id}`);
        const {
            user_id,
            user_name,
            user_email,
            service_name,
            appointment_date,
            duration,
            payment_method
        } = paymentIntent.metadata || {};

        if (!user_id || !user_name || !user_email || !service_name || !appointment_date || !duration || !payment_method) {
            console.error(`❌ Webhook Error: Missing metadata on Payment Intent ${paymentIntent.id}`);
            break;
        }

        const appointmentData = {
            user_id: user_id,
            user_name: user_name,
            user_email: user_email,
            service_name: service_name,
            date: appointment_date,
            duration: parseInt(duration, 10),
            status: 'Confirmado' as const,
            payment_method: payment_method,
        };

        console.log(`[Webhook] 📅 Creating appointment from Payment Intent ${paymentIntent.id}`);
        const { error: appointmentError } = await supabaseAdmin.from('appointments').insert(appointmentData);

        if (appointmentError) {
            console.error(`❌ Webhook Error: Failed to create appointment for PI ${paymentIntent.id}:`, appointmentError);
        } else {
            console.log(`[Webhook] ✅ Successfully created appointment for PI ${paymentIntent.id}.`);
        }
        break;
      }

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

    