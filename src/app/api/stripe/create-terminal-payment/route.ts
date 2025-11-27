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

    // 1. Criar PaymentIntent no Stripe
    // Nota: Para Tap to Pay no telemóvel (Flutter), usamos 'card_present' se for Reader SDK
    // ou workflow de Mobile Payment Element. Geralmente, criar o PI básico funciona,
    // o SDK mobile depois faz o 'collect'.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Em cêntimos
      currency: 'eur',
      payment_method_types: ['card_present'], 
      capture_method: 'automatic',
      metadata: {
        appointment_id,
        source: 'flutter_terminal_bridge'
      }
    });

    // 2. Criar Ordem na tabela 'terminal_orders' para o Flutter ouvir
    const { error: dbError } = await supabase
        .from('terminal_orders')
        .insert({
            id: paymentIntent.id, // O ID começa por pi_...
            appointment_id: appointment_id,
            amount: Math.round(amount * 100),
            status: 'pending'
        });

    if (dbError) throw dbError;

    // Retorna o ID para o Frontend (Next.js) poder subscrever ao canal
    return NextResponse.json({ 
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret 
    });

  } catch (error: any) {
    console.error('Erro ao criar ordem de terminal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}