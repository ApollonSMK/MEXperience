
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

// Esta API cria um PaymentIntent para o formulário de pagamento incorporado
export async function POST(req: Request) {
  try {
    const { plan_id, amount } = await req.json();
    
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    if (!plan_id || !amount) {
      return NextResponse.json({ error: 'ID du plan ou montant manquant.' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);
    
    // Procura o cliente Stripe associado ou cria um novo
    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();
    
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata.display_name,
            metadata: { user_id: user.id }
        });
        customerId = customer.id;
        // Salva o novo ID do cliente no perfil do usuário
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // O montante deve ser em cêntimos
        currency: 'eur',
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
            user_id: user.id,
            plan_id: plan_id,
        },
    });

    if (!paymentIntent.client_secret) {
        throw new Error("Impossible de créer l'intention de paiement Stripe.");
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('[API] /create-payment-intent: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
