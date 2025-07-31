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

interface VehicleInService {
  visitor_name: string;
  vehicle_plate: string;
  vehicle_info: string;
  service_type: string;
  check_in_time: string;
  estimated_completion: string;
  status: string;
}

interface ServiceStats {
  service_type: string;
  count: number;
}

interface AutomotiveDashboard {
  vehicles_in_service: number;
  total_vehicles_period: number;
  average_service_time: number;
  service_capacity: number;
  capacity_utilization: number;
  revenue_period: number;
  recent_vehicles: VehicleInService[];
  service_breakdown: ServiceStats[];
  alerts: any[];
}

const AutomotiveWorkshopScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<AutomotiveDashboard | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInService | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // This would be the actual business ID from context
      const businessId = user?.businessId || 'demo-automotive-id';
      const response = await apiService.get(`/dashboard/automotive/${businessId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading automotive dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar la información del taller');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleVehicleCheckOut = async (vehicle: VehicleInService) => {
    Alert.alert(
      'Confirmar Salida',
      `¿Confirmar salida del vehículo ${vehicle.vehicle_plate}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Implementation for vehicle checkout
              Alert.alert('Éxito', 'Vehículo dado de alta exitosamente');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo dar de alta el vehículo');
            }
          },
        },
      ]
    );
  };

  const generateServiceQR = async () => {
    setShowQR(true);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error al cargar datos del taller</Text>
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
          <Text style={styles.title}>Taller Automotriz</Text>
          <TouchableOpacity onPress={generateServiceQR}>
            <Icon name="qr-code" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.vehicles_in_service}</Text>
            <Text style={styles.metricLabel}>Vehículos en Servicio</Text>
            <Icon name="build" size={24} color="#f59e0b" />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {Math.round(dashboardData.capacity_utilization)}%
            </Text>
            <Text style={styles.metricLabel}>Capacidad</Text>
            <Icon name="speed" size={24} color="#10b981" />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {Math.round(dashboardData.average_service_time / 60)}h
            </Text>
            <Text style={styles.metricLabel}>Tiempo Promedio</Text>
            <Icon name="schedule" size={24} color="#6366f1" />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              ${dashboardData.revenue_period.toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Ingresos del Período</Text>
            <Icon name="attach-money" size={24} color="#059669" />
          </View>
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

        {/* Vehicles in Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehículos en Servicio</Text>
          {dashboardData.recent_vehicles.map((vehicle, index) => (
            <TouchableOpacity
              key={index}
              style={styles.vehicleCard}
              onPress={() => setSelectedVehicle(vehicle)}
            >
              <View style={styles.vehicleHeader}>
                <Text style={styles.vehiclePlate}>{vehicle.vehicle_plate}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicle.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(vehicle.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.vehicleInfo}>{vehicle.vehicle_info}</Text>
              <Text style={styles.vehicleOwner}>Cliente: {vehicle.visitor_name}</Text>
              <Text style={styles.serviceType}>Servicio: {vehicle.service_type}</Text>
              
              <View style={styles.vehicleFooter}>
                <Text style={styles.timeText}>
                  Ingreso: {new Date(vehicle.check_in_time).toLocaleTimeString()}
                </Text>
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={() => handleVehicleCheckOut(vehicle)}
                >
                  <Text style={styles.checkoutText}>Dar de Alta</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Service Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de Servicio</Text>
          {dashboardData.service_breakdown.map((service, index) => (
            <View key={index} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{service.service_type}</Text>
              <Text style={styles.serviceCount}>{service.count}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="add-circle" size={24} color="white" />
            <Text style={styles.actionText}>Nuevo Ingreso</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="assignment" size={24} color="white" />
            <Text style={styles.actionText}>Órdenes de Trabajo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="inventory" size={24} color="white" />
            <Text style={styles.actionText}>Inventario</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Modal */}
      {showQR && (
        <QRDisplay
          visible={showQR}
          onClose={() => setShowQR(false)}
          qrData="https://axs360.com/workshop/access"
          title="QR de Acceso al Taller"
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_progress': return '#f59e0b';
    case 'completed': return '#10b981';
    case 'delayed': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'in_progress': return 'En Proceso';
    case 'completed': return 'Completado';
    case 'delayed': return 'Retrasado';
    default: return 'Desconocido';
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
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
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
  metricValue: {
    fontSize: 24,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  vehicleOwner: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  checkoutButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  checkoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceName: {
    fontSize: 16,
    color: '#374151',
  },
  serviceCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
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

export default AutomotiveWorkshopScreen;
