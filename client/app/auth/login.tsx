// client/app/auth/login.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

export default function LoginScreen() {
  // Utiliser notre hook personnalisé pour accéder au contexte d'authentification
  const { login, isLoading, error, clearError } = useAuth();

  // État local pour les champs du formulaire - pré-rempli avec notre test DB user
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Password123!');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  // Effet pour réinitialiser les erreurs quand les champs changent
  useEffect(() => {
    if (email || password) {
      clearError();
      setValidationErrors({});
    }
  }, [email, password]);

  // Fonction pour valider le formulaire avant soumission
  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fonction pour gérer la soumission du formulaire
  const handleLogin = async () => {
    // Valider le formulaire d'abord
    if (!validateForm()) return;

    try {
      console.log('⭐ LOGIN FORM SUBMIT - Values:', { email, password: '***HIDDEN***' });

      // Ensure we have valid form data before submitting
      if (!email.trim() || !password.trim()) {
        console.error('Form validation passed but values are empty!');
        setValidationErrors({
          email: !email.trim() ? 'Email cannot be empty' : undefined,
          password: !password.trim() ? 'Password cannot be empty' : undefined,
        });
        return;
      }

      // Construct credentials object explicitly
      const credentials = {
        email: email.trim(),
        password: password.trim(),
      };

      // Call login function from AuthContext
      await login(credentials);

      // Redirection is handled in the login function in AuthContext
    } catch (err) {
      // Errors are already handled by the context
      console.error('Extra login error handling:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Connexion</Text>

          {/* Afficher l'erreur globale du contexte s'il y en a une */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Champ email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, validationErrors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="Entrez votre email"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            {validationErrors.email && (
              <Text style={styles.errorText}>{validationErrors.email}</Text>
            )}
          </View>

          {/* Champ mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={[styles.input, validationErrors.password && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              placeholder="Entrez votre mot de passe"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            {validationErrors.password && (
              <Text style={styles.errorText}>{validationErrors.password}</Text>
            )}
          </View>

          {/* Bouton de connexion */}
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Information sur le compte de démonstration */}
          <View style={styles.demoInfoContainer}>
            <Text style={styles.demoInfoText}>
              <Text style={{ fontWeight: 'bold' }}>UTILISATEUR DB: </Text>
              test@example.com / Password123!
            </Text>
            <Text style={styles.demoInfoText}>
              ✅ Ce compte est enregistré dans la base de données PostgreSQL, pas un mock!
            </Text>
          </View>

          {/* Lien vers l'inscription */}
          <View style={styles.linkContainer}>
            <Text>Vous n'avez pas de compte ? </Text>
            <Link href="/auth/register">
              <Text style={styles.link}>Créer un compte</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#111827',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 4,
    fontSize: 14,
  },
  demoInfoContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  demoInfoText: {
    color: '#0369a1',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    color: '#3b82f6',
    fontWeight: '500',
  },
});
