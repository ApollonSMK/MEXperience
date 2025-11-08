

import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('id', user.id)
        .single();
        
    if (profileError || !profile || !profile.stripe_subscription_id) {
        return NextResponse.json({ error: 'Nenhuma subscrição ativa encontrada para este utilizador.' }, { status: 404 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Clé secrète Stripe non configurée.");
    }
    const stripe = getStripe(secretKey);
    
    // Instead of canceling, we schedule it to be canceled at the period end.
    const canceledSubscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
          stripe_subscription_status: 'active', // Stays active until period end
          stripe_cancel_at_period_end: true,
          stripe_subscription_cancel_at: canceledSubscription.cancel_at // Unix timestamp
      })
      .eq('id', user.id);
    
    if (updateError) {
        console.error("Erro ao atualizar perfil do Supabase após agendar cancelamento:", updateError);
        // Don't throw, just log. The main action was successful.
    }

    return NextResponse.json({
        message: 'A subscrição foi agendada para cancelamento no final do período.',
        cancel_at: canceledSubscription.cancel_at
    });
    
  } catch (error: any) {
    console.error('[API] /cancel-subscription: Erro geral:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
