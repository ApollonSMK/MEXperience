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
  console.log("[API] /create-subscription-intent: Recebido novo pedido.");
  try {
    const { planId, stripePriceId } = await req.json();

    if (!planId || !stripePriceId) {
      console.error("[API] /create-subscription-intent: Erro - ID do plano ou ID de preço Stripe em falta.");
      return NextResponse.json({ error: 'ID du plan ou ID de prix Stripe manquant.' }, { status: 400 });
    }
    console.log(`[API] /create-subscription-intent: planId=${planId}, stripePriceId=${stripePriceId}`);


    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[API] /create-subscription-intent: Erro - Utilizador não autenticado.");
      return NextResponse.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
    }
    console.log(`[API] /create-subscription-intent: Utilizador autenticado com ID: ${user.id}`);


    let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();
    
    // CORREÇÃO GOOGLE LOGIN: Se o perfil não existir, criamos um agora.
    if (profileError && profileError.code === 'PGRST116') {
        console.log(`[API] Perfil não encontrado para ${user.id}. Criando novo perfil a partir dos metadados Google.`);
        const meta = user.user_metadata || {};
        const fullName = meta.full_name || meta.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            display_name: fullName,
            first_name: firstName,
            last_name: lastName,
            photo_url: meta.avatar_url || meta.picture,
        });

        if (insertError) {
            console.error("[API] Erro ao criar perfil fallback:", insertError);
            throw insertError;
        }
        
        // Define perfil vazio para continuar a lógica (o stripe_customer_id será null e criado a seguir)
        profile = { stripe_customer_id: null };
        profileError = null;
    } else if (profileError) {
        console.error("[API] /create-subscription-intent: Erro ao buscar perfil do Supabase:", profileError);
        throw profileError;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        console.error("[API] /create-subscription-intent: Erro - Chave secreta Stripe não configurada.");
        throw new Error("Clé secrète Stripe non configurée.");
    }
    const stripe = getStripe(secretKey);

    let customerId = profile?.stripe_customer_id;
    
    // VERIFICAÇÃO DE SEGURANÇA:
    // Se tivermos um ID, verificamos se ele ainda é válido no Stripe.
    if (customerId) {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            // Se foi apagado ou não é válido
            if (customer.deleted) {
                console.log(`[API] Cliente Stripe ${customerId} foi marcado como apagado. Criando novo.`);
                customerId = null;
            }
        } catch (error) {
            console.warn(`[API] Cliente Stripe ${customerId} não encontrado ou erro ao buscar (pode ter sido apagado no dashboard). Criando novo.`);
            customerId = null;
        }
    }

    // Se o cliente não existir no Stripe (ou foi resetado acima), cria um novo.
    if (!customerId) {
        console.log(`[API] /create-subscription-intent: A criar novo cliente Stripe para o utilizador ${user.id}.`);
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata.display_name,
            metadata: {
                supabase_user_id: user.id
            }
        });
        customerId = customer.id;
        console.log(`[API] /create-subscription-intent: Criado novo cliente Stripe: ${customerId}`);

        // Atualiza o perfil no Supabase com o novo ID de cliente Stripe.
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
        
        if (updateError) {
            console.error("[API] /create-subscription-intent: Erro ao atualizar o perfil com o ID do cliente Stripe:", updateError);
            // Não é um erro bloqueante, podemos prosseguir.
        } else {
            console.log(`[API] /create-subscription-intent: Perfil do utilizador ${user.id} atualizado com sucesso com o novo ID de cliente Stripe.`);
        }
    }
    
    // CRÍTICO: Criar a subscrição com um estado de pagamento incompleto.
    // Isto garante que estamos a trabalhar com uma subscrição real desde o início.
    console.log(`[API] /create-subscription-intent: A criar subscrição para o cliente ${customerId}`);
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
            save_default_payment_method: 'on_subscription',
            payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            plan_id: planId, // Consistência de nomenclatura
            user_id: user.id
        }
    });
    console.log(`[API] /create-subscription-intent: Subscrição criada com ID: ${subscription.id}`);


    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    // O client_secret é a chave que autoriza o frontend a confirmar este pagamento específico.
    if (!paymentIntent?.client_secret) {
        console.error("[API] /create-subscription-intent: Erro - Impossível extrair o client_secret da intenção de pagamento.");
        throw new Error("Impossible d'extraire le client_secret de l'intention de paiement.");
    }
    
    console.log(`[API] /create-subscription-intent: Sucesso! A devolver client_secret ao frontend.`);
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('[API] /create-subscription-intent: Erro não tratado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}