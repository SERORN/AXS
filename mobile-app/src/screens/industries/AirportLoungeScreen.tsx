import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/apiService';
import LoadingScreen from '../../components/LoadingScreen';
import QRDisplay from '../../components/QRDisplay';

interface LoungeGuest {
  visitor_name: string;
  pass_type: string;
  entry_time: string;
  duration_minutes: number;
  flight_info?: {
    airline: string;
    flight_number: string;
    departure_time: string;
    destination: string;
  };
  membership_tier?: string;
}

interface LoungeDashboard {
  total_capacity: number;
  current_occupancy: number;
  available_seats: number;
  occupancy_percentage: number;
  revenue_today: number;
  passes_sold_today: number;
  average_stay_duration: number;
  current_guests: LoungeGuest[];
  flight_departures_next_2h: Array<{
    flight_number: string;
    airline: string;
    departure_time: string;
    destination: string;
    guests_count: number;
  }>;
  amenities_usage: Array<{
    amenity: string;
    usage_count: number;
    capacity: number;
  }>;
  alerts: any[];
}

const AirportLoungeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<LoungeDashboard | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 30 seconds for flight information
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const businessId = user?.businessId || 'demo-lounge-id';
      const response = await apiService.get(`/dashboard/airport/${businessId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading lounge dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar la información del lounge');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateLoungeQR = async () => {
    setShowQR(true);
  };

  const notifyGuestDeparture = async (guest: LoungeGuest) => {
    if (guest.flight_info) {
      Alert.alert(
        'Notificar Huésped',
        `¿Notificar a ${guest.visitor_name} sobre su vuelo ${guest.flight_info.flight_number}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Notificar',
            onPress: async () => {
              try {
                // Implementation for guest notification
                Alert.alert('Notificación Enviada', 'El huésped ha sido notificado');
              } catch (error) {
                Alert.alert('Error', 'No se pudo enviar la notificación');
              }
            },
          },
        ]
      );
    }
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage < 60) return '#10b981';
    if (percentage < 85) return '#f59e0b';
    return '#ef4444';
  };

  const getPassTypeColor = (passType: string) => {
    switch (passType.toLowerCase()) {
      case 'premium': return '#8b5cf6';
      case 'business': return '#f59e0b';
      case 'day_pass': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getMembershipColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return '#a78bfa';
      case 'gold': return '#fbbf24';
      case 'silver': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error al cargar datos del lounge</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
          <Text style={styles.title}>Airport Lounge</Text>
          <TouchableOpacity onPress={generateLoungeQR}>
            <Icon name="qr-code" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Occupancy Status */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.occupancyTitle}>Estado del Lounge</Text>
            <Text style={[
              styles.occupancyPercentage,
              { color: getOccupancyColor(dashboardData.occupancy_percentage) }
            ]}>
              {Math.round(dashboardData.occupancy_percentage)}%
            </Text>
          </View>
          
          <View style={styles.occupancyBar}>
            <View
              style={[
                styles.occupancyFill,
                { 
                  width: `${dashboardData.occupancy_percentage}%`,
                  backgroundColor: getOccupancyColor(dashboardData.occupancy_percentage)
                },
              ]}
            />
          </View>
          
          <View style={styles.occupancyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.current_occupancy}</Text>
              <Text style={styles.statLabel}>Huéspedes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.available_seats}</Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.total_capacity}</Text>
              <Text style={styles.statLabel}>Capacidad</Text>
            </View>
          </View>
        </View>

        {/* Daily Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              ${dashboardData.revenue_today.toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Ingresos del Día</Text>
            <Icon name="attach-money" size={24} color="#10b981" />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {dashboardData.passes_sold_today}
            </Text>
            <Text style={styles.metricLabel}>Pases Vendidos</Text>
            <Icon name="confirmation-number" size={24} color="#6366f1" />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {Math.round(dashboardData.average_stay_duration / 60)}h
            </Text>
            <Text style={styles.metricLabel}>Estadía Promedio</Text>
            <Icon name="schedule" size={24} color="#f59e0b" />
          </View>
        </View>

        {/* Flight Departures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas Salidas (2h)</Text>
          {dashboardData.flight_departures_next_2h.map((flight, index) => (
            <View key={index} style={styles.flightCard}>
              <View style={styles.flightHeader}>
                <View style={styles.flightInfo}>
                  <Text style={styles.flightNumber}>{flight.flight_number}</Text>
                  <Text style={styles.airline}>{flight.airline}</Text>
                </View>
                <View style={styles.flightDetails}>
                  <Text style={styles.destination}>{flight.destination}</Text>
                  <Text style={styles.departureTime}>
                    {new Date(flight.departure_time).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.guestCount}>
                  <Icon name="person" size={16} color="#6b7280" />
                  <Text style={styles.guestCountText}>{flight.guests_count}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Amenities Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uso de Servicios</Text>
          <View style={styles.amenitiesGrid}>
            {dashboardData.amenities_usage.map((amenity, index) => (
              <View key={index} style={styles.amenityCard}>
                <Text style={styles.amenityName}>{amenity.amenity}</Text>
                <View style={styles.amenityUsage}>
                  <Text style={styles.amenityCount}>
                    {amenity.usage_count}/{amenity.capacity}
                  </Text>
                  <View style={styles.amenityBar}>
                    <View
                      style={[
                        styles.amenityFill,
                        { width: `${(amenity.usage_count / amenity.capacity) * 100}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Current Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Huéspedes Actuales</Text>
          {dashboardData.current_guests.map((guest, index) => (
            <TouchableOpacity
              key={index}
              style={styles.guestCard}
              onPress={() => notifyGuestDeparture(guest)}
            >
              <View style={styles.guestHeader}>
                <Text style={styles.guestName}>{guest.visitor_name}</Text>
                <View style={styles.guestTags}>
                  <View style={[
                    styles.passTag,
                    { backgroundColor: getPassTypeColor(guest.pass_type) }
                  ]}>
                    <Text style={styles.passTagText}>{guest.pass_type}</Text>
                  </View>
                  {guest.membership_tier && (
                    <View style={[
                      styles.membershipTag,
                      { backgroundColor: getMembershipColor(guest.membership_tier) }
                    ]}>
                      <Text style={styles.membershipTagText}>{guest.membership_tier}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <Text style={styles.guestEntry}>
                Ingreso: {new Date(guest.entry_time).toLocaleTimeString()}
              </Text>
              
              {guest.flight_info && (
                <View style={styles.flightInfo}>
                  <Icon name="flight" size={16} color="#6b7280" />
                  <Text style={styles.guestFlight}>
                    {guest.flight_info.flight_number} - {guest.flight_info.destination}
                  </Text>
                  <Text style={styles.guestDeparture}>
                    Sale: {new Date(guest.flight_info.departure_time).toLocaleTimeString()}
                  </Text>
                </View>
              )}
              
              <Text style={styles.guestDuration}>
                Estadía: {Math.round(guest.duration_minutes / 60)}h {guest.duration_minutes % 60}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alerts */}
        {dashboardData.alerts && dashboardData.alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <Text style={styles.sectionTitle}>Alertas</Text>
            {dashboardData.alerts.map((alert, index) => (
              <View key={index} style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.type) }]}>
                <Icon 
                  name={getAlertIcon(alert.type)} 
                  size={20} 
                  color={getAlertColor(alert.type)} 
                />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="person-add" size={24} color="white" />
            <Text style={styles.actionText}>Nuevo Huésped</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="notifications" size={24} color="white" />
            <Text style={styles.actionText}>Notificaciones</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="room-service" size={24} color="white" />
            <Text style={styles.actionText}>Servicios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Modal */}
      {showQR && (
        <QRDisplay
          visible={showQR}
          onClose={() => setShowQR(false)}
          qrData="https://axs360.com/lounge/access"
          title="QR de Acceso al Lounge"
        />
      )}
    </SafeAreaView>
  );
};

const getAlertColor = (type: string) => {
  switch (type) {
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'info': return '#3b82f6';
    default: return '#10b981';
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    default: return 'check-circle';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  occupancyCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  occupancyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  occupancyPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  occupancyBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 4,
  },
  occupancyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  flightCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flightInfo: {
    flex: 1,
  },
  flightNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  airline: {
    fontSize: 14,
    color: '#6b7280',
  },
  flightDetails: {
    flex: 1,
    alignItems: 'center',
  },
  destination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  departureTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  guestCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guestCountText: {
    fontSize: 14,
    color: '#6b7280',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amenityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  amenityUsage: {
    gap: 8,
  },
  amenityCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
  },
  amenityBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  amenityFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  guestCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  guestTags: {
    flexDirection: 'row',
    gap: 8,
  },
  passTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  passTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  membershipTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membershipTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  guestEntry: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  guestFlight: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  guestDeparture: {
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 'auto',
  },
  guestDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  alertsContainer: {
    padding: 16,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default AirportLoungeScreen;
