
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

// This is a generic Supabase admin client for server-side operations
const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[WEBHOOK] Erro: URL do Supabase ou Service Role Key não configurada.');
        throw new Error('Supabase URL or Service Role Key is not configured.');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: Request) {
  console.log('\n--- [WEBHOOK] Novo evento recebido do Stripe ---');
  const body = await request.text();
  const signature = headers().get('Stripe-Signature') as string;
  const supabase = getSupabaseAdminClient();
  console.log('[WEBHOOK] Corpo do pedido e assinatura lidos.');
  
  // Fetch Stripe keys and webhook secret from the database
  console.log('[WEBHOOK] A obter configurações do gateway da base de dados.');
  const { data: gatewaySettings, error: gatewayError } = await supabase
        .from('gateway_settings')
        .select('secret_key, webhook_secret')
        .eq('id', 'stripe')
        .single();

  if (gatewayError || !gatewaySettings?.secret_key || !gatewaySettings?.webhook_secret) {
        console.error("[WEBHOOK] Erro: Chave secreta ou segredo do webhook Stripe não configurado na base de dados.", gatewayError);
        return new NextResponse('Stripe secret key or webhook secret not configured.', { status: 500 });
  }
  console.log('[WEBHOOK] Chave secreta e segredo do webhook Stripe obtidos.');
  
  const stripe = getStripe(gatewaySettings.secret_key);
  const webhookSecret = gatewaySettings.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[WEBHOOK] Evento verificado com sucesso. Tipo: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ [WEBHOOK] Erro de verificação do webhook: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      console.log(`[WEBHOOK] Evento 'checkout.session.completed' processado para a sessão: ${checkoutSession.id}`);
      // This event is for one-time payments. For subscriptions, we use `invoice.paid`.
      break;

    case 'invoice.paid':
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[WEBHOOK] Evento 'invoice.paid' recebido para a fatura: ${invoice.id}`);
      
      const subscriptionId = invoice.subscription;
      if (typeof subscriptionId !== 'string') {
        console.error('[WEBHOOK] Erro: ID de subscrição em falta ou inválido na fatura.');
        break;
      }
      console.log(`[WEBHOOK] A obter detalhes da subscrição: ${subscriptionId}`);

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId = subscription.customer as string;
      console.log(`[WEBHOOK] Subscrição obtida. Cliente Stripe ID: ${customerId}`);

      // Find the user in our database via their Stripe customer ID
      console.log(`[WEBHOOK] A procurar perfil de utilizador com o cliente Stripe ID: ${customerId}`);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*') // Fetch all profile data
        .eq('stripe_customer_id', customerId)
        .single();
        
      if (profileError || !profile) {
        console.error(`[WEBHOOK] Erro: Perfil não encontrado para o cliente Stripe ${customerId}`, profileError);
        break;
      }
      console.log(`[WEBHOOK] Perfil de utilizador encontrado: ${profile.id}`);

      // Get plan details from the subscription
      const priceId = subscription.items.data[0].price.id;
      console.log(`[WEBHOOK] A procurar plano com o price_id: ${priceId}`);
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, title, minutes')
        .eq('stripe_price_id', priceId)
        .single();

      if (planError || !plan) {
        console.error(`[WEBHOOK] Erro: Plano não encontrado para o price_id ${priceId}`, planError);
        break;
      }
      console.log(`[WEBHOOK] Plano encontrado: ${plan.id}, com ${plan.minutes} minutos.`);
      
      // Update user's profile with the new plan and minutes
      const newMinutes = (profile.minutes_balance || 0) + plan.minutes;
      console.log(`[WEBHOOK] A atualizar o perfil do utilizador ${profile.id}. Novo saldo de minutos: ${newMinutes}`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan_id: plan.id,
          minutes_balance: newMinutes,
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
        })
        .eq('id', profile.id);

      if (updateError) {
          console.error(`[WEBHOOK] Erro de atualização do perfil para o utilizador ${profile.id}:`, updateError.message);
      } else {
          console.log(`[WEBHOOK] Perfil do utilizador ${profile.id} atualizado com sucesso com o plano ${plan.id}.`);
      }
      
      // Create an invoice record for the payment history
      if (invoice.amount_paid > 0) {
        console.log(`[WEBHOOK] A criar registo de fatura para o utilizador ${profile.id}.`);
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            user_id: profile.id,
            plan_id: plan.id,
            plan_title: plan.title,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100, // Stripe amount is in cents
            status: 'Pago',
            // pdf_url is intentionally left null. We will generate our own PDF later.
            pdf_url: null, 
          });

        if (invoiceError) {
          console.error(`[WEBHOOK] Erro ao criar a fatura para o utilizador ${profile.id}:`, invoiceError.message);
        } else {
          console.log(`[WEBHOOK] Fatura criada com sucesso para o utilizador ${profile.id}.`);
        }
      }

      break;
      
    case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log(`[WEBHOOK] Evento 'customer.subscription.deleted' recebido para a subscrição: ${deletedSubscription.id}`);
        // Logic to handle subscription cancellation
        const { error: cancelError } = await supabase
            .from('profiles')
            .update({
                plan_id: null,
                stripe_subscription_id: null,
                stripe_subscription_status: 'canceled',
             })
            .eq('stripe_subscription_id', deletedSubscription.id);
        
        if (cancelError) {
            console.error(`[WEBHOOK] Erro ao cancelar a subscrição na base de dados:`, cancelError.message);
        } else {
            console.log(`[WEBHOOK] Subscrição cancelada na base de dados para o ID ${deletedSubscription.id}`);
        }
        break;

    default:
      console.log(`[WEBHOOK] Evento não gerido: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
