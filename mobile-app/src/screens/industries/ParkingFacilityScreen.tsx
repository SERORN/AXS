import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/apiService';
import LoadingScreen from '../../components/LoadingScreen';
import QRDisplay from '../../components/QRDisplay';

const { width } = Dimensions.get('window');

interface ParkedVehicle {
  visitor_name: string;
  vehicle_plate: string;
  entry_time: string;
  duration_minutes: number;
  estimated_cost: number;
}

interface ParkingDashboard {
  total_spaces: number;
  occupied_spaces: number;
  available_spaces: number;
  occupancy_percentage: number;
  total_parkings_period: number;
  average_duration: number;
  revenue_period: number;
  current_hourly_rate: number;
  current_vehicles: ParkedVehicle[];
  peak_hours: Array<{ hour: number; count: number }>;
  alerts: any[];
}

const ParkingFacilityScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<ParkingDashboard | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const businessId = user?.businessId || 'demo-parking-id';
      const response = await apiService.get(`/dashboard/parking/${businessId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading parking dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar la información del estacionamiento');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleVehicleCheckOut = async (vehicle: ParkedVehicle) => {
    Alert.alert(
      'Confirmar Salida',
      `Vehículo: ${vehicle.vehicle_plate}\nCosto: $${vehicle.estimated_cost}\n¿Confirmar salida?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Implementation for vehicle checkout
              Alert.alert('Éxito', 'Vehículo retirado exitosamente');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo procesar la salida');
            }
          },
        },
      ]
    );
  };

  const generateParkingQR = async () => {
    setShowQR(true);
  };

  const renderParkingGrid = () => {
    if (!dashboardData) return null;

    const spaces = Array.from({ length: dashboardData.total_spaces }, (_, index) => {
      const isOccupied = index < dashboardData.occupied_spaces;
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.parkingSpace,
            isOccupied ? styles.occupiedSpace : styles.availableSpace,
          ]}
        >
          <Text style={[
            styles.spaceNumber,
            isOccupied ? styles.occupiedText : styles.availableText,
          ]}>
            {index + 1}
          </Text>
          {isOccupied && (
            <Icon
              name="directions-car"
              size={16}
              color="white"
              style={styles.carIcon}
            />
          )}
        </TouchableOpacity>
      );
    });

    return (
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {spaces}
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error al cargar datos del estacionamiento</Text>
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
          <Text style={styles.title}>Estacionamiento</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Icon
                name={viewMode === 'grid' ? 'view-list' : 'view-module'}
                size={24}
                color="#2563eb"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={generateParkingQR}>
              <Icon name="qr-code" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Occupancy Overview */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.occupancyTitle}>Estado del Estacionamiento</Text>
            <Text style={styles.occupancyPercentage}>
              {Math.round(dashboardData.occupancy_percentage)}%
            </Text>
          </View>
          
          <View style={styles.occupancyBar}>
            <View
              style={[
                styles.occupancyFill,
                { width: `${dashboardData.occupancy_percentage}%` },
              ]}
            />
          </View>
          
          <View style={styles.occupancyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.occupied_spaces}</Text>
              <Text style={styles.statLabel}>Ocupados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.available_spaces}</Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardData.total_spaces}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Revenue Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              ${dashboardData.revenue_period.toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Ingresos del Período</Text>
            <Icon name="attach-money" size={24} color="#10b981" />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {Math.round(dashboardData.average_duration / 60)}h
            </Text>
            <Text style={styles.metricLabel}>Tiempo Promedio</Text>
            <Icon name="schedule" size={24} color="#6366f1" />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              ${dashboardData.current_hourly_rate}
            </Text>
            <Text style={styles.metricLabel}>Tarifa por Hora</Text>
            <Icon name="local-parking" size={24} color="#f59e0b" />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {dashboardData.total_parkings_period}
            </Text>
            <Text style={styles.metricLabel}>Vehículos Atendidos</Text>
            <Icon name="directions-car" size={24} color="#8b5cf6" />
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

        {/* Parking Layout or Vehicle List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {viewMode === 'grid' ? 'Mapa del Estacionamiento' : 'Vehículos Estacionados'}
          </Text>
          
          {viewMode === 'grid' ? (
            renderParkingGrid()
          ) : (
            <View>
              {dashboardData.current_vehicles.map((vehicle, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.vehicleCard}
                  onPress={() => handleVehicleCheckOut(vehicle)}
                >
                  <View style={styles.vehicleHeader}>
                    <Text style={styles.vehiclePlate}>{vehicle.vehicle_plate}</Text>
                    <Text style={styles.vehicleCost}>${vehicle.estimated_cost}</Text>
                  </View>
                  
                  <Text style={styles.vehicleOwner}>Cliente: {vehicle.visitor_name}</Text>
                  <Text style={styles.vehicleTime}>
                    Ingreso: {new Date(vehicle.entry_time).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.vehicleDuration}>
                    Duración: {Math.round(vehicle.duration_minutes / 60)}h {vehicle.duration_minutes % 60}m
                  </Text>
                  
                  <View style={styles.vehicleFooter}>
                    <TouchableOpacity
                      style={styles.checkoutButton}
                      onPress={() => handleVehicleCheckOut(vehicle)}
                    >
                      <Text style={styles.checkoutText}>Procesar Salida</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Legend for Grid View */}
        {viewMode === 'grid' && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Disponible</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Ocupado</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="add-circle" size={24} color="white" />
            <Text style={styles.actionText}>Nuevo Ingreso</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="settings" size={24} color="white" />
            <Text style={styles.actionText}>Configurar Tarifas</Text>
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
          qrData="https://axs360.com/parking/access"
          title="QR de Acceso al Estacionamiento"
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
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  viewToggle: {
    padding: 8,
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
    color: '#2563eb',
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
    backgroundColor: '#ef4444',
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
    fontSize: 20,
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
  gridContainer: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  parkingSpace: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  availableSpace: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  occupiedSpace: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  },
  spaceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  availableText: {
    color: 'white',
  },
  occupiedText: {
    color: 'white',
  },
  carIcon: {
    position: 'absolute',
    bottom: 2,
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
  vehicleCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  vehicleOwner: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  vehicleTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  vehicleDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  vehicleFooter: {
    alignItems: 'flex-end',
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  legendText: {
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

export default ParkingFacilityScreen;
