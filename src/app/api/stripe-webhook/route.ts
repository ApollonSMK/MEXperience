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
        throw new Error('Supabase URL or Service Role Key is not configured.');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('Stripe-Signature') as string;
  const supabase = getSupabaseAdminClient();
  
  // Fetch Stripe keys and webhook secret from the database
  const { data: gatewaySettings, error: gatewayError } = await supabase
        .from('gateway_settings')
        .select('secret_key') // We assume webhook secret is also stored here or in env
        .eq('id', 'stripe')
        .single();

  if (gatewayError || !gatewaySettings?.secret_key) {
        console.error("Clé secrète Stripe non configurée pour le webhook.");
        return new NextResponse('Stripe secret key not configured.', { status: 500 });
  }
  
  const stripe = getStripe(gatewaySettings.secret_key);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET n'est pas défini dans les variables d'environnement.");
      return new NextResponse('Webhook secret not configured.', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Erreur de vérification du webhook: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', checkoutSession.id);
      // This event is for one-time payments. For subscriptions, we use `invoice.paid`.
      break;

    case 'invoice.paid':
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice paid:', invoice.id);
      
      const subscriptionId = invoice.subscription;
      if (typeof subscriptionId !== 'string') {
        console.error('ID de souscription manquant ou invalide.');
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId = subscription.customer as string;

      // Find the user in our database via their Stripe customer ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, minutes_balance')
        .eq('stripe_customer_id', customerId)
        .single();
        
      if (profileError || !profile) {
        console.error(`Profil introuvable pour le client Stripe ${customerId}`);
        break;
      }

      // Get plan details from the subscription
      const priceId = subscription.items.data[0].price.id;
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, minutes')
        .eq('stripe_price_id', priceId)
        .single();

      if (planError || !plan) {
        console.error(`Plan introuvable pour le price_id ${priceId}`);
        break;
      }
      
      // Update user's profile with the new plan and minutes
      // Here, we're adding minutes from the new plan to any existing balance.
      // You might want to reset it instead: `minutes_balance: plan.minutes`
      const newMinutes = (profile.minutes_balance || 0) + plan.minutes;
      
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
          console.error(`Erreur de mise à jour du profil pour l'utilisateur ${profile.id}:`, updateError.message);
      } else {
          console.log(`Profil de l'utilisateur ${profile.id} mis à jour avec le plan ${plan.id}.`);
      }

      break;
      
    case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
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
            console.error(`Erreur lors de l'annulation de la souscription dans la DB:`, cancelError.message);
        } else {
            console.log(`Souscription annulée pour l'ID ${deletedSubscription.id}`);
        }
        break;

    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
