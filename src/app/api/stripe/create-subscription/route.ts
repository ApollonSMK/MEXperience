
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

const getOrCreateStripeCustomer = async (userId: string, email: string) => {
  const supabase = await createSupabaseRouteClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching stripe_customer_id:', profileError);
    throw new Error('Could not fetch user Stripe customer ID.');
  }

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe secret key not configured.");
  const stripe = getStripe(secretKey);

  try {
    console.log(`Creating new Stripe customer for user ${userId}`);
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
        throw new Error('Failed to update profile with new Stripe customer ID.');
    }
    return customer.id;
  } catch (stripeError: any) {
     console.error('Error creating stripe customer:', stripeError);
     if (stripeError.code === 'resource_already_exists') {
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        if (customers.data.length > 0) {
            const existingCustomer = customers.data[0];
            console.log(`Found existing Stripe customer ${existingCustomer.id} for email ${email}. Linking...`);
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ stripe_customer_id: existingCustomer.id })
                .eq('id', userId);
            if (updateError) {
                console.error('Error saving existing stripe_customer_id:', updateError);
                throw new Error('Failed to link existing Stripe customer to profile.');
            }
            return existingCustomer.id;
        }
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
    
    const { data: planData, error: planError } = await supabase.from('plans').select('id, stripe_price_id').eq('id', plan_id).single();
    if (planError || !planData || !planData.stripe_price_id) {
        return NextResponse.json({ error: `ID de preço do plano não encontrado para: ${plan_id}` }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Chave secreta Stripe não configurada.");
    const stripe = getStripe(secretKey);
    
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: planData.stripe_price_id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: user.id,
        plan_id: planData.id,
      }
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent || !paymentIntent.client_secret) {
        throw new Error("A intenção de pagamento não foi encontrada na fatura mais recente.");
    }
    
    // Return the client secret and subscription ID to the frontend
    return NextResponse.json({ 
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API] /create-subscription: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
