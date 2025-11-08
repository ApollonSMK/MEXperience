
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { User } from '@supabase/supabase-js';

const getOrCreateStripeCustomer = async (user: User, stripe: any, payment_method: string) => {
    const supabase = await createSupabaseRouteClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
        // Attach the new payment method to the existing customer
        await stripe.paymentMethods.attach(payment_method, {
            customer: profile.stripe_customer_id,
        });
        // Set it as the default for future invoices
        await stripe.customers.update(profile.stripe_customer_id, {
            invoice_settings: {
                default_payment_method: payment_method,
            },
        });
        return profile.stripe_customer_id;
    }

    // Create a new customer
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.display_name,
        metadata: { supabaseUUID: user.id },
        payment_method: payment_method,
        invoice_settings: {
            default_payment_method: payment_method,
        },
    });

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id);

    return customer.id;
};


export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não autenticado.' }, { status: 401 });
    }

    const { plan_price_id, plan_id, payment_method } = await req.json();

    if (!plan_price_id || !plan_id || !payment_method) {
      return NextResponse.json({ error: 'Dados de plano ou de pagamento em falta.' }, { status: 400 });
    }
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Chave secreta Stripe não configurada.");
    }
    const stripe = getStripe(secretKey);
    
    const customerId = await getOrCreateStripeCustomer(user, stripe, payment_method);

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan_price_id }],
        metadata: { 
            plan_id, 
            user_id: user.id 
        },
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
    });

    return NextResponse.json(subscription, { status: 200 });

  } catch (error: any) {
    console.error('[API] /create-subscription: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
