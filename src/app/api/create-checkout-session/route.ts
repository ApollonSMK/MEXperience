
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
    
    // Fetch Stripe keys from the database
    const { data: gatewaySettings, error: gatewayError } = await supabase
        .from('gateway_settings')
        .select('secret_key, test_mode')
        .eq('id', 'stripe')
        .single();
    
    if (gatewayError || !gatewaySettings?.secret_key) {
        throw new Error("Clé secrète Stripe non configurée.");
    }
    
    const stripe = getStripe(gatewaySettings.secret_key);

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // If user is not a Stripe customer yet, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.user_metadata.display_name,
        metadata: {
          supabaseUUID: user.id,
        },
      });
      customerId = customer.id;
      
      // Save the new customer ID to our database
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }
    
    // Create the subscription
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          plan_id: planId,
          user_id: user.id,
        }
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent?.client_secret) {
        throw new Error("Não foi possível inicializar o pagamento.");
    }
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
    
  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro geral no bloco catch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
