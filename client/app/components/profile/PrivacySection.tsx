import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrivacySettings } from '../../services/api/privacy.api';

interface PrivacySectionProps {
  privacySettings: PrivacySettings;
  handleTogglePrivacy: (setting: keyof PrivacySettings) => void;
  handleSavePrivacySettings: () => Promise<void>;
  handleRequestDataExport: () => void;
  sectionLoading?: boolean;
}

export default function PrivacySection({
  privacySettings,
  handleTogglePrivacy,
  handleSavePrivacySettings,
  handleRequestDataExport,
  sectionLoading = false
}: PrivacySectionProps) {
  // Ensure we have profile visibility property for compatibility with API
  if (!privacySettings.profileVisibility) {
    privacySettings.profileVisibility = 'PRIVATE';
  }
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Paramètres de confidentialité</Text>
      
      <View style={styles.privacyOption}>
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Partager mes progrès</Text>
          <Text style={styles.privacyDescription}>Autorise le partage de vos progrès avec votre guide/instructeur</Text>
        </View>
        <Switch
          value={privacySettings.shareProgress}
          onValueChange={() => handleTogglePrivacy('shareProgress')}
          trackColor={{ false: "#dedede", true: "#b1cfed" }}
          thumbColor={privacySettings.shareProgress ? "#7CA7D8" : "#f4f3f4"}
          disabled={sectionLoading}
        />
      </View>
      
      <View style={styles.privacyOption}>
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Recevoir des notifications</Text>
          <Text style={styles.privacyDescription}>Active ou désactive toutes les notifications</Text>
        </View>
        <Switch
          value={privacySettings.receiveNotifications}
          onValueChange={() => handleTogglePrivacy('receiveNotifications')}
          trackColor={{ false: "#dedede", true: "#b1cfed" }}
          thumbColor={privacySettings.receiveNotifications ? "#7CA7D8" : "#f4f3f4"}
          disabled={sectionLoading}
        />
      </View>
      
      <View style={styles.privacyOption}>
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Profil public</Text>
          <Text style={styles.privacyDescription}>Rend votre profil visible pour les autres utilisateurs</Text>
        </View>
        <Switch
          value={privacySettings.publicProfile}
          onValueChange={() => handleTogglePrivacy('publicProfile')}
          trackColor={{ false: "#dedede", true: "#b1cfed" }}
          thumbColor={privacySettings.publicProfile ? "#7CA7D8" : "#f4f3f4"}
          disabled={sectionLoading}
        />
      </View>
      
      <View style={styles.privacyOption}>
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Suivi de position</Text>
          <Text style={styles.privacyDescription}>Autorise le suivi de votre position pendant les sessions de conduite</Text>
        </View>
        <Switch
          value={privacySettings.locationTracking}
          onValueChange={() => handleTogglePrivacy('locationTracking')}
          trackColor={{ false: "#dedede", true: "#b1cfed" }}
          thumbColor={privacySettings.locationTracking ? "#7CA7D8" : "#f4f3f4"}
          disabled={sectionLoading}
        />
      </View>
      
      <View style={styles.privacyOption}>
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Collecte de données</Text>
          <Text style={styles.privacyDescription}>Autorise la collecte de données pour améliorer l'application</Text>
        </View>
        <Switch
          value={privacySettings.dataCollection}
          onValueChange={() => handleTogglePrivacy('dataCollection')}
          trackColor={{ false: "#dedede", true: "#b1cfed" }}
          thumbColor={privacySettings.dataCollection ? "#7CA7D8" : "#f4f3f4"}
          disabled={sectionLoading}
        />
      </View>
      
      {/* Option du profil partagé (visibility) */}
      <View style={styles.privacyOption}>
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Visibilité du profil</Text>
          <Text style={styles.privacyDescription}>Définit qui peut voir votre profil</Text>
        </View>
        <View style={styles.visibilitySelector}>
          <TouchableOpacity 
            style={[
              styles.visibilityOption, 
              privacySettings.profileVisibility === 'PRIVATE' && styles.visibilitySelected
            ]}
            onPress={() => handleTogglePrivacy('profileVisibility')}
            disabled={sectionLoading || privacySettings.profileVisibility === 'PRIVATE'}
          >
            <Text style={styles.visibilityText}>Privé</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.visibilityOption, 
              privacySettings.profileVisibility === 'FRIENDS_ONLY' && styles.visibilitySelected
            ]}
            onPress={() => handleTogglePrivacy('profileVisibility')}
            disabled={sectionLoading || privacySettings.profileVisibility === 'FRIENDS_ONLY'}
          >
            <Text style={styles.visibilityText}>Amis</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.visibilityOption, 
              privacySettings.profileVisibility === 'PUBLIC' && styles.visibilitySelected
            ]}
            onPress={() => handleTogglePrivacy('profileVisibility')}
            disabled={sectionLoading || privacySettings.profileVisibility === 'PUBLIC'}
          >
            <Text style={styles.visibilityText}>Public</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, styles.saveButton, sectionLoading && styles.disabledButton]} 
        onPress={handleSavePrivacySettings}
        disabled={sectionLoading}
      >
        <Text style={styles.buttonText}>Enregistrer les paramètres</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.downloadButton, sectionLoading && styles.disabledButton]}
        onPress={handleRequestDataExport}
        disabled={sectionLoading}
      >
        <Ionicons name="download-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Exporter mes données</Text>
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
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  privacyDescription: {
    fontSize: 14,
    color: '#666',
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
  saveButton: {
    backgroundColor: '#7CA7D8',
  },
  downloadButton: {
    backgroundColor: '#666',
  },
  disabledButton: {
    opacity: 0.6,
  },
  visibilitySelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  visibilityOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
  },
  visibilitySelected: {
    backgroundColor: '#7CA7D8',
  },
  visibilityText: {
    fontSize: 14,
    color: '#666',
  },
});