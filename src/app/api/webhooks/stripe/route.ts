
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
};

// This is the crucial function to update a subscription status in our database.
async function manageSubscriptionStatusChange(supabaseAdmin: any, subscription: Stripe.Subscription) {
    const userId = subscription.metadata.user_id;
    const planId = subscription.metadata.plan_id;
    const customerId = subscription.customer as string;

    if (!userId || !planId) {
        console.error(`❌ Webhook Error: Missing metadata on subscription ${subscription.id}: user_id or plan_id`);
        return;
    }

    console.log(`[Webhook] 💡 Processing subscription ${subscription.id} for User: ${userId}, Plan: ${planId}, Status: ${subscription.status}`);
    
    let minutesToAdd = 0;
    
    // Only add minutes if the subscription is active. This handles both new subscriptions and renewals.
    if (subscription.status === 'active') {
        const { data: planData, error: planError } = await supabaseAdmin
            .from('plans')
            .select('minutes')
            .eq('id', planId)
            .single();

        if (planError || !planData) {
            console.error(`❌ Webhook Error: Plan with ID ${planId} not found in Supabase for subscription ${subscription.id}.`);
            return;
        }
        minutesToAdd = planData.minutes;
        console.log(`[Webhook] 💰 Plan found. Minutes to add: ${minutesToAdd}`);
    }

    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('minutes_balance')
        .eq('id', userId)
        .single();
    
    if (profileError) {
        console.error(`❌ Webhook Error: User profile with ID ${userId} not found in Supabase.`);
        return;
    }

    // Add minutes only on activation or renewal. Don't re-add on other updates.
    // We check if the status is active AND if it's a renewal (invoice paid) or a new sub (created).
    // A simpler logic for this demo is to rely on `invoice.payment_succeeded` for renewals.
    // For the initial activation, we can handle it here.
    const currentBalance = profileData?.minutes_balance || 0;
    let newMinutesBalance = currentBalance;

    const profileUpdateData = {
        plan_id: planId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
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
  const body = await req.text();
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
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  console.log(`[Webhook] ✅ Event received and verified: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] 💡 Event: customer.subscription.created. ID: ${subscription.id}, Status: ${subscription.status}`);
        await manageSubscriptionStatusChange(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] 💡 Event: customer.subscription.updated. ID: ${subscription.id}, Status: ${subscription.status}`);
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
        
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) {
           console.log(`[Webhook] ℹ️ Invoice ${invoice.id} is not related to a subscription. Ignoring for minute balance update.`);
           break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.user_id;

        // If it's a new subscription, `customer.subscription.updated` will handle the minute addition.
        // If it's a renewal, add minutes here.
        if (invoice.billing_reason === 'subscription_cycle') {
            const planId = subscription.metadata.plan_id;

            if (!userId || !planId) {
                console.error(`❌ Webhook Error: Missing metadata on renewal subscription ${subscriptionId}.`);
                break;
            }

            const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('minutes').eq('id', planId).single();
            if (planError || !planData) {
                console.error(`❌ Webhook Error: Plan not found for renewal. Plan ID: ${planId}`);
                break;
            }
            
            const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').select('minutes_balance').eq('id', userId).single();
            if (profileError || !profileData) {
                console.error(`❌ Webhook Error: Profile not found for renewal. User ID: ${userId}`);
                break;
            }

            const newBalance = (profileData.minutes_balance || 0) + planData.minutes;
            console.log(`[Webhook] 💰 Renewing subscription. Adding ${planData.minutes} minutes to user ${userId}. New balance: ${newBalance}`);
            const { error: updateError } = await supabaseAdmin.from('profiles').update({ minutes_balance: newBalance }).eq('id', userId);
            
            if (updateError) {
                console.error(`❌ Webhook Error: Error adding minutes on renewal for user ${userId}:`, updateError);
            } else {
                console.log(`[Webhook] ✅ Successfully added minutes for user ${userId} on renewal.`);
            }
        } else if (invoice.billing_reason === 'subscription_create') {
            // This is the first payment of the subscription.
             const planId = subscription.metadata.plan_id;
            if (!userId || !planId) break;

            const { data: planData } = await supabaseAdmin.from('plans').select('minutes').eq('id', planId).single();
            if (!planData) break;

            console.log(`[Webhook] 💰 First payment for subscription. Adding ${planData.minutes} minutes to user ${userId}.`);
            const { error: updateError } = await supabaseAdmin.from('profiles').update({ minutes_balance: planData.minutes }).eq('id', userId);
            
            if (updateError) {
                console.error(`❌ Webhook Error: Error adding initial minutes for user ${userId}:`, updateError);
            } else {
                console.log(`[Webhook] ✅ Successfully added initial minutes for user ${userId}.`);
            }
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
