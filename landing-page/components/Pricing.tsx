'use client'

import { Check, Star, ArrowRight } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    description: 'Perfect for small businesses getting started',
    features: [
      'Up to 50 vehicles',
      'Basic QR access',
      'Mobile app access',
      'Email support',
      'Basic analytics',
      '1 business location'
    ],
    popular: false,
    cta: 'Start Free Trial'
  },
  {
    name: 'Professional',
    price: '$299',
    period: '/month',
    description: 'Ideal for growing businesses',
    features: [
      'Up to 200 vehicles',
      'Advanced QR features',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      '3 business locations',
      'Employee management',
      'API access'
    ],
    popular: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with complex needs',
    features: [
      'Unlimited vehicles',
      'White-label solution',
      'Dedicated support',
      'Custom development',
      'SLA guarantee',
      'Unlimited locations',
      'Advanced security',
      'On-premise deployment'
    ],
    popular: false,
    cta: 'Contact Sales'
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business. All plans include our core features 
            with no setup fees or hidden costs.
          </p>
          
          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <span className="text-gray-600">Monthly</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" />
              <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
              </div>
            </div>
            <span className="text-gray-600">
              Annual 
              <span className="ml-1 text-green-600 text-sm font-medium">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.popular 
                  ? 'border-blue-500 shadow-xl scale-105' 
                  : 'border-gray-200 hover:border-blue-300'
              } transition-all duration-300 hover:shadow-lg`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star size={14} />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center space-x-3">
                    <Check className="text-green-500 flex-shrink-0" size={18} />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button 
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight size={16} />
              </button>

              {/* Money Back Guarantee */}
              {index < 2 && (
                <p className="text-center text-xs text-gray-500 mt-4">
                  30-day money-back guarantee
                </p>
              )}
            </div>
          ))}
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Have questions about our pricing?
          </p>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View FAQ →
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime SLA</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-2">SOC 2</div>
              <div className="text-gray-600">Security Certified</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
