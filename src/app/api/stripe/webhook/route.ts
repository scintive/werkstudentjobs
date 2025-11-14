import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log event for debugging
  await supabaseAdmin.from('stripe_events').insert({
    id: event.id,
    type: event.type,
    data: event.data as any,
    processed: false,
  })

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await supabaseAdmin
      .from('stripe_events')
      .update({ processed: true })
      .eq('id', event.id)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    await supabaseAdmin
      .from('stripe_events')
      .update({ processed: false, error: error.message })
      .eq('id', event.id)

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id

  // Get user from customer ID
  const { data: existing } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!existing) {
    console.error('No user found for customer:', customerId)
    return
  }

  const planId = getPlanIdFromPrice(subscription.items.data[0]?.price.id)
  const billingCycle = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

  await supabaseAdmin
    .from('user_subscriptions')
    .upsert({
      user_id: existing.user_id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan_id: planId,
      status: subscription.status,
      billing_cycle: billingCycle,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    }, {
      onConflict: 'stripe_subscription_id'
    })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!subscriptionId) {
    return
  }

  // Get the full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Get user ID from metadata
  const userId = session.metadata?.user_id

  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  const planId = getPlanIdFromPrice(subscription.items.data[0]?.price.id)
  const billingCycle = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

  await supabaseAdmin
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan_id: planId,
      status: subscription.status,
      billing_cycle: billingCycle,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id)
  // Additional logic for successful payments (e.g., send receipt email)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  await supabaseAdmin
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId)

  console.log('Payment failed for invoice:', invoice.id)
  // Additional logic (e.g., send payment failure email)
}

function getPlanIdFromPrice(priceId?: string): string {
  // This should match your Stripe price IDs to plan IDs
  // You'll need to update this mapping based on your actual Stripe price IDs
  if (!priceId) return 'free'

  // For now, return 'pro' as a placeholder
  // You should implement proper mapping based on your Stripe dashboard
  return 'pro'
}
