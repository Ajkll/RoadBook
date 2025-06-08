import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { RegisterRequest, UserRole } from '../../types/auth.types';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from '../../store/slices/networkSlice';
import { logger } from '../../utils/logger';

// Regex patterns pour la validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const RegisterForm = ({ navigation }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const isOnline = useSelector(selectIsInternetReachable);
  
  // État pour les champs du formulaire
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: UserRole.APPRENTICE
  });
  
  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // État pour montrer/cacher le mot de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Gérer les changements de valeurs des champs
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur de validation lorsque l'utilisateur modifie le champ
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Effacer l'erreur globale
    if (error) {
      clearError();
    }
  };
  
  // Valider le formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validation de l'email
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = 'Veuillez entrer une adresse email valide';
    }
    
    // Validation du mot de passe
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial';
    }
    
    // Validation de la confirmation du mot de passe
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    // Validation du nom d'affichage
    if (!formData.displayName) {
      errors.displayName = 'Le nom d\'affichage est requis';
    } else if (formData.displayName.length < 3) {
      errors.displayName = 'Le nom d\'affichage doit contenir au moins 3 caractères';
    }
    
    // Validation du numéro de téléphone (optionnel)
    if (formData.phoneNumber && !PHONE_REGEX.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Format de numéro de téléphone invalide. Utilisez le format international (ex: +33612345678)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    // Vérifier si l'utilisateur est en ligne
    if (!isOnline) {
      Alert.alert(
        "Mode hors ligne",
        "L'inscription nécessite une connexion internet. Veuillez vous connecter à Internet et réessayer."
      );
      return;
    }
    
    // Valider le formulaire avant de soumettre
    if (!validateForm()) {
      return;
    }
    
    try {
      // Supprimer le champ confirmPassword avant d'envoyer à l'API
      const { confirmPassword, ...registerData } = formData;
      
      logger.info("Tentative d'inscription d'un nouvel utilisateur");
      
      await register(registerData);
      
      logger.info("Inscription réussie pour l'utilisateur avec l'email: " + registerData.email);
      
      Alert.alert(
        'Inscription réussie', 
        'Votre compte a été créé avec succès. Bienvenue sur RoadBook!',
        [{ text: 'OK', onPress: () => navigation.replace('(tabs)') }]
      );
    } catch (err) {
      // L'erreur est déjà gérée par le contexte d'authentification
      logger.error('Erreur lors de l\'inscription:', err);
      
      // Si l'erreur concerne l'email déjà utilisé
      if (err.message?.toLowerCase().includes('email') && err.message?.toLowerCase().includes('déjà utilisé')) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre ou vous connecter.'
        }));
      } 
      // Améliorer les messages d'erreur pour les problèmes de mot de passe
      else if (err.message?.toLowerCase().includes('mot de passe')) {
        setValidationErrors(prev => ({
          ...prev,
          password: err.message || 'Problème avec le mot de passe. Veuillez vérifier qu\'il respecte les critères de sécurité.'
        }));
      }
      // Messages génériques pour d'autres erreurs
      else if (err.message) {
        Alert.alert(
          "Erreur d'inscription",
          "Une erreur est survenue lors de votre inscription: " + err.message
        );
      }
    }
  };
  
  // Afficher les icônes d'aide pour les champs avec des exigences spécifiques
  const renderHelpIcon = (field: string, description: string) => (
    <TouchableOpacity
      onPress={() => Alert.alert(`Information sur ${field}`, description)}
      style={styles.helpIcon}
    >
      <Ionicons name="information-circle-outline" size={18} color="#7CA7D8" />
    </TouchableOpacity>
  );
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez notre communauté pour améliorer vos compétences de conduite</Text>
        
        {/* Email Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <View style={[styles.inputContainer, validationErrors.email ? styles.inputError : null]}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Votre adresse email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {renderHelpIcon("l'email", "Doit être une adresse email valide. Nous vous enverrons un email de confirmation.")}
          </View>
          {validationErrors.email && (
            <Text style={styles.errorText}>{validationErrors.email}</Text>
          )}
        </View>
        
        {/* Display Name Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom d'affichage *</Text>
          <View style={[styles.inputContainer, validationErrors.displayName ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Comment souhaitez-vous être appelé?"
              value={formData.displayName}
              onChangeText={(text) => handleChange('displayName', text)}
              autoComplete="name"
            />
          </View>
          {validationErrors.displayName && (
            <Text style={styles.errorText}>{validationErrors.displayName}</Text>
          )}
        </View>
        
        {/* First Name Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prénom</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Votre prénom"
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              autoComplete="given-name"
            />
          </View>
        </View>
        
        {/* Last Name Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Votre nom de famille"
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              autoComplete="family-name"
            />
          </View>
        </View>
        
        {/* Phone Number Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Téléphone</Text>
          <View style={[styles.inputContainer, validationErrors.phoneNumber ? styles.inputError : null]}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Votre numéro de téléphone"
              value={formData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            {renderHelpIcon("le téléphone", "Format international recommandé (ex: +33612345678). Ce numéro peut être utilisé pour la récupération de compte.")}
          </View>
          {validationErrors.phoneNumber && (
            <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>
          )}
        </View>
        
        {/* Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mot de passe *</Text>
          <View style={[styles.inputContainer, validationErrors.password ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Créez un mot de passe sécurisé"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />
            <TouchableOpacity 
              style={styles.visibilityIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
            {renderHelpIcon("le mot de passe", "Doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@, $, !, %, *, ?, &).")}
          </View>
          {validationErrors.password && (
            <Text style={styles.errorText}>{validationErrors.password}</Text>
          )}
          
          {/* Password Strength Indicator */}
          {formData.password ? (
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.strengthIndicators}>
                <View style={[
                  styles.strengthBar, 
                  formData.password.length >= 8 ? styles.strengthMet : styles.strengthNotMet
                ]} />
                <View style={[
                  styles.strengthBar, 
                  /[A-Z]/.test(formData.password) ? styles.strengthMet : styles.strengthNotMet
                ]} />
                <View style={[
                  styles.strengthBar, 
                  /[a-z]/.test(formData.password) ? styles.strengthMet : styles.strengthNotMet
                ]} />
                <View style={[
                  styles.strengthBar, 
                  /\d/.test(formData.password) ? styles.strengthMet : styles.strengthNotMet
                ]} />
                <View style={[
                  styles.strengthBar, 
                  /[@$!%*?&]/.test(formData.password) ? styles.strengthMet : styles.strengthNotMet
                ]} />
              </View>
              <View style={styles.strengthLabels}>
                <Text style={styles.strengthLabel}>8+ caractères</Text>
                <Text style={styles.strengthLabel}>Majuscule</Text>
                <Text style={styles.strengthLabel}>Minuscule</Text>
                <Text style={styles.strengthLabel}>Chiffre</Text>
                <Text style={styles.strengthLabel}>Spécial</Text>
              </View>
            </View>
          ) : null}
        </View>
        
        {/* Confirm Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmer le mot de passe *</Text>
          <View style={[styles.inputContainer, validationErrors.confirmPassword ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmez votre mot de passe"
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
            />
            <TouchableOpacity 
              style={styles.visibilityIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {validationErrors.confirmPassword && (
            <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
          )}
        </View>
        
        {/* Message d'avertissement hors ligne */}
        {!isOnline && (
          <View style={styles.offlineWarning}>
            <Ionicons name="wifi-off" size={20} color="#fff" />
            <Text style={styles.offlineWarningText}>
              Mode hors ligne. L'inscription nécessite une connexion Internet.
            </Text>
          </View>
        )}
        
        {/* Afficher l'erreur globale */}
        {error && <Text style={styles.globalError}>{error}</Text>}
        
        {/* Register Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={isLoading || !isOnline}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>
        
        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Déjà un compte?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
        
        {/* Notes légales */}
        <Text style={styles.legalText}>
          En vous inscrivant, vous acceptez nos <Text style={styles.legalLink}>Conditions d'utilisation</Text> et notre <Text style={styles.legalLink}>Politique de confidentialité</Text>.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  visibilityIcon: {
    padding: 5,
  },
  helpIcon: {
    padding: 5,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  globalError: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
  },
  offlineWarning: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  offlineWarningText: {
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  button: {
    backgroundColor: '#7CA7D8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#7CA7D8',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  legalText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 18,
  },
  legalLink: {
    color: '#7CA7D8',
    textDecorationLine: 'underline',
  },
  passwordStrengthContainer: {
    marginTop: 10,
  },
  strengthIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  strengthMet: {
    backgroundColor: '#4CAF50', // Vert
  },
  strengthNotMet: {
    backgroundColor: '#E0E0E0', // Gris
  },
  strengthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    fontSize: 9,
    color: '#999',
    flex: 1,
    textAlign: 'center',
  },
});

export default RegisterForm;