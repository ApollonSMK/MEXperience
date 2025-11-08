
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId est requis.' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Clé secrète Stripe non configurée.");
    }
    
    const stripe = getStripe(secretKey);

    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();
        
    if (!profile?.stripe_customer_id) {
        return NextResponse.json({ error: 'Client Stripe non trouvé pour cet utilisateur.' }, { status: 404 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.customer !== profile.stripe_customer_id) {
        return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
    }
    
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Atualize o perfil do usuário para refletir que o cancelamento foi agendado
    await supabase
      .from('profiles')
      .update({ 
          stripe_subscription_status: 'active', // Permanece ativo até o final do período
          stripe_cancel_at_period_end: true,
          stripe_subscription_cancel_at: canceledSubscription.cancel_at
      })
      .eq('id', user.id);


    return NextResponse.json({
        message: 'Subscription scheduled for cancellation.',
        cancel_at: canceledSubscription.cancel_at
    });
    
  } catch (error: any) {
    console.error('[API] /cancel-subscription: Erro geral:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
