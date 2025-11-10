
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
 * FLUXO:
 * 1.  Recebe um `payment_intent_id` do frontend.
 * 2.  Usa a chave secreta do Stripe para ir buscar o objeto `PaymentIntent` completo, incluindo a fatura (`invoice`).
 * 3.  **VALIDAÇÃO CRÍTICA**: A partir da fatura, obtém a `Subscription` associada. Dos metadados da subscrição,
 *     extrai o `user_id` e o `plan_id`, garantindo que o pagamento corresponde ao utilizador autenticado e ao plano pretendido.
 * 4.  Usa um cliente Supabase com `service_role_key` (admin) para contornar as políticas de RLS de forma segura.
 * 5.  **AÇÕES IMEDIATAS**:
 *     a.  Atualiza a tabela `profiles` do utilizador, associando o `plan_id` e o `stripe_subscription_id`,
 *         e adiciona os minutos do plano ao `minutes_balance`.
 *     b.  Cria um novo registo na tabela `invoices` com os detalhes da transação. **Importante**: O ID da fatura do Stripe é usado como chave para evitar duplicação pelo webhook.
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
    
    const invoice = paymentIntent.invoice as Stripe.Invoice;
    if (!invoice || !invoice.subscription) {
      console.error('[API] CRITICAL: Invoice or Subscription ID not found in PaymentIntent.');
      return NextResponse.json({ error: 'Dados da subscrição não encontrados no pagamento.' }, { status: 400 });
    }

    const subscriptionId = invoice.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const planId = subscription.metadata.plan_id;
    const userIdFromStripe = subscription.metadata.user_id;

    if (!planId || !userIdFromStripe || userIdFromStripe !== user.id) {
        console.error('[API] CRITICAL: Metadata mismatch or missing. Plan ID:', planId, 'Stripe User ID:', userIdFromStripe, 'Supabase User ID:', user.id);
        return NextResponse.json({ error: 'Metadados de pagamento inválidos ou utilizador não correspondente.' }, { status: 400 });
    }
    console.log(`[API] Found planId in metadata: ${planId}`);
    
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    console.log(`[API] Fetching plan details for plan_id: ${planId}`);
    const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('minutes, title')
        .eq('id', planId)
        .single();
    
    if (planError || !planData) {
        console.error('[API] Error fetching plan data:', planError);
        return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
    }
    console.log('[API] Successfully fetched plan data:', planData);


    console.log(`[API] Fetching profile for user_id: ${user.id}`);
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('minutes_balance')
        .eq('id', user.id)
        .single();
        
    if (profileError) {
         console.error('[API] Error fetching profile data:', profileError);
         return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }
    console.log('[API] Successfully fetched profile data:', profileData);

    const newBalance = (profileData.minutes_balance || 0) + planData.minutes;

    console.log(`[API] Preparing to update profile. New balance: ${newBalance}, Subscription ID: ${subscription.id}`);
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            plan_id: planId,
            minutes_balance: newBalance,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: 'active'
        })
        .eq('id', user.id);
        
    if (updateError) {
        console.error("[API] CRITICAL: Error updating user profile:", updateError);
        return NextResponse.json({ error: "Erro ao atualizar o perfil do utilizador." }, { status: 500 });
    }
    console.log("[API] User profile updated successfully.");

    // The 'id' column for invoices is a UUID generated by the database. 
    // We should not provide it on insert.
    // The Stripe Invoice ID is saved in a separate column to avoid duplication by the webhook.
    const invoiceDataForDb = {
        user_id: user.id,
        plan_id: planId,
        plan_title: planData.title,
        date: new Date(paymentIntent.created * 1000).toISOString(),
        amount: paymentIntent.amount_received / 100,
        status: 'Pago', // CORRECTED: from 'paid' to 'Pago' to match the enum
        id: invoice.id // Use Stripe's invoice ID as the primary key.
    };
    
    console.log("[API] Preparing to insert/upsert invoice. Data:", JSON.stringify(invoiceDataForDb, null, 2));

    const { error: invoiceError } = await supabaseAdmin.from('invoices').upsert(invoiceDataForDb, { onConflict: 'id' });

    if (invoiceError) {
        console.error("[API] CRITICAL: Error inserting invoice record:", invoiceError);
        // Return the specific Supabase error
        return NextResponse.json({ error: `Erro ao criar registo de fatura: ${invoiceError.message} (Código: ${invoiceError.code})`}, { status: 500 });
    }
    console.log("[API] Invoice record created successfully.");

    console.log("=============== [API] /confirm-payment END (Success) ===============");
    return NextResponse.json({ success: true, message: 'Conta atualizada e fatura criada com sucesso.' });

  } catch (error: any) {
    console.error('[API] Unhandled exception in /confirm-payment:', error);
    console.log("=============== [API] /confirm-payment END (Error) ===============");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
