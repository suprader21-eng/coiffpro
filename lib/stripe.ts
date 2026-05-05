import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
export default stripe

export async function createStripeCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name })
}

export async function createCheckoutSession({ customerId, priceId, salonId, successUrl, cancelUrl }: {
  customerId: string; priceId: string; salonId: string; successUrl: string; cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 14, metadata: { salonId } },
    metadata: { salonId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'fr',
    allow_promotion_codes: true,
  })
}
