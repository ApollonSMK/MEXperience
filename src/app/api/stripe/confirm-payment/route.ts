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
 * This endpoint's responsibility is to create an invoice record in the database after a successful
 * payment is confirmed on the client-side for both SUBSCRIPTIONS and one-time APPOINTMENTS.
 * It is NOT responsible for assigning plans or minutes. That logic is handled exclusively
 * by the 'invoice.payment_succeeded' webhook to ensure it's the single source of truth.
 *
 * FLOW:
 * 1.  Receives a `payment_intent_id` from the frontend.
 * 2.  Authenticates the user making the request.
 * 3.  Retrieves the `PaymentIntent` object from Stripe.
 * 4.  **CRITICAL ROUTING**: It inspects the `PaymentIntent` to decide the flow:
 *     a. **SUBSCRIPTION FLOW**: If the `PaymentIntent` has an associated `invoice.subscription`,
 *        it creates a subscription invoice record. It DOES NOT assign the plan or minutes here.
 *     b. **APPOINTMENT FLOW**: If the `PaymentIntent` metadata contains `type: 'appointment'`,
 *        it creates an appointment invoice record.
 * 5.  All database operations use a Supabase Admin client to securely bypass RLS.
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
        
        const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('title, minutes').eq('id', planId).single();
        if (planError) throw planError;
        
        // --- START: IMMEDIATE PROFILE UPDATE ---
        // This logic is added to provide immediate feedback to the user.
        // The webhook will still run but should be idempotent.
        if (invoice.billing_reason === 'subscription_create') {
            console.log("[API] /confirm-payment: First subscription payment detected. Updating profile immediately.");
            const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').select('minutes_balance').eq('id', user.id).single();
            if (profileError) throw profileError;

            const newBalance = (profileData.minutes_balance || 0) + planData.minutes;

            const { error: updateError } = await supabaseAdmin.from('profiles').update({
                plan_id: planId,
                minutes_balance: newBalance,
                stripe_subscription_id: subscription.id,
                stripe_subscription_status: subscription.status,
            }).eq('id', user.id);

            if (updateError) {
                console.error('[API] /confirm-payment: Failed to immediately update profile:', updateError);
                // Don't block the flow, just log the error. The webhook should eventually correct it.
            } else {
                console.log(`[API] /confirm-payment: Profile for user ${user.id} updated with plan ${planId} and new balance ${newBalance}.`);
            }
        }
        // --- END: IMMEDIATE PROFILE UPDATE ---

        const invoiceDataForDb = { 
            id: invoice.id,
            user_id: user.id, 
            plan_id: planId, 
            plan_title: planData.title, 
            date: new Date(invoice.created * 1000).toISOString(), 
            amount: invoice.amount_paid / 100, 
            status: 'Pago' // Correct enum value
        };
        
        // This endpoint's only job is to create the invoice record.
        // The webhook 'invoice.payment_succeeded' will handle plan assignment and minutes.
        const { error: invoiceError } = await supabaseAdmin.from('invoices').upsert(invoiceDataForDb, { onConflict: 'id' });
        if (invoiceError) throw invoiceError;
        
        console.log("[API] /confirm-payment END (Subscription Invoice Created)");
        return NextResponse.json({ success: true, message: 'Fatura de subscrição criada.' });

      } catch (error: any) {
        console.error('[API Subscription Logic Error]', error);
        return NextResponse.json({
            error: `Erro ao processar a fatura da subscrição: ${error.message}`
        }, { status: 500 });
      }
    }

    // --- MINUTE PACK Flow ---
    if (paymentIntent.metadata.type === 'minute_pack') {
        try {
            const { user_id, minutes_amount, pack_name, user_email } = paymentIntent.metadata;
            const minutesToAdd = parseInt(minutes_amount, 10);

            if (!user_id || isNaN(minutesToAdd)) {
                throw new Error("Metadados inválidos para pacote de minutos.");
            }

            // 1. Atualizar Saldo do Usuário
            const { data: profile, error: profileFetchError } = await supabaseAdmin
                .from('profiles')
                .select('minutes_balance')
                .eq('id', user_id)
                .single();
            
            if (profileFetchError) throw profileFetchError;

            const newBalance = (profile.minutes_balance || 0) + minutesToAdd;

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ minutes_balance: newBalance })
                .eq('id', user_id);

            if (updateError) throw updateError;

            // 2. Criar Fatura
            const invoiceDataForDb = {
                id: paymentIntent.id,
                user_id: user_id,
                plan_title: pack_name || `Pack ${minutesToAdd} Min`,
                date: new Date(paymentIntent.created * 1000).toISOString(),
                amount: paymentIntent.amount / 100,
                status: 'Pago',
            };

            const { error: invoiceError } = await supabaseAdmin.from('invoices').upsert(invoiceDataForDb, { onConflict: 'id' });
            if (invoiceError) throw invoiceError;

            console.log(`[API] /confirm-payment: Added ${minutesToAdd} minutes to user ${user_id}. New balance: ${newBalance}`);
            return NextResponse.json({ success: true, message: 'Pacote de minutos creditado com sucesso.' });

        } catch (error: any) {
             console.error('[API Minute Pack Logic Error]', error);
             return NextResponse.json({
                error: `Erro ao processar pacote de minutos: ${error.message}`
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
            id: paymentIntent.id, // Use payment intent ID as unique ID for the invoice
            user_id: user_id,
            plan_title: `${service_name} - ${duration} min`,
            date: new Date(paymentIntent.created * 1000).toISOString(),
            amount: Number(price),
            status: 'Pago', // Correct enum value,
        };
        
        const { error: invoiceError } = await supabaseAdmin.from('invoices').upsert(invoiceDataForDb, { onConflict: 'id' });

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