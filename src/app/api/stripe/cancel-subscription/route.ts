import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { cancelNow = false } = await req.json().catch(() => ({ cancelNow: false }));

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, plan_id')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération du profil.' }, { status: 404 });
    }

    const subscriptionId = profile.stripe_subscription_id;

    // Se tiver ID do Stripe, cancela via Stripe
    if (subscriptionId) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
        const stripe = getStripe(secretKey);

        let canceledSubscription;
        if (cancelNow) {
            canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
        } else {
            canceledSubscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
        }

        // Update local DB for Stripe subscription
        const { error: dbError } = await supabase
        .from('profiles')
        .update({
            stripe_subscription_status: canceledSubscription.status,
            stripe_cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        })
        .eq('id', user.id);

        if (dbError) console.error('⚠️ Erreur mise à jour DB après annulation:', dbError);

        return NextResponse.json({
            message: cancelNow
                ? 'Abonnement annulé immédiatement.'
                : 'Abonnement annulé avec succès à la fin de la période.',
        });
    } else if (profile.plan_id) {
        // Se for plano manual (sem Stripe ID), remove o plano imediatamente
        const { error: dbError } = await supabase
            .from('profiles')
            .update({
                plan_id: null,
                stripe_subscription_status: 'canceled',
                minutes_balance: 0 // Remove minutes for manual plan cancellation
            })
            .eq('id', user.id);

        if (dbError) throw new Error("Erreur lors de l'annulation du plan manuel.");

        return NextResponse.json({ message: 'Abonnement manuel annulé immédiatement.' });
    } else {
        return NextResponse.json({ error: 'Aucun abonnement actif trouvé.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error('[API] /cancel-subscription: Erreur:', error);
    return NextResponse.json({
      error: error.message || 'Une erreur est survenue lors de l\'annulation de l\'abonnement.',
    }, { status: 500 });
  }
}