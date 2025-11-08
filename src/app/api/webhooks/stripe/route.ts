
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

const handleCheckoutSessionCompleted = async (supabase: any, session: Stripe.Checkout.Session) => {
    const userId = session.metadata?.user_id;
    const planId = session.metadata?.plan_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId || !planId || !customerId || !subscriptionId) {
        console.error('[WEBHOOK] checkout.session.completed: Faltando metadados cruciais.', session.metadata);
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            plan_id: planId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: 'incomplete', // Will be updated by invoice.paid
        })
        .eq('id', userId);

    if (error) {
        console.error(`[WEBHOOK] checkout.session.completed: Erro ao atualizar o perfil para o utilizador ${userId}:`, error.message);
    } else {
        console.log(`[WEBHOOK] checkout.session.completed: Perfil do utilizador ${userId} atualizado com IDs do Stripe.`);
    }
}


const handleInvoicePaid = async (supabase: any, invoice: Stripe.Invoice) => {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) {
        console.log('[WEBHOOK] invoice.paid: Ignorado - Fatura não está associada a uma subscrição.');
        return;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan_id, minutes_balance')
        .eq('stripe_subscription_id', subscriptionId)
        .single();
    
    if (profileError || !profile) {
        console.error(`[WEBHOOK] invoice.paid: Perfil não encontrado para a subscrição ${subscriptionId}.`, profileError);
        return;
    }

    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, title, minutes')
        .eq('id', profile.plan_id)
        .single();

    if (planError || !plan) {
        console.error(`[WEBHOOK] invoice.paid: Plano ${profile.plan_id} não encontrado para o utilizador ${profile.id}.`, planError);
        return;
    }
    
    const newMinutes = (profile.minutes_balance || 0) + plan.minutes;

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
          minutes_balance: newMinutes,
          stripe_subscription_status: 'active',
          stripe_cancel_at_period_end: false,
        })
        .eq('id', profile.id);

    if (updateError) {
      console.error(`[WEBHOOK] invoice.paid: Erro de atualização do perfil para o utilizador ${profile.id}:`, updateError.message);
    } else {
      console.log(`[WEBHOOK] invoice.paid: Perfil do utilizador ${profile.id} atualizado. Novo saldo: ${newMinutes}. Status: active.`);
    }

    if (invoice.amount_paid > 0) {
        await supabase.from('invoices').insert({
            user_id: profile.id,
            plan_id: profile.plan_id,
            plan_title: plan.title,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100,
            status: 'Pago',
            pdf_url: invoice.invoice_pdf,
        });
        console.log(`[WEBHOOK] invoice.paid: Fatura criada com sucesso para o utilizador ${profile.id}.`);
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
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
        break;
    case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;
    default:
      // console.log(`[WEBHOOK] Evento não gerido: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
