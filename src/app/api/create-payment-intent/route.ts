
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'O ID do plano é obrigatório.' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }

    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('price')
        .eq('id', planId)
        .single();
    
    if (planError || !plan) {
        return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
    }

    const amount = parseInt(plan.price.replace('€', ''), 10) * 100;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Chave secreta Stripe não configurada.");
    }
    const stripe = getStripe(secretKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.user_metadata.display_name,
        metadata: { supabaseUUID: user.id },
      });
      customerId = customer.id;
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'eur',
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
            user_id: user.id,
            plan_id: planId,
        },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('[API] /create-payment-intent: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
