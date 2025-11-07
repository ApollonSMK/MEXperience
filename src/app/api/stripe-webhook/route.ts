
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
const handleSubscriptionActivation = async (supabase: any, userId: string, subscriptionId: string, subscriptionStatus: string) => {
    console.log(`[WEBHOOK] handleSubscriptionActivation: Iniciando para o utilizador ${userId} com a subscrição ${subscriptionId}`);
    
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan_id, minutes_balance')
        .eq('id', userId)
        .single();
    
    if (profileError || !profile) {
        console.error(`[WEBHOOK] handleSubscriptionActivation: Erro crítico - Perfil do utilizador ${userId} não encontrado.`, profileError);
        return;
    }
    
    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, title, minutes')
        .eq('id', profile.plan_id)
        .single();

    if (planError || !plan) {
        console.error(`[WEBHOOK] handleSubscriptionActivation: Erro crítico - Plano ${profile.plan_id} não encontrado no perfil do utilizador ${userId}.`, planError);
        return;
    }
    console.log(`[WEBHOOK] handleSubscriptionActivation: Plano encontrado: ${plan.title} com ${plan.minutes} minutos.`);
    
    const newMinutes = (profile.minutes_balance || 0) + plan.minutes;
    console.log(`[WEBHOOK] handleSubscriptionActivation: A atualizar o perfil do utilizador ${userId}. Saldo de minutos de ${profile.minutes_balance} para ${newMinutes}.`);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
          minutes_balance: newMinutes,
          stripe_subscription_status: subscriptionStatus,
        })
        .eq('id', userId);

    if (updateError) {
      console.error(`[WEBHOOK] handleSubscriptionActivation: Erro de atualização do perfil para o utilizador ${userId}:`, updateError.message);
    } else {
      console.log(`[WEBHOOK] handleSubscriptionActivation: Perfil do utilizador ${userId} atualizado com sucesso.`);
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
    case 'invoice.paid':
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[WEBHOOK] Evento 'invoice.paid' recebido para a fatura: ${invoice.id}`);
      
      const subscriptionIdForInvoice = invoice.subscription as string;
      const customerIdForInvoice = invoice.customer as string;
      
      if (!subscriptionIdForInvoice) {
        console.log('[WEBHOOK] invoice.paid: Ignorado - Fatura não está associada a uma subscrição (provavelmente pagamento único).');
        break;
      }

      console.log(`[WEBHOOK] invoice.paid: A procurar perfil com stripe_subscription_id: ${subscriptionIdForInvoice}`);
      
      const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, plan_id, minutes_balance')
          .eq('stripe_subscription_id', subscriptionIdForInvoice)
          .single();

      if (profileError || !profileData) {
          console.error(`[WEBHOOK] invoice.paid: Erro - Perfil não encontrado para a subscrição ${subscriptionIdForInvoice}. A procurar pelo customerId ${customerIdForInvoice} como alternativa.`, profileError);
          // Fallback: If subscription ID is not yet on the profile, find user by customer ID
          const { data: profileByCustomer, error: customerError } = await supabase
            .from('profiles')
            .select('id, plan_id, minutes_balance')
            .eq('stripe_customer_id', customerIdForInvoice)
            .single();

          if(customerError || !profileByCustomer) {
            console.error(`[WEBHOOK] invoice.paid: Fallback falhou. Perfil não encontrado para o customerId ${customerIdForInvoice}`, customerError);
            break;
          }
          console.log(`[WEBHOOK] invoice.paid: Perfil encontrado via fallback do customerId: ${profileByCustomer.id}. A ativar/renovar subscrição.`);
          await handleSubscriptionActivation(supabase, profileByCustomer.id, subscriptionIdForInvoice, 'active');

          // Now, also create the invoice record
          const { data: planData } = await supabase.from('plans').select('title').eq('id', profileByCustomer.plan_id).single();
          if(planData && invoice.amount_paid > 0) {
            await supabase.from('invoices').insert({
                user_id: profileByCustomer.id,
                plan_id: profileByCustomer.plan_id,
                plan_title: planData.title,
                date: new Date(invoice.created * 1000).toISOString(),
                amount: invoice.amount_paid / 100,
                status: 'Pago',
            });
            console.log(`[WEBHOOK] invoice.paid: Fatura criada com sucesso para o utilizador ${profileByCustomer.id}.`);
          }

          break;
      }
      
      console.log(`[WEBHOOK] invoice.paid: Perfil encontrado: ${profileData.id}. A ativar/renovar subscrição.`);

      await handleSubscriptionActivation(supabase, profileData.id, subscriptionIdForInvoice, 'active');

      // Create invoice record
      if(profileData.plan_id && invoice.amount_paid > 0) {
        const { data: planData } = await supabase.from('plans').select('title').eq('id', profileData.plan_id).single();
         if(planData) {
             await supabase.from('invoices').insert({
                user_id: profileData.id,
                plan_id: profileData.plan_id,
                plan_title: planData.title,
                date: new Date(invoice.created * 1000).toISOString(),
                amount: invoice.amount_paid / 100,
                status: 'Pago',
            });
            console.log(`[WEBHOOK] invoice.paid: Fatura criada com sucesso para o utilizador ${profileData.id}.`);
         }
      }
      break;
      
    case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log(`[WEBHOOK] Evento 'customer.subscription.deleted' recebido para a subscrição: ${deletedSubscription.id}`);
        const { error: cancelError } = await supabase
            .from('profiles')
            .update({
                plan_id: null,
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
