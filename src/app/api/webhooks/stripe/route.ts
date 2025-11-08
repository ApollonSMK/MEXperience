
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret || !secretKey) {
      console.error('❌ Stripe environment variables not set');
      return new NextResponse('Webhook Error: Environment variables not set', { status: 400 });
  }

  const stripe = getStripe(secretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret,
    );
  } catch (err: any) {
    console.error('❌ Webhook verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  console.log('✅ Webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.paid': {
        const session = event.data.object;
        let subscriptionId: string | null | undefined;
        let customerId: string | null | undefined;
        let userId: string | undefined;
        let planId: string | undefined;

        if (session.object === 'checkout.session') {
            const checkoutSession = session as Stripe.Checkout.Session;
            subscriptionId = checkoutSession.subscription as string;
            customerId = checkoutSession.customer as string;
        } else if (session.object === 'invoice') {
            const invoice = session as Stripe.Invoice;
            subscriptionId = invoice.subscription as string;
            customerId = invoice.customer as string;
        }
        
        if (!subscriptionId) {
            console.log(`ℹ️ Event ${event.id} of type ${event.type} does not have a subscription ID. Ignoring.`);
            break;
        }

        console.log(`💡 Processing event ${event.id} -> Fetching subscription ${subscriptionId}`);
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        userId = subscription.metadata.user_id;
        planId = subscription.metadata.plan_id;

        if (!userId || !planId) {
          console.error(`⚠️ Missing metadata on subscription ${subscriptionId}: user_id or plan_id`);
          return NextResponse.json({ received: true, message: 'Missing metadata' }); 
        }

        console.log('✅ Found metadata. User:', userId, 'Plan:', planId);
        
        const { data: planData, error: planError } = await supabaseAdmin
            .from('plans')
            .select('minutes')
            .eq('id', planId)
            .single();

        if(planError || !planData) {
            console.error(`❌ Plan with ID ${planId} not found in Supabase.`);
            break;
        }

        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('minutes_balance')
            .eq('id', userId)
            .single();

        if(profileError) {
            console.error(`❌ User profile with ID ${userId} not found in Supabase.`);
            break;
        }
        
        const newMinutesBalance = (profileData?.minutes_balance || 0) + planData.minutes;

        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_id: planId,
            minutes_balance: newMinutesBalance,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId as string,
            stripe_subscription_status: subscription.status,
            stripe_cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_subscription_cancel_at: subscription.cancel_at,
          })
          .eq('id', userId);

        if (updateProfileError) {
            console.error(`❌ Error updating profile for user ${userId}:`, updateProfileError);
            throw updateProfileError;
        } else {
            console.log(`✅ Successfully updated profile for user ${userId}`);
        }

        if (session.object === 'invoice') {
            const invoice = session as Stripe.Invoice;
            const { error: invoiceInsertError } = await supabaseAdmin.from('invoices').insert({
                id: invoice.id,
                user_id: userId,
                plan_id: planId,
                plan_title: subscription.items.data[0]?.plan?.nickname || 'Assinatura',
                amount: invoice.amount_paid / 100,
                status: 'Pago',
                pdf_url: invoice.invoice_pdf,
            });
             if (invoiceInsertError) {
                console.error(`❌ Error inserting invoice for user ${userId}:`, invoiceInsertError);
             } else {
                console.log(`✅ Successfully inserted invoice for user ${userId}`);
             }
        }

        await supabaseAdmin.from('debug_logs').insert({
          user_id: userId,
          log_message: `Plano ${planId} ativado/pago via Stripe Webhook.`,
          metadata: { 
            event_type: event.type,
            subscription_status: subscription.status,
            new_minutes_balance: newMinutesBalance
          },
          is_admin_result: false, 
        });
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('💡 Subscription deleted:', subscription.id);
        
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            stripe_subscription_status: 'canceled',
            plan_id: null,
            stripe_cancel_at_period_end: false,
            stripe_subscription_cancel_at: null,
          })
          .eq('stripe_subscription_id', subscription.id);
        if (error) console.error(`❌ Error updating profile on subscription delete for ${subscription.id}:`, error);

        break;
      }
      
      case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`💡 Subscription updated: ${subscription.id}`);
          
          const { error } = await supabaseAdmin
              .from('profiles')
              .update({
                  stripe_subscription_status: subscription.status,
                  stripe_cancel_at_period_end: subscription.cancel_at_period_end,
                  stripe_subscription_cancel_at: subscription.cancel_at,
              })
              .eq('stripe_subscription_id', subscription.id);

          if (error) console.error(`❌ Error updating profile on subscription update for ${subscription.id}:`, error);
          
          break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('⚠️ Error processing webhook:', error);
    await supabaseAdmin.from('debug_logs').insert({
      log_message: 'Erro no webhook Stripe',
      metadata: { error: error.message, eventType: event.type },
      is_admin_result: false
    });
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}
