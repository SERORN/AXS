'use client'

import { ArrowRight, Zap, Users, Smartphone } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 hero-pattern opacity-10"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main CTA */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform
            <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Your Business?
            </span>
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join 500+ businesses that have revolutionized their operations with AXS360. 
            Start your free trial today and see results in the first week.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <button className="inline-flex items-center justify-center space-x-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <span>Start Free Trial</span>
              <ArrowRight size={20} />
            </button>
            <button className="inline-flex items-center justify-center space-x-3 border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
              <Smartphone size={20} />
              <span>Schedule Demo</span>
            </button>
          </div>

          {/* Features Highlight */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="text-yellow-300" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Quick Setup
              </h3>
              <p className="text-blue-100 text-sm">
                Get started in under 30 minutes with our guided setup process
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-green-300" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Expert Support
              </h3>
              <p className="text-blue-100 text-sm">
                24/7 dedicated support team to help you succeed
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="text-pink-300" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Mobile Ready
              </h3>
              <p className="text-blue-100 text-sm">
                Native iOS and Android apps for on-the-go management
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-20 pt-12 border-t border-white/20">
          <p className="text-blue-200 mb-8">Join these industry leaders</p>
          <div className="flex items-center justify-center space-x-12 opacity-60">
            <div className="text-white font-bold text-xl">Mercedes-Benz</div>
            <div className="text-white font-bold text-xl">BMW Group</div>
            <div className="text-white font-bold text-xl">Audi</div>
            <div className="text-white font-bold text-xl">VIP Lounges</div>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-12 inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full">
          <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
            <span className="text-green-900 text-xs font-bold">✓</span>
          </div>
          <span className="text-white text-sm font-medium">
            30-day money-back guarantee • No setup fees • Cancel anytime
          </span>
        </div>
      </div>
    </section>
  )
}
