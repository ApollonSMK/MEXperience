
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
    
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Price in cents
        currency: 'eur',
        payment_method_types: ['card'],
        metadata: {
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
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
    console.error('[API] /create-payment-intent: Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
