
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
async function manageSubscriptionStatusChange(supabaseAdmin: any, subscription: Stripe.Subscription, isNew: boolean = false) {
    const userId = subscription.metadata.user_id;
    const planId = subscription.metadata.plan_id;
    const customerId = subscription.customer as string;

    if (!userId || !planId) {
        console.error(`❌ Missing metadata on subscription ${subscription.id}: user_id or plan_id`);
        return;
    }

    console.log(`[${isNew ? 'NEW' : 'UPDATE'}] Managing subscription for User: ${userId}, Plan: ${planId}, Status: ${subscription.status}`);
    
    let minutesToAdd = 0;
    // Only add minutes on brand new 'active' subscriptions or on renewals (handled by invoice.paid).
    if (isNew && subscription.status === 'active') {
        const { data: planData, error: planError } = await supabaseAdmin
            .from('plans')
            .select('minutes')
            .eq('id', planId)
            .single();

        if (planError || !planData) {
            console.error(`❌ Plan with ID ${planId} not found in Supabase.`);
            return;
        }
        minutesToAdd = planData.minutes;
    }

    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('minutes_balance')
        .eq('id', userId)
        .single();
    
    if (profileError) {
        console.error(`❌ User profile with ID ${userId} not found in Supabase.`);
        return;
    }

    const newMinutesBalance = (profileData?.minutes_balance || 0) + minutesToAdd;

    const profileUpdateData = {
        plan_id: planId,
        minutes_balance: newMinutesBalance,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        stripe_cancel_at_period_end: subscription.cancel_at_period_end,
    };

    const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

    if (updateProfileError) {
        console.error(`❌ Error updating profile for user ${userId}:`, updateProfileError);
    } else {
        console.log(`✅ Successfully updated profile for user ${userId} with new subscription details.`);
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
  console.log(`✅ Webhook received and verified: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`💡 Subscription created: ${subscription.id}`);
        // Immediately sync the profile with the new subscription details and its initial status (e.g., 'incomplete').
        await manageSubscriptionStatusChange(supabaseAdmin, subscription, true);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const previousAttributes = event.data.previous_attributes;
        console.log(`💡 Subscription updated: ${subscription.id}, Status: ${subscription.status}`);
        
        // This is the most important handler. If a subscription moves from 'incomplete' to 'active',
        // we activate it. We also sync other status changes.
        const isBecomingActive = subscription.status === 'active' && previousAttributes?.status !== 'active';
        await manageSubscriptionStatusChange(supabaseAdmin, subscription, isBecomingActive);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`💡 Subscription deleted: ${subscription.id}`);
        
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_id: null,
            stripe_subscription_id: null,
            stripe_subscription_status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id);
        if (error) console.error(`❌ Error updating profile on subscription delete for ${subscription.id}:`, error);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (!subscriptionId) {
           console.log(`ℹ️ Invoice ${invoice.id} is not related to a subscription. Ignoring.`);
           break;
        }
        
        // This handles renewals. We don't activate the plan here, we just add the minutes.
        if (invoice.billing_reason === 'subscription_cycle') {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata.user_id;
            const planId = subscription.metadata.plan_id;

            if (!userId || !planId) {
                console.error(`❌ Missing metadata on subscription renewal ${subscriptionId}.`);
                break;
            }

            const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('minutes').eq('id', planId).single();
            if (planError || !planData) break;
            
            const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').select('minutes_balance').eq('id', userId).single();
            if (profileError || !profileData) break;

            const newBalance = (profileData.minutes_balance || 0) + planData.minutes;
            const { error: updateError } = await supabaseAdmin.from('profiles').update({ minutes_balance: newBalance }).eq('id', userId);
            
            if (updateError) console.error(`❌ Error adding minutes on renewal for user ${userId}:`, updateError);
            else console.log(`✅ Successfully added ${planData.minutes} minutes to user ${userId} on renewal.`);
        }
        
        // Also log the invoice to the invoices table
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.user_id;

        const { error: invoiceInsertError } = await supabaseAdmin.from('invoices').upsert({
            id: invoice.id,
            user_id: userId,
            plan_id: subscription.items.data[0]?.price.id,
            plan_title: subscription.items.data[0]?.price.nickname || 'Assinatura',
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100,
            status: 'Pago',
            pdf_url: invoice.invoice_pdf,
        }, { onConflict: 'id' });
        
        if (invoiceInsertError) console.error(`❌ Error inserting invoice for user ${userId}:`, invoiceInsertError);
        else console.log(`✅ Successfully inserted invoice for user ${userId}`);
        
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subscription.id);
        
        if (error) console.error(`❌ Error updating profile status to 'past_due' for subscription ${subscription.id}:`, error);
        else console.log(`🔔 Marked subscription ${subscription.id} as 'past_due' due to failed payment.`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('⚠️ Error processing webhook:', error);
    await supabaseAdmin.from('debug_logs').insert({
      log_message: 'Erro no webhook Stripe',
      metadata: { error: error.message, eventType: event.type },
    });
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}
