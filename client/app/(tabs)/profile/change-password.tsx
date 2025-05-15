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
import { validatePassword } from '../../utils/validation';

/**
 * Écran de changement de mot de passe
 * Permet à l'utilisateur de modifier son mot de passe
 */
export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Valide le formulaire avant soumission
   */
  const validateForm = () => {
    const newErrors = {};
    
    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Soumet le formulaire pour changer le mot de passe
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Simuler une api call - en production, nous enverrions ces données au serveur
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Mot de passe mis à jour',
        'Votre mot de passe a été modifié avec succès.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      logger.error('Erreur lors du changement de mot de passe', error);
      Alert.alert(
        'Erreur',
        'Impossible de changer votre mot de passe. Veuillez vérifier votre mot de passe actuel et réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.infoBox}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Sécurité du compte</Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Choisissez un mot de passe fort et unique que vous n'utilisez pas sur d'autres sites.
        </Text>
      </View>

      <View style={styles.formContainer}>
        {/* Mot de passe actuel */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Mot de passe actuel</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card, 
                  color: colors.text, 
                  borderColor: errors.currentPassword ? '#ef4444' : colors.border,
                  flex: 1
                },
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Entrez votre mot de passe actuel"
              placeholderTextColor={colors.secondaryText}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIconContainer}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons 
                name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={colors.secondaryText} 
              />
            </TouchableOpacity>
          </View>
          {errors.currentPassword && (
            <Text style={styles.errorText}>{errors.currentPassword}</Text>
          )}
        </View>

        {/* Nouveau mot de passe */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nouveau mot de passe</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card, 
                  color: colors.text, 
                  borderColor: errors.newPassword ? '#ef4444' : colors.border,
                  flex: 1
                },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Créez un nouveau mot de passe"
              placeholderTextColor={colors.secondaryText}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIconContainer}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons 
                name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={colors.secondaryText} 
              />
            </TouchableOpacity>
          </View>
          {errors.newPassword && (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          )}
          <Text style={[styles.passwordHint, { color: colors.secondaryText }]}>
            Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
          </Text>
        </View>

        {/* Confirmation du nouveau mot de passe */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Confirmez le nouveau mot de passe</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card, 
                  color: colors.text, 
                  borderColor: errors.confirmPassword ? '#ef4444' : colors.border,
                  flex: 1
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmez votre nouveau mot de passe"
              placeholderTextColor={colors.secondaryText}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIconContainer}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={colors.secondaryText} 
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Boutons d'action */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Mettre à jour le mot de passe</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.card }]} 
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
  },
  passwordHint: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});