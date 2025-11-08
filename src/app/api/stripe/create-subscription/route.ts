
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }

    const { plan_price_id, plan_id } = await req.json();

    if (!plan_price_id || !plan_id) {
      return NextResponse.json({ error: 'Dados de plano em falta.' }, { status: 400 });
    }
    
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

    // 1. Cria o cliente se ainda não existir
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata?.display_name,
            metadata: { supabaseUUID: user.id },
        });
        customerId = customer.id;
        
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
    }

    // 2. Cria a subscrição
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan_price_id }],
        metadata: { plan_id, user_id: user.id },
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
    });

    return NextResponse.json(subscription, { status: 200 });

  } catch (error: any) {
    console.error('[API] /create-subscription: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
