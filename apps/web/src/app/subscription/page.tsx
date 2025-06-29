'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CreditCard, Check, AlertCircle } from 'lucide-react'
import { createCheckoutSession } from '@/lib/stripe'

function SubscriptionContent() {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'dealer'>('pro')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      alert('Payment was canceled. You can try again anytime.')
    }
  }, [searchParams])

  const plans = {
    pro: {
      name: 'Pro',
      monthly: 9.99,
      yearly: 99.99,
      features: [
        'Unlimited scans',
        'Advanced AI analysis',
        'Market value tracking',
        'PSA submission prep',
        'Priority support',
        'Export unlimited reports'
      ]
    },
    dealer: {
      name: 'Dealer',
      monthly: 49.99,
      yearly: 499.99,
      features: [
        'Everything in Pro',
        'Bulk scanning mode',
        'Inventory management',
        'eBay integration',
        'API access',
        'White-label reports',
        'Dedicated support'
      ]
    }
  }

  const currentPlan = plans[selectedPlan]
  const price = currentPlan[billingCycle]
  const savings = billingCycle === 'yearly' ? (currentPlan.monthly * 12 - currentPlan.yearly) : 0

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      await createCheckoutSession(selectedPlan, billingCycle)
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Unable to start subscription. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Upgrade Your Account</h1>
            <p className="text-xl text-gray-400">Get unlimited scans and premium features</p>
          </div>

          {/* Plan Selection */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setSelectedPlan('pro')}
              className={`p-6 rounded-xl border-2 transition ${
                selectedPlan === 'pro'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
            >
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-gray-400">For serious collectors</p>
              <p className="text-2xl font-bold mt-2">
                ${plans.pro[billingCycle]}
                <span className="text-sm text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </p>
            </button>

            <button
              onClick={() => setSelectedPlan('dealer')}
              className={`p-6 rounded-xl border-2 transition ${
                selectedPlan === 'dealer'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
            >
              <h3 className="text-xl font-bold mb-2">Dealer</h3>
              <p className="text-gray-400">For shops & businesses</p>
              <p className="text-2xl font-bold mt-2">
                ${plans.dealer[billingCycle]}
                <span className="text-sm text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </p>
            </button>
          </div>

          {/* Billing Cycle */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-4">Billing Cycle</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  billingCycle === 'yearly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Yearly
                {savings > 0 && (
                  <span className="block text-sm font-normal">Save ${savings.toFixed(0)}</span>
                )}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-4">{currentPlan.name} Features</h3>
            <ul className="space-y-3">
              {currentPlan.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Form Placeholder */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Method
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Secure payment processing by Stripe
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Test mode: Use card number 4242 4242 4242 4242
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Plan</span>
              <span className="font-semibold">{currentPlan.name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Billing</span>
              <span className="font-semibold capitalize">{billingCycle}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ${price}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:opacity-50 text-white py-4 rounded-lg font-semibold text-lg transition"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            By subscribing, you agree to our{' '}
            <Link href="/" className="text-primary hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <SubscriptionContent />
    </Suspense>
  )
}