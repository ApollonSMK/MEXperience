
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';


// This route now creates a CHECKOUT SESSION for subscriptions.
export async function POST(req: Request) {
  try {
    const { plan_id } = await req.json();
    if (!plan_id) {
      return NextResponse.json({ error: 'ID du plan manquant.' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }
    
    const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('stripe_price_id')
        .eq('id', plan_id)
        .single();

    if (planError || !planData?.stripe_price_id) {
        return NextResponse.json({ error: 'ID de prix Stripe pour le plan non trouvé.' }, { status: 404 });
    }
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: planData.stripe_price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${origin}/checkout/return?type=subscription&redirect_status=succeeded`,
      cancel_url: `${origin}/abonnements`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan_id: plan_id,
      },
    });

    if (!session.id) {
        throw new Error('Impossible de créer la session de paiement Stripe.');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('[API] /create-subscription: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
