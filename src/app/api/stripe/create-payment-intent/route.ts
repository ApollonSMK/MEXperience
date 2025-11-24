import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(req: Request) {
  try {
    const { 
        serviceId, 
        serviceName, 
        price, 
        userId, 
        userName, 
        userEmail, 
        appointmentDate, 
        duration, 
        paymentMethod 
    } = await req.json();
    
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    if (!serviceId || !serviceName || price === undefined || !userId || !appointmentDate || !duration) {
      return NextResponse.json({ error: 'Données de réservation manquantes.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);
    
    const amountInCents = Math.round(price * 100);

    // Fetch user profile to get stripe_customer_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

    if (!profile) {
        throw new Error('Profil utilisateur introuvable.');
    }
    
    // 2. Obter ou criar Cliente Stripe
    let stripeCustomerId = profile.stripe_customer_id;

    if (stripeCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(stripeCustomerId);
            if (customer.deleted) {
                stripeCustomerId = null;
            }
        } catch (error) {
            console.warn(`[API] Cliente Stripe ${stripeCustomerId} inválido. Criando novo.`);
            stripeCustomerId = null;
        }
    }

    if (!stripeCustomerId) {
        console.log(`[API] Criando novo cliente Stripe para ${user.email}`);
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata.display_name,
            metadata: { supabase_user_id: user.id }
        });
        stripeCustomerId = customer.id;

        await supabase
            .from('profiles')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', user.id);
    }

    // 3. Criar PaymentIntent
    console.log(`[API] Criando PaymentIntent para ${amountInCents} cêntimos`);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        metadata: {
            service_id: serviceId,
            service_name: serviceName,
            appointment_date: appointmentDate,
            duration: String(duration),
            price: String(price),
            payment_method: paymentMethod,
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