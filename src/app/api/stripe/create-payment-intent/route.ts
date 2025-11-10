
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(req: Request) {
  try {
    const { 
        planId, 
        planPrice 
    } = await req.json();
    
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    if (!planId || planPrice === undefined) {
      return NextResponse.json({ error: 'Données du plan manquantes.' }, { status: 400 });
    }
    
    const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);
    
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata.display_name,
            metadata: { supabase_user_id: user.id }
        });
        customerId = customer.id;
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(planPrice * 100), // Price in cents
        currency: 'eur',
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
            user_id: user.id,
            plan_id: planId,
        },
    });

    if (!paymentIntent.client_secret) {
        throw new Error('Impossible de créer l\'intention de paiement Stripe.');
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('[API] /create-payment-intent: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
