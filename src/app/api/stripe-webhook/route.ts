
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

// Helper function to update profile and create invoice
const handleSubscriptionActivation = async (supabase: any, userId: string, planId: string, subscriptionId: string, subscriptionStatus: string, invoice: Stripe.Invoice | null) => {
    console.log(`[WEBHOOK] handleSubscriptionActivation: Iniciando para o utilizador ${userId} e plano ${planId}`);
    
    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, title, minutes')
        .eq('id', planId)
        .single();

    if (planError || !plan) {
        console.error(`[WEBHOOK] handleSubscriptionActivation: Erro crítico - Plano ${planId} não encontrado.`, planError);
        return;
    }
    console.log(`[WEBHOOK] handleSubscriptionActivation: Plano encontrado: ${plan.title} com ${plan.minutes} minutos.`);
    
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('minutes_balance')
        .eq('id', userId)
        .single();
    
    if (profileError || !profile) {
        console.error(`[WEBHOOK] handleSubscriptionActivation: Erro crítico - Perfil do utilizador ${userId} não encontrado para atualizar os minutos.`, profileError);
        return;
    }
    
    const newMinutes = (profile.minutes_balance || 0) + plan.minutes;
    console.log(`[WEBHOOK] handleSubscriptionActivation: A atualizar o perfil do utilizador ${userId}. Saldo de minutos de ${profile.minutes_balance} para ${newMinutes}.`);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan_id: plan.id,
          minutes_balance: newMinutes,
          stripe_subscription_id: subscriptionId,
          stripe_subscription_status: subscriptionStatus,
        })
        .eq('id', userId);

    if (updateError) {
      console.error(`[WEBHOOK] handleSubscriptionActivation: Erro de atualização do perfil para o utilizador ${userId}:`, updateError.message);
    } else {
      console.log(`[WEBHOOK] handleSubscriptionActivation: Perfil do utilizador ${userId} atualizado com sucesso.`);
    }

    if (invoice && invoice.amount_paid > 0) {
      console.log(`[WEBHOOK] handleSubscriptionActivation: A criar registo de fatura para o utilizador ${userId}.`);
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            user_id: userId,
            plan_id: plan.id,
            plan_title: plan.title,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100, // Stripe amount is in cents
            status: 'Pago',
            pdf_url: null, 
          });

        if (invoiceError) {
          console.error(`[WEBHOOK] handleSubscriptionActivation: Erro ao criar a fatura para o utilizador ${userId}:`, invoiceError.message);
        } else {
          console.log(`[WEBHOOK] handleSubscriptionActivation: Fatura criada com sucesso para o utilizador ${userId}.`);
        }
    } else {
      console.log(`[WEBHOOK] handleSubscriptionActivation: A ignorar a criação da fatura (valor é 0 ou fatura nula).`);
    }
}


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
      console.log(`[WEBHOOK] Evento 'checkout.session.completed' para a sessão: ${checkoutSession.id}`);

      // This is the first payment of a new subscription.
      // We need to link the Stripe customer and subscription to our user.
      const userId = checkoutSession.metadata?.supabase_user_id;
      const planId = checkoutSession.metadata?.app_plan_id;
      const customerId = checkoutSession.customer as string;
      const subscriptionId = checkoutSession.subscription as string;

      if (!userId || !planId || !customerId || !subscriptionId) {
        console.error(`[WEBHOOK] 'checkout.session.completed': Erro - Metadados em falta.`, checkoutSession.metadata);
        break;
      }
      
      console.log(`[WEBHOOK] 'checkout.session.completed': A atualizar o perfil ${userId} com o cliente ${customerId} e subscrição ${subscriptionId}`);

      const { error } = await supabase
        .from('profiles')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_subscription_status: 'active', // The subscription is active now
        })
        .eq('id', userId);

      if(error){
        console.error(`[WEBHOOK] 'checkout.session.completed': Erro ao atualizar o perfil para o utilizador ${userId}`, error);
      } else {
        console.log(`[WEBHOOK] 'checkout.session.completed': Perfil do utilizador ${userId} atualizado com sucesso.`);
      }

      break;

    case 'invoice.paid':
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[WEBHOOK] Evento 'invoice.paid' recebido para a fatura: ${invoice.id}`);
      
      const subIdForInvoice = invoice.subscription as string;
      const customerIdForInvoice = invoice.customer as string;
      
      if (!subIdForInvoice) {
        console.log('[WEBHOOK] invoice.paid: Ignorado - Fatura não está associada a uma subscrição (provavelmente pagamento único).');
        break;
      }

      console.log(`[WEBHOOK] invoice.paid: A procurar perfil com stripe_subscription_id: ${subIdForInvoice}`);
      
      const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, plan_id')
          .eq('stripe_subscription_id', subIdForInvoice)
          .single();

      if (profileError || !profileData) {
          console.error(`[WEBHOOK] invoice.paid: Erro - Perfil não encontrado para a subscrição ${subIdForInvoice}`, profileError);
          break;
      }
      console.log(`[WEBHOOK] invoice.paid: Perfil encontrado: ${profileData.id}. A ativar/renovar subscrição.`);

      // Use the plan from the profile if it's a renewal, otherwise this handler is for payment confirmation
      await handleSubscriptionActivation(supabase, profileData.id, profileData.plan_id!, subIdForInvoice, 'active', invoice);
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
