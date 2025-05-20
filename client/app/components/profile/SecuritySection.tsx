import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SecuritySectionProps {
  sessions: any[];
  handleLogoutSession: (sessionId: string) => Promise<void>;
  handleLogoutAllSessions: () => Promise<void>;
  handleDeleteAccount: () => void;
  handleDeactivateAccount: () => void;
  handleChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  formatDate: (dateString: string) => string;
  sectionLoading?: boolean;
}

export default function SecuritySection({
  sessions,
  handleLogoutSession,
  handleLogoutAllSessions,
  handleDeleteAccount,
  formatDate
}: SecuritySectionProps) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Gestion du mot de passe</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.securityButton]} 
        onPress={() => Alert.alert('Simulation', 'Redirection vers la page de changement de mot de passe')}
      >
        <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Changer mon mot de passe</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Sessions actives</Text>
      
      {sessions && sessions.length > 0 ? (
        sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionInfo}>
              <View style={styles.sessionHeader}>
                <Ionicons 
                  name={session.device && session.device.toLowerCase().includes('iphone') || session.device && session.device.toLowerCase().includes('samsung') ? 'phone-portrait-outline' : 'desktop-outline'} 
                  size={18} 
                  color="#666" 
                />
                <Text style={styles.sessionDevice}>
                  {session.device || 'Appareil inconnu'} {session.current && <Text style={styles.currentSession}>(Session actuelle)</Text>}
                </Text>
              </View>
              <Text style={styles.sessionDetail}>
                <Ionicons name="location-outline" size={14} color="#888" /> {session.location || 'Emplacement non disponible'}
              </Text>
              <Text style={styles.sessionDetail}>
                <Ionicons name="time-outline" size={14} color="#888" /> Dernière activité: {formatDate(session.lastActive)}
              </Text>
            </View>
            
            {!session.current && (
              <TouchableOpacity 
                style={styles.logoutSessionButton}
                onPress={() => handleLogoutSession(session.id)}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.emptyMessage}>Aucune session active trouvée</Text>
      )}
      
      {sessions && sessions.filter(s => !s.current).length > 0 && (
        <TouchableOpacity 
          style={[styles.button, styles.logoutAllButton]}
          onPress={handleLogoutAllSessions}
        >
          <Text style={styles.buttonText}>Déconnecter toutes les autres sessions</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.sectionTitle}>Suppression du compte</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.dangerButton]} 
        onPress={handleDeleteAccount}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Supprimer mon compte</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 10,
  },
  securityButton: {
    backgroundColor: '#7CA7D8',
    marginBottom: 20,
  },
  sessionCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sessionDevice: {
    fontWeight: '500',
    fontSize: 15,
    marginLeft: 6,
    color: '#333',
  },
  currentSession: {
    color: '#7CA7D8',
    fontWeight: 'normal',
    fontSize: 13,
  },
  sessionDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  logoutSessionButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 5,
    padding: 8,
    marginLeft: 10,
  },
  logoutAllButton: {
    backgroundColor: '#FF6B6B',
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});