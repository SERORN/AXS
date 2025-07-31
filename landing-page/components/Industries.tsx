'use client'

import { Car, Plane, Building2, GraduationCap, Briefcase, TreePine, Users } from 'lucide-react'

const industries = [
  {
    icon: Car,
    name: 'Automotive Workshops',
    description: 'Complete vehicle service management with work orders, inventory tracking, and customer communication.',
    features: ['Service tracking', 'Inventory management', 'Customer updates', 'Quality control'],
    image: '/images/automotive.jpg',
    stats: { clients: '150+', efficiency: '+40%', satisfaction: '4.9/5' }
  },
  {
    icon: Building2,
    name: 'Parking Facilities',
    description: 'Smart parking management with real-time occupancy, dynamic pricing, and automated payments.',
    features: ['Real-time occupancy', 'Dynamic pricing', 'Reserved spots', 'Payment automation'],
    image: '/images/parking.jpg',
    stats: { clients: '200+', efficiency: '+35%', satisfaction: '4.8/5' }
  },
  {
    icon: Plane,
    name: 'Airport Lounges',
    description: 'Premium lounge management with guest tracking, amenity booking, and flight integration.',
    features: ['Guest management', 'Flight tracking', 'Amenity booking', 'Capacity control'],
    image: '/images/lounge.jpg',
    stats: { clients: '50+', efficiency: '+50%', satisfaction: '5.0/5' }
  },
  {
    icon: GraduationCap,
    name: 'Educational Institutions',
    description: 'Student and staff access control with attendance tracking and safety monitoring.',
    features: ['Attendance tracking', 'Safety monitoring', 'Parent notifications', 'Emergency alerts'],
    image: '/images/education.jpg',
    stats: { clients: '75+', efficiency: '+30%', satisfaction: '4.7/5' }
  },
  {
    icon: Briefcase,
    name: 'Corporate Offices',
    description: 'Enterprise access management with visitor control, meeting rooms, and security integration.',
    features: ['Visitor management', 'Meeting rooms', 'Security integration', 'Access levels'],
    image: '/images/corporate.jpg',
    stats: { clients: '100+', efficiency: '+45%', satisfaction: '4.9/5' }
  },
  {
    icon: TreePine,
    name: 'Residential Communities',
    description: 'Community access control with visitor approval, resident communication, and security monitoring.',
    features: ['Visitor approval', 'Resident portal', 'Security events', 'Communication hub'],
    image: '/images/residential.jpg',
    stats: { clients: '80+', efficiency: '+25%', satisfaction: '4.6/5' }
  },
]

export default function Industries() {
  return (
    <section id="industries" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Built for Every Industry
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From automotive workshops to premium lounges, AXS360 adapts to your specific business needs 
            with industry-tailored features and workflows.
          </p>
        </div>

        {/* Industries Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 left-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                    <industry.icon className="text-white" size={24} />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {industry.name}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {industry.description}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {industry.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{industry.stats.clients}</div>
                    <div className="text-xs text-gray-500">Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{industry.stats.efficiency}</div>
                    <div className="text-xs text-gray-500">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{industry.stats.satisfaction}</div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </div>
                </div>

                {/* CTA */}
                <button className="w-full mt-4 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 py-2 rounded-lg transition-colors text-sm font-medium">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center space-x-12 bg-white rounded-2xl shadow-lg px-12 py-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">655+</div>
              <div className="text-gray-600">Total Clients</div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">7</div>
              <div className="text-gray-600">Industries</div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
