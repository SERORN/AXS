// Industry-specific screens for the AXS360 platform
export { default as AutomotiveWorkshopScreen } from './AutomotiveWorkshopScreen';
export { default as ParkingFacilityScreen } from './ParkingFacilityScreen';
export { default as AirportLoungeScreen } from './AirportLoungeScreen';
export { default as ResidentialScreen } from './ResidentialScreen';
export { default as EducationalScreen } from './EducationalScreen';
export { default as CorporateScreen } from './CorporateScreen';
export { default as ValetParkingScreen } from './ValetParkingScreen';

// Screen configuration for navigation
export const IndustryScreens = {
  AUTOMOTIVE: 'AutomotiveWorkshop',
  PARKING: 'ParkingFacility',
  AIRPORT: 'AirportLounge',
  RESIDENTIAL: 'Residential',
  EDUCATIONAL: 'Educational',
  CORPORATE: 'Corporate',
  VALET: 'ValetParking',
} as const;

// Industry metadata for the platform
export const IndustryMetadata = {
  [IndustryScreens.AUTOMOTIVE]: {
    name: 'Talleres Automotrices',
    description: 'Gestión completa de vehículos en servicio, tiempo de reparación y control de capacidad',
    icon: 'build',
    color: '#ef4444',
    features: ['Vehicle tracking', 'Service management', 'Capacity control', 'Revenue analytics'],
  },
  [IndustryScreens.PARKING]: {
    name: 'Estacionamientos',
    description: 'Control de espacios, tarifas dinámicas y gestión de vehículos estacionados',
    icon: 'local-parking',
    color: '#3b82f6',
    features: ['Space management', 'Dynamic pricing', 'Vehicle tracking', 'Payment processing'],
  },
  [IndustryScreens.AIRPORT]: {
    name: 'Lounges de Aeropuerto',
    description: 'Gestión de huéspedes, servicios premium y información de vuelos',
    icon: 'flight',
    color: '#8b5cf6',
    features: ['Guest management', 'Flight integration', 'Amenity tracking', 'VIP services'],
  },
  [IndustryScreens.RESIDENTIAL]: {
    name: 'Condominios y Residencias',
    description: 'Control de visitantes, comunicación con residentes y seguridad perimetral',
    icon: 'apartment',
    color: '#10b981',
    features: ['Visitor management', 'Resident communication', 'Security events', 'Access control'],
  },
  [IndustryScreens.EDUCATIONAL]: {
    name: 'Instituciones Educativas',
    description: 'Control de asistencia de estudiantes, personal y comunicación con tutores',
    icon: 'school',
    color: '#f59e0b',
    features: ['Attendance tracking', 'Guardian communication', 'Safety protocols', 'Grade management'],
  },
  [IndustryScreens.CORPORATE]: {
    name: 'Oficinas Corporativas',
    description: 'Gestión de empleados, visitantes corporativos y salas de reuniones',
    icon: 'business',
    color: '#6366f1',
    features: ['Employee management', 'Meeting rooms', 'Corporate visitors', 'Floor management'],
  },
  [IndustryScreens.VALET]: {
    name: 'Valet Parking',
    description: 'Servicio premium de estacionamiento con gestión de personal y cola de entregas',
    icon: 'car-rental',
    color: '#ec4899',
    features: ['Valet management', 'Queue system', 'Premium service', 'Customer tracking'],
  },
} as const;
