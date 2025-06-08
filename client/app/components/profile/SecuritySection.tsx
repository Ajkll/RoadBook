import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';

interface SecuritySectionProps {
  sessions: any[];
  handleLogoutSession: (sessionId: string) => Promise<void>;
  handleLogoutAllSessions: () => Promise<void>;
  handleDeleteAccount: () => void;
  handleDeactivateAccount?: () => void;
  handleChangePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) => Promise<void>;
  handleForgotPassword?: (email: string) => Promise<void>;
  formatDate: (dateString: string) => string;
  sectionLoading?: boolean;
}

export default function SecuritySection({
  sessions,
  handleLogoutSession,
  handleLogoutAllSessions,
  handleDeleteAccount,
  handleChangePassword,
  handleForgotPassword,
  formatDate,
  sectionLoading
}: SecuritySectionProps) {
  const { colors, dark } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState(false);
  
  // État pour suivre la force du mot de passe
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSpecialChar: false
  });
  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: colors.backgroundText }]}>Gestion du mot de passe</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.securityButton, { backgroundColor: colors.primary }]} 
        onPress={() => setShowPasswordModal(true)}
      >
        <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Changer mon mot de passe</Text>
      </TouchableOpacity>
      
      <Text style={[styles.sectionTitle, { color: colors.backgroundText }]}>Sessions actives</Text>
      
      {sessions && sessions.length > 0 ? (
        sessions.map((session) => (
          <View key={session.id} style={[styles.sessionCard, { backgroundColor: dark ? colors.cardDark : '#f9f9f9', borderColor: dark ? colors.borderDark : '#eee' }]}>
            <View style={styles.sessionInfo}>
              <View style={styles.sessionHeader}>
                <Ionicons 
                  name={session.device && session.device.toLowerCase().includes('iphone') || session.device && session.device.toLowerCase().includes('samsung') ? 'phone-portrait-outline' : 'desktop-outline'} 
                  size={18} 
                  color={dark ? colors.backgroundTextSoft : "#666"} 
                />
                <Text style={[styles.sessionDevice, { color: dark ? colors.backgroundText : '#333' }]}>
                  {session.device || 'Appareil inconnu'} {session.current && <Text style={styles.currentSession}>(Session actuelle)</Text>}
                </Text>
              </View>
              <Text style={[styles.sessionDetail, { color: dark ? colors.backgroundTextSoft : '#666' }]}>
                <Ionicons name="location-outline" size={14} color={dark ? colors.backgroundTextSoft : "#888"} /> {session.location || 'Emplacement non disponible'}
              </Text>
              <Text style={[styles.sessionDetail, { color: dark ? colors.backgroundTextSoft : '#666' }]}>
                <Ionicons name="time-outline" size={14} color={dark ? colors.backgroundTextSoft : "#888"} /> Dernière activité: {formatDate(session.lastActive)}
              </Text>
            </View>
            
            {!session.current && (
              <TouchableOpacity 
                style={[styles.logoutSessionButton, { backgroundColor: colors.danger }]}
                onPress={() => handleLogoutSession(session.id)}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <Text style={[styles.emptyMessage, { color: dark ? colors.backgroundTextSoft : '#666' }]}>Aucune session active trouvée</Text>
      )}
      
      {sessions && sessions.filter(s => !s.current).length > 0 && (
        <TouchableOpacity 
          style={[styles.button, styles.logoutAllButton, { backgroundColor: colors.danger }]}
          onPress={handleLogoutAllSessions}
        >
          <Text style={styles.buttonText}>Déconnecter toutes les autres sessions</Text>
        </TouchableOpacity>
      )}
      
      <Text style={[styles.sectionTitle, { color: colors.backgroundText }]}>Suppression du compte</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.dangerButton, { backgroundColor: colors.danger }]} 
        onPress={handleDeleteAccount}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Supprimer mon compte</Text>
      </TouchableOpacity>

      {/* Modal pour le changement de mot de passe */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.ui.modal.background }]}>
            <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>Changer votre mot de passe</Text>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.passwordInput, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.backgroundText
                }]}
                placeholder="Mot de passe actuel"
                placeholderTextColor={colors.backgroundTextSoft}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity 
                style={styles.togglePasswordButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons 
                  name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={colors.backgroundText} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.passwordInput, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.backgroundText
                }]}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={colors.backgroundTextSoft}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  
                  // Évaluer la force du mot de passe
                  const hasMinLength = text.length >= 8;
                  const hasUpperCase = /[A-Z]/.test(text);
                  const hasLowerCase = /[a-z]/.test(text);
                  const hasNumbers = /\d/.test(text);
                  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(text);
                  
                  // Calculer un score sur 5
                  const criteriaCount = [
                    hasMinLength, 
                    hasUpperCase, 
                    hasLowerCase, 
                    hasNumbers, 
                    hasSpecialChar
                  ].filter(Boolean).length;
                  
                  setPasswordStrength({
                    score: criteriaCount,
                    hasMinLength,
                    hasUpperCase,
                    hasLowerCase,
                    hasNumbers,
                    hasSpecialChar
                  });
                }}
              />
              <TouchableOpacity 
                style={styles.togglePasswordButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={colors.backgroundText} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.passwordInput, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.backgroundText
                }]}
                placeholder="Confirmer le nouveau mot de passe"
                placeholderTextColor={colors.backgroundTextSoft}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.togglePasswordButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={colors.backgroundText} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Indicateur de force du mot de passe */}
            <View style={styles.strengthIndicatorContainer}>
              <View style={styles.strengthBarContainer}>
                <View 
                  style={[
                    styles.strengthBar, 
                    { 
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: passwordStrength.score === 0 
                        ? '#ddd' 
                        : passwordStrength.score < 3 
                          ? '#ff6b6b' 
                          : passwordStrength.score < 5 
                            ? '#ffd166' 
                            : '#06d6a0'
                    }
                  ]}
                />
              </View>
              <Text style={[styles.strengthText, { color: colors.backgroundTextSoft }]}>
                {passwordStrength.score === 0 && 'Aucun critère respecté'}
                {passwordStrength.score === 1 && 'Mot de passe très faible'}
                {passwordStrength.score === 2 && 'Mot de passe faible'}
                {passwordStrength.score === 3 && 'Mot de passe moyen'}
                {passwordStrength.score === 4 && 'Mot de passe fort'}
                {passwordStrength.score === 5 && 'Mot de passe très fort'}
              </Text>
            </View>
            
            <View style={styles.criteriaContainer}>
              <Text style={[
                styles.criteriaText, 
                { color: passwordStrength.hasMinLength ? colors.success : colors.backgroundTextSoft }
              ]}>
                ✓ Au moins 8 caractères
              </Text>
              <Text style={[
                styles.criteriaText, 
                { color: passwordStrength.hasUpperCase ? colors.success : colors.backgroundTextSoft }
              ]}>
                ✓ Au moins une lettre majuscule
              </Text>
              <Text style={[
                styles.criteriaText, 
                { color: passwordStrength.hasLowerCase ? colors.success : colors.backgroundTextSoft }
              ]}>
                ✓ Au moins une lettre minuscule
              </Text>
              <Text style={[
                styles.criteriaText, 
                { color: passwordStrength.hasNumbers ? colors.success : colors.backgroundTextSoft }
              ]}>
                ✓ Au moins un chiffre
              </Text>
              <Text style={[
                styles.criteriaText, 
                { color: passwordStrength.hasSpecialChar ? colors.success : colors.backgroundTextSoft }
              ]}>
                {`✓ Au moins un caractère spécial (!@#$%^&*(),.?)`}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={() => {
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                
                // Ouvrir le modal de mot de passe oublié
                if (handleForgotPassword) {
                  setShowForgotPasswordModal(true);
                }
              }}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.backgroundTextSoft }]}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
                disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                onPress={async () => {
                  // Vérifier que tous les champs sont remplis
                  if (!currentPassword) {
                    Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel.');
                    return;
                  }
                  
                  if (!newPassword) {
                    Alert.alert('Erreur', 'Veuillez entrer un nouveau mot de passe.');
                    return;
                  }
                  
                  if (!confirmPassword) {
                    Alert.alert('Erreur', 'Veuillez confirmer votre nouveau mot de passe.');
                    return;
                  }
                  
                  // Vérifier que les nouveaux mots de passe correspondent
                  if (newPassword !== confirmPassword) {
                    Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
                    return;
                  }
                  
                  setIsSubmitting(true);
                  try {
                    // Passer également confirmPassword comme troisième paramètre
                    await handleChangePassword(currentPassword, newPassword, confirmPassword);
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  } catch (error) {
                    // L'erreur est déjà gérée dans handleChangePassword
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal pour réinitialiser le mot de passe */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.ui.modal.background }]}>
            <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>
              Réinitialiser votre mot de passe
            </Text>
            
            <Text style={[styles.modalMessage, { color: colors.backgroundTextSoft }]}>
              Veuillez entrer votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
            </Text>
            
            <TextInput
              style={[styles.passwordInput, { 
                borderColor: colors.border, 
                backgroundColor: colors.background,
                color: colors.backgroundText
              }]}
              placeholder="Votre adresse email"
              placeholderTextColor={colors.backgroundTextSoft}
              value={forgotPasswordEmail}
              onChangeText={setForgotPasswordEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordEmail('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.backgroundTextSoft }]}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
                disabled={isForgotPasswordSubmitting || !forgotPasswordEmail}
                onPress={async () => {
                  if (!handleForgotPassword) return;
                  
                  setIsForgotPasswordSubmitting(true);
                  try {
                    await handleForgotPassword(forgotPasswordEmail);
                    setShowForgotPasswordModal(false);
                    setForgotPasswordEmail('');
                  } catch (error) {
                    // L'erreur est déjà gérée dans handleForgotPassword
                  } finally {
                    setIsForgotPasswordSubmitting(false);
                  }
                }}
              >
                {isForgotPasswordSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
  },
  sessionCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
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
  },
  currentSession: {
    color: '#7CA7D8',
    fontWeight: 'normal',
    fontSize: 13,
  },
  sessionDetail: {
    fontSize: 14,
    marginTop: 3,
  },
  logoutSessionButton: {
    borderRadius: 5,
    padding: 8,
    marginLeft: 10,
    backgroundColor: '#FF6B6B',
  },
  logoutAllButton: {
    backgroundColor: '#FF6B6B',
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  emptyMessage: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  // Styles pour le modal de changement de mot de passe
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    fontSize: 16,
    paddingRight: 50,
  },
  togglePasswordButton: {
    position: 'absolute',
    right: 12,
    height: 50,
    justifyContent: 'center',
  },
  passwordRequirements: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'left',
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  modalSaveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 5,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  strengthIndicatorContainer: {
    marginBottom: 15,
  },
  strengthBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  criteriaContainer: {
    marginBottom: 15,
  },
  criteriaText: {
    fontSize: 12,
    marginBottom: 4,
  },
  demoNote: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 15,
  },
});