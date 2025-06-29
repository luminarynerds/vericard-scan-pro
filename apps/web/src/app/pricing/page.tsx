import Link from 'next/link'
import { Check } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Hobby',
      price: 0,
      description: 'For casual collectors',
      features: [
        '10 scans per month',
        'Basic damage detection',
        'Grade estimation',
        'Export to PDF'
      ],
      cta: 'Start Free',
      href: '/scanner'
    },
    {
      name: 'Pro',
      price: 9.99,
      description: 'For serious collectors',
      features: [
        'Unlimited scans',
        'Advanced AI analysis',
        'Market value tracking',
        'PSA submission prep',
        'Priority support'
      ],
      cta: 'Upgrade to Pro',
      href: '/subscription',
      popular: true
    },
    {
      name: 'Dealer',
      price: 49.99,
      description: 'For card shops & dealers',
      features: [
        'Everything in Pro',
        'Bulk scanning',
        'Inventory management',
        'eBay integration',
        'API access',
        'White-label reports'
      ],
      cta: 'Contact Sales',
      href: '/subscription'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-400">Choose the plan that fits your collecting needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-gray-800 rounded-2xl p-8 ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-400">/month</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full text-center py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'bg-primary hover:bg-primary/90 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400">
            All plans include SSL encryption, automatic backups, and our satisfaction guarantee.
          </p>
          <p className="text-gray-400 mt-2">
            Questions? <Link href="/" className="text-primary hover:underline">Contact us</Link>
          </p>
        </div>
      </div>
    </div>
  )
}