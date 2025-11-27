import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

export async function POST() {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Chave secreta Stripe não configurada.");
    const stripe = getStripe(secretKey);

    // Cria o token de conexão para o SDK do Terminal
    const connectionToken = await stripe.terminal.connectionTokens.create();

    return NextResponse.json({ secret: connectionToken.secret });
  } catch (error: any) {
    console.error('Erro ao criar token de conexão:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}