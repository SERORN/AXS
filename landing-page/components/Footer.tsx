'use client'

import { Mail, Phone, MapPin, Twitter, Linkedin, Instagram, Github } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-white">AXS360</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              The ultimate multi-industry access control platform. 
              Revolutionizing vehicle management for businesses worldwide.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="#features" className="hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link href="#industries" className="hover:text-blue-400 transition-colors">Industries</Link></li>
              <li><Link href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link href="/integrations" className="hover:text-blue-400 transition-colors">Integrations</Link></li>
              <li><Link href="/api" className="hover:text-blue-400 transition-colors">API</Link></li>
              <li><Link href="/security" className="hover:text-blue-400 transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-3">
              <li><Link href="/automotive" className="hover:text-blue-400 transition-colors">Automotive Workshops</Link></li>
              <li><Link href="/parking" className="hover:text-blue-400 transition-colors">Parking Facilities</Link></li>
              <li><Link href="/lounges" className="hover:text-blue-400 transition-colors">Premium Lounges</Link></li>
              <li><Link href="/corporate" className="hover:text-blue-400 transition-colors">Corporate Offices</Link></li>
              <li><Link href="/residential" className="hover:text-blue-400 transition-colors">Residential</Link></li>
              <li><Link href="/education" className="hover:text-blue-400 transition-colors">Education</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/help" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
              <li><Link href="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact Support</Link></li>
              <li><Link href="/status" className="hover:text-blue-400 transition-colors">System Status</Link></li>
              <li><Link href="/training" className="hover:text-blue-400 transition-colors">Training</Link></li>
              <li><Link href="/community" className="hover:text-blue-400 transition-colors">Community</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="flex items-center space-x-3">
              <Mail className="text-blue-400" size={20} />
              <div>
                <div className="text-white font-medium">Email</div>
                <div className="text-gray-400">hello@axs360.com</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="text-blue-400" size={20} />
              <div>
                <div className="text-white font-medium">Phone</div>
                <div className="text-gray-400">+1 (555) 123-4567</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="text-blue-400" size={20} />
              <div>
                <div className="text-white font-medium">Address</div>
                <div className="text-gray-400">San Francisco, CA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 AXS360. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-blue-400 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
