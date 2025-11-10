
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
 * FLOW:
 * 1.  Receives a `payment_intent_id` from the frontend.
 * 2.  Authenticates the user making the request.
 * 3.  Retrieves the `PaymentIntent` object from Stripe.
 * 4.  **CRITICAL ROUTING**: It inspects the `PaymentIntent` to decide the flow:
 *     a. **SUBSCRIPTION FLOW**: If the `PaymentIntent` has an associated `invoice.subscription`,
 *        it updates the user's profile and creates a subscription invoice.
 *     b. **APPOINTMENT FLOW**: If the `PaymentIntent` metadata contains `type: 'appointment'`,
 *        it creates an appointment invoice.
 * 5.  For both flows, the `id` of the invoice is NOT provided, allowing the database to generate the UUID.
 */
export async function POST(req: Request) {
  console.log("=============== [API] /confirm-payment START ===============");
  try {
    const { payment_intent_id } = await req.json();

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[API] Auth Error:', userError);
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }

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
        
        const invoiceDataForDb = { 
            user_id: user.id, 
            plan_id: planId, 
            plan_title: planData.title, 
            date: new Date(invoice.created * 1000).toISOString(), 
            amount: invoice.amount_paid / 100, 
            status: 'Pago' // Use 'Pago' as it's the correct enum value
        };
        
        const { error: invoiceError } = await supabaseAdmin.from('invoices').insert(invoiceDataForDb);
        if (invoiceError) throw invoiceError;
        
        console.log("[API] /confirm-payment END (Subscription Success)");
        return NextResponse.json({ success: true, message: 'Conta atualizada e fatura de subscrição criada.' });

      } catch (error: any) {
        console.error('[API Subscription Logic Error]', error);
        return NextResponse.json({
            error: `Erro ao processar a subscrição: ${error.message}`
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
        
        const invoiceDataForDb = {
            user_id: user_id,
            plan_title: `${service_name} - ${duration} min`,
            date: new Date(paymentIntent.created * 1000).toISOString(),
            amount: Number(price),
            status: 'Pago', // Use 'Pago' as it's the correct enum value
        };
        
        const { error: invoiceError } = await supabaseAdmin.from('invoices').insert(invoiceDataForDb);

        if (invoiceError) {
            throw invoiceError;
        }
        
        console.log("[API] /confirm-payment END (Appointment Success)");
        return NextResponse.json({ success: true, message: 'Fatura de agendamento criada com sucesso.' });
      
      } catch (error: any) {
        console.error('[API Appointment Logic Error]', error);
        return NextResponse.json({
            error: `Erro ao criar registo de fatura de agendamento: ${error.message}`
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
