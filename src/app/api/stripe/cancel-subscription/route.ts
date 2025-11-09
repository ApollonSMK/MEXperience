
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
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé pour cet utilisateur.' }, { status: 404 });
    }

    const subscriptionId = profile.stripe_subscription_id;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);

    // Cancel or mark for future cancellation
    const canceledSubscription = cancelNow
      ? await stripe.subscriptions.cancel(subscriptionId)
      : await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

    // Update local DB
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        stripe_subscription_status: canceledSubscription.status, // ← mantém "active" até expirar
        stripe_cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        stripe_subscription_cancel_at: canceledSubscription.cancel_at
          ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
          : null,
      })
      .eq('id', user.id);

    if (dbError) {
      console.error('⚠️ Erreur mise à jour DB après annulation:', dbError);
    }

    console.log(`[API] Subscription ${subscriptionId} ${cancelNow ? 'immédiatement annulée' : 'programmée pour annulation à la fin du cycle'}.`);

    return NextResponse.json({
      message: cancelNow
        ? 'Abonnement annulé immédiatement.'
        : 'Abonnement annulé avec succès à la fin de la période.',
    });

  } catch (error: any) {
    console.error('[API] /cancel-subscription: Erreur:', error);
    return NextResponse.json({
      error: error.message || 'Une erreur est survenue lors de l\'annulation de l\'abonnement.',
    }, { status: 500 });
  }
}
