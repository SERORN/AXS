import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/apiService';
import LoadingScreen from '../../components/LoadingScreen';
import QRDisplay from '../../components/QRDisplay';

interface Vehicle {
  ticket_number: string;
  customer_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_color: string;
  drop_off_time: string;
  pickup_time?: string;
  status: 'dropped_off' | 'parked' | 'ready' | 'picked_up';
  valet_attendant: string;
  parking_location: string;
  estimated_retrieval_time?: string;
  customer_phone: string;
  special_instructions?: string;
}

interface ValetAttendant {
  attendant_id: string;
  name: string;
  status: 'available' | 'busy' | 'on_break';
  current_task?: string;
  vehicles_handled_today: number;
  rating: number;
}

interface ValetDashboard {
  total_vehicles_today: number;
  currently_parked: number;
  vehicles_ready_pickup: number;
  average_retrieval_time: number;
  active_attendants: number;
  revenue_today: number;
  current_vehicles: Vehicle[];
  valet_attendants: ValetAttendant[];
  queue_vehicles: Array<{
    ticket_number: string;
    customer_name: string;
    request_time: string;
    estimated_time: string;
    priority: 'normal' | 'vip' | 'urgent';
  }>;
  parking_locations: Array<{
    zone: string;
    total_spaces: number;
    occupied_spaces: number;
    percentage: number;
  }>;
  alerts: any[];
}

const ValetParkingScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<ValetDashboard | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'vehicles' | 'queue' | 'attendants'>('vehicles');

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const businessId = user?.businessId || 'demo-valet-id';
      const response = await apiService.get(`/dashboard/valet/${businessId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading valet dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar la información del valet');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateValetQR = async () => {
    setShowQR(true);
  };

  const markVehicleReady = async (vehicle: Vehicle) => {
    Alert.alert(
      'Marcar Vehículo Listo',
      `¿Marcar ${vehicle.vehicle_plate} como listo para entrega?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar Listo',
          onPress: async () => {
            try {
              await apiService.put(`/valet/vehicle/${vehicle.ticket_number}/ready`);
              Alert.alert('Listo', 'Vehículo marcado como listo y cliente notificado');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el estado del vehículo');
            }
          },
        },
      ]
    );
  };

  const processPickup = async (vehicle: Vehicle) => {
    Alert.alert(
      'Procesar Entrega',
      `¿Entregar vehículo ${vehicle.vehicle_plate} a ${vehicle.customer_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Entregar',
          onPress: async () => {
            try {
              await apiService.put(`/valet/vehicle/${vehicle.ticket_number}/pickup`);
              Alert.alert('Entregado', 'Vehículo entregado exitosamente');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo procesar la entrega');
            }
          },
        },
      ]
    );
  };

  const assignAttendant = async (ticketNumber: string, attendantId: string) => {
    try {
      await apiService.put(`/valet/vehicle/${ticketNumber}/assign`, {
        attendant_id: attendantId
      });
      Alert.alert('Asignado', 'Valet asignado exitosamente');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo asignar el valet');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dropped_off': return '#f59e0b';
      case 'parked': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'picked_up': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'input';
      case 'parked': return 'local-parking';
      case 'ready': return 'check-circle';
      case 'picked_up': return 'output';
      default: return 'help';
    }
  };

  const getAttendantStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'busy': return '#ef4444';
      case 'on_break': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'vip': return '#8b5cf6';
      case 'normal': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error al cargar datos del valet</Text>
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
          <Text style={styles.title}>Valet Parking</Text>
          <TouchableOpacity onPress={generateValetQR}>
            <Icon name="qr-code" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.currently_parked}</Text>
            <Text style={styles.statLabel}>Vehículos Estacionados</Text>
            <Icon name="local-parking" size={24} color="#3b82f6" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.vehicles_ready_pickup}</Text>
            <Text style={styles.statLabel}>Listos para Entrega</Text>
            <Icon name="check-circle" size={24} color="#10b981" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(dashboardData.average_retrieval_time)}min</Text>
            <Text style={styles.statLabel}>Tiempo Promedio</Text>
            <Icon name="schedule" size={24} color="#f59e0b" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>${dashboardData.revenue_today}</Text>
            <Text style={styles.statLabel}>Ingresos Hoy</Text>
            <Icon name="attach-money" size={24} color="#10b981" />
          </View>
        </View>

        {/* Parking Zones Overview */}
        <View style={styles.zonesSection}>
          <Text style={styles.sectionTitle}>Zonas de Estacionamiento</Text>
          {dashboardData.parking_locations.map((zone, index) => (
            <View key={index} style={styles.zoneCard}>
              <View style={styles.zoneHeader}>
                <Text style={styles.zoneName}>Zona {zone.zone}</Text>
                <Text style={styles.zonePercentage}>{Math.round(zone.percentage)}%</Text>
              </View>
              <View style={styles.zoneBar}>
                <View
                  style={[
                    styles.zoneFill,
                    { width: `${zone.percentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.zoneNumbers}>
                {zone.occupied_spaces} / {zone.total_spaces} espacios
              </Text>
            </View>
          ))}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'vehicles' && styles.activeTab]}
            onPress={() => setSelectedTab('vehicles')}
          >
            <Text style={[styles.tabText, selectedTab === 'vehicles' && styles.activeTabText]}>
              Vehículos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'queue' && styles.activeTab]}
            onPress={() => setSelectedTab('queue')}
          >
            <Text style={[styles.tabText, selectedTab === 'queue' && styles.activeTabText]}>
              Cola
            </Text>
            {dashboardData.queue_vehicles.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dashboardData.queue_vehicles.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'attendants' && styles.activeTab]}
            onPress={() => setSelectedTab('attendants')}
          >
            <Text style={[styles.tabText, selectedTab === 'attendants' && styles.activeTabText]}>
              Personal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on selected tab */}
        {selectedTab === 'vehicles' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehículos Actuales</Text>
            {dashboardData.current_vehicles.map((vehicle, index) => (
              <TouchableOpacity
                key={index}
                style={styles.vehicleCard}
                onPress={() => {
                  if (vehicle.status === 'parked') {
                    markVehicleReady(vehicle);
                  } else if (vehicle.status === 'ready') {
                    processPickup(vehicle);
                  }
                }}
              >
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.ticketNumber}>#{vehicle.ticket_number}</Text>
                    <Text style={styles.vehiclePlate}>{vehicle.vehicle_plate}</Text>
                    <Text style={styles.vehicleModel}>{vehicle.vehicle_model} - {vehicle.vehicle_color}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(vehicle.status) }
                  ]}>
                    <Icon name={getStatusIcon(vehicle.status)} size={16} color="white" />
                    <Text style={styles.statusText}>{vehicle.status}</Text>
                  </View>
                </View>
                
                <Text style={styles.customerName}>Cliente: {vehicle.customer_name}</Text>
                <Text style={styles.customerPhone}>Tel: {vehicle.customer_phone}</Text>
                <Text style={styles.dropOffTime}>
                  Entregado: {new Date(vehicle.drop_off_time).toLocaleTimeString()}
                </Text>
                
                <View style={styles.vehicleDetails}>
                  <Text style={styles.valetAttendant}>Valet: {vehicle.valet_attendant}</Text>
                  <Text style={styles.parkingLocation}>Ubicación: {vehicle.parking_location}</Text>
                </View>
                
                {vehicle.special_instructions && (
                  <Text style={styles.specialInstructions}>
                    Instrucciones: {vehicle.special_instructions}
                  </Text>
                )}
                
                {vehicle.estimated_retrieval_time && (
                  <Text style={styles.estimatedTime}>
                    Tiempo estimado: {vehicle.estimated_retrieval_time}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedTab === 'queue' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cola de Entregas</Text>
            {dashboardData.queue_vehicles.map((queueItem, index) => (
              <View key={index} style={styles.queueCard}>
                <View style={styles.queueHeader}>
                  <View style={styles.queueInfo}>
                    <Text style={styles.queueTicket}>#{queueItem.ticket_number}</Text>
                    <Text style={styles.queueCustomer}>{queueItem.customer_name}</Text>
                  </View>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(queueItem.priority) }
                  ]}>
                    <Text style={styles.priorityText}>{queueItem.priority}</Text>
                  </View>
                </View>
                
                <Text style={styles.requestTime}>
                  Solicitado: {new Date(queueItem.request_time).toLocaleTimeString()}
                </Text>
                <Text style={styles.estimatedDelivery}>
                  Estimado: {queueItem.estimated_time}
                </Text>
                
                <View style={styles.queueActions}>
                  <TouchableOpacity style={styles.prioritizeButton}>
                    <Icon name="priority-high" size={16} color="#ef4444" />
                    <Text style={styles.prioritizeText}>Priorizar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.locateButton}>
                    <Icon name="location-on" size={16} color="#2563eb" />
                    <Text style={styles.locateText}>Localizar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'attendants' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Valet</Text>
            {dashboardData.valet_attendants.map((attendant, index) => (
              <View key={index} style={styles.attendantCard}>
                <View style={styles.attendantHeader}>
                  <View style={styles.attendantInfo}>
                    <Text style={styles.attendantName}>{attendant.name}</Text>
                    <Text style={styles.attendantId}>ID: {attendant.attendant_id}</Text>
                  </View>
                  <View style={styles.attendantStatus}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: getAttendantStatusColor(attendant.status) }
                    ]}>
                      <Text style={styles.attendantStatusText}>{attendant.status}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.attendantStats}>
                  <View style={styles.attendantStat}>
                    <Text style={styles.statNumber}>{attendant.vehicles_handled_today}</Text>
                    <Text style={styles.statDescription}>Vehículos Hoy</Text>
                  </View>
                  <View style={styles.attendantStat}>
                    <Text style={styles.statNumber}>{attendant.rating.toFixed(1)}</Text>
                    <Text style={styles.statDescription}>Rating</Text>
                  </View>
                </View>
                
                {attendant.current_task && (
                  <Text style={styles.currentTask}>
                    Tarea actual: {attendant.current_task}
                  </Text>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.assignButton,
                    attendant.status !== 'available' && styles.assignButtonDisabled
                  ]}
                  disabled={attendant.status !== 'available'}
                >
                  <Icon name="assignment" size={16} color="white" />
                  <Text style={styles.assignText}>Asignar Tarea</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

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
            <Icon name="add-circle" size={24} color="white" />
            <Text style={styles.actionText}>Nuevo Vehículo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="search" size={24} color="white" />
            <Text style={styles.actionText}>Buscar Vehículo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="assessment" size={24} color="white" />
            <Text style={styles.actionText}>Reportes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Modal */}
      {showQR && (
        <QRDisplay
          visible={showQR}
          onClose={() => setShowQR(false)}
          qrData="https://axs360.com/valet/access"
          title="QR de Acceso Valet"
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  zonesSection: {
    padding: 16,
  },
  zoneCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  zonePercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  zoneBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  zoneFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  zoneNumbers: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  vehicleCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vehicleInfo: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  vehicleModel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  dropOffTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valetAttendant: {
    fontSize: 14,
    color: '#6b7280',
  },
  parkingLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  specialInstructions: {
    fontSize: 14,
    color: '#f59e0b',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  queueCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueInfo: {
    flex: 1,
  },
  queueTicket: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  queueCustomer: {
    fontSize: 14,
    color: '#1f2937',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  requestTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  estimatedDelivery: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 12,
  },
  queueActions: {
    flexDirection: 'row',
    gap: 12,
  },
  prioritizeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 4,
  },
  prioritizeText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  locateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
    gap: 4,
  },
  locateText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  attendantCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attendantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendantInfo: {
    flex: 1,
  },
  attendantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  attendantId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  attendantStatus: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendantStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  attendantStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  attendantStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  currentTask: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  assignButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  assignText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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

export default ValetParkingScreen;
