
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
    const { plan_id, payment_method } = await req.json();
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

    // Attach the payment method to the customer
    if(payment_method) {
        await stripe.paymentMethods.attach(payment_method, { customer: customerId });
        await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: payment_method },
        });
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: planData.stripe_price_id }],
      payment_settings: { 
          payment_method_options: {
            card: { request_three_d_secure: 'any' },
          },
          save_default_payment_method: 'on_subscription' 
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: user.id,
        plan_id: planData.id,
      }
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    if (paymentIntent?.status === 'requires_action' && paymentIntent.next_action?.type === 'use_stripe_sdk') {
      // This is for 3D Secure authentication. We send the client secret to the frontend.
      console.log(`[API] 3DSecure required for PaymentIntent ${paymentIntent.id}. Sending client_secret.`);
      return NextResponse.json({ 
        requires_action: true,
        client_secret: paymentIntent.client_secret,
      }, { status: 200 });
    } else if (paymentIntent?.status === 'succeeded') {
      // Payment was successful immediately (e.g., no 3DS required)
      console.log(`[API] PaymentIntent ${paymentIntent.id} succeeded immediately.`);
      return NextResponse.json({ success: true, subscriptionId: subscription.id }, { status: 200 });
    } else {
      // Handle other statuses if necessary (e.g. requires_payment_method, processing)
       console.log(`[API] Subscription created with status: ${subscription.status}. PaymentIntent status: ${paymentIntent?.status}`);
       return NextResponse.json({ 
         success: false, 
         requires_action: true,
         client_secret: paymentIntent?.client_secret 
        }, { status: 200 });
    }

  } catch (error: any) {
    console.error('[API] /create-subscription: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
