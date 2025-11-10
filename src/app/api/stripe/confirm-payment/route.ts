
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// This is a secure server-side endpoint.
export async function POST(req: Request) {
  try {
    const { payment_intent_id } = await req.json();

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }

    if (!payment_intent_id) {
      return NextResponse.json({ error: 'ID da intenção de pagamento em falta.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Chave secreta Stripe não configurada.");
    const stripe = getStripe(secretKey);

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Pagamento não bem-sucedido.' }, { status: 400 });
    }
    
    const planId = paymentIntent.metadata.planId;
    
    if (!planId) {
        return NextResponse.json({ error: 'Metadados de pagamento inválidos ou incompatíveis.' }, { status: 400 });
    }
    
    // Use the admin client to perform sensitive operations
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('minutes, title')
        .eq('id', planId)
        .single();
    
    if (planError || !planData) {
        return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
    }

    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('minutes_balance')
        .eq('id', user.id)
        .single();
        
    if (profileError) {
         return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    const newBalance = (profileData.minutes_balance || 0) + planData.minutes;

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            plan_id: planId,
            minutes_balance: newBalance,
            stripe_subscription_status: 'active' // Manually set status to active
        })
        .eq('id', user.id);
        
    if (updateError) {
        console.error("Error updating profile on payment confirmation:", updateError);
        return NextResponse.json({ error: "Erro ao atualizar o perfil do utilizador." }, { status: 500 });
    }

    const invoiceData = {
        id: paymentIntent.id, // Using Payment Intent ID as invoice ID
        user_id: user.id,
        plan_id: planId,
        plan_title: planData.title,
        date: new Date(paymentIntent.created * 1000).toISOString(),
        amount: paymentIntent.amount_received / 100,
        status: 'paid'
    };

    const { error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert(invoiceData);

    if (invoiceError) {
        // This is a critical error in this flow, return an error
        console.error("Error creating invoice record on confirmation:", invoiceError);
        return NextResponse.json({ error: 'Erro ao criar registo de fatura.'}, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Conta atualizada e fatura criada com sucesso.' });

  } catch (error: any) {
    console.error('[API] /confirm-payment: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
