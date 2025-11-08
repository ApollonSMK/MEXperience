
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

const getOrCreateStripeCustomer = async (userId: string, email: string, name: string) => {
  const supabase = await createSupabaseRouteClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching stripe_customer_id:', profileError);
  }

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe secret key not configured.");
  const stripe = getStripe(secretKey);

  try {
    const customer = await stripe.customers.create({
        email,
        name,
        metadata: { supabase_user_id: userId },
    });

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

    if (updateError) {
        console.error('Error saving new stripe_customer_id:', updateError);
    }
    return customer.id;
  } catch (stripeError) {
     console.error('Error creating stripe customer:', stripeError);
     const customers = await stripe.customers.list({ email: email, limit: 1 });
     if (customers.data.length > 0) {
        const existingCustomer = customers.data[0];
         const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: existingCustomer.id })
            .eq('id', userId);
        if (updateError) console.error('Error saving existing stripe_customer_id:', updateError);
        return existingCustomer.id;
     }
     throw stripeError;
  }
};


export async function POST(req: Request) {
  try {
    const { plan_id } = await req.json();
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Utilisateur non authentifié ou e-mail manquant.' }, { status: 401 });
    }
     
    if (!plan_id) {
      return NextResponse.json({ error: 'Dados de plano em falta.' }, { status: 400 });
    }
    
    const { data: planData, error: planError } = await supabase.from('plans').select('stripe_price_id').eq('id', plan_id).single();

    if (planError || !planData || !planData.stripe_price_id) {
        return NextResponse.json({ error: 'ID de preço do plano não encontrado ou inválido.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Chave secreta Stripe não configurada.");
    }
    const stripe = getStripe(secretKey);
    
    const customerId = await getOrCreateStripeCustomer(user.id, user.email, user.user_metadata.display_name || user.email);

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      customer: customerId,
      line_items: [{ price: planData.stripe_price_id, quantity: 1 }],
      mode: 'subscription',
      return_url: `${req.headers.get('origin')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: plan_id,
        }
      }
    });

    return NextResponse.json({ 
        clientSecret: session.client_secret,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
