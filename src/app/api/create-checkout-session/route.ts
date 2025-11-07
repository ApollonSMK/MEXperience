import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json();
    if (!priceId) {
      return NextResponse.json({ error: 'priceId est requis.' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }
    
    // Fetch Stripe keys from the database
    const { data: gatewaySettings, error: gatewayError } = await supabase
        .from('gateway_settings')
        .select('secret_key')
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
        email: user.email,
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
    
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
    });

    const latestInvoice = subscription.latest_invoice as any;

    return NextResponse.json({
      sessionId: subscription.id,
      clientSecret: latestInvoice.payment_intent.client_secret,
    });
    
  } catch (error: any) {
    console.error('Erreur API Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
