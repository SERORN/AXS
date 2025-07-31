'use client'

import { ArrowRight, Play, Star, Users, Building, Zap } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 hero-pattern opacity-30"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-500/10 rounded-full blur-xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Zap size={16} />
              <span>Next-Gen Access Control</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Premium Vehicle
              <span className="gradient-text block">Access Management</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              The ultimate multi-industry platform for automotive workshops, parking facilities, and premium lounges. 
              Streamline access control with QR technology and boost your business efficiency.
            </motion.p>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 text-blue-600 mb-1">
                  <Users size={20} />
                  <span className="text-2xl font-bold">500+</span>
                </div>
                <p className="text-gray-600 text-sm">Active Businesses</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 text-blue-600 mb-1">
                  <Building size={20} />
                  <span className="text-2xl font-bold">7</span>
                </div>
                <p className="text-gray-600 text-sm">Industries Covered</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 text-blue-600 mb-1">
                  <Star size={20} />
                  <span className="text-2xl font-bold">4.9</span>
                </div>
                <p className="text-gray-600 text-sm">Customer Rating</p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link 
                href="/signup"
                className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={20} />
              </Link>
              <button className="inline-flex items-center justify-center space-x-2 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-300">
                <Play size={20} />
                <span>Watch Demo</span>
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="mt-12 pt-8 border-t border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <p className="text-sm text-gray-500 mb-4">Trusted by leading businesses</p>
              <div className="flex items-center justify-center lg:justify-start space-x-8 opacity-60">
                <div className="text-gray-400 font-semibold">Mercedes-Benz</div>
                <div className="text-gray-400 font-semibold">BMW Group</div>
                <div className="text-gray-400 font-semibold">Audi</div>
                <div className="text-gray-400 font-semibold">VIP Lounges</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {/* Main Device Mockup */}
            <div className="relative z-10">
              <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-6 hover:rotate-3 transition-transform duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    </div>
                    <div className="text-sm opacity-80">AXS360 Dashboard</div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-sm opacity-80">Active Vehicles</div>
                      <div className="text-2xl font-bold">247</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-sm opacity-80">Revenue Today</div>
                      <div className="text-2xl font-bold">$12,450</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-sm opacity-80">QR Scans</div>
                      <div className="text-2xl font-bold">1,892</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div 
              className="absolute -top-4 -left-8 bg-white rounded-xl shadow-lg p-4 z-20"
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="text-green-600" size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold">New Customer</div>
                  <div className="text-xs text-gray-500">Just checked in</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="absolute -bottom-8 -right-8 bg-white rounded-xl shadow-lg p-4 z-20"
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 8, repeat: Infinity }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="text-blue-600" size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold">Revenue Up</div>
                  <div className="text-xs text-green-600">+23% this month</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
