
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

// This is a generic Supabase admin client for server-side operations
const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[WEBHOOK] Erro: URL do Supabase ou Service Role Key não configurada.');
        throw new Error('Supabase URL or Service Role Key is not configured.');
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

const handleSubscriptionCreationOrUpdate = async (supabase: any, subscription: Stripe.Subscription) => {
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan_id, minutes_balance')
        .eq('stripe_customer_id', customerId)
        .single();

    if (profileError || !profile) {
        console.error(`[WEBHOOK] Profile not found for customer ${customerId}.`, profileError);
        return;
    }

    const planId = subscription.metadata.plan_id || subscription.items.data[0]?.price.metadata.plan_id;
    if (!planId) {
        console.error(`[WEBHOOK] Plan ID not found in subscription metadata for subscription ${subscriptionId}.`);
        return;
    }

    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, title, minutes')
        .eq('id', planId)
        .single();
    
    if (planError || !plan) {
        console.error(`[WEBHOOK] Plan ${planId} not found for user ${profile.id}.`, planError);
        return;
    }

    const newMinutes = (profile.minutes_balance || 0) + plan.minutes;

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            plan_id: plan.id,
            minutes_balance: newMinutes,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: 'active',
            stripe_cancel_at_period_end: false,
        })
        .eq('id', profile.id);

    if (updateError) {
        console.error(`[WEBHOOK] Error updating profile for user ${profile.id}:`, updateError.message);
    } else {
        console.log(`[WEBHOOK] Profile updated for user ${profile.id}. New balance: ${newMinutes}. Status: active.`);
    }
    
    // Create an invoice record if it's a new subscription or renewal
    const latestInvoiceId = subscription.latest_invoice as string;
    if (latestInvoiceId) {
        try {
            const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeSecretKey) {
                const { data: gatewaySettings } = await supabase.from('gateway_settings').select('secret_key').eq('id', 'stripe').single();
                if (!gatewaySettings?.secret_key) throw new Error("Stripe secret key not found.");
                process.env.STRIPE_SECRET_KEY = gatewaySettings.secret_key;
            }
            const stripe = getStripe(process.env.STRIPE_SECRET_KEY!);
            const invoice = await stripe.invoices.retrieve(latestInvoiceId);
            if (invoice.amount_paid > 0 && invoice.status === 'paid') {
                 await supabase.from('invoices').insert({
                    user_id: profile.id,
                    plan_id: plan.id,
                    plan_title: plan.title,
                    date: new Date(invoice.created * 1000).toISOString(),
                    amount: invoice.amount_paid / 100,
                    status: 'Pago',
                    pdf_url: invoice.invoice_pdf,
                });
                console.log(`[WEBHOOK] Invoice created successfully for user ${profile.id}.`);
            }
        } catch (invoiceError) {
            console.error(`[WEBHOOK] Error retrieving or saving invoice ${latestInvoiceId}:`, invoiceError);
        }
    }
}


const handleCheckoutSessionCompleted = async (supabase: any, session: Stripe.Checkout.Session) => {
    const userId = session.metadata?.user_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId || !customerId || !subscriptionId) {
        console.error('[WEBHOOK] checkout.session.completed: Missing crucial metadata.', session.metadata);
        return;
    }

    // First, ensure the customer ID is associated with the user profile
    const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

    if (profileUpdateError) {
         console.error(`[WEBHOOK] checkout.session.completed: Error updating profile for user ${userId} with customer ID:`, profileUpdateError.message);
    }

    // Now, fetch the full subscription object from Stripe to process it
    try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            const { data: gatewaySettings } = await supabase.from('gateway_settings').select('secret_key').eq('id', 'stripe').single();
            if (!gatewaySettings?.secret_key) throw new Error("Stripe secret key not found.");
            process.env.STRIPE_SECRET_KEY = gatewaySettings.secret_key;
        }
        const stripe = getStripe(process.env.STRIPE_SECRET_KEY!);
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await handleSubscriptionCreationOrUpdate(supabase, subscription);
    } catch (error) {
        console.error(`[WEBHOOK] checkout.session.completed: Failed to retrieve subscription ${subscriptionId} from Stripe.`, error);
    }
}


const handleSubscriptionDeleted = async (supabase: any, subscription: Stripe.Subscription) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            plan_id: null,
            stripe_subscription_status: 'canceled',
            stripe_cancel_at_period_end: null, // Clear this field
            stripe_subscription_id: null, // Clear this field to allow re-subscription
         })
        .eq('stripe_subscription_id', subscription.id);
    
    if (error) {
        console.error(`[WEBHOOK] customer.subscription.deleted: Erro ao cancelar a subscrição na DB:`, error.message);
    } else {
        console.log(`[WEBHOOK] customer.subscription.deleted: Subscrição ${subscription.id} removida do perfil.`);
    }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('Stripe-Signature') as string;
  const supabase = getSupabaseAdminClient();
  
  const { data: gatewaySettings, error: gatewayError } = await supabase
        .from('gateway_settings')
        .select('secret_key, webhook_secret')
        .eq('id', 'stripe')
        .single();

  if (gatewayError || !gatewaySettings?.secret_key || !gatewaySettings?.webhook_secret) {
        console.error("[WEBHOOK] Erro: Chave secreta ou segredo do webhook Stripe não configurado na base de dados.", gatewayError);
        return new NextResponse('Stripe secret key or webhook secret not configured.', { status: 500 });
  }
  
  // Set the secret key for the getStripe utility
  process.env.STRIPE_SECRET_KEY = gatewaySettings.secret_key;
  const stripe = getStripe(gatewaySettings.secret_key);
  const webhookSecret = gatewaySettings.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ [WEBHOOK] Erro de verificação do webhook: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;
    case 'invoice.paid':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
            const subscriptionId = invoice.subscription as string;
            if (subscriptionId) {
                try {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    await handleSubscriptionCreationOrUpdate(supabase, subscription);
                } catch (error) {
                     console.error(`[WEBHOOK] invoice.paid: Failed to retrieve subscription ${subscriptionId}.`, error);
                }
            }
        }
        break;
    case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;
    default:
      // console.log(`[WEBHOOK] Evento não gerido: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
