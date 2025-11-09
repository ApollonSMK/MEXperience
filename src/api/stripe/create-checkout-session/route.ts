
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(req: Request) {
  try {
    const { serviceId, serviceName, price, userId, userName, userEmail, appointmentDate, duration } = await req.json();
    
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
    
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${serviceName} (${duration} min)`,
          description: `Réservation pour le ${new Date(appointmentDate).toLocaleString('fr-FR')}`,
        },
        unit_amount: Math.round(price * 100), // Price in cents
      },
      quantity: 1,
    }];
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/agendar`,
      customer_email: userEmail,
      metadata: {
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        service_id: serviceId,
        service_name: serviceName,
        appointment_date: appointmentDate,
        duration: String(duration),
        price: String(price),
        payment_method: 'card', // Explicitly setting it
      },
    });

    if (!session.id) {
        throw new Error('Impossible de créer la session de paiement Stripe.');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
