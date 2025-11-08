
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(request: Request) {
  try {
    const { priceId, planId } = await request.json();
    if (!priceId || !planId) {
      return NextResponse.json({ error: 'priceId e planId são requisitados.' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilizador non authentifié.' }, { status: 401 });
    }
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Clé secrète Stripe non configurée.");
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
        metadata: {
          supabaseUUID: user.id,
        },
      });
      customerId = customer.id;
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }
    
    // This is the correct way, we create a checkout session and pass metadata there.
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customerId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        // CRUCIAL: Pass metadata here. This is what the webhook will receive.
        metadata: {
            user_id: user.id,
            plan_id: planId,
        },
        success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.headers.get('origin')}/checkout/cancel`,
    });
    
    if (!session.url) {
        throw new Error("Não foi possível criar a sessão de checkout do Stripe.");
    }

    // Instead of returning a client secret, we return the session ID.
    // The client will then redirect to Stripe's hosted checkout page.
    return NextResponse.json({ sessionId: session.id, redirectUrl: session.url });
    
  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro geral no bloco catch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
