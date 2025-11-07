
import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export async function POST(request: Request) {
  console.log('[API] /create-checkout-session: Recebida solicitação POST.');
  try {
    const { priceId } = await request.json();
    console.log(`[API] /create-checkout-session: Tentando criar sessão para o priceId: ${priceId}`);
    if (!priceId) {
      console.error('[API] /create-checkout-session: Erro - priceId está em falta no corpo da solicitação.');
      return NextResponse.json({ error: 'priceId est requis.' }, { status: 400 });
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
        .select('secret_key')
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
    
    console.log(`[API] /create-checkout-session: A criar subscrição no Stripe para o cliente ${customerId}`);
    // Create a subscription but don't charge immediately
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
    });
    console.log(`[API] /create-checkout-session: Subscrição Stripe criada com ID: ${subscription.id}`);

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent || !paymentIntent.client_secret) {
        console.error('[API] /create-checkout-session: Erro - Não foi possível obter o client_secret do Payment Intent.');
        throw new Error('Could not retrieve payment client_secret.');
    }
    console.log('[API] /create-checkout-session: Client secret obtido com sucesso. A enviar para o frontend.');

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
    
  } catch (error: any) {
    console.error('[API] /create-checkout-session: Erro geral no bloco catch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
