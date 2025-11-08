
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

const getOrCreateStripeCustomer = async (userId: string, email: string) => {
  const supabase = await createSupabaseRouteClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching stripe_customer_id:', profileError);
    // Don't throw, let it try to create a new one.
  }

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe secret key not configured.");
  const stripe = getStripe(secretKey);

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  if (updateError) {
    console.error('Error saving new stripe_customer_id:', updateError);
    // Even if this fails, we can proceed with the customer ID
  }

  return customer.id;
};


export async function POST(req: Request) {
  try {
    const { plan_id, user_id, user_email } = await req.json();

    if (!plan_id || !user_id || !user_email) {
      return NextResponse.json({ error: 'Dados de plano ou utilizador em falta.' }, { status: 400 });
    }
    
    const supabase = await createSupabaseRouteClient();
    const { data: planData, error: planError } = await supabase.from('plans').select('stripe_price_id').eq('id', plan_id).single();

    if (planError || !planData || !planData.stripe_price_id) {
        return NextResponse.json({ error: 'ID de preço do plano não encontrado ou inválido.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Chave secreta Stripe não configurada.");
    }
    const stripe = getStripe(secretKey);
    
    const customerId = await getOrCreateStripeCustomer(user_id, user_email);

    const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: 'subscription',
        customer: customerId,
        line_items: [
            {
                price: planData.stripe_price_id,
                quantity: 1,
            },
        ],
        subscription_data: {
            metadata: {
                user_id: user_id,
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
