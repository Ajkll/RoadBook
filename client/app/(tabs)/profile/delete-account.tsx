import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../constants/theme';
import { logger } from '../../utils/logger';

/**
 * Écran de suppression de compte
 * Permet à l'utilisateur de supprimer définitivement son compte
 */
export default function DeleteAccountScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Texte de confirmation requis
  const confirmationText = "SUPPRIMER MON COMPTE";

  /**
   * Gère la demande de suppression de compte
   */
  const handleDeleteAccount = async () => {
    // Vérifier le mot de passe et la confirmation
    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe pour confirmer.');
      return;
    }
    
    if (confirmation !== confirmationText) {
      Alert.alert('Erreur', `Veuillez saisir exactement "${confirmationText}" pour confirmer.`);
      return;
    }
    
    // Confirmation finale
    Alert.alert(
      'Point de non-retour',
      'Êtes-vous vraiment sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              // Simuler un délai de suppression
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // En production, faire un appel à l'API ici
              
              Alert.alert(
                'Compte supprimé',
                'Votre compte a été supprimé avec succès. Vous allez être déconnecté.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      try {
                        await logout();
                      } catch (error) {
                        logger.error('Erreur lors de la déconnexion après suppression', error);
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              logger.error('Erreur lors de la suppression du compte', error);
              Alert.alert(
                'Erreur',
                'Une erreur est survenue lors de la suppression de votre compte. Veuillez réessayer plus tard.'
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.warningContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning-outline" size={40} color="#ef4444" />
        </View>
        <Text style={styles.warningTitle}>Cette action est irréversible</Text>
        <Text style={styles.warningText}>
          La suppression de votre compte entraînera la perte définitive de toutes vos données, y compris :
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={styles.bulletPoint}>• Votre profil et vos informations personnelles</Text>
          <Text style={styles.bulletPoint}>• Tous vos trajets enregistrés et historiques</Text>
          <Text style={styles.bulletPoint}>• Toutes vos compétences et validations</Text>
          <Text style={styles.bulletPoint}>• Tous vos badges et réalisations</Text>
        </View>
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Confirmer la suppression</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Votre mot de passe</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Entrez votre mot de passe"
              placeholderTextColor={colors.secondaryText}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIconContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={colors.secondaryText} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Pour confirmer, tapez "{confirmationText}"
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder={confirmationText}
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.deleteButton, 
            {
              backgroundColor: '#ef4444',
              opacity: password && confirmation === confirmationText ? 1 : 0.5,
            }
          ]} 
          onPress={handleDeleteAccount}
          disabled={!password || confirmation !== confirmationText || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.cancelButton} 
        onPress={() => router.back()}
        disabled={isSubmitting}
      >
        <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#7f1d1d',
    marginBottom: 12,
    lineHeight: 20,
  },
  bulletPoints: {
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#7f1d1d',
    marginBottom: 6,
    lineHeight: 20,
  },
  formContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});