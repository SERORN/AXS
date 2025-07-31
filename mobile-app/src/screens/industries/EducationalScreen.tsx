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

interface Student {
  student_id: string;
  name: string;
  grade: string;
  entry_time: string;
  exit_time?: string;
  status: 'inside' | 'outside' | 'late' | 'absent';
  guardian_name: string;
  guardian_phone: string;
}

interface Staff {
  staff_id: string;
  name: string;
  department: string;
  role: string;
  entry_time?: string;
  status: 'inside' | 'outside';
}

interface EducationalDashboard {
  total_students: number;
  present_students: number;
  absent_students: number;
  late_students: number;
  total_staff: number;
  present_staff: number;
  current_students: Student[];
  current_staff: Staff[];
  attendance_by_grade: Array<{
    grade: string;
    total: number;
    present: number;
    absent: number;
    percentage: number;
  }>;
  late_arrivals_today: Array<{
    name: string;
    grade: string;
    arrival_time: string;
    minutes_late: number;
  }>;
  emergency_contacts: Array<{
    student_name: string;
    issue: string;
    guardian_phone: string;
    timestamp: string;
  }>;
  alerts: any[];
}

const EducationalScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<EducationalDashboard | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'students' | 'staff' | 'attendance'>('students');

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 2 minutes for real-time attendance
    const interval = setInterval(loadDashboardData, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const businessId = user?.businessId || 'demo-school-id';
      const response = await apiService.get(`/dashboard/educational/${businessId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading educational dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar la información educativa');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateSchoolQR = async () => {
    setShowQR(true);
  };

  const contactGuardian = async (student: Student) => {
    Alert.alert(
      'Contactar Tutor',
      `¿Llamar a ${student.guardian_name}?\nEstudiante: ${student.name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          onPress: () => {
            // Implementation for calling guardian
            Alert.alert('Llamando', `Conectando con ${student.guardian_phone}`);
          },
        },
      ]
    );
  };

  const markStudentPresent = async (student: Student) => {
    try {
      await apiService.put(`/access/student/${student.student_id}/checkin`);
      Alert.alert('Registro Exitoso', `${student.name} marcado como presente`);
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la asistencia');
    }
  };

  const markStudentExit = async (student: Student) => {
    Alert.alert(
      'Confirmar Salida',
      `¿Marcar salida de ${student.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await apiService.put(`/access/student/${student.student_id}/checkout`);
              Alert.alert('Salida Registrada', `${student.name} ha salido`);
              loadDashboardData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo registrar la salida');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inside': return '#10b981';
      case 'outside': return '#6b7280';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'inside': return 'check-circle';
      case 'outside': return 'radio-button-unchecked';
      case 'late': return 'schedule';
      case 'absent': return 'cancel';
      default: return 'help';
    }
  };

  const getAttendancePercentageColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error al cargar datos educativos</Text>
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
          <Text style={styles.title}>Institución Educativa</Text>
          <TouchableOpacity onPress={generateSchoolQR}>
            <Icon name="qr-code" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.present_students}</Text>
            <Text style={styles.statLabel}>Estudiantes Presentes</Text>
            <Icon name="school" size={24} color="#10b981" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.absent_students}</Text>
            <Text style={styles.statLabel}>Ausentes</Text>
            <Icon name="cancel" size={24} color="#ef4444" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.late_students}</Text>
            <Text style={styles.statLabel}>Tardanzas</Text>
            <Icon name="schedule" size={24} color="#f59e0b" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.present_staff}</Text>
            <Text style={styles.statLabel}>Personal Presente</Text>
            <Icon name="people" size={24} color="#3b82f6" />
          </View>
        </View>

        {/* Attendance Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Resumen de Asistencia</Text>
          <View style={styles.attendanceBar}>
            <View
              style={[
                styles.presentBar,
                { width: `${(dashboardData.present_students / dashboardData.total_students) * 100}%` }
              ]}
            />
            <View
              style={[
                styles.lateBar,
                { width: `${(dashboardData.late_students / dashboardData.total_students) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.attendanceText}>
            {Math.round((dashboardData.present_students / dashboardData.total_students) * 100)}% de asistencia
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'students' && styles.activeTab]}
            onPress={() => setSelectedTab('students')}
          >
            <Text style={[styles.tabText, selectedTab === 'students' && styles.activeTabText]}>
              Estudiantes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'staff' && styles.activeTab]}
            onPress={() => setSelectedTab('staff')}
          >
            <Text style={[styles.tabText, selectedTab === 'staff' && styles.activeTabText]}>
              Personal
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'attendance' && styles.activeTab]}
            onPress={() => setSelectedTab('attendance')}
          >
            <Text style={[styles.tabText, selectedTab === 'attendance' && styles.activeTabText]}>
              Por Grado
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on selected tab */}
        {selectedTab === 'students' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estudiantes Actuales</Text>
            {dashboardData.current_students.map((student, index) => (
              <TouchableOpacity
                key={index}
                style={styles.studentCard}
                onPress={() => student.status === 'inside' ? markStudentExit(student) : markStudentPresent(student)}
              >
                <View style={styles.studentHeader}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentGrade}>Grado: {student.grade}</Text>
                    <Text style={styles.studentId}>ID: {student.student_id}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(student.status) }
                    ]}>
                      <Icon name={getStatusIcon(student.status)} size={16} color="white" />
                      <Text style={styles.statusText}>{student.status}</Text>
                    </View>
                  </View>
                </View>
                
                {student.entry_time && (
                  <Text style={styles.studentTime}>
                    Entrada: {new Date(student.entry_time).toLocaleTimeString()}
                  </Text>
                )}
                
                <View style={styles.guardianInfo}>
                  <Text style={styles.guardianName}>Tutor: {student.guardian_name}</Text>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => contactGuardian(student)}
                  >
                    <Icon name="phone" size={16} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedTab === 'staff' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Actual</Text>
            {dashboardData.current_staff.map((staff, index) => (
              <View key={index} style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffRole}>{staff.role}</Text>
                    <Text style={styles.staffDepartment}>{staff.department}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(staff.status) }
                  ]}>
                    <Icon name={getStatusIcon(staff.status)} size={16} color="white" />
                    <Text style={styles.statusText}>{staff.status}</Text>
                  </View>
                </View>
                
                {staff.entry_time && (
                  <Text style={styles.staffTime}>
                    Entrada: {new Date(staff.entry_time).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'attendance' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asistencia por Grado</Text>
            {dashboardData.attendance_by_grade.map((grade, index) => (
              <View key={index} style={styles.gradeCard}>
                <View style={styles.gradeHeader}>
                  <Text style={styles.gradeName}>Grado {grade.grade}</Text>
                  <Text style={[
                    styles.gradePercentage,
                    { color: getAttendancePercentageColor(grade.percentage) }
                  ]}>
                    {Math.round(grade.percentage)}%
                  </Text>
                </View>
                
                <View style={styles.gradeStats}>
                  <View style={styles.gradeStat}>
                    <Text style={styles.gradeStatValue}>{grade.present}</Text>
                    <Text style={styles.gradeStatLabel}>Presentes</Text>
                  </View>
                  <View style={styles.gradeStat}>
                    <Text style={styles.gradeStatValue}>{grade.absent}</Text>
                    <Text style={styles.gradeStatLabel}>Ausentes</Text>
                  </View>
                  <View style={styles.gradeStat}>
                    <Text style={styles.gradeStatValue}>{grade.total}</Text>
                    <Text style={styles.gradeStatLabel}>Total</Text>
                  </View>
                </View>
                
                <View style={styles.gradeBar}>
                  <View
                    style={[
                      styles.gradeProgress,
                      { 
                        width: `${grade.percentage}%`,
                        backgroundColor: getAttendancePercentageColor(grade.percentage)
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Late Arrivals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tardanzas de Hoy</Text>
          {dashboardData.late_arrivals_today.map((late, index) => (
            <View key={index} style={styles.lateCard}>
              <View style={styles.lateHeader}>
                <Text style={styles.lateName}>{late.name}</Text>
                <Text style={styles.lateMinutes}>+{late.minutes_late} min</Text>
              </View>
              <Text style={styles.lateGrade}>Grado: {late.grade}</Text>
              <Text style={styles.lateTime}>
                Llegada: {new Date(late.arrival_time).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Emergency Contacts */}
        {dashboardData.emergency_contacts && dashboardData.emergency_contacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
            {dashboardData.emergency_contacts.map((contact, index) => (
              <View key={index} style={styles.emergencyCard}>
                <View style={styles.emergencyHeader}>
                  <Text style={styles.emergencyStudent}>{contact.student_name}</Text>
                  <TouchableOpacity style={styles.emergencyCall}>
                    <Icon name="emergency" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.emergencyIssue}>{contact.issue}</Text>
                <Text style={styles.emergencyPhone}>Tel: {contact.guardian_phone}</Text>
                <Text style={styles.emergencyTime}>
                  {new Date(contact.timestamp).toLocaleTimeString()}
                </Text>
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
            <Icon name="person-add" size={24} color="white" />
            <Text style={styles.actionText}>Registrar Estudiante</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="assignment" size={24} color="white" />
            <Text style={styles.actionText}>Reporte de Asistencia</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="emergency" size={24} color="white" />
            <Text style={styles.actionText}>Emergencia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Modal */}
      {showQR && (
        <QRDisplay
          visible={showQR}
          onClose={() => setShowQR(false)}
          qrData="https://axs360.com/school/access"
          title="QR de Acceso Escolar"
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
  overviewCard: {
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
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  attendanceBar: {
    height: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  presentBar: {
    backgroundColor: '#10b981',
    height: '100%',
  },
  lateBar: {
    backgroundColor: '#f59e0b',
    height: '100%',
  },
  attendanceText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: '600',
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  studentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  studentGrade: {
    fontSize: 14,
    color: '#6b7280',
  },
  studentId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusContainer: {
    alignItems: 'flex-end',
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
  studentTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  guardianInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guardianName: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  contactButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  staffCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  staffRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  staffDepartment: {
    fontSize: 12,
    color: '#9ca3af',
  },
  staffTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  gradeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  gradePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gradeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  gradeStat: {
    alignItems: 'center',
  },
  gradeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  gradeStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  gradeBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gradeProgress: {
    height: '100%',
    borderRadius: 3,
  },
  lateCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  lateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  lateMinutes: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  lateGrade: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  lateTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  emergencyCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emergencyCall: {
    padding: 8,
  },
  emergencyIssue: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  emergencyPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  emergencyTime: {
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
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default EducationalScreen;
