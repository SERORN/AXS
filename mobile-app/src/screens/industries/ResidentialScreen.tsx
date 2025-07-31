import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/apiService';
import LoadingScreen from '../../components/LoadingScreen';
import QRDisplay from '../../components/QRDisplay';

interface Visitor {
  visitor_name: string;
  resident_name: string;
  unit_number: string;
  phone: string;
  entry_time: string;
  exit_time?: string;
  status: 'waiting' | 'approved' | 'inside' | 'completed';
  visitor_type: 'guest' | 'delivery' | 'service' | 'contractor';
  qr_code?: string;
  vehicle_plate?: string;
}

interface Unit {
  unit_number: string;
  resident_name: string;
  resident_phone: string;
  active_visitors: number;
  authorized_contacts: string[];
}

interface ResidentialDashboard {
  total_units: number;
  occupied_units: number;
  active_visitors: number;
  pending_approvals: number;
  visitors_today: number;
  deliveries_today: number;
  current_visitors: Visitor[];
  pending_visitors: Visitor[];
  units: Unit[];
  alerts: any[];
  security_events: Array<{
    timestamp: string;
    event_type: string;
    description: string;
    unit_involved?: string;
  }>;
}

const ResidentialScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<ResidentialDashboard | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'visitors' | 'pending' | 'units'>('visitors');
  const [visitorModalVisible, setVisitorModalVisible] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const businessId = user?.businessId || 'demo-residential-id';
      const response = await apiService.get(`/dashboard/residential/${businessId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading residential dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar la información residencial');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateAccessQR = async () => {
    setShowQR(true);
  };

  const approveVisitor = async (visitor: Visitor) => {
    Alert.alert(
      'Aprobar Visita',
      `¿Aprobar entrada de ${visitor.visitor_name} para la unidad ${visitor.unit_number}?`,
      [
        { text: 'Rechazar', style: 'destructive', onPress: () => rejectVisitor(visitor) },
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            try {
              await apiService.put(`/access/visitor/${visitor.visitor_name}/approve`);
              Alert.alert('Aprobado', 'Visitante aprobado y notificado');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo aprobar al visitante');
            }
          },
        },
      ]
    );
  };

  const rejectVisitor = async (visitor: Visitor) => {
    try {
      await apiService.put(`/access/visitor/${visitor.visitor_name}/reject`);
      Alert.alert('Rechazado', 'Visitante rechazado y notificado');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar al visitante');
    }
  };

  const contactResident = async (unit: Unit) => {
    Alert.alert(
      'Contactar Residente',
      `¿Llamar a ${unit.resident_name} - Unidad ${unit.unit_number}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          onPress: () => {
            // Implementation for calling resident
            Alert.alert('Llamando', `Conectando con ${unit.resident_phone}`);
          },
        },
      ]
    );
  };

  const getVisitorTypeColor = (type: string) => {
    switch (type) {
      case 'guest': return '#10b981';
      case 'delivery': return '#f59e0b';
      case 'service': return '#3b82f6';
      case 'contractor': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'inside': return '#3b82f6';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getVisitorTypeIcon = (type: string) => {
    switch (type) {
      case 'guest': return 'person';
      case 'delivery': return 'local-shipping';
      case 'service': return 'build';
      case 'contractor': return 'engineering';
      default: return 'person';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error al cargar datos residenciales</Text>
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
          <Text style={styles.title}>Condominio</Text>
          <TouchableOpacity onPress={generateAccessQR}>
            <Icon name="qr-code" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.active_visitors}</Text>
            <Text style={styles.statLabel}>Visitantes Activos</Text>
            <Icon name="person" size={24} color="#10b981" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.pending_approvals}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
            <Icon name="schedule" size={24} color="#f59e0b" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.visitors_today}</Text>
            <Text style={styles.statLabel}>Visitas Hoy</Text>
            <Icon name="today" size={24} color="#3b82f6" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.deliveries_today}</Text>
            <Text style={styles.statLabel}>Entregas Hoy</Text>
            <Icon name="local-shipping" size={24} color="#8b5cf6" />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'visitors' && styles.activeTab]}
            onPress={() => setSelectedTab('visitors')}
          >
            <Text style={[styles.tabText, selectedTab === 'visitors' && styles.activeTabText]}>
              Visitantes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
            onPress={() => setSelectedTab('pending')}
          >
            <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
              Pendientes
            </Text>
            {dashboardData.pending_approvals > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dashboardData.pending_approvals}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'units' && styles.activeTab]}
            onPress={() => setSelectedTab('units')}
          >
            <Text style={[styles.tabText, selectedTab === 'units' && styles.activeTabText]}>
              Unidades
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on selected tab */}
        {selectedTab === 'visitors' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visitantes Actuales</Text>
            {dashboardData.current_visitors.map((visitor, index) => (
              <TouchableOpacity
                key={index}
                style={styles.visitorCard}
                onPress={() => {
                  setSelectedVisitor(visitor);
                  setVisitorModalVisible(true);
                }}
              >
                <View style={styles.visitorHeader}>
                  <View style={styles.visitorInfo}>
                    <Text style={styles.visitorName}>{visitor.visitor_name}</Text>
                    <Text style={styles.visitorUnit}>Unidad {visitor.unit_number}</Text>
                  </View>
                  <View style={styles.visitorTags}>
                    <View style={[
                      styles.typeTag,
                      { backgroundColor: getVisitorTypeColor(visitor.visitor_type) }
                    ]}>
                      <Icon name={getVisitorTypeIcon(visitor.visitor_type)} size={12} color="white" />
                      <Text style={styles.typeTagText}>{visitor.visitor_type}</Text>
                    </View>
                    <View style={[
                      styles.statusTag,
                      { backgroundColor: getStatusColor(visitor.status) }
                    ]}>
                      <Text style={styles.statusTagText}>{visitor.status}</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.visitorResident}>
                  Visitando a: {visitor.resident_name}
                </Text>
                <Text style={styles.visitorTime}>
                  Entrada: {new Date(visitor.entry_time).toLocaleTimeString()}
                </Text>
                {visitor.vehicle_plate && (
                  <Text style={styles.visitorVehicle}>
                    Vehículo: {visitor.vehicle_plate}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedTab === 'pending' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visitas Pendientes de Aprobación</Text>
            {dashboardData.pending_visitors.map((visitor, index) => (
              <View key={index} style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingName}>{visitor.visitor_name}</Text>
                    <Text style={styles.pendingUnit}>Unidad {visitor.unit_number}</Text>
                    <Text style={styles.pendingResident}>Para: {visitor.resident_name}</Text>
                  </View>
                  <View style={[
                    styles.pendingTypeTag,
                    { backgroundColor: getVisitorTypeColor(visitor.visitor_type) }
                  ]}>
                    <Icon name={getVisitorTypeIcon(visitor.visitor_type)} size={16} color="white" />
                  </View>
                </View>
                
                <Text style={styles.pendingPhone}>Tel: {visitor.phone}</Text>
                <Text style={styles.pendingTime}>
                  Solicitado: {new Date(visitor.entry_time).toLocaleTimeString()}
                </Text>
                
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => rejectVisitor(visitor)}
                  >
                    <Icon name="close" size={20} color="white" />
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => approveVisitor(visitor)}
                  >
                    <Icon name="check" size={20} color="white" />
                    <Text style={styles.approveText}>Aprobar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'units' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unidades del Condominio</Text>
            {dashboardData.units.map((unit, index) => (
              <TouchableOpacity
                key={index}
                style={styles.unitCard}
                onPress={() => contactResident(unit)}
              >
                <View style={styles.unitHeader}>
                  <Text style={styles.unitNumber}>Unidad {unit.unit_number}</Text>
                  {unit.active_visitors > 0 && (
                    <View style={styles.visitorBadge}>
                      <Icon name="person" size={12} color="white" />
                      <Text style={styles.visitorBadgeText}>{unit.active_visitors}</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.unitResident}>{unit.resident_name}</Text>
                <Text style={styles.unitPhone}>{unit.resident_phone}</Text>
                
                <View style={styles.unitFooter}>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => contactResident(unit)}
                  >
                    <Icon name="phone" size={16} color="#2563eb" />
                    <Text style={styles.callText}>Contactar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Security Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eventos de Seguridad</Text>
          {dashboardData.security_events.slice(0, 5).map((event, index) => (
            <View key={index} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={styles.eventType}>{event.event_type}</Text>
              </View>
              <Text style={styles.eventDescription}>{event.description}</Text>
              {event.unit_involved && (
                <Text style={styles.eventUnit}>Unidad: {event.unit_involved}</Text>
              )}
            </View>
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
            <Text style={styles.actionText}>Registrar Visita</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="emergency" size={24} color="white" />
            <Text style={styles.actionText}>Emergencia</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="security" size={24} color="white" />
            <Text style={styles.actionText}>Seguridad</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Visitor Detail Modal */}
      <Modal
        visible={visitorModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisitorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedVisitor && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalles del Visitante</Text>
                  <TouchableOpacity
                    onPress={() => setVisitorModalVisible(false)}
                  >
                    <Icon name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.modalLabel}>Nombre:</Text>
                  <Text style={styles.modalValue}>{selectedVisitor.visitor_name}</Text>
                  
                  <Text style={styles.modalLabel}>Unidad:</Text>
                  <Text style={styles.modalValue}>{selectedVisitor.unit_number}</Text>
                  
                  <Text style={styles.modalLabel}>Residente:</Text>
                  <Text style={styles.modalValue}>{selectedVisitor.resident_name}</Text>
                  
                  <Text style={styles.modalLabel}>Teléfono:</Text>
                  <Text style={styles.modalValue}>{selectedVisitor.phone}</Text>
                  
                  <Text style={styles.modalLabel}>Entrada:</Text>
                  <Text style={styles.modalValue}>
                    {new Date(selectedVisitor.entry_time).toLocaleString()}
                  </Text>
                  
                  {selectedVisitor.vehicle_plate && (
                    <>
                      <Text style={styles.modalLabel}>Vehículo:</Text>
                      <Text style={styles.modalValue}>{selectedVisitor.vehicle_plate}</Text>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* QR Modal */}
      {showQR && (
        <QRDisplay
          visible={showQR}
          onClose={() => setShowQR(false)}
          qrData="https://axs360.com/residential/access"
          title="QR de Acceso Residencial"
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
  visitorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  visitorUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  visitorTags: {
    gap: 4,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  visitorResident: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  visitorTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  visitorVehicle: {
    fontSize: 14,
    color: '#6b7280',
  },
  pendingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderLeftWidth: 4,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pendingUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  pendingResident: {
    fontSize: 14,
    color: '#6b7280',
  },
  pendingTypeTag: {
    padding: 8,
    borderRadius: 20,
  },
  pendingPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  pendingTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectText: {
    color: 'white',
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveText: {
    color: 'white',
    fontWeight: '600',
  },
  unitCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  visitorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  visitorBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  unitResident: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  unitPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  unitFooter: {
    alignItems: 'flex-end',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  callText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  eventType: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  eventUnit: {
    fontSize: 12,
    color: '#6b7280',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalBody: {
    gap: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalValue: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ResidentialScreen;
