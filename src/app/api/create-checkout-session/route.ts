
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(request: Request) {
  console.log('[API] /create-checkout-session: Recebida solicitação POST.');
  try {
    const { priceId, planId } = await request.json();
    console.log(`[API] /create-checkout-session: Tentando criar sessão para o priceId: ${priceId} e planId: ${planId}`);
    if (!priceId || !planId) {
      console.error('[API] /create-checkout-session: Erro - priceId ou planId estão em falta no corpo da solicitação.');
      return NextResponse.json({ error: 'priceId e planId são requisitados.' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteClient();
    console.log('[API] /create-checkout-session: Cliente Supabase inicializado.');

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[API] /create-checkout-session: Erro - Utilizador não autenticado.', userError);
      return NextResponse.json({ error: 'Utilizador non authentifié.' }, { status: 401 });
    }
    console.log(`[API] /create-checkout-session: Utilizador autenticado com sucesso: ${user.id}`);
    
    // Fetch Stripe keys from the database
    console.log('[API] /create-checkout-session: A obter configurações do gateway Stripe da base de dados.');
    const { data: gatewaySettings, error: gatewayError } = await supabase
        .from('gateway_settings')
        .select('secret_key, test_mode')
        .eq('id', 'stripe')
        .single();
    
    if (gatewayError || !gatewaySettings?.secret_key) {
        console.error('[API] /create-checkout-session: Erro ao obter a chave secreta Stripe da base de dados.', gatewayError);
        throw new Error("Clé secrète Stripe non configurée.");
    }
    console.log('[API] /create-checkout-session: Chave secreta Stripe obtida com sucesso.');
    
    const stripe = getStripe(gatewaySettings.secret_key);
    console.log('[API] /create-checkout-session: Instância do Stripe inicializada.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();
    console.log(`[API] /create-checkout-session: Perfil do utilizador obtido. Stripe Customer ID: ${profile?.stripe_customer_id}`);

    let customerId = profile?.stripe_customer_id;

    // If user is not a Stripe customer yet, create one
    if (!customerId) {
      console.log('[API] /create-checkout-session: Nenhum Stripe Customer ID encontrado. A criar um novo cliente Stripe.');
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.user_metadata.display_name,
        metadata: {
          supabaseUUID: user.id,
        },
      });
      customerId = customer.id;
      console.log(`[API] /create-checkout-session: Novo cliente Stripe criado com ID: ${customerId}`);
      
      // Save the new customer ID to our database
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      console.log('[API] /create-checkout-session: ID do cliente Stripe guardado no perfil do Supabase.');
    }
    
    // Create the subscription
    console.log(`[API] /create-checkout-session: A criar subscrição para o cliente ${customerId} com o preço ${priceId}`);
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
    });

    console.log(`[API] /create-checkout-session: Subscrição criada com ID: ${subscription.id}`);

    // Update the user profile with subscription details immediately
    await supabase.from('profiles').update({
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        plan_id: planId,
    }).eq('id', user.id);

    console.log(`[API] /create-checkout-session: Perfil do utilizador ${user.id} atualizado com os detalhes da subscrição.`);

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent?.client_secret) {
        console.error('[API] /create-checkout-session: Erro crítico - client_secret do PaymentIntent não encontrado.');
        throw new Error("Não foi possível inicializar o pagamento.");
    }
    
    console.log(`[API] /create-checkout-session: A devolver o client_secret para o Payment Intent: ${paymentIntent.id}`);
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
    
  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro geral no bloco catch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
