
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'ID da sessão em falta.' }, { status: 400 });
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Chave secreta Stripe não configurada.");
    }
    const stripe = getStripe(secretKey);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      customer_email: session.customer_details?.email
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[API] /checkout-status: Erro ao obter o estado da sessão ${sessionId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
