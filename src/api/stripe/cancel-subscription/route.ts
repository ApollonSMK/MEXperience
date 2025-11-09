
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    // 1. Get user's subscription ID from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || !profile.stripe_subscription_id) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé pour cet utilisateur.' }, { status: 404 });
    }

    const subscriptionId = profile.stripe_subscription_id;

    // 2. Get Stripe instance
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Clé secrète Stripe non configurée.");
    }
    const stripe = getStripe(secretKey);

    // 3. Cancel the subscription at the end of the period
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // 4. Update our database to reflect the change
    const { error: dbUpdateError } = await supabase
      .from('profiles')
      .update({ 
        stripe_subscription_status: 'canceled', // Or you could use canceledSubscription.status
        stripe_cancel_at_period_end: true,
        stripe_subscription_cancel_at: canceledSubscription.cancel_at ? new Date(canceledSubscription.cancel_at * 1000).toISOString() : null,
       })
      .eq('id', user.id);

    if (dbUpdateError) {
      console.error('Erreur de mise à jour de la base de données après l\'annulation Stripe:', dbUpdateError);
      // Even if DB update fails, Stripe cancellation was successful, so we don't throw an error to the user
      // but we log it for maintenance.
    }
    
    console.log(`[API] Abonnement ${subscriptionId} marqué pour annulation à la fin de la période.`);

    return NextResponse.json({ message: 'Abonnement annulé avec succès à la fin de la période.' }, { status: 200 });

  } catch (error: any) {
    console.error('[API] /cancel-subscription: Erreur:', error);
    return NextResponse.json({ error: error.message || 'Une erreur est survenue lors de l\'annulation de l\'abonnement.' }, { status: 500 });
  }
}
