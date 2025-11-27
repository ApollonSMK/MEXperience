import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

export async function POST(req: Request) {
  try {
    const { amount, appointment_id } = await req.json();

    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Chave secreta Stripe não configurada.");
    const stripe = getStripe(secretKey);

    // Cria o PaymentIntent configurado para leitores físicos (card_present)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Em centimos
      currency: 'eur',
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
      metadata: {
        appointment_id,
        type: 'appointment_terminal'
      }
    });

    return NextResponse.json({ client_secret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Erro ao criar terminal payment intent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}