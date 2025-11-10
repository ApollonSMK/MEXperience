
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// This is a secure server-side endpoint.
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
    console.log('[API] PaymentIntent Metadata:', paymentIntent.metadata);
    
    // The PaymentIntent metadata should contain planId.
    const planId = paymentIntent.metadata.plan_id;
    
    if (!planId) {
        console.error('[API] CRITICAL: plan_id not found in PaymentIntent metadata.');
        return NextResponse.json({ error: 'Metadados de pagamento inválidos: plan_id em falta.' }, { status: 400 });
    }
    console.log(`[API] Found planId in metadata: ${planId}`);
    
    // Use the admin client to perform sensitive operations
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
        .select('minutes_balance, stripe_subscription_id')
        .eq('id', user.id)
        .single();
        
    if (profileError) {
         console.error('[API] Error fetching profile data:', profileError);
         return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }
    console.log('[API] Successfully fetched profile data:', profileData);


    const newBalance = (profileData.minutes_balance || 0) + planData.minutes;
    const stripeSubscriptionId = paymentIntent.invoice ? (paymentIntent.invoice as any).subscription : null;

    console.log(`[API] Preparing to update profile. New balance: ${newBalance}, Subscription ID: ${stripeSubscriptionId}`);
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            plan_id: planId,
            minutes_balance: newBalance,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_subscription_status: 'active'
        })
        .eq('id', user.id);
        
    if (updateError) {
        console.error("[API] CRITICAL: Error updating user profile:", updateError);
        return NextResponse.json({ error: "Erro ao atualizar o perfil do utilizador." }, { status: 500 });
    }
    console.log("[API] User profile updated successfully.");

    const invoiceData = {
        id: paymentIntent.id, // Using Payment Intent ID as invoice ID
        user_id: user.id,
        plan_id: planId,
        plan_title: planData.title,
        date: new Date(paymentIntent.created * 1000).toISOString(),
        amount: paymentIntent.amount_received / 100,
        status: 'paid'
    };
    
    console.log("[API] Preparing to insert invoice. Data:", JSON.stringify(invoiceData, null, 2));

    const { error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert(invoiceData);

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

