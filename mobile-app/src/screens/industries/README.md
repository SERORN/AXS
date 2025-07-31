# AXS360 Mobile App - Industry Screens

Este directorio contiene todas las pantallas específicas para cada industria soportada por la plataforma AXS360.

## 📱 Pantallas Implementadas

### 1. **AutomotiveWorkshopScreen.tsx**
**Gestión de Talleres Automotrices**
- ✅ Control de vehículos en servicio
- ✅ Seguimiento de tipos de servicio (Mantenimiento, Reparación, Inspección, etc.)
- ✅ Métricas de tiempo promedio de servicio
- ✅ Control de capacidad y espacios disponibles
- ✅ Análisis de ingresos y servicios completados
- ✅ Alertas de vehículos listos para entrega
- ✅ Integración con generación de códigos QR

### 2. **ParkingFacilityScreen.tsx**
**Gestión de Estacionamientos**
- ✅ Vista de mapa con espacios disponibles/ocupados
- ✅ Control de tarifas por hora y tiempo promedio
- ✅ Gestión de ingresos del período
- ✅ Lista detallada de vehículos estacionados
- ✅ Procesamiento de salidas con cálculo de costos
- ✅ Vista de cuadrícula de espacios de estacionamiento
- ✅ Leyenda visual para estados de espacios

### 3. **AirportLoungeScreen.tsx**
**Gestión de Lounges de Aeropuerto**
- ✅ Control de ocupación y capacidad
- ✅ Información de próximas salidas de vuelos (2h)
- ✅ Seguimiento de uso de servicios/amenidades
- ✅ Gestión de huéspedes con tipos de pase y membresías
- ✅ Notificaciones de vuelos a huéspedes
- ✅ Métricas de ingresos y pases vendidos
- ✅ Auto-refresh cada 30 segundos para info de vuelos

### 4. **ResidentialScreen.tsx**
**Gestión de Condominios y Residencias**
- ✅ Control de visitantes con estados (esperando, aprobado, dentro)
- ✅ Sistema de aprobación/rechazo de visitas pendientes
- ✅ Gestión de unidades y contacto con residentes
- ✅ Clasificación de visitantes (huésped, entrega, servicio, contratista)
- ✅ Eventos de seguridad en tiempo real
- ✅ Modal detallado de información de visitantes
- ✅ Navegación por pestañas (Visitantes/Pendientes/Unidades)

### 5. **EducationalScreen.tsx**
**Gestión de Instituciones Educativas**
- ✅ Control de asistencia de estudiantes por grado
- ✅ Gestión de personal presente/ausente
- ✅ Seguimiento de tardanzas con minutos de retraso
- ✅ Contactos de emergencia y comunicación con tutores
- ✅ Análisis de asistencia por grado con porcentajes
- ✅ Estados de estudiantes (dentro, fuera, tarde, ausente)
- ✅ Auto-refresh cada 2 minutos para asistencia en tiempo real

### 6. **CorporateScreen.tsx**
**Gestión de Oficinas Corporativas**
- ✅ Control de empleados con niveles de acceso
- ✅ Gestión de visitantes corporativos con aprobación de host
- ✅ Sistema de salas de reuniones con reservas
- ✅ Ocupación por piso con métricas detalladas
- ✅ Eventos de seguridad con niveles de severidad
- ✅ Estados de empleados (dentro, fuera, reunión, descanso)
- ✅ Información de reuniones actuales con detalles

### 7. **ValetParkingScreen.tsx**
**Gestión de Valet Parking**
- ✅ Control de vehículos con tickets numerados
- ✅ Cola de entregas con prioridades (normal, VIP, urgente)
- ✅ Gestión de personal valet con ratings y tareas
- ✅ Estados de vehículos (entregado, estacionado, listo, retirado)
- ✅ Zonas de estacionamiento con ocupación
- ✅ Tiempo promedio de recuperación
- ✅ Auto-refresh cada 30 segundos para actualizaciones en tiempo real

### 8. **HomeScreen.tsx**
**Pantalla Principal de Navegación**
- ✅ Grid de todas las industrias disponibles
- ✅ Información de la plataforma AXS360
- ✅ Acciones rápidas (escaneo QR, reportes, configuración)
- ✅ Navegación a pantallas específicas de cada industria

## 🎨 Características Comunes

### Diseño y UX
- **Diseño consistente** con tema de colores profesional
- **Iconografía Material Design** para mejor reconocimiento
- **Navegación intuitiva** con botones de regreso y menús de pestañas
- **Pull-to-refresh** en todas las pantallas para datos actualizados
- **Loading states** con spinners durante carga de datos

### Funcionalidades Transversales
- **Generación de códigos QR** específicos por industria
- **Sistema de alertas** color-coded por tipo y severidad
- **Métricas en tiempo real** con auto-refresh automático
- **Gestión de estados** para entidades (visitantes, vehículos, empleados)
- **Integración con APIs** del backend para datos dinámicos

### Características Técnicas
- **TypeScript** con interfaces tipadas para cada industria
- **React Native** con componentes nativos
- **Context API** para autenticación y estado global
- **Navegación declarativa** con React Navigation
- **Manejo de errores** con alerts informativos

## 🔧 Integración con Backend

Cada pantalla se conecta con los endpoints específicos del dashboard backend:
- `/dashboard/automotive/{business_id}` - Datos de talleres
- `/dashboard/parking/{business_id}` - Datos de estacionamientos  
- `/dashboard/airport/{business_id}` - Datos de lounges
- `/dashboard/residential/{business_id}` - Datos residenciales
- `/dashboard/educational/{business_id}` - Datos educativos
- `/dashboard/corporate/{business_id}` - Datos corporativos
- `/dashboard/valet/{business_id}` - Datos de valet

## 📊 Estados y Flujos

### Estados de Entidades
- **Vehículos**: dropped_off → parked → ready → picked_up
- **Visitantes**: waiting → approved → inside → completed
- **Empleados/Estudiantes**: inside, outside, meeting, break, late, absent
- **Salas**: available, occupied, reserved, maintenance

### Flujos de Aprobación
1. **Visitante solicita acceso** → Notificación al host/residente
2. **Aprobación/Rechazo** → Notificación al visitante y seguridad
3. **Acceso concedido** → Generación de QR temporal
4. **Monitoreo en tiempo real** → Seguimiento de ubicación y duración

## 🚀 Próximos Pasos

### Funcionalidades Pendientes
- [ ] Integración con cámara para escaneo QR
- [ ] Notificaciones push en tiempo real
- [ ] Modo offline con sincronización
- [ ] Reportes exportables (PDF/Excel)
- [ ] Configuración de tarifas y precios
- [ ] Sistema de reservas avanzado

### Mejoras de UX
- [ ] Animaciones de transición
- [ ] Búsqueda y filtros avanzados
- [ ] Temas oscuro/claro
- [ ] Accesibilidad completa
- [ ] Soporte multiidioma

## 📱 Uso

```typescript
// Importar pantallas específicas
import { AutomotiveWorkshopScreen, ParkingFacilityScreen } from './industries';

// Usar metadata de industrias
import { IndustryMetadata, IndustryScreens } from './industries';

// Navegación
navigation.navigate(IndustryScreens.AUTOMOTIVE);
```

Cada pantalla es completamente funcional y está lista para integrarse con el sistema de navegación principal de la aplicación móvil AXS360.
