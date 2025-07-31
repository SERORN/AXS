'use client'

import { Zap, Shield, Users, BarChart3, QrCode, Smartphone, Clock, Cog } from 'lucide-react'

const features = [
  {
    icon: QrCode,
    title: 'QR Code Access',
    description: 'Instant vehicle access with secure QR codes. No more keys or cards needed.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade security with encryption and multi-factor authentication.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Comprehensive dashboards with live metrics and business insights.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Users,
    title: 'Multi-Industry Support',
    description: 'Perfect for workshops, parking, lounges, and more business types.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Native iOS and Android apps for seamless mobile experience.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Clock,
    title: '24/7 Monitoring',
    description: 'Round-the-clock system monitoring and automated alerts.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: Cog,
    title: 'Easy Integration',
    description: 'Simple API integration with existing systems and workflows.',
    color: 'bg-red-100 text-red-600',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-second response times with global CDN infrastructure.',
    color: 'bg-yellow-100 text-yellow-600',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Businesses
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage vehicle access, boost efficiency, and grow your business. 
            Built for the future, available today.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-4 rounded-2xl">
            <Zap className="text-blue-600" size={24} />
            <span className="text-gray-700 font-medium">
              Ready to transform your business? 
            </span>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
