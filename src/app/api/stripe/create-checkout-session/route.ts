
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

// Helper function to find or create a Stripe customer
const getOrCreateStripeCustomer = async (userId: string, email: string) => {
  const supabase = await createSupabaseRouteClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe secret key not configured.");
  const stripe = getStripe(secretKey);

  const customer = await stripe.customers.create({
    email,
    metadata: { supabaseUUID: userId },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
};


export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }

    const { plan_price_id, plan_id, user_id } = await req.json();

    if (!plan_price_id || !plan_id || !user_id) {
      return NextResponse.json({ error: 'Dados de plano ou de utilizador em falta.' }, { status: 400 });
    }
    
    if(user.id !== user_id) {
      return NextResponse.json({ error: 'Incompatibilidade de ID de utilizador.' }, { status: 403 });
    }
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Chave secreta Stripe não configurada.");
    }
    const stripe = getStripe(secretKey);
    
    const customerId = await getOrCreateStripeCustomer(user.id, user.email!);

    // Check for existing active subscriptions for this customer and plan
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        price: plan_price_id,
        status: 'active',
    });

    if (subscriptions.data.length > 0) {
        return NextResponse.json({ error: 'Você já tem uma subscrição ativa para este plano.' }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan_price_id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            user_id: user.id,
            plan_id: plan_id,
        }
    });

    const latestInvoice = subscription.latest_invoice as any;

    return NextResponse.json({ 
        clientSecret: latestInvoice.payment_intent.client_secret,
        subscriptionId: subscription.id
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
