
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/**
 * @fileoverview API Route to confirm a payment and finalize server-side actions.
 * @description
 * **CRITICAL LOGIC - DO NOT ALTER WITHOUT AUTHORIZATION**
 *
 * This endpoint is the single source of truth for creating invoices after a successful payment,
 * for both SUBSCRIPTIONS and one-time APPOINTMENTS. It's called by the frontend immediately
 * after Stripe confirms a payment.
 *
 * It uses a "optimistic confirmation" flow. It retrieves the PaymentIntent from Stripe to
 * verify its success and then immediately updates our database, providing instant feedback
 * to the user without waiting for the asynchronous Stripe webhook.
 *
 * FLOW:
 * 1.  Receives a `payment_intent_id` from the frontend.
 * 2.  Authenticates the user making the request.
 * 3.  Uses the Stripe secret key to retrieve the full `PaymentIntent` object.
 * 4.  **CRITICAL ROUTING**: It inspects the `PaymentIntent` to decide the flow:
 *     a. **SUBSCRIPTION FLOW**: If the `PaymentIntent` is associated with a `Subscription` (via its invoice),
 *        it extracts `user_id` and `plan_id` from the subscription's metadata. It then:
 *        - Updates the user's `profiles` table with the new plan and minutes.
 *        - Creates an `invoices` record for the subscription.
 *     b. **APPOINTMENT FLOW**: If the `PaymentIntent` metadata contains `type: 'appointment'`,
 *        it extracts `user_id`, `service_name`, `price`, etc. It then:
 *        - Creates an `invoices` record for the one-time service payment.
 * 5.  All database operations use a Supabase Admin client to securely bypass RLS.
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
    
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
    
    // --- ROUTING LOGIC ---

    // 1. SUBSCRIPTION Flow (check for associated invoice and subscription)
    if (paymentIntent.invoice && typeof paymentIntent.invoice === 'object' && paymentIntent.invoice.subscription) {
        const invoice = paymentIntent.invoice as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const planId = subscription.metadata.plan_id;
        const userIdFromStripe = subscription.metadata.user_id;

        if (!planId || !userIdFromStripe || userIdFromStripe !== user.id) {
            console.error('[API] CRITICAL: Subscription metadata mismatch or missing. Plan ID:', planId, 'Stripe User ID:', userIdFromStripe, 'Supabase User ID:', user.id);
            return NextResponse.json({ error: 'Metadados de pagamento inválidos ou utilizador não correspondente.' }, { status: 400 });
        }
        console.log(`[API] Subscription Flow: Found planId in metadata: ${planId}`);
        
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

        const invoiceDataForDb = { user_id: user.id, plan_id: planId, plan_title: planData.title, date: new Date(invoice.created * 1000).toISOString(), amount: invoice.amount_paid / 100, status: 'paid', id: invoice.id };
        
        const { error: invoiceError } = await supabaseAdmin.from('invoices').upsert(invoiceDataForDb, { onConflict: 'id' });
        if (invoiceError) {
            console.error("[API] CRITICAL: Error inserting subscription invoice:", invoiceError);
            // Non-critical, but log it. The webhook will eventually handle this.
        }
        
        console.log("=============== [API] /confirm-payment END (Subscription Success) ===============");
        return NextResponse.json({ success: true, message: 'Conta atualizada e fatura de subscrição criada.' });
    }
    
    // 2. APPOINTMENT Flow (check for 'appointment' type in metadata)
    if (paymentIntent.metadata.type === 'appointment') {
        const { service_name, duration, user_id, price } = paymentIntent.metadata;

        if(user_id !== user.id) {
            return NextResponse.json({ error: 'ID de utilizador não correspondente.' }, { status: 400 });
        }
        console.log(`[API] Appointment Flow: Found metadata for service: ${service_name}`);

        const invoiceDataForDb = {
            id: paymentIntent.id, // Use payment intent ID as the unique invoice ID
            user_id: user_id,
            plan_title: `${service_name} - ${duration} min`,
            date: new Date(paymentIntent.created * 1000).toISOString(),
            amount: Number(price),
            status: 'paid',
        };

        console.log("[API] Preparing to insert APPOINTMENT invoice. Data:", JSON.stringify(invoiceDataForDb, null, 2));

        const { error: invoiceError } = await supabaseAdmin.from('invoices').upsert(invoiceDataForDb, { onConflict: 'id' });
        if (invoiceError) {
            console.error("[API] CRITICAL: Error inserting appointment invoice:", invoiceError);
            return NextResponse.json({ error: `Erro ao criar registo de fatura de agendamento: ${invoiceError.message}`}, { status: 500 });
        }
        
        console.log("=============== [API] /confirm-payment END (Appointment Success) ===============");
        return NextResponse.json({ success: true, message: 'Fatura de agendamento criada com sucesso.' });
    }

    console.error('[API] Unhandled payment type. No invoice.subscription or appointment metadata found.');
    return NextResponse.json({ error: 'Tipo de pagamento não reconhecido.' }, { status: 400 });

  } catch (error: any) {
    console.error('[API] Unhandled exception in /confirm-payment:', error);
    console.log("=============== [API] /confirm-payment END (Error) ===============");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

    