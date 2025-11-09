import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

// ✅ Garante execução no Node.js Runtime (necessário para Buffer)
export const runtime = 'nodejs'

// ✅ Impede cache e força requisição dinâmica (preserva o corpo RAW)
export const dynamic = 'force-dynamic'
export const revalidate = 0

// ✅ Cria cliente admin do Supabase
const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey)
    throw new Error('Variáveis de ambiente do Supabase não configuradas.')
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ✅ Função auxiliar para atualizar o status da subscrição
async function manageSubscriptionStatusChange(
  supabaseAdmin: any,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata.user_id
  const planId = subscription.metadata.plan_id
  const customerId = subscription.customer as string

  if (!userId || !planId) {
    console.error(
      `❌ Webhook Error: Missing metadata on subscription ${subscription.id}: user_id or plan_id`
    )
    return
  }

  console.log(
    `[Webhook] 💡 Updating subscription ${subscription.id} (status: ${subscription.status}) for user ${userId}`
  )

  const profileUpdateData = {
    plan_id: planId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_subscription_status: subscription.status,
    stripe_cancel_at_period_end: subscription.cancel_at_period_end,
    stripe_subscription_cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(profileUpdateData)
    .eq('id', userId)

  if (error)
    console.error(`❌ Failed to update profile for user ${userId}:`, error)
  else
    console.log(
      `[Webhook] ✅ Subscription data updated in profile for user ${userId}`
    )
}

export async function POST(req: Request) {
  const sig = headers().get('stripe-signature')
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secretKey || !webhookSecret) {
    console.error('❌ Stripe environment variables not set')
    return new NextResponse('Webhook Error: Env vars not set', { status: 400 })
  }

  const stripe = getStripe(secretKey)
  let event: Stripe.Event

  try {
    // 🚨 Corpo RAW (não usar req.json() / req.text())
    const body = Buffer.from(await req.arrayBuffer())
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(`❌ Webhook verification failed: ${err.message}`)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log(`✅ Webhook verified: ${event.type}`)

  const supabaseAdmin = getSupabaseAdminClient()

  try {
    switch (event.type) {
      // 🔹 Subscriptions criadas/atualizadas
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await manageSubscriptionStatusChange(supabaseAdmin, subscription)
        break
      }

      // 🔹 Subscriptions canceladas
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[Webhook] 🟥 Subscription deleted: ${subscription.id}`)

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_id: null,
            stripe_subscription_id: null,
            stripe_subscription_status: 'canceled',
            stripe_cancel_at_period_end: true,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error)
          console.error(
            `❌ Failed to clear subscription for ${subscription.id}:`,
            error
          )
        else console.log(`✅ Profile cleared for subscription ${subscription.id}`)
        break
      }

      // 🔹 Pagamento de fatura bem-sucedido
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(
          `[Webhook] 🧾 Invoice paid: ${invoice.id} (reason: ${invoice.billing_reason})`
        )

        if (
          invoice.billing_reason === 'subscription_create' ||
          invoice.billing_reason === 'subscription_cycle'
        ) {
          const subscriptionId = invoice.subscription as string
          if (!subscriptionId) break

          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata.user_id
          const planId = subscription.metadata.plan_id
          if (!userId || !planId) break

          const { data: plan, error: planErr } = await supabaseAdmin
            .from('plans')
            .select('minutes, title')
            .eq('id', planId)
            .single()
          if (planErr || !plan) break

          const { data: profile, error: profErr } = await supabaseAdmin
            .from('profiles')
            .select('minutes_balance')
            .eq('id', userId)
            .single()
          if (profErr || !profile) break

          const newBalance = (profile.minutes_balance || 0) + plan.minutes
          await supabaseAdmin
            .from('profiles')
            .update({ minutes_balance: newBalance })
            .eq('id', userId)

          console.log(
            `[Webhook] 💰 Added ${plan.minutes} minutes to user ${userId} (new balance: ${newBalance})`
          )

          await supabaseAdmin.from('invoices').insert({
            id: invoice.id,
            user_id: userId,
            plan_id: planId,
            plan_title: plan.title,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100,
            status: invoice.status,
          })
        }
        break
      }

      // 🔹 Pagamento individual (ex: agendamento avulso)
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`[Webhook] 💳 PaymentIntent succeeded: ${paymentIntent.id}`)

        const meta = paymentIntent.metadata || {}
        const {
          user_id,
          user_name,
          user_email,
          service_name,
          appointment_date,
          duration,
          payment_method,
        } = meta

        if (
          !user_id ||
          !user_name ||
          !user_email ||
          !service_name ||
          !appointment_date ||
          !duration
        ) {
          console.warn(`⚠️ Missing metadata on PaymentIntent ${paymentIntent.id}`)
          break
        }

        const appointment = {
          user_id,
          user_name,
          user_email,
          service_name,
          date: appointment_date,
          duration: parseInt(duration, 10),
          status: 'Confirmado' as const,
          payment_method: payment_method || 'online',
        }

        const { error } = await supabaseAdmin
          .from('appointments')
          .insert(appointment)
        if (error)
          console.error(`❌ Failed to insert appointment:`, error)
        else
          console.log(`✅ Appointment created for user ${user_id}`)
        break
      }

      // 🔹 Falha no pagamento
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = invoice.subscription as string
        if (!subId) break

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ stripe_subscription_status: 'past_due' })
          .eq('stripe_subscription_id', subId)

        if (error)
          console.error(`❌ Failed to mark subscription as past_due:`, error)
        else console.log(`⚠️ Subscription ${subId} marked as past_due`)
        break
      }

      default:
        console.log(`[Webhook] ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('⚠️ Webhook handler failed:', err)
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
}
