import { loadStripe } from '@stripe/stripe-js'

// Use test key for now - replace with env variable in production
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51234567890abcdefghijklmnopqrstuvwxyz'

let stripePromise: Promise<any> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

export const createCheckoutSession = async (plan: 'pro' | 'dealer', billingCycle: 'monthly' | 'yearly') => {
  const priceIds = {
    pro: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly'
    },
    dealer: {
      monthly: 'price_dealer_monthly',
      yearly: 'price_dealer_yearly'
    }
  }

  // In production, this would call your backend API
  // For now, we'll use Stripe Checkout with predefined prices
  const stripe = await getStripe()
  
  const { error } = await stripe!.redirectToCheckout({
    lineItems: [
      {
        price: priceIds[plan][billingCycle],
        quantity: 1,
      },
    ],
    mode: 'subscription',
    successUrl: `${window.location.origin}/dashboard?success=true`,
    cancelUrl: `${window.location.origin}/subscription?canceled=true`,
  })

  if (error) {
    console.error('Stripe checkout error:', error)
    throw error
  }
}