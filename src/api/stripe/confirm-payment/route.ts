
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/**
 * @fileoverview API Route para confirmar um pagamento e finalizar a subscrição do lado do servidor.
 *
 * @description
 * **LÓGICA CRÍTICA - NÃO ALTERAR SEM AUTORIZAÇÃO**
 *
 * Este endpoint é chamado pelo frontend (`src/app/subscribe/page.tsx`) IMEDIATAMENTE após
 * um pagamento ser bem-sucedido no Stripe. A sua principal função é dar feedback instantâneo ao utilizador,
 * atualizando a nossa base de dados antes mesmo de o webhook do Stripe ser processado.
 * 
 * Este fluxo é um mecanismo de "confirmação otimista". Ele assume que o pagamento foi bem-sucedido
 * (verificado ao ir buscar o `paymentIntent`) e atualiza o estado da aplicação localmente para uma
 * experiência de utilizador instantânea. O webhook do Stripe serve como um mecanismo de reconciliação
 * e para eventos subsequentes (como renovações).
 *
 * FLUXO:
 * 1.  Recebe um `payment_intent_id` do frontend.
 * 2.  Usa a chave secreta do Stripe para ir buscar o objeto `PaymentIntent` completo, incluindo a fatura (`invoice`).
 * 3.  **VALIDAÇÃO CRÍTICA**: A partir da fatura, obtém a `Subscription` associada. Dos metadados da subscrição,
 *     extrai o `user_id` e o `plan_id`, garantindo que o pagamento corresponde ao utilizador autenticado e ao plano pretendido.
 * 4.  Usa um cliente Supabase com `service_role_key` (admin) para contornar as políticas de RLS de forma segura.
 * 5.  **AÇÕES IMEDIATAS**:
 *     a.  Atualiza a tabela `profiles` do utilizador, associando o `plan_id` e o `stripe_subscription_id`,
 *         e adiciona os minutos do plano ao `minutes_balance`.
 *     b.  Cria um novo registo na tabela `invoices`. **Importante**: O campo `id` NÃO é fornecido;
 *         a base de dados gera um UUID automaticamente para evitar conflitos de tipo.
 * 6.  Devolve uma resposta de sucesso. A página do perfil do utilizador, que está a ouvir em tempo real,
 *     reflete estas alterações instantaneamente.
 */
export async function POST(req: Request) {
  console.log("=============== [API] /confirm-payment START ===============");
  try {
    const { payment_intent_id } = await req.json();
    console.log(`[API] Received payment_intent_id: ${payment_intent_id}`);

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[API] Auth Error:', userError);
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }
    console.log(`[API] Authenticated user: ${user.id}`);

    if (!payment_intent_id) {
      console.error('[API] Missing payment_intent_id.');
      return NextResponse.json({ error: 'ID da intenção de pagamento em falta.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Chave secreta Stripe não configurada.");
    const stripe = getStripe(secretKey);

    console.log('[API] Retrieving PaymentIntent from Stripe...');
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id, {
      expand: ['invoice']
    });

    if (paymentIntent.status !== 'succeeded') {
        console.error(`[API] PaymentIntent status is not 'succeeded'. Status: ${paymentIntent.status}`);
        return NextResponse.json({ error: 'Pagamento não bem-sucedido.' }, { status: 400 });
    }
    console.log('[API] PaymentIntent successfully retrieved and is "succeeded".');
    
    // --- LÓGICA PARA SUBSCRIÇÕES ---
    if (paymentIntent.invoice) {
        const invoice = paymentIntent.invoice as Stripe.Invoice;
        if (invoice.subscription) {
            const subscriptionId = invoice.subscription as string;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const planId = subscription.metadata.plan_id;
            const userIdFromStripe = subscription.metadata.user_id;

            if (!planId || !userIdFromStripe || userIdFromStripe !== user.id) {
                console.error('[API] CRITICAL: Subscription metadata mismatch or missing. Plan ID:', planId, 'Stripe User ID:', userIdFromStripe, 'Supabase User ID:', user.id);
                return NextResponse.json({ error: 'Metadados de pagamento inválidos ou utilizador não correspondente.' }, { status: 400 });
            }
            console.log(`[API] Found planId in metadata: ${planId}`);
            
            const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
            
            const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('minutes, title').eq('id', planId).single();
            if (planError || !planData) {
                console.error('[API] Error fetching plan data:', planError);
                return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
            }
            
            const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').select('minutes_balance').eq('id', user.id).single();
            if (profileError) {
                console.error('[API] Error fetching profile data:', profileError);
                return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
            }

            const newBalance = (profileData.minutes_balance || 0) + planData.minutes;

            const { error: updateError } = await supabaseAdmin.from('profiles').update({ plan_id: planId, minutes_balance: newBalance, stripe_subscription_id: subscription.id, stripe_subscription_status: 'active' }).eq('id', user.id);
            if (updateError) {
                console.error("[API] CRITICAL: Error updating user profile:", updateError);
                return NextResponse.json({ error: "Erro ao atualizar o perfil do utilizador." }, { status: 500 });
            }

            const invoiceDataForDb = { user_id: user.id, plan_id: planId, plan_title: planData.title, date: new Date(invoice.created * 1000).toISOString(), amount: invoice.amount_paid / 100, status: 'Pago' };
            
            const { error: invoiceError } = await supabaseAdmin.from('invoices').insert(invoiceDataForDb);
            if (invoiceError) {
                console.error("[API] CRITICAL: Error inserting subscription invoice:", invoiceError);
                return NextResponse.json({ error: `Erro ao criar registo de fatura: ${invoiceError.message}`}, { status: 500 });
            }
            
            console.log("=============== [API] /confirm-payment END (Subscription Success) ===============");
            return NextResponse.json({ success: true, message: 'Conta atualizada e fatura de subscrição criada.' });
        }
    }
    
    // --- LÓGICA PARA AGENDAMENTOS (PAGAMENTOS ÚNICOS) ---
    if (paymentIntent.metadata.type === 'appointment') {
        const { service_name, duration, user_id, price } = paymentIntent.metadata;

        if(user_id !== user.id) {
            return NextResponse.json({ error: 'ID de utilizador não correspondente.' }, { status: 400 });
        }

        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

        const invoiceDataForDb = {
            id: paymentIntent.invoice as string || undefined,
            user_id: user_id,
            plan_title: `${service_name} - ${duration} min`,
            date: new Date(paymentIntent.created * 1000).toISOString(),
            amount: Number(price),
            status: 'paid',
        };

        console.log("[API] Preparing to insert APPOINTMENT invoice. Data:", JSON.stringify(invoiceDataForDb, null, 2));

        const { error: invoiceError } = await supabaseAdmin.from('invoices').insert(invoiceDataForDb);
        if (invoiceError) {
            console.error("[API] CRITICAL: Error inserting appointment invoice:", invoiceError);
            return NextResponse.json({ error: `Erro ao criar registo de fatura de agendamento: ${invoiceError.message}`}, { status: 500 });
        }
        
        console.log("=============== [API] /confirm-payment END (Appointment Success) ===============");
        return NextResponse.json({ success: true, message: 'Fatura de agendamento criada com sucesso.' });
    }

    console.error('[API] Unhandled payment type. No invoice or specific metadata found.');
    return NextResponse.json({ error: 'Tipo de pagamento não reconhecido.' }, { status: 400 });

  } catch (error: any) {
    console.error('[API] Unhandled exception in /confirm-payment:', error);
    console.log("=============== [API] /confirm-payment END (Error) ===============");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
