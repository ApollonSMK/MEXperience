import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(req: Request) {
  try {
    const { planId, stripePriceId } = await req.json();

    if (!planId || !stripePriceId) {
      return NextResponse.json({ error: 'ID du plan ou ID de prix Stripe manquant.' }, { status: 400 });
    }

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
    
    if (profileError) throw profileError;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);

    let customerId = profile.stripe_customer_id;

    // Create a new Stripe customer if one doesn't exist
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata.display_name,
            metadata: {
                supabase_user_id: user.id
            }
        });
        customerId = customer.id;

        // Update the profile in Supabase with the new Stripe Customer ID
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
        
        if (updateError) {
            console.error("Erreur de mise à jour du profil avec l'ID client Stripe:", updateError);
            // Non-blocking error, we can proceed
        }
    }
    
    // VERIFICAÇÃO DE ASSINATURA EXISTENTE (Lógica de Upgrade)
    let subscriptionId = profile.stripe_subscription_id;
    let activeSubscription = null;

    if (subscriptionId) {
        try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') {
                activeSubscription = sub;
            }
        } catch (e) {
            console.log("Assinatura antiga não encontrada ou erro:", e);
        }
    }

    let subscription;

    if (activeSubscription) {
        // --- CENÁRIO: UPGRADE / TROCA DE PLANO ---
        // Pegamos o ID do item da assinatura (o preço atual) para substituí-lo
        const currentItemId = activeSubscription.items.data[0].id;

        subscription = await stripe.subscriptions.update(activeSubscription.id, {
            items: [{
                id: currentItemId,
                price: stripePriceId, // Novo Preço
            }],
            metadata: {
                plan_id: planId, // Novo ID do plano (interno)
                user_id: user.id
            },
            proration_behavior: 'always_invoice', // Cobra a diferença imediatamente
            payment_behavior: 'pending_if_incomplete', // Aguarda pagamento se necessário
            expand: ['latest_invoice.payment_intent'],
        });

    } else {
        // --- CENÁRIO: NOVA ASSINATURA ---
        subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: stripePriceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                plan_id: planId,
                user_id: user.id
            }
        });
    }

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    // Se for um upgrade gratuito ou coberto por créditos, pode não haver PaymentIntent ou client_secret
    if (!paymentIntent?.client_secret) {
        // Se o status for pago (upgrade gratuito ou crédito), retornamos sucesso especial ou lidamos no frontend.
        // Mas para simplificar, se já estiver pago, o frontend pode receber null e redirecionar?
        // O frontend atual espera clientSecret. Se não houver, vamos lançar erro por enquanto ou tratar edge case.
        if (latestInvoice.paid) {
             // Caso raro: Upgrade gratuito ou saldo credor cobriu tudo.
             // Precisamos de uma flag para o frontend saber que não precisa coletar cartão.
             return NextResponse.json({ message: "Upgrade efetuado sem custos adicionais.", upgradeComplete: true });
        }
        throw new Error("Impossible d'extraire le client_secret de l'intention de paiement.");
    }
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('[API] /create-subscription-intent: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}