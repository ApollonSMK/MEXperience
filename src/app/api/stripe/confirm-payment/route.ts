
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
 *        it executes the subscription logic.
 *     b. **APPOINTMENT FLOW**: If the `PaymentIntent` metadata contains `type: 'appointment'`,
 *        it executes the appointment logic.
 * 5.  All database operations use a Supabase Admin client to securely bypass RLS.
 */
export async function POST(req: Request) {
  console.log("=============== [API] /confirm-payment START ===============");
  let dataToInsert: any; // For improved error logging
  try {
    const { payment_intent_id } = await req.json();

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[API] Auth Error:', userError);
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }
    console.log(`[API] Authenticated user: ${user.id}`);

    if (!payment_intent_id) {
      return NextResponse.json({ error: 'ID da intenção de pagamento em falta.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Chave secreta Stripe não configurada.");
    const stripe = getStripe(secretKey);

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id, {
      expand: ['invoice']
    });

    if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Pagamento não bem-sucedido.' }, { status: 400 });
    }
    
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
    
    // --- SUBSCRIPTION Flow ---
    if (paymentIntent.invoice && typeof paymentIntent.invoice === 'object' && paymentIntent.invoice.subscription) {
      try {
        const invoice = paymentIntent.invoice as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const planId = subscription.metadata.plan_id;
        const userIdFromStripe = subscription.metadata.user_id;

        if (!planId || !userIdFromStripe || userIdFromStripe !== user.id) {
            return NextResponse.json({ error: 'Metadados de pagamento inválidos ou utilizador não correspondente.' }, { status: 400 });
        }
        
        const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('minutes, title').eq('id', planId).single();
        if (planError) throw planError;
        
        const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').select('minutes_balance').eq('id', user.id).single();
        if (profileError) throw profileError;

        const newBalance = (profileData.minutes_balance || 0) + planData.minutes;

        const { error: updateError } = await supabaseAdmin.from('profiles').update({ plan_id: planId, minutes_balance: newBalance, stripe_subscription_id: subscription.id, stripe_subscription_status: 'active' }).eq('id', user.id);
        if (updateError) throw updateError;

        const invoiceDataForDb = { user_id: user.id, plan_id: planId, plan_title: planData.title, date: new Date(invoice.created * 1000).toISOString(), amount: invoice.amount_paid / 100, status: 'pago', id: invoice.id };
        
        const { error: invoiceError } = await supabaseAdmin.from('invoices').upsert(invoiceDataForDb, { onConflict: 'id' });
        if (invoiceError) throw invoiceError;
        
        console.log("[API] /confirm-payment END (Subscription Success)");
        return NextResponse.json({ success: true, message: 'Conta atualizada e fatura de subscrição criada.' });

      } catch (error: any) {
        console.error('[API Subscription Logic Error]', error);
        return NextResponse.json({
            error: `Erro ao processar a subscrição: ${error.message}`,
            context: 'subscription',
        }, { status: 500 });
      }
    }
    
    // --- APPOINTMENT Flow ---
    if (paymentIntent.metadata.type === 'appointment') {
      try {
        const { service_name, duration, user_id, price } = paymentIntent.metadata;

        if(user_id !== user.id) {
            return NextResponse.json({ error: 'ID de utilizador não correspondente.' }, { status: 400 });
        }

        dataToInsert = {
            user_id: user_id,
            plan_title: `${service_name} - ${duration} min`,
            date: new Date(paymentIntent.created * 1000).toISOString(),
            amount: Number(price),
            status: 'Pago', // CORRECTED: from 'pago' (lowercase) to 'Pago' (uppercase) to match the enum.
        };

        console.log("[API] Preparing to INSERT APPOINTMENT invoice. Data:", JSON.stringify(dataToInsert, null, 2));
        
        const { error: invoiceError } = await supabaseAdmin.from('invoices').insert(dataToInsert);

        if (invoiceError) {
            throw invoiceError;
        }
        
        console.log("[API] /confirm-payment END (Appointment Success)");
        return NextResponse.json({ success: true, message: 'Fatura de agendamento criada com sucesso.' });
      
      } catch (error: any) {
        console.error('[API Appointment Logic Error]', error);
        return NextResponse.json({
            error: `Erro ao criar registo de fatura de agendamento: ${error.message}`,
            context: 'appointment',
            dataSent: dataToInsert, // Send back the data that failed
        }, { status: 500 });
      }
    }

    console.error('[API] Unhandled payment type.');
    return NextResponse.json({ error: 'Tipo de pagamento não reconhecido.' }, { status: 400 });

  } catch (error: any) {
    console.error('[API] Unhandled exception in /confirm-payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
