
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

// Esta rota agora é para criar a SUBSCRIÇÃO no Stripe DEPOIS que o pagamento inicial foi bem-sucedido.
export async function POST(req: Request) {
  try {
    const { plan_id, customer_id, payment_method_id } = await req.json();

    if (!plan_id || !customer_id || !payment_method_id) {
      return NextResponse.json({ error: 'Dados da subscrição incompletos.' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }

    const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('stripe_price_id')
        .eq('id', plan_id)
        .single();
    if (planError || !planData?.stripe_price_id) {
        return NextResponse.json({ error: 'ID de prix Stripe pour le plan non trouvé.' }, { status: 404 });
    }
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);

    // Anexa o método de pagamento ao cliente
    await stripe.paymentMethods.attach(payment_method_id, {
        customer: customer_id,
    });

    // Define o método de pagamento como padrão para o cliente
    await stripe.customers.update(customer_id, {
        invoice_settings: {
            default_payment_method: payment_method_id,
        },
    });

    // Cria a subscrição
    const subscription = await stripe.subscriptions.create({
        customer: customer_id,
        items: [{ price: planData.stripe_price_id }],
        expand: ['latest_invoice.payment_intent'],
    });

    if (!subscription.id) {
        throw new Error('Impossible de créer la subscrição no Stripe.');
    }

    return NextResponse.json({ subscriptionId: subscription.id });

  } catch (error: any) {
    console.error('[API] /create-subscription: Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
