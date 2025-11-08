
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

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.paid': {
        const session = event.data.object;
        let subscriptionId;
        let subscription;

        if (session.object === 'checkout.session') {
            subscriptionId = (session as Stripe.Checkout.Session).subscription;
        } else if (session.object === 'invoice') {
            subscriptionId = (session as Stripe.Invoice).subscription;
        }
        
        if (!subscriptionId) {
            console.log(`ℹ️ Event ${event.id} of type ${event.type} does not have a subscription ID. Ignoring.`);
            break;
        }

        console.log('💡 Payment succeeded for event:', event.id, '-> fetching subscription:', subscriptionId);
        subscription = await stripe.subscriptions.retrieve(subscriptionId as string);

        const userId = subscription.metadata.user_id;
        const planId = subscription.metadata.plan_id;

        if (!userId || !planId) {
          console.error(`⚠️ Missing metadata on subscription ${subscriptionId}: user_id or plan_id`);
          return NextResponse.json({ received: true, message: 'Missing metadata' }); 
        }

        console.log('✅ Updating subscription for user', userId, 'plan', planId);
        
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
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_status: subscription.status,
            stripe_cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_subscription_cancel_at: subscription.cancel_at,
          })
          .eq('id', userId);

        if (updateProfileError) {
            console.error(`❌ Error updating profile for user ${userId}:`, updateProfileError);
        }

        if (session.object === 'invoice') {
            const invoice = session as Stripe.Invoice;
            await supabaseAdmin.from('invoices').insert({
                id: invoice.id,
                user_id: userId,
                plan_id: planId,
                plan_title: subscription.items.data[0]?.plan?.nickname || 'Assinatura',
                amount: invoice.amount_paid / 100,
                status: 'Pago',
                pdf_url: invoice.invoice_pdf,
            });
        }

        await supabaseAdmin.from('debug_logs').insert({
          user_id: userId,
          log_message: `Plano ${planId} ativado via Stripe.`,
          metadata: { 
            event_type: event.type,
            invoiceId: session.id,
            subscription_status: subscription.status
          },
          is_admin_result: true, // Placeholder
        });
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('💡 Subscription deleted:', subscription.id);
        
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_subscription_status: 'canceled',
            plan_id: null,
            stripe_cancel_at_period_end: false,
            stripe_subscription_cancel_at: null,
          })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }
      
      case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`💡 Subscription updated: ${subscription.id}`);
          
          await supabaseAdmin
              .from('profiles')
              .update({
                  stripe_subscription_status: subscription.status,
                  stripe_cancel_at_period_end: subscription.cancel_at_period_end,
                  stripe_subscription_cancel_at: subscription.cancel_at,
              })
              .eq('stripe_subscription_id', subscription.id);
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
    });
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}
