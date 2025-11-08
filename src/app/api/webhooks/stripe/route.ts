
import { NextResponse } from 'next/headers';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const getStripeInstance = (): Stripe => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY não está definida.');
    return new Stripe(secretKey, { apiVersion: '2024-06-20', typescript: true });
};

const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
};

const activateSubscription = async (userId: string, planId: string, customerId: string, subscriptionId: string) => {
    console.log(`[WEBHOOK] Iniciando ativação: Utilizador ${userId}, Plano ${planId}`);
    const supabase = getSupabaseAdminClient();

    try {
        const { data: plan, error: planError } = await supabase
            .from('plans').select('id, title, minutes, price').eq('id', planId).single();
        if (planError || !plan) throw new Error(`[WEBHOOK] ERRO: Plano ${planId} não encontrado. ${planError?.message}`);

        const { data: profile, error: profileError } = await supabase
            .from('profiles').select('minutes_balance').eq('id', userId).single();
        if (profileError || !profile) throw new Error(`[WEBHOOK] ERRO: Perfil do utilizador ${userId} não encontrado. ${profileError?.message}`);
        
        const newMinutesBalance = (profile.minutes_balance || 0) + plan.minutes;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                plan_id: planId,
                minutes_balance: newMinutesBalance,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_subscription_status: 'active',
                stripe_cancel_at_period_end: false,
                stripe_subscription_cancel_at: null,
            })
            .eq('id', userId);
        if (updateError) throw new Error(`[WEBHOOK] ERRO: Falha ao atualizar o perfil do utilizador ${userId}. ${updateError.message}`);
        
        console.log(`[WEBHOOK] SUCESSO: Perfil do utilizador ${userId} atualizado para o plano ${plan.title}. Saldo de minutos: ${newMinutesBalance}`);

        const priceNumber = parseFloat(plan.price.replace('€', ''));
        const { error: invoiceError } = await supabase.from('invoices').insert({
            user_id: userId,
            plan_id: planId,
            plan_title: plan.title,
            date: new Date().toISOString(),
            amount: isNaN(priceNumber) ? 0 : priceNumber,
            status: 'Pago',
        });
        if (invoiceError) console.warn(`[WEBHOOK] Aviso: Não foi possível criar a fatura para ${userId}.`, invoiceError.message);
        else console.log(`[WEBHOOK] Fatura criada para o utilizador ${userId}.`);

    } catch (e: any) {
        console.error(`[WEBHOOK] ERRO FATAL ao processar a ativação:`, e.message);
        throw e;
    }
};

const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
    const subscriptionId = invoice.subscription;
    if (typeof subscriptionId !== 'string') {
        console.log('[WEBHOOK] Invoice.payment_succeeded sem ID de subscrição válido.');
        return;
    }

    const stripe = getStripeInstance();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const userId = subscription.metadata.user_id;
    const planId = subscription.metadata.plan_id;
    const customerId = invoice.customer;

    if (!userId || !planId || !customerId || typeof customerId !== 'string') {
        console.error('[WEBHOOK] ERRO: Metadados (user_id, plan_id) ou ID de cliente em falta na subscrição.', { userId, planId, customerId });
        throw new Error('Metadados essenciais em falta na subscrição.');
    }

    await activateSubscription(userId, planId, customerId, subscriptionId);
};


export async function POST(request: Request) {
    const body = await request.text();
    const signature = headers().get('Stripe-Signature') as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("[WEBHOOK] Erro: STRIPE_WEBHOOK_SECRET não está definido.");
        return new NextResponse('Stripe webhook secret is not configured.', { status: 500 });
    }

    const stripe = getStripeInstance();
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ [WEBHOOK] Falha na verificação da assinatura: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    console.log(`[WEBHOOK] Evento recebido: ${event.type}`);

    try {
        switch (event.type) {
             case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log(`[WEBHOOK] Processando 'invoice.payment_succeeded': ${invoice.id}`);
                // Only process for subscriptions, not one-off payments
                if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
                    await handleInvoicePaymentSucceeded(invoice);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log(`[WEBHOOK] Processando 'customer.subscription.deleted' para a subscrição: ${subscription.id}`);
                const supabase = getSupabaseAdminClient();
                const { error } = await supabase
                    .from('profiles')
                    .update({ 
                        plan_id: null, 
                        stripe_subscription_status: 'canceled',
                        stripe_cancel_at_period_end: false,
                        stripe_subscription_cancel_at: null,
                     })
                    .eq('stripe_subscription_id', subscription.id);
                
                if (error) console.error(`[WEBHOOK] Erro ao cancelar a subscrição na BD:`, error.message);
                else console.log(`[WEBHOOK] Subscrição ${subscription.id} removida do perfil do utilizador.`);
                break;
            }
             case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log(`[WEBHOOK] Processando 'customer.subscription.updated': ${subscription.id}`);
                
                const supabase = getSupabaseAdminClient();
                const updatePayload: any = {
                    stripe_subscription_status: subscription.status,
                    stripe_cancel_at_period_end: subscription.cancel_at_period_end,
                    stripe_subscription_cancel_at: subscription.cancel_at,
                };
                 if (subscription.status !== 'active' && !subscription.cancel_at_period_end) {
                    updatePayload.plan_id = null; // If subscription is no longer active, remove plan
                }
                
                const { error } = await supabase
                    .from('profiles')
                    .update(updatePayload)
                    .eq('stripe_subscription_id', subscription.id);

                if (error) console.error(`[WEBHOOK] Erro ao atualizar o estado da subscrição:`, error.message);
                else console.log(`[WEBHOOK] Estado da subscrição ${subscription.id} atualizado para ${subscription.status}.`);
                break;
            }
            default:
               console.log(`[WEBHOOK] Evento não tratado recebido: ${event.type}`);
        }
    } catch (error: any) {
        console.error(`[WEBHOOK] Erro geral ao processar o evento ${event.type}:`, error.message);
        return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
