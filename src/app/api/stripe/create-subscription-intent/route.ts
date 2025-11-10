
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

/**
 * @fileoverview API Route para criar uma intenção de subscrição no Stripe.
 *
 * @description
 * Este é o ponto de partida para o fluxo de subscrição. Ele faz o seguinte:
 * 1.  Valida o utilizador e os dados do plano.
 * 2.  Verifica se existe um Cliente Stripe para o utilizador no Supabase. Se não, cria um novo no Stripe e guarda o ID.
 * 3.  **CRÍTICO**: Cria um objeto 'Subscription' no Stripe com o estado 'default_incomplete'.
 *     Isto é essencial porque associa o pagamento a uma subscrição recorrente desde o início.
 * 4.  O objeto 'Subscription' contém a sua primeira fatura ('latest_invoice'), que por sua vez contém o 'payment_intent'.
 * 5.  Extrai o 'clientSecret' desse 'payment_intent' e devolve-o ao frontend.
 * 6.  Este 'clientSecret' é o que permite ao componente <PaymentElement> do Stripe no frontend processar o pagamento
 *     para ATIVAR a subscrição que acabámos de criar em estado pendente.
 */
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
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();
    
    if (profileError) throw profileError;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);

    let customerId = profile.stripe_customer_id;

    // Se o cliente não existir no Stripe, cria um novo.
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata.display_name,
            metadata: {
                supabase_user_id: user.id
            }
        });
        customerId = customer.id;

        // Atualiza o perfil no Supabase com o novo ID de cliente Stripe.
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
        
        if (updateError) {
            console.error("Erreur de mise à jour du profil avec l'ID client Stripe:", updateError);
            // Não é um erro bloqueante, podemos prosseguir.
        }
    }
    
    // CRÍTICO: Criar a subscrição com um estado de pagamento incompleto.
    // Isto garante que estamos a trabalhar com uma subscrição real desde o início.
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            plan_id: planId, // Consistência de nomenclatura
            user_id: user.id
        }
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    // O client_secret é a chave que autoriza o frontend a confirmar este pagamento específico.
    if (!paymentIntent?.client_secret) {
        throw new Error("Impossible d'extraire le client_secret de l'intention de paiement.");
    }
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('[API] /create-subscription-intent: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
