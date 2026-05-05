import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: 'Webhook signature invalide' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  switch (event.type) {

    // Abonnement créé (avec trial) → salon en mode trialing
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const salonId = sub.metadata?.salonId
      if (!salonId) break
      await db.from('salons').update({
        stripe_subscription_id: sub.id,
        stripe_subscription_status: sub.status, // 'trialing'
        status: 'trialing',
        trial_ends_at: new Date((sub.trial_end || 0) * 1000).toISOString(),
      }).eq('id', salonId)
      break
    }

    // Paiement réussi (après les 14j) → salon actif
    case 'invoice.payment_succeeded': {
      const inv = event.data.object as Stripe.Invoice
      if (!inv.subscription) break
      const sub = await stripe.subscriptions.retrieve(inv.subscription as string)
      const salonId = sub.metadata?.salonId
      if (!salonId) break
      // Chercher aussi par customer_id si pas de metadata
      const query = salonId
        ? db.from('salons').update({ status: 'active', stripe_subscription_status: 'active' }).eq('id', salonId)
        : db.from('salons').update({ status: 'active', stripe_subscription_status: 'active' }).eq('stripe_customer_id', inv.customer as string)
      await query
      break
    }

    // Échec de paiement → suspendre
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice
      await db.from('salons').update({ status: 'suspended', stripe_subscription_status: 'past_due' }).eq('stripe_customer_id', inv.customer as string)
      break
    }

    // Abonnement mis à jour (ex: trial → active)
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const salonId = sub.metadata?.salonId
      const newStatus = sub.status === 'active' ? 'active' : sub.status === 'trialing' ? 'trialing' : sub.status === 'canceled' ? 'cancelled' : 'suspended'
      if (salonId) {
        await db.from('salons').update({ status: newStatus, stripe_subscription_status: sub.status }).eq('id', salonId)
      } else {
        await db.from('salons').update({ status: newStatus, stripe_subscription_status: sub.status }).eq('stripe_customer_id', sub.customer as string)
      }
      break
    }

    // Abonnement annulé → suspended
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const salonId = sub.metadata?.salonId
      if (salonId) {
        await db.from('salons').update({ status: 'cancelled', stripe_subscription_status: 'canceled' }).eq('id', salonId)
      } else {
        await db.from('salons').update({ status: 'cancelled', stripe_subscription_status: 'canceled' }).eq('stripe_customer_id', sub.customer as string)
      }
      break
    }

    // Checkout complété → lier l'abonnement au salon
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const salonId = session.metadata?.salonId
      if (salonId && session.subscription) {
        await db.from('salons').update({
          stripe_subscription_id: session.subscription as string,
        }).eq('id', salonId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
