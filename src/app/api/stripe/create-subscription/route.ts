
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { plan_id } = await req.json();

    if (!plan_id) {
      return NextResponse.json({ error: "ID du plan manquant." }, { status: 400 });
    }

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("stripe_price_id, price")
      .eq("id", plan_id)
      .single();

    if (planError || !plan?.stripe_price_id) {
      console.error("❌ Erreur plan Supabase:", planError);
      return NextResponse.json(
        { error: "Ce plan n'a pas de prix Stripe associé." },
        { status: 400 }
      );
    }
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);

    const priceInCents = parseInt(plan.price.replace('€', ''), 10) * 100;

    const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: {
            user_id: user.id,
            plan_id: plan_id,
        },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (err: any) {
    console.error("❌ Stripe create-subscription error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur Stripe inconnue." },
      { status: 500 }
    );
  }
}
