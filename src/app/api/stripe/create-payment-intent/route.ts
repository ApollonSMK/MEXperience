
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(req: Request) {
  try {
    const { 
        appointment_id, 
        serviceName, 
        price, 
        duration, 
        userEmail
    } = await req.json();
    
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    if (!appointment_id || !serviceName || price === undefined || !duration || !userEmail) {
      return NextResponse.json({ error: 'Données de réservation manquantes.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);
    
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Price in cents
        currency: 'eur',
        payment_method_types: ['card'],
        metadata: {
            appointment_id: appointment_id,
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
