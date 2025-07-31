'use client'

import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Carlos Rodriguez',
    role: 'Workshop Owner',
    company: 'Rodriguez Auto Service',
    image: '/images/testimonial-1.jpg',
    rating: 5,
    text: 'AXS360 transformed our workshop operations. We went from manual paperwork to a fully digital system that our customers love. Revenue increased 40% in the first quarter.'
  },
  {
    name: 'Sarah Chen',
    role: 'Facility Manager',
    company: 'Downtown Parking Solutions',
    image: '/images/testimonial-2.jpg',
    rating: 5,
    text: 'The real-time occupancy tracking and automated payments have revolutionized our parking facility. Customer satisfaction is at an all-time high.'
  },
  {
    name: 'Michael Torres',
    role: 'Operations Director',
    company: 'Premium Airport Lounges',
    image: '/images/testimonial-3.jpg',
    rating: 5,
    text: 'Managing our VIP lounges has never been easier. The guest tracking and amenity booking features are exactly what we needed for our premium service.'
  },
  {
    name: 'Lisa Anderson',
    role: 'IT Director',
    company: 'TechCorp Headquarters',
    image: '/images/testimonial-4.jpg',
    rating: 5,
    text: 'Security and ease of use were our top priorities. AXS360 delivered both with their enterprise-grade platform and intuitive interface.'
  },
  {
    name: 'David Kim',
    role: 'General Manager',
    company: 'Luxury Valet Services',
    image: '/images/testimonial-5.jpg',
    rating: 5,
    text: 'Our valet operations are now completely streamlined. The customer experience has improved dramatically, and our efficiency has increased by 35%.'
  },
  {
    name: 'Maria Garcia',
    role: 'Community Manager',
    company: 'Sunset Residences',
    image: '/images/testimonial-6.jpg',
    rating: 5,
    text: 'Resident satisfaction has never been higher. The visitor management and communication features have made our community safer and more connected.'
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Loved by Businesses Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. See what industry leaders are saying about AXS360 
            and how it's transforming their operations.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-8 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote size={40} className="text-blue-600" />
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-600 leading-relaxed mb-6 relative z-10">
                "{testimonial.text}"
              </p>

              {/* Profile */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white rounded-3xl shadow-xl p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
              <div className="text-gray-600">Average Rating</div>
              <div className="flex justify-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">99.2%</div>
              <div className="text-gray-600">Customer Retention</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-8">Trusted by industry leaders</p>
          <div className="flex items-center justify-center space-x-12 opacity-40">
            <div className="text-2xl font-bold text-gray-600">Mercedes-Benz</div>
            <div className="text-2xl font-bold text-gray-600">BMW</div>
            <div className="text-2xl font-bold text-gray-600">Audi</div>
            <div className="text-2xl font-bold text-gray-600">VIP Lounges</div>
            <div className="text-2xl font-bold text-gray-600">Enterprise</div>
          </div>
        </div>
      </div>
    </section>
  )
}
