
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Função para obter o cliente Stripe, garantindo que seja inicializado apenas uma vez
const getStripeInstance = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
    }
    return new Stripe(secretKey, {
        apiVersion: '2024-06-20',
        typescript: true,
    });
};

// Função para obter o cliente Supabase Admin
const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key is not configured.');
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};


const handleSubscriptionLogic = async (supabase: any, invoice: Stripe.Invoice) => {
    const subscriptionId = invoice.subscription as string;
    const customerId = invoice.customer as string;

    if (!subscriptionId || !customerId) {
        console.error('[WEBHOOK] Missing subscription or customer ID in invoice.', invoice.id);
        return;
    }

    const { user_id, plan_id } = invoice.lines.data[0].metadata;

    if (!user_id || !plan_id) {
        console.error(`[WEBHOOK] Metadata (user_id, plan_id) missing for invoice ${invoice.id}`);
        return;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan_id, minutes_balance')
        .eq('id', user_id)
        .single();

    if (profileError) {
        console.error(`[WEBHOOK] Profile not found for user ${user_id}.`, profileError);
        return;
    }

    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, title, minutes')
        .eq('id', plan_id)
        .single();
    
    if (planError || !plan) {
        console.error(`[WEBHOOK] Plan ${plan_id} not found for user ${user_id}.`, planError);
        return;
    }
    
    const newMinutes = (profile.minutes_balance || 0) + plan.minutes;

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            plan_id: plan.id,
            minutes_balance: newMinutes,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            stripe_subscription_status: 'active',
            stripe_cancel_at_period_end: false,
        })
        .eq('id', user_id);

    if (updateError) {
        console.error(`[WEBHOOK] Error updating profile for user ${user_id}:`, updateError.message);
    } else {
        console.log(`[WEBHOOK] Profile updated for user ${user_id}. New balance: ${newMinutes}. Status: active.`);
    }

    // Create an invoice record
    if (invoice.amount_paid > 0 && invoice.status === 'paid') {
        const { error: invoiceInsertError } = await supabase.from('invoices').insert({
            user_id: user_id,
            plan_id: plan.id,
            plan_title: plan.title,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100,
            status: 'Pago',
            pdf_url: invoice.invoice_pdf,
        });
        if (invoiceInsertError) {
            console.error(`[WEBHOOK] Error saving invoice ${invoice.id}:`, invoiceInsertError);
        } else {
            console.log(`[WEBHOOK] Invoice created successfully for user ${user_id}.`);
        }
    }
}


const handleSubscriptionDeleted = async (supabase: any, subscription: Stripe.Subscription) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            plan_id: null,
            stripe_subscription_status: 'canceled',
            stripe_cancel_at_period_end: null, 
            stripe_subscription_id: null, 
         })
        .eq('stripe_subscription_id', subscription.id);
    
    if (error) {
        console.error(`[WEBHOOK] customer.subscription.deleted: Error canceling subscription in DB:`, error.message);
    } else {
        console.log(`[WEBHOOK] customer.subscription.deleted: Subscription ${subscription.id} removed from profile.`);
    }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('Stripe-Signature') as string;
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[WEBHOOK] Error: STRIPE_WEBHOOK_SECRET is not set in environment variables.");
    return new NextResponse('Stripe webhook secret is not configured.', { status: 500 });
  }

  const stripe = getStripeInstance();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ [WEBHOOK] Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
        await handleSubscriptionLogic(supabase, event.data.object as Stripe.Invoice);
        break;
    case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;
    default:
      // console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
