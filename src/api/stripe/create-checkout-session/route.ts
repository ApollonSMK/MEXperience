
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

// Esta rota agora é EXCLUSIVA para pagamentos únicos de AGENDAMENTOS.
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

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${serviceName} (${duration} min)`,
            description: `Réservation pour le service M.E Experience.`,
          },
          unit_amount: Math.round(price * 100), // Preço em cêntimos
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/checkout/return?type=appointment&redirect_status=succeeded`,
      cancel_url: `${origin}/agendar`,
      customer_email: user.email,
      metadata: {
        // Apenas metadados para o agendamento
        user_id: user.id,
        appointment_id: appointment_id,
        service_name: serviceName,
        duration: String(duration),
        price: String(price),
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
