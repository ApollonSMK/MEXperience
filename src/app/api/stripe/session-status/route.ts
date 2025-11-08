
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
      return NextResponse.json({ error: "Stripe secret key not configured." }, { status: 500 });
  }
  const stripe = getStripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer']
    });
    
    const customer = session.customer as any;

    return NextResponse.json({
      status: session.status,
      customer_email: customer?.email
    }, { status: 200 });

  } catch (error: any) {
    console.error(`Error retrieving session ${sessionId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
