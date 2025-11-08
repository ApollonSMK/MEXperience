
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

const handleSubscriptionLogic = async (supabase: any, subscriptionId: string, customerId: string, metadata: { [key: string]: string }) => {
    console.log('[WEBHOOK] Iniciando a lógica de subscrição para subscriptionId:', subscriptionId);

    const { user_id, plan_id } = metadata;

    if (!user_id || !plan_id) {
        console.error(`[WEBHOOK] Metadata (user_id, plan_id) em falta. Recebido:`, metadata);
        return { error: `Metadata (user_id, plan_id) em falta.` };
    }
    console.log(`[WEBHOOK] Metadata encontrado: user_id=${user_id}, plan_id=${plan_id}`);

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan_id, minutes_balance')
        .eq('id', user_id)
        .single();

    if (profileError || !profile) {
        console.error(`[WEBHOOK] Perfil não encontrado para o utilizador ${user_id}.`, profileError);
        return { error: `Perfil não encontrado para o utilizador ${user_id}.` };
    }

    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, title, minutes')
        .eq('id', plan_id)
        .single();
    
    if (planError || !plan) {
        console.error(`[WEBHOOK] Plano ${plan_id} não encontrado para o utilizador ${user_id}.`, planError);
        return { error: `Plano ${plan_id} não encontrado.` };
    }
    console.log(`[WEBHOOK] Plano encontrado: ${plan.title} com ${plan.minutes} minutos.`);
    
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
        console.error(`[WEBHOOK] Erro ao atualizar o perfil para o utilizador ${user_id}:`, updateError.message);
        return { error: `Erro ao atualizar o perfil para o utilizador ${user_id}.` };
    }

    console.log(`[WEBHOOK] Perfil atualizado para o utilizador ${user_id}. Novo saldo: ${newMinutes}. Status: active.`);
    return { success: true };
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
        console.error(`[WEBHOOK] customer.subscription.deleted: Erro ao cancelar a subscrição na BD:`, error.message);
    } else {
        console.log(`[WEBHOOK] customer.subscription.deleted: Subscrição ${subscription.id} removida do perfil.`);
    }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('Stripe-Signature') as string;
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[WEBHOOK] Erro: STRIPE_WEBHOOK_SECRET não está definido nas variáveis de ambiente.");
    return new NextResponse('Stripe webhook secret is not configured.', { status: 500 });
  }

  const stripe = getStripeInstance();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ [WEBHOOK] Falha na verificação da assinatura do webhook: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  console.log(`[WEBHOOK] Evento recebido: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
            await handleSubscriptionLogic(
                supabase,
                session.subscription as string,
                session.customer as string,
                session.metadata || {}
            );
        }
        break;
    }
    case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
            const subscriptionId = invoice.subscription as string;
            const customerId = invoice.customer as string;

            // Tentativa de obter metadados de várias fontes para robustez
            let metadata = invoice.lines.data[0]?.metadata;
            if (!metadata || Object.keys(metadata).length === 0) {
                 const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                 metadata = subscription.metadata;
                 console.log("[WEBHOOK] Metadados obtidos do objeto de subscrição.", metadata);
            } else {
                 console.log("[WEBHOOK] Metadados obtidos das linhas da fatura.", metadata);
            }

            await handleSubscriptionLogic(supabase, subscriptionId, customerId, metadata);
        }
        break;
    }
    case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;
    default:
       console.log(`[WEBHOOK] Evento não tratado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
