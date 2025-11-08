

import { NextResponse } from 'next/server';
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

const handleSubscriptionLogic = async (metadata: { user_id?: string, plan_id?: string }, customerId: string, subscriptionId: string | null, paymentStatus: string, invoice: any) => {
    if (!metadata.user_id || !metadata.plan_id) {
        console.error('[WEBHOOK] ERRO: user_id ou plan_id em falta nos metadados.');
        return;
    }
    const { user_id, plan_id } = metadata;
    const supabase = getSupabaseAdminClient();

    try {
        const { data: plan, error: planError } = await supabase
            .from('plans').select('id, title, minutes').eq('id', plan_id).single();
        if (planError || !plan) throw new Error(`Plano ${plan_id} não encontrado.`);

        const { data: profile, error: profileError } = await supabase
            .from('profiles').select('minutes_balance').eq('id', user_id).single();
        if (profileError || !profile) throw new Error(`Perfil do utilizador ${user_id} não encontrado.`);
        
        const newMinutesBalance = (profile.minutes_balance || 0) + plan.minutes;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                plan_id: plan_id,
                minutes_balance: newMinutesBalance,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_subscription_status: 'active',
            })
            .eq('id', user_id);
        if (updateError) throw updateError;
        
        console.log(`[WEBHOOK] Perfil do utilizador ${user_id} atualizado com sucesso para o plano ${plan.title}.`);

        const { error: invoiceError } = await supabase.from('invoices').insert({
            user_id: user_id,
            plan_id: plan_id,
            plan_title: plan.title,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100,
            status: 'Pago',
            pdf_url: invoice.invoice_pdf,
        });
        if (invoiceError) console.warn(`[WEBHOOK] Aviso: Não foi possível criar a fatura para ${user_id}.`, invoiceError);

    } catch (e: any) {
        console.error(`[WEBHOOK] Erro detalhado ao processar a lógica da subscrição:`, e.message);
        throw e; // Re-throw para que a resposta seja 500
    }
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

    const supabase = getSupabaseAdminClient();

    try {
        switch (event.type) {
             case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log(`[WEBHOOK] Processando 'payment_intent.succeeded': ${paymentIntent.id}`);
                
                if (paymentIntent.invoice) {
                    const invoice = await stripe.invoices.retrieve(paymentIntent.invoice as string);
                    if (invoice.subscription) {
                         const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
                        await handleSubscriptionLogic(
                            subscription.metadata,
                            paymentIntent.customer as string,
                            invoice.subscription as string,
                            'paid',
                            invoice
                        );
                    }
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log(`[WEBHOOK] Processando 'invoice.payment_succeeded': ${invoice.id}`);
                if (invoice.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
                    await handleSubscriptionLogic(
                        subscription.metadata,
                        invoice.customer as string,
                        invoice.subscription as string,
                        'paid',
                        invoice
                    );
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log(`[WEBHOOK] Processando 'customer.subscription.deleted' para a subscrição: ${subscription.id}`);
                
                const { error } = await supabase
                    .from('profiles')
                    .update({ plan_id: null, stripe_subscription_status: 'canceled' })
                    .eq('stripe_subscription_id', subscription.id);
                
                if (error) console.error(`[WEBHOOK] Erro ao cancelar a subscrição na BD:`, error.message);
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
