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

interface Employee {
  employee_id: string;
  name: string;
  department: string;
  position: string;
  entry_time: string;
  exit_time?: string;
  status: 'inside' | 'outside' | 'meeting' | 'break';
  floor: string;
  access_level: 'basic' | 'intermediate' | 'full';
}

interface Visitor {
  visitor_name: string;
  host_employee: string;
  company: string;
  purpose: string;
  entry_time: string;
  exit_time?: string;
  status: 'waiting' | 'approved' | 'inside' | 'completed';
  floor: string;
  badge_number?: string;
}

interface MeetingRoom {
  room_id: string;
  name: string;
  floor: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  current_meeting?: {
    title: string;
    organizer: string;
    attendees: number;
    end_time: string;
  };
}

interface CorporateDashboard {
  total_employees: number;
  present_employees: number;
  total_visitors: number;
  active_visitors: number;
  pending_visitor_approvals: number;
  meeting_rooms_total: number;
  meeting_rooms_occupied: number;
  current_employees: Employee[];
  current_visitors: Visitor[];
  pending_visitors: Visitor[];
  meeting_rooms: MeetingRoom[];
  floor_occupancy: Array<{
    floor: string;
    total_capacity: number;
    current_occupancy: number;
    percentage: number;
  }>;
  security_events: Array<{
    timestamp: string;
    event_type: string;
    description: string;
    floor?: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  alerts: any[];
}

const CorporateScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<CorporateDashboard | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'employees' | 'visitors' | 'meetings'>('employees');

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 2 minutes for real-time updates
    const interval = setInterval(loadDashboardData, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const businessId = user?.businessId || 'demo-corporate-id';
      const response = await apiService.get(`/dashboard/corporate/${businessId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading corporate dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar la información corporativa');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateCorporateQR = async () => {
    setShowQR(true);
  };

  const approveVisitor = async (visitor: Visitor) => {
    Alert.alert(
      'Aprobar Visitante',
      `¿Aprobar entrada de ${visitor.visitor_name} de ${visitor.company}?`,
      [
        { text: 'Rechazar', style: 'destructive', onPress: () => rejectVisitor(visitor) },
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            try {
              await apiService.put(`/access/visitor/${visitor.visitor_name}/approve`);
              Alert.alert('Aprobado', 'Visitante aprobado y host notificado');
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

  const reserveMeetingRoom = async (room: MeetingRoom) => {
    if (room.status === 'available') {
      Alert.alert(
        'Reservar Sala',
        `¿Reservar ${room.name} (Capacidad: ${room.capacity})?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Reservar',
            onPress: async () => {
              try {
                await apiService.post(`/meeting-rooms/${room.room_id}/reserve`);
                Alert.alert('Reservado', 'Sala reservada exitosamente');
                loadDashboardData();
              } catch (error) {
                Alert.alert('Error', 'No se pudo reservar la sala');
              }
            },
          },
        ]
      );
    }
  };

  const getEmployeeStatusColor = (status: string) => {
    switch (status) {
      case 'inside': return '#10b981';
      case 'outside': return '#6b7280';
      case 'meeting': return '#3b82f6';
      case 'break': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getEmployeeStatusIcon = (status: string) => {
    switch (status) {
      case 'inside': return 'work';
      case 'outside': return 'logout';
      case 'meeting': return 'meeting-room';
      case 'break': return 'free-breakfast';
      default: return 'help';
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'occupied': return '#ef4444';
      case 'reserved': return '#f59e0b';
      case 'maintenance': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return '#6b7280';
      case 'intermediate': return '#f59e0b';
      case 'full': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error al cargar datos corporativos</Text>
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
          <Text style={styles.title}>Oficina Corporativa</Text>
          <TouchableOpacity onPress={generateCorporateQR}>
            <Icon name="qr-code" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.present_employees}</Text>
            <Text style={styles.statLabel}>Empleados Presentes</Text>
            <Icon name="badge" size={24} color="#10b981" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.active_visitors}</Text>
            <Text style={styles.statLabel}>Visitantes Activos</Text>
            <Icon name="groups" size={24} color="#3b82f6" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.pending_visitor_approvals}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
            <Icon name="pending" size={24} color="#f59e0b" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.meeting_rooms_occupied}</Text>
            <Text style={styles.statLabel}>Salas Ocupadas</Text>
            <Icon name="meeting-room" size={24} color="#8b5cf6" />
          </View>
        </View>

        {/* Floor Occupancy */}
        <View style={styles.floorSection}>
          <Text style={styles.sectionTitle}>Ocupación por Piso</Text>
          {dashboardData.floor_occupancy.map((floor, index) => (
            <View key={index} style={styles.floorCard}>
              <View style={styles.floorHeader}>
                <Text style={styles.floorName}>Piso {floor.floor}</Text>
                <Text style={styles.floorPercentage}>{Math.round(floor.percentage)}%</Text>
              </View>
              <View style={styles.floorBar}>
                <View
                  style={[
                    styles.floorFill,
                    { width: `${floor.percentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.floorNumbers}>
                {floor.current_occupancy} / {floor.total_capacity} personas
              </Text>
            </View>
          ))}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'employees' && styles.activeTab]}
            onPress={() => setSelectedTab('employees')}
          >
            <Text style={[styles.tabText, selectedTab === 'employees' && styles.activeTabText]}>
              Empleados
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'visitors' && styles.activeTab]}
            onPress={() => setSelectedTab('visitors')}
          >
            <Text style={[styles.tabText, selectedTab === 'visitors' && styles.activeTabText]}>
              Visitantes
            </Text>
            {dashboardData.pending_visitor_approvals > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dashboardData.pending_visitor_approvals}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'meetings' && styles.activeTab]}
            onPress={() => setSelectedTab('meetings')}
          >
            <Text style={[styles.tabText, selectedTab === 'meetings' && styles.activeTabText]}>
              Salas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on selected tab */}
        {selectedTab === 'employees' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Empleados Presentes</Text>
            {dashboardData.current_employees.map((employee, index) => (
              <View key={index} style={styles.employeeCard}>
                <View style={styles.employeeHeader}>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>{employee.name}</Text>
                    <Text style={styles.employeePosition}>{employee.position}</Text>
                    <Text style={styles.employeeDepartment}>{employee.department}</Text>
                  </View>
                  <View style={styles.employeeTags}>
                    <View style={[
                      styles.statusTag,
                      { backgroundColor: getEmployeeStatusColor(employee.status) }
                    ]}>
                      <Icon name={getEmployeeStatusIcon(employee.status)} size={12} color="white" />
                      <Text style={styles.statusTagText}>{employee.status}</Text>
                    </View>
                    <View style={[
                      styles.accessTag,
                      { backgroundColor: getAccessLevelColor(employee.access_level) }
                    ]}>
                      <Text style={styles.accessTagText}>{employee.access_level}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.employeeDetails}>
                  <Text style={styles.employeeTime}>
                    Entrada: {new Date(employee.entry_time).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.employeeFloor}>Piso: {employee.floor}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'visitors' && (
          <View>
            {/* Pending Visitors */}
            {dashboardData.pending_visitors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Visitantes Pendientes</Text>
                {dashboardData.pending_visitors.map((visitor, index) => (
                  <View key={index} style={styles.pendingVisitorCard}>
                    <View style={styles.visitorHeader}>
                      <View style={styles.visitorInfo}>
                        <Text style={styles.visitorName}>{visitor.visitor_name}</Text>
                        <Text style={styles.visitorCompany}>{visitor.company}</Text>
                        <Text style={styles.visitorPurpose}>{visitor.purpose}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.visitorHost}>Host: {visitor.host_employee}</Text>
                    <Text style={styles.visitorFloor}>Destino: Piso {visitor.floor}</Text>
                    
                    <View style={styles.visitorActions}>
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

            {/* Current Visitors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Visitantes Actuales</Text>
              {dashboardData.current_visitors.map((visitor, index) => (
                <View key={index} style={styles.visitorCard}>
                  <View style={styles.visitorHeader}>
                    <View style={styles.visitorInfo}>
                      <Text style={styles.visitorName}>{visitor.visitor_name}</Text>
                      <Text style={styles.visitorCompany}>{visitor.company}</Text>
                      <Text style={styles.visitorPurpose}>{visitor.purpose}</Text>
                    </View>
                    {visitor.badge_number && (
                      <View style={styles.badgeInfo}>
                        <Text style={styles.badgeNumber}>#{visitor.badge_number}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.visitorHost}>Host: {visitor.host_employee}</Text>
                  <Text style={styles.visitorTime}>
                    Entrada: {new Date(visitor.entry_time).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.visitorFloor}>Ubicación: Piso {visitor.floor}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'meetings' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salas de Reuniones</Text>
            {dashboardData.meeting_rooms.map((room, index) => (
              <TouchableOpacity
                key={index}
                style={styles.roomCard}
                onPress={() => reserveMeetingRoom(room)}
              >
                <View style={styles.roomHeader}>
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomCapacity}>Capacidad: {room.capacity} personas</Text>
                    <Text style={styles.roomFloor}>Piso: {room.floor}</Text>
                  </View>
                  <View style={[
                    styles.roomStatus,
                    { backgroundColor: getRoomStatusColor(room.status) }
                  ]}>
                    <Text style={styles.roomStatusText}>{room.status}</Text>
                  </View>
                </View>
                
                {room.current_meeting && (
                  <View style={styles.meetingInfo}>
                    <Text style={styles.meetingTitle}>{room.current_meeting.title}</Text>
                    <Text style={styles.meetingOrganizer}>
                      Organizador: {room.current_meeting.organizer}
                    </Text>
                    <Text style={styles.meetingAttendees}>
                      Asistentes: {room.current_meeting.attendees}
                    </Text>
                    <Text style={styles.meetingEnd}>
                      Termina: {new Date(room.current_meeting.end_time).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Security Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eventos de Seguridad Recientes</Text>
          {dashboardData.security_events.slice(0, 5).map((event, index) => (
            <View key={index} style={[
              styles.securityCard,
              { borderLeftColor: getSeverityColor(event.severity) }
            ]}>
              <View style={styles.securityHeader}>
                <Text style={styles.securityTime}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Text>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(event.severity) }
                ]}>
                  <Text style={styles.severityText}>{event.severity}</Text>
                </View>
              </View>
              <Text style={styles.securityType}>{event.event_type}</Text>
              <Text style={styles.securityDescription}>{event.description}</Text>
              {event.floor && (
                <Text style={styles.securityFloor}>Piso: {event.floor}</Text>
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
            <Text style={styles.actionText}>Registrar Visitante</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="meeting-room" size={24} color="white" />
            <Text style={styles.actionText}>Reservar Sala</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="security" size={24} color="white" />
            <Text style={styles.actionText}>Seguridad</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Modal */}
      {showQR && (
        <QRDisplay
          visible={showQR}
          onClose={() => setShowQR(false)}
          qrData="https://axs360.com/corporate/access"
          title="QR de Acceso Corporativo"
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
  floorSection: {
    padding: 16,
  },
  floorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  floorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  floorPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  floorBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  floorFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  floorNumbers: {
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
  employeeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  employeePosition: {
    fontSize: 14,
    color: '#6b7280',
  },
  employeeDepartment: {
    fontSize: 12,
    color: '#9ca3af',
  },
  employeeTags: {
    gap: 4,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  accessTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  accessTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  employeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  employeeTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  employeeFloor: {
    fontSize: 14,
    color: '#6b7280',
  },
  pendingVisitorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
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
  visitorCompany: {
    fontSize: 14,
    color: '#6b7280',
  },
  visitorPurpose: {
    fontSize: 12,
    color: '#9ca3af',
  },
  badgeInfo: {
    alignItems: 'center',
  },
  badgeNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visitorHost: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  visitorTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  visitorFloor: {
    fontSize: 14,
    color: '#6b7280',
  },
  visitorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
  roomCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  roomCapacity: {
    fontSize: 14,
    color: '#6b7280',
  },
  roomFloor: {
    fontSize: 12,
    color: '#9ca3af',
  },
  roomStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roomStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  meetingInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  meetingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  meetingOrganizer: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  meetingAttendees: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  meetingEnd: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  securityCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  securityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  securityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  securityType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  securityDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  securityFloor: {
    fontSize: 12,
    color: '#9ca3af',
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

export default CorporateScreen;
