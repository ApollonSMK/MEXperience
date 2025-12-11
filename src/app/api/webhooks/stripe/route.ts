import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from '@/lib/email-service';

export const runtime = "nodejs";

const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
};

export async function POST(req: Request) {
  const headerList = await headers();
  const sig = headerList.get('stripe-signature');
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!sig || !webhookSecret || !secretKey) {
      console.error('❌ Stripe environment variables not set.');
      return new NextResponse('Webhook Error: Environment variables not set', { status: 400 });
  }

  const stripe = getStripe(secretKey);
  let event: Stripe.Event;

  try {
    const rawBody = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  console.log(`[Webhook] ✅ Event received: ${event.type}`);

  try {
    switch (event.type) {
        
      // --- EVENTO CRÍTICO PARA AGENDAMENTOS ÚNICOS (One-Time Payments) ---
      case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const metadata = paymentIntent.metadata;

          console.log(`[Webhook] 💰 PaymentIntent Succeeded: ${paymentIntent.id}. Type: ${metadata.type}`);

          // Lógica para Agendamento (Appointment)
          if (metadata.type === 'appointment') {
              const { 
                  user_id, 
                  user_name, 
                  user_email, 
                  service_name, 
                  appointment_date, 
                  duration 
              } = metadata;

              if (!user_id || !appointment_date) {
                  console.error('[Webhook] ❌ Missing metadata for appointment.');
                  break;
              }

              // 1. Tentar encontrar o agendamento existente (criado pelo cliente no front-end)
              // Procuramos por um agendamento do mesmo user, na mesma data/hora exata
              const { data: existingApps, error: searchError } = await supabaseAdmin
                  .from('appointments')
                  .select('*')
                  .eq('user_id', user_id)
                  .eq('date', appointment_date) // A data deve ser ISO string exata
                  .limit(1);

              if (searchError) {
                  console.error('[Webhook] ❌ Error searching for appointment:', searchError);
              }

              const existingApp = existingApps?.[0];

              if (existingApp) {
                  // Agendamento já existe. Atualizamos o pagamento para 'card' se estiver como 'reception' ou outro
                  if (existingApp.payment_method !== 'card' && existingApp.payment_method !== 'online') {
                      console.log(`[Webhook] 🔄 Updating existing appointment ${existingApp.id} to payment_method='card'`);
                      await supabaseAdmin
                          .from('appointments')
                          .update({ payment_method: 'card', status: 'Confirmado' })
                          .eq('id', existingApp.id);
                  } else {
                      console.log(`[Webhook] ✅ Appointment ${existingApp.id} already has correct payment status.`);
                  }
              } else {
                  // CRÍTICO: Agendamento NÃO existe (cliente fechou a janela). CRIAR AGORA.
                  console.log(`[Webhook] ⚠️ Appointment not found for PI ${paymentIntent.id}. Creating NEW appointment from metadata.`);
                  
                  const { error: insertError } = await supabaseAdmin.from('appointments').insert({
                      user_id,
                      user_name: user_name || 'Client Web',
                      user_email: user_email,
                      service_name: service_name || 'Service',
                      date: appointment_date,
                      duration: parseInt(duration || '30'),
                      status: 'Confirmado',
                      payment_method: 'card', // Força 'card' pois veio do Stripe
                  });

                  if (insertError) {
                      console.error('[Webhook] ❌ Failed to create backup appointment:', insertError);
                  } else {
                      console.log('[Webhook] ✅ Backup appointment created successfully.');
                  }
              }

              // 2. Garantir que a Fatura (Invoice) existe
              const invoiceData = {
                  id: paymentIntent.id,
                  user_id: user_id,
                  plan_title: `${service_name} - ${duration} min`,
                  date: new Date(paymentIntent.created * 1000).toISOString(),
                  amount: paymentIntent.amount / 100,
                  status: 'Pago',
                  payment_method: 'card'
              };
              await supabaseAdmin.from('invoices').upsert(invoiceData, { onConflict: 'id' });
          } 
          // Lógica para Cartão Presente (Gift Card)
          else if (metadata.type === 'gift_card') {
               const { from_name, to_name, recipient_email, message, buyer_id } = metadata;
               const amount = paymentIntent.amount / 100;

               console.log(`[Webhook] 🎁 Processing Gift Card for ${recipient_email}, Amount: ${amount}`);

               // IDEMPOTENCY CHECK: Check if a gift card with this payment intent already exists
               // Note: This assumes metadata is stored as JSONB and searchable.
               // Alternatively, check for invoice existence if that's the standard.
               const { data: existingCards } = await supabaseAdmin
                   .from('gift_cards')
                   .select('id, code')
                   .contains('metadata', { stripe_payment_intent: paymentIntent.id })
                   .limit(1);

               if (existingCards && existingCards.length > 0) {
                   console.log(`[Webhook] ✅ Gift Card already exists for PI ${paymentIntent.id}. Skipping.`);
                   break;
               }

               // Generate Unique Code
               const generateCode = () => {
                 const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
                 let code = 'GIFT-';
                 for (let i = 0; i < 8; i++) {
                   code += chars.charAt(Math.floor(Math.random() * chars.length));
                 }
                 return code;
               };

               const giftCode = generateCode();

               // Prepare Insert Data
               const insertData: any = {
                   code: giftCode,
                   initial_balance: amount,
                   current_balance: amount,
                   metadata: {
                       from_name,
                       to_name,
                       message,
                       stripe_payment_intent: paymentIntent.id
                   },
                   status: 'active',
                   type: 'gift_card'
               };

               // If we have a buyer_id (authenticated user), associate it
               if (buyer_id) {
                   insertData.buyer_id = buyer_id;
               }

               // Insert into DB
               const { error: insertError } = await supabaseAdmin.from('gift_cards').insert(insertData);

               if (insertError) {
                   console.error('[Webhook] ❌ Failed to create gift card:', insertError);
               } else {
                   console.log(`[Webhook] ✅ Gift Card created: ${giftCode}. Buyer: ${buyer_id || 'Guest'}`);

                   // --- NEW: Create Invoice for Gift Card ---
                   if (buyer_id) {
                       const invoiceData = {
                           id: paymentIntent.id,
                           user_id: buyer_id,
                           plan_title: `Carte Cadeau - ${to_name || 'Ami'}`,
                           date: new Date(paymentIntent.created * 1000).toISOString(),
                           amount: amount,
                           status: 'Pago',
                           payment_method: 'online'
                       };
                       
                       const { error: invoiceError } = await supabaseAdmin.from('invoices').upsert(invoiceData, { onConflict: 'id' });
                       
                       if (invoiceError) {
                            console.error('[Webhook] ❌ Failed to create invoice for gift card:', invoiceError);
                       } else {
                            console.log('[Webhook] ✅ Invoice created for gift card.');
                       }
                   }

                   // Send Email
                   if (recipient_email) {
                       try {
                           console.log(`[Webhook] 📧 Sending gift card email to ${recipient_email}...`);
                           await sendEmail({
                               type: 'gift_card',
                               to: recipient_email,
                               data: {
                                   userName: to_name, // This maps to the template variable
                                   giftAmount: amount,
                                   giftCode: giftCode,
                                   fromName: from_name,
                                   message: message
                               }
                           });
                           console.log('[Webhook] 📧 Email sent successfully.');
                       } catch (emailError) {
                           console.error('[Webhook] ❌ Failed to send email:', emailError);
                       }
                   }
               }
          }
          // Lógica para Pacote de Minutos (Minute Pack)
          else if (metadata.type === 'minute_pack') {
               // A lógica de crédito já é feita no confirm-payment, mas o webhook garante redundância
               // (Pode ser implementada aqui similar ao subscription se necessário, mas geralmente é instantânea)
               console.log('[Webhook] ℹ️ Minute pack payment received via Webhook (Already handled by API usually).');
          }

          break;
      }

      // --- ASSINATURAS (JÁ EXISTENTE) ---
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] 💡 Subscription Event: ${event.type}. ID: ${subscription.id}`);
        
        let profileUpdate: any = {
            stripe_subscription_status: subscription.status,
        }

        if (event.type === 'customer.subscription.deleted') {
            profileUpdate.plan_id = null;
            profileUpdate.stripe_subscription_id = null;
        }

        await supabaseAdmin
          .from('profiles')
          .update(profileUpdate)
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Apenas processa se for renovação ou criação de ASSINATURA
        if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
            const subscriptionId = invoice.subscription as string;
            if (!subscriptionId) break;
            
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata.user_id;
            const planId = subscription.metadata.plan_id;
            
            if (!userId || !planId) break;

            const { data: planData } = await supabaseAdmin.from('plans').select('minutes, title').eq('id', planId).single();
            const { data: profileData } = await supabaseAdmin.from('profiles').select('minutes_balance, stripe_subscription_id, email, display_name').eq('id', userId).single();
                
            if (!profileData || !planData) break;
            
            const isRenewal = invoice.billing_reason === 'subscription_cycle';
            const isCreation = invoice.billing_reason === 'subscription_create';
            const shouldAddMinutes = isRenewal || (isCreation && profileData.stripe_subscription_id !== subscription.id);

            let newBalance = profileData.minutes_balance || 0;
            if (shouldAddMinutes) {
                newBalance += planData.minutes;
                console.log(`[Webhook] 💰 Adding ${planData.minutes} minutes to user ${userId}.`);
            }

            await supabaseAdmin.from('profiles').update({
                plan_id: planId,
                minutes_balance: newBalance,
                stripe_subscription_id: subscription.id,
                stripe_subscription_status: subscription.status,
            }).eq('id', userId);

            // Create invoice record
            await supabaseAdmin.from('invoices').upsert({
                id: invoice.id,
                user_id: userId,
                plan_id: planId,
                plan_title: planData.title,
                date: new Date(invoice.created * 1000).toISOString(),
                amount: invoice.amount_paid / 100,
                status: 'Pago',
                payment_method: 'stripe'
            }, { onConflict: 'id' });

            // Send Email
            if (profileData.email) {
                await sendEmail({
                    type: 'purchase',
                    to: profileData.email,
                    data: {
                        userName: profileData.display_name || 'Client',
                        planName: planData.title,
                        planPrice: `${(invoice.amount_paid / 100).toFixed(2)}€`,
                        date: new Date().toISOString()
                    }
                });
            }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
             await supabaseAdmin
            .from('profiles')
            .update({ stripe_subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('⚠️ Webhook handler failed:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}