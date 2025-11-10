import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
        appointment_id, 
        serviceName, 
        price, 
        duration, 
        userEmail,
        plan_id,
        is_subscription 
    } = body;
    
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);

    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: Stripe.Checkout.SessionCreateParams.Mode = 'payment';
    let metadata: Stripe.MetadataParam = {};

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const success_url = `${origin}/checkout/return?type=${is_subscription ? 'subscription' : 'appointment'}&redirect_status=succeeded`;
    const cancel_url = is_subscription ? `${origin}/abonnements` : `${origin}/agendar`;


    if (is_subscription) {
        // --- Subscription Flow ---
        if (!plan_id) return NextResponse.json({ error: 'ID du plan manquant.' }, { status: 400 });
        
        const { data: planData, error: planError } = await supabase.from('plans').select('stripe_price_id').eq('id', plan_id).single();
        if (planError || !planData?.stripe_price_id) {
            return NextResponse.json({ error: 'ID de prix Stripe pour le plan non trouvé.' }, { status: 404 });
        }
        
        line_items.push({
            price: planData.stripe_price_id,
            quantity: 1,
        });
        mode = 'subscription';
        metadata = {
            user_id: user.id,
            plan_id: plan_id,
        };

    } else {
        // --- Appointment Flow ---
        if (!appointment_id || !serviceName || price === undefined || !duration || !userEmail) {
          return NextResponse.json({ error: 'Données de réservation manquantes.' }, { status: 400 });
        }

        line_items.push({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `${serviceName} (${duration} min)`,
                    description: `Réservation pour le service M.E Experience.`,
                },
                unit_amount: Math.round(price * 100), // Price in cents
            },
            quantity: 1,
        });
        mode = 'payment';
        metadata = {
            appointment_id: appointment_id,
        };
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: mode,
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: user.email, // Always use authenticated user's email
      metadata: metadata,
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
