
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

// Função para extrair metadados de forma robusta
const getMetadataFromPaymentIntent = (paymentIntent: Stripe.PaymentIntent): { userId: string | null, planId: string | null } => {
    if (paymentIntent.metadata.user_id && paymentIntent.metadata.plan_id) {
        return {
            userId: paymentIntent.metadata.user_id,
            planId: paymentIntent.metadata.plan_id
        }
    }
    return { userId: null, planId: null };
}

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

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`[WEBHOOK] Processando 'payment_intent.succeeded' para: ${paymentIntent.id}`);

            const { userId, planId } = getMetadataFromPaymentIntent(paymentIntent);
            
            if (!userId || !planId) {
                console.error(`[WEBHOOK] ERRO CRÍTICO: user_id ou plan_id em falta nos metadados para PaymentIntent ${paymentIntent.id}.`);
                return NextResponse.json({ received: true, error: "Metadados do PaymentIntent em falta." });
            }

            console.log(`[WEBHOOK] Metadados encontrados: user_id=${userId}, plan_id=${planId}`);

            try {
                // Obter detalhes do plano
                const { data: plan, error: planError } = await supabase
                    .from('plans').select('id, title, minutes').eq('id', planId).single();

                if (planError || !plan) {
                    throw new Error(`Plano ${planId} não encontrado.`);
                }
                 console.log(`[WEBHOOK] Plano encontrado: ${plan.title} (${plan.minutes} minutos).`);


                // Obter perfil do utilizador
                const { data: profile, error: profileError } = await supabase
                    .from('profiles').select('minutes_balance').eq('id', userId).single();
                
                if (profileError || !profile) {
                    throw new Error(`Perfil do utilizador ${userId} não encontrado.`);
                }

                const newMinutesBalance = (profile.minutes_balance || 0) + plan.minutes;
                
                // Obter a subscrição do Payment Intent se existir
                 const subscriptionId = paymentIntent.invoice ? (await stripe.invoices.retrieve(paymentIntent.invoice as string)).subscription : null;


                // Atualizar o perfil do utilizador
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        plan_id: planId,
                        minutes_balance: newMinutesBalance,
                        stripe_customer_id: paymentIntent.customer as string,
                        stripe_subscription_id: subscriptionId ? subscriptionId as string: null,
                        stripe_subscription_status: 'active',
                    })
                    .eq('id', userId);

                if (updateError) throw updateError;
                console.log(`[WEBHOOK] Perfil do utilizador ${userId} atualizado com sucesso.`);


                // Criar fatura
                const { error: invoiceError } = await supabase
                    .from('invoices').insert({
                        user_id: userId,
                        plan_id: planId,
                        plan_title: plan.title,
                        date: new Date(paymentIntent.created * 1000).toISOString(),
                        amount: (paymentIntent.amount || 0) / 100,
                        status: 'Pago',
                    });

                if (invoiceError) {
                    console.warn(`[WEBHOOK] Aviso: Não foi possível criar a fatura para ${userId}.`, invoiceError);
                }

            } catch (e: any) {
                console.error(`[WEBHOOK] Erro ao processar 'payment_intent.succeeded':`, e.message);
                return new NextResponse(`Internal Server Error: ${e.message}`, { status: 500 });
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            console.log(`[WEBHOOK] Processando 'customer.subscription.deleted' para a subscrição: ${subscription.id}`);
            
            const { error } = await supabase
                .from('profiles')
                .update({
                    plan_id: null,
                    stripe_subscription_status: 'canceled',
                })
                .eq('stripe_subscription_id', subscription.id);
            
            if (error) {
                console.error(`[WEBHOOK] Erro ao cancelar a subscrição na BD:`, error.message);
            }
            break;
        }

        default:
           console.log(`[WEBHOOK] Evento não tratado recebido: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
