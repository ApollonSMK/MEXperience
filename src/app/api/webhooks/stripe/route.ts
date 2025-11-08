
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const getStripeInstance = (): Stripe => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY não está definida.');
    return new Stripe(secretKey, { apiVersion: '2024-06-20' });
};

const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
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

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`[WEBHOOK] Processando 'checkout.session.completed' para a sessão: ${session.id}`);

            const { user_id, plan_id } = session.metadata || {};
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;

            if (!user_id || !plan_id) {
                console.error(`[WEBHOOK] ERRO CRÍTICO: user_id (${user_id}) ou plan_id (${plan_id}) em falta nos metadados da sessão.`);
                return NextResponse.json({ received: true, error: "Metadados da sessão em falta." });
            }

            console.log(`[WEBHOOK] Metadados encontrados: user_id=${user_id}, plan_id=${plan_id}`);

            try {
                // 1. Obter os detalhes do plano
                const { data: plan, error: planError } = await supabase
                    .from('plans').select('id, title, minutes').eq('id', plan_id).single();

                if (planError || !plan) {
                    console.error(`[WEBHOOK] Plano ${plan_id} não encontrado na base de dados.`, planError);
                    return NextResponse.json({ received: true, error: `Plano ${plan_id} não encontrado.` });
                }
                console.log(`[WEBHOOK] Plano encontrado: ${plan.title} (${plan.minutes} minutos).`);

                // 2. Obter o perfil do utilizador
                const { data: profile, error: profileError } = await supabase
                    .from('profiles').select('minutes_balance').eq('id', user_id).single();
                
                if (profileError || !profile) {
                    console.error(`[WEBHOOK] Perfil do utilizador ${user_id} não encontrado.`, profileError);
                    return NextResponse.json({ received: true, error: `Perfil ${user_id} não encontrado.` });
                }
                
                const newMinutesBalance = (profile.minutes_balance || 0) + plan.minutes;
                console.log(`[WEBHOOK] A atualizar saldo para ${user_id}. Saldo antigo: ${profile.minutes_balance || 0}, Saldo novo: ${newMinutesBalance}`);

                // 3. Atualizar o perfil do utilizador
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        plan_id: plan_id,
                        minutes_balance: newMinutesBalance,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        stripe_subscription_status: 'active',
                        stripe_cancel_at_period_end: false,
                        stripe_subscription_cancel_at: null,
                    })
                    .eq('id', user_id);

                if (updateError) {
                    console.error(`[WEBHOOK] Erro ao atualizar o perfil para ${user_id}:`, updateError);
                    return NextResponse.json({ received: true, error: "Erro ao atualizar perfil." });
                }

                console.log(`[WEBHOOK] Perfil do utilizador ${user_id} atualizado com sucesso.`);

                // 4. Inserir fatura
                const { error: invoiceError } = await supabase
                    .from('invoices').insert({
                        user_id: user_id,
                        plan_id: plan_id,
                        plan_title: plan.title,
                        date: new Date(session.created * 1000).toISOString(),
                        amount: (session.amount_total || 0) / 100,
                        status: 'Pago',
                    });

                if (invoiceError) {
                    console.warn(`[WEBHOOK] Aviso: Não foi possível criar a fatura para o utilizador ${user_id}.`, invoiceError);
                } else {
                    console.log(`[WEBHOOK] Fatura criada com sucesso para o utilizador ${user_id}.`);
                }

            } catch (e: any) {
                console.error('[WEBHOOK] Exceção ao processar checkout.session.completed:', e.message);
                return new NextResponse('Internal Server Error in webhook processing', { status: 500 });
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
                    stripe_cancel_at_period_end: null, 
                    stripe_subscription_id: null,
                    stripe_subscription_cancel_at: null,
                 })
                .eq('stripe_subscription_id', subscription.id);
            
            if (error) {
                console.error(`[WEBHOOK] Erro ao cancelar a subscrição na BD:`, error.message);
            } else {
                console.log(`[WEBHOOK] Subscrição ${subscription.id} removida do perfil.`);
            }
            break;
        }
        default:
           console.log(`[WEBHOOK] Evento não tratado recebido: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
