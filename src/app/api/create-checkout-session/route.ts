

import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { priceId, planId } = await request.json();
    if (!priceId || !planId) {
      return NextResponse.json({ error: 'Os IDs do preço e do plano são obrigatórios.' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Chave secreta Stripe não configurada.");
    }
    const stripe = getStripe(secretKey);

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.user_metadata.display_name || user.email,
        metadata: { supabaseUUID: user.id },
      });
      customerId = customer.id;
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // CRUCIAL: Anexar os metadados à sessão de checkout
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
      success_url: `${baseUrl}/profile/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/abonnements`,
    });

    if (session.url) {
      return NextResponse.json({ redirectUrl: session.url });
    } else {
      return NextResponse.json({ error: 'Não foi possível criar a sessão de checkout.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
