import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';

interface IndustryOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  screen: string;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const industries: IndustryOption[] = [
    {
      id: 'automotive',
      name: 'Talleres Automotrices',
      description: 'Gestión de vehículos y servicios',
      icon: 'build',
      color: '#ef4444',
      screen: 'AutomotiveWorkshop',
    },
    {
      id: 'parking',
      name: 'Estacionamientos',
      description: 'Control de espacios y tarifas',
      icon: 'local-parking',
      color: '#3b82f6',
      screen: 'ParkingFacility',
    },
    {
      id: 'airport',
      name: 'Lounges de Aeropuerto',
      description: 'Gestión de huéspedes y servicios',
      icon: 'flight',
      color: '#8b5cf6',
      screen: 'AirportLounge',
    },
    {
      id: 'residential',
      name: 'Condominios',
      description: 'Control de visitantes y residentes',
      icon: 'apartment',
      color: '#10b981',
      screen: 'Residential',
    },
    {
      id: 'educational',
      name: 'Instituciones Educativas',
      description: 'Asistencia de estudiantes y personal',
      icon: 'school',
      color: '#f59e0b',
      screen: 'Educational',
    },
    {
      id: 'corporate',
      name: 'Oficinas Corporativas',
      description: 'Empleados, visitantes y salas',
      icon: 'business',
      color: '#6366f1',
      screen: 'Corporate',
    },
    {
      id: 'valet',
      name: 'Valet Parking',
      description: 'Servicio de estacionamiento valet',
      icon: 'car-rental',
      color: '#ec4899',
      screen: 'ValetParking',
    },
  ];

  const handleIndustryPress = (industry: IndustryOption) => {
    try {
      navigation.navigate(industry.screen as never);
    } catch (error) {
      Alert.alert(
        'Próximamente',
        `La pantalla de ${industry.name} estará disponible pronto.`
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name || 'Usuario'}</Text>
          <Text style={styles.subtitle}>Selecciona tu industria</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
          <Icon name="account-circle" size={32} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Industry Cards */}
        <View style={styles.industriesGrid}>
          {industries.map((industry) => (
            <TouchableOpacity
              key={industry.id}
              style={[styles.industryCard, { borderLeftColor: industry.color }]}
              onPress={() => handleIndustryPress(industry)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: industry.color }]}>
                  <Icon name={industry.icon} size={32} color="white" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.industryName}>{industry.name}</Text>
                  <Text style={styles.industryDescription}>{industry.description}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#6b7280" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Platform Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>AXS360 Platform</Text>
          <Text style={styles.infoDescription}>
            Plataforma integral de control de acceso QR multi-industria con 
            reconocimiento de placas, reconocimiento facial y gestión de visitantes.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Icon name="qr-code" size={20} color="#2563eb" />
              <Text style={styles.featureText}>Códigos QR</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="camera-alt" size={20} color="#2563eb" />
              <Text style={styles.featureText}>Reconocimiento</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="analytics" size={20} color="#2563eb" />
              <Text style={styles.featureText}>Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="security" size={20} color="#2563eb" />
              <Text style={styles.featureText}>Seguridad</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="qr-code-scanner" size={24} color="#2563eb" />
              <Text style={styles.actionText}>Escanear QR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="add-circle" size={24} color="#10b981" />
              <Text style={styles.actionText}>Nuevo Registro</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="assessment" size={24} color="#f59e0b" />
              <Text style={styles.actionText}>Reportes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="settings" size={24} color="#8b5cf6" />
              <Text style={styles.actionText}>Configuración</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  industriesGrid: {
    padding: 16,
    gap: 16,
  },
  industryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  industryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  industryDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoSection: {
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
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  quickActions: {
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
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;
