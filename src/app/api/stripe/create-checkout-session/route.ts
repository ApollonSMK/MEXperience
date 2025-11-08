
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

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
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    const { plan_id, plan_price_id } = await req.json();

    if (!plan_price_id || !plan_id) {
      return NextResponse.json({ error: 'Dados de plano em falta.' }, { status: 400 });
    }
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Chave secreta Stripe não configurada.");
    }
    const stripe = getStripe(secretKey);
    
    const customerId = await getOrCreateStripeCustomer(user.id, user.email!);

    const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: 'subscription',
        customer: customerId,
        line_items: [
            {
                price: plan_price_id,
                quantity: 1,
            },
        ],
        subscription_data: {
            metadata: {
                user_id: user.id,
                plan_id: plan_id,
            }
        },
        return_url: `${req.headers.get('origin')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ 
        clientSecret: session.client_secret,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
