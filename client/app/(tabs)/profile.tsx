import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../constants/theme';
import { logger } from '../utils/logger';
import * as ImagePicker from 'expo-image-picker';

/**
 * Écran consolidé du profil utilisateur
 * Gère tous les aspects du profil en un seul composant avec état
 */
export default function ProfileScreen() {
  const { logout } = useAuth();
  const { userData: user, refreshUserData, updateUserProfile, updateUserAvatar, isLoading: userDataLoading } = useUser();
  const { colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isLoading = userDataLoading;
  
  // État pour gérer quelle vue est affichée
  const [activeScreen, setActiveScreen] = useState('main'); // 'main', 'edit', 'changePassword', 'sessions', 'deleteAccount'
  
  // États pour le formulaire d'édition
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profilePicture || null);
  
  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // États pour la suppression de compte
  const [confirmDelete, setConfirmDelete] = useState('');
  
  // Erreurs de validation
  const [errors, setErrors] = useState({});

  // Récupérer les informations utilisateur au chargement
  useEffect(() => {
    handleRefresh();
  }, []);

  useEffect(() => {
    // Mise à jour des données du formulaire quand l'utilisateur change
    if (user) {
      setDisplayName(user.displayName || '');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhoneNumber(user.phoneNumber || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
      setProfileImage(user.profilePicture || null);
    }
  }, [user]);

  /**
   * Rafraîchit les données utilisateur depuis le serveur
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      logger.info('Refreshing user data in profile page');
      
      // Debug information
      if (user) {
        logger.info('Current user before refresh:', {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName
        });
      } else {
        logger.warn('No user data available before refresh');
      }
      
      try {
        await refreshUserData();
        logger.info('User data refreshed successfully');
      } catch (refreshError) {
        // Handle different types of errors
        if (refreshError instanceof Error && 
            (refreshError.message.includes('Session expirée') || 
             refreshError.message.includes('401') ||
             refreshError.message.includes('token'))) {
          logger.warn('Auth error during refresh, handled by AuthContext', refreshError);
          return;
        }
        
        if (refreshError instanceof Error && 
            (refreshError.message.includes('saveItem') || 
             refreshError.message.includes("doesn't exist"))) {
          logger.warn('Storage error during refresh, but user data may be available', refreshError);
        } else {
          throw refreshError;
        }
      }
    } catch (error) {
      logger.error('Erreur lors du rafraîchissement du profil', error);
      Alert.alert(
        'Erreur',
        'Impossible de récupérer vos informations. Veuillez réessayer plus tard.'
      );
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Gère la déconnexion de l'utilisateur
   */
  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              logger.error('Erreur lors de la déconnexion', error);
              Alert.alert('Erreur', 'Un problème est survenu lors de la déconnexion.');
            }
          },
        },
      ]
    );
  };

  /**
   * Gère la sélection d'une image depuis la galerie
   */
  const handleImagePick = async () => {
    try {
      // Demander les permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la galerie pour changer votre photo de profil.');
        return;
      }
      
      // Lancer le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        
        // Utiliser notre nouvelle fonction updateUserAvatar du UserContext
        try {
          setIsSaving(true);
          await updateUserAvatar(result.assets[0].uri);
          logger.info('Photo de profil mise à jour avec succès via UserContext');
        } catch (updateError) {
          logger.error('Erreur lors de la mise à jour de l\'avatar via UserContext', updateError);
          // Continuer quand même car nous avons déjà mis à jour localement
          Alert.alert('Avertissement', 'Votre photo a été mise à jour localement, mais il pourrait y avoir des problèmes lors de la synchronisation avec le serveur.');
        } finally {
          setIsSaving(false);
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la sélection d\'image', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image. Veuillez réessayer.');
    }
  };

  /**
   * Valide le formulaire d'édition de profil
   */
  const validateEditForm = () => {
    const newErrors = {};
    
    if (!displayName.trim()) {
      newErrors.displayName = 'Le nom d\'utilisateur est requis';
    } else if (displayName.length < 3) {
      newErrors.displayName = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Valide le formulaire de changement de mot de passe
   */
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Soumet le formulaire pour mettre à jour le profil
   */
  const handleSubmitEdit = async () => {
    if (!validateEditForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Utiliser notre UserContext pour mettre à jour le profil
      const profileData = {
        displayName,
        firstName,
        lastName,
        phoneNumber,
        address,
        bio
      };
      
      await updateUserProfile(profileData);
      
      Alert.alert(
        'Profil mis à jour',
        'Vos informations ont été mises à jour avec succès.',
        [
          {
            text: 'OK',
            onPress: () => setActiveScreen('main'),
          },
        ]
      );
      
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil', error);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour votre profil. Veuillez réessayer plus tard.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Soumet le formulaire pour changer le mot de passe
   */
  const handleSubmitPasswordChange = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // En production, nous enverrions ces données au serveur
      // Pour l'instant, simulons une réussite
      
      setTimeout(() => {
        Alert.alert(
          'Mot de passe mis à jour',
          'Votre mot de passe a été modifié avec succès.',
          [
            {
              text: 'OK',
              onPress: () => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setActiveScreen('main');
              },
            },
          ]
        );
        setIsSaving(false);
      }, 1000);
      
    } catch (error) {
      logger.error('Erreur lors du changement de mot de passe', error);
      Alert.alert(
        'Erreur',
        'Impossible de changer votre mot de passe. Veuillez réessayer plus tard.'
      );
      setIsSaving(false);
    }
  };

  /**
   * Soumet la demande de suppression de compte
   */
  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'SUPPRIMER') {
      setErrors({
        confirmDelete: 'Veuillez taper "SUPPRIMER" pour confirmer'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // En production, nous enverrions cette demande au serveur
      // Pour l'instant, simulons une réussite
      
      setTimeout(() => {
        Alert.alert(
          'Compte supprimé',
          'Votre compte a été supprimé avec succès.',
          [
            {
              text: 'OK',
              onPress: () => logout(),
            },
          ]
        );
        setIsSaving(false);
      }, 1500);
      
    } catch (error) {
      logger.error('Erreur lors de la suppression du compte', error);
      Alert.alert(
        'Erreur',
        'Impossible de supprimer votre compte. Veuillez réessayer plus tard.'
      );
      setIsSaving(false);
    }
  };

  // Afficher un indicateur de chargement pendant le chargement initial
  if (isLoading && activeScreen === 'main') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Chargement du profil...</Text>
      </View>
    );
  }
  
  // Écran quand l'utilisateur n'est pas chargé
  if (!user && activeScreen === 'main') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error, marginBottom: 20, fontWeight: 'bold' }}>
          Utilisateur non disponible
        </Text>
        <Text style={{ marginBottom: 20, color: colors.text }}>
          Impossible de charger les données utilisateur. Veuillez vous reconnecter.
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Réessayer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.card, marginTop: 16 }]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.text} />
          <Text style={[styles.logoutButtonText, { color: colors.text }]}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // En-tête dynamique selon l'écran actif
  const renderHeader = () => {
    let title = '';
    let showBackButton = activeScreen !== 'main';
    
    switch (activeScreen) {
      case 'edit':
        title = 'Modifier mon profil';
        break;
      case 'changePassword':
        title = 'Changer de mot de passe';
        break;
      case 'sessions':
        title = 'Sessions actives';
        break;
      case 'deleteAccount':
        title = 'Supprimer mon compte';
        break;
      default:
        title = 'Mon profil';
        showBackButton = false;
    }
    
    return (
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.headerBackButton} 
            onPress={() => setActiveScreen('main')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
    );
  };

  // Écran principal du profil
  const renderMainScreen = () => {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {refreshing && (
          <View style={styles.refreshingBanner}>
            <ActivityIndicator size="small" color={colors.background} />
            <Text style={styles.refreshingText}>Actualisation...</Text>
          </View>
        )}
        
        {/* Section de l'en-tête du profil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.profileImageContainer} 
            onPress={() => setActiveScreen('edit')}
          >
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={50} color={colors.background} />
              </View>
            )}
            <View style={[styles.editIconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.displayName || 'Utilisateur'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.secondaryText }]}>
              {user?.email || 'email@exemple.com'}
            </Text>
            <View style={styles.roleContainer}>
              <Text style={[styles.roleLabel, { backgroundColor: colors.primary, color: colors.background }]}>
                {user?.role || 'APPRENTICE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section des actions du profil */}
        <View style={[styles.actionsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mon Compte</Text>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => setActiveScreen('edit')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionText, { color: colors.text }]}>Modifier mon profil</Text>
              <Text style={[styles.actionSubtext, { color: colors.secondaryText }]}>
                Nom, photo, informations personnelles
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => setActiveScreen('changePassword')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="key-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionText, { color: colors.text }]}>Changer de mot de passe</Text>
              <Text style={[styles.actionSubtext, { color: colors.secondaryText }]}>
                Sécurité du compte
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => setActiveScreen('sessions')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionText, { color: colors.text }]}>Sessions actives</Text>
              <Text style={[styles.actionSubtext, { color: colors.secondaryText }]}>
                Gérer les appareils connectés
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Section pour le support et la sécurité */}
        <View style={[styles.actionsContainer, { backgroundColor: colors.card, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support & Sécurité</Text>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => router.navigate('/PrivacyScreen')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionText, { color: colors.text }]}>Confidentialité</Text>
              <Text style={[styles.actionSubtext, { color: colors.secondaryText }]}>
                Paramètres de confidentialité
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => router.navigate('/HelpScreen')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionText, { color: colors.text }]}>Aide & Support</Text>
              <Text style={[styles.actionSubtext, { color: colors.secondaryText }]}>
                FAQ, contact assistance
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Section des actions dangereuses */}
        <View style={styles.dangerZone}>
          <TouchableOpacity 
            style={[styles.dangerButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} 
            onPress={() => setActiveScreen('deleteAccount')}
          >
            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
            <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.card }]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.text} />
            <Text style={[styles.logoutButtonText, { color: colors.text }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.secondaryText }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Écran d'édition du profil
  const renderEditScreen = () => {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.contentContainer}
      >
        {/* Photo de profil */}
        <View style={styles.imageContainer}>
          <TouchableOpacity style={styles.imageWrapper} onPress={handleImagePick}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profilePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={60} color={colors.background} />
              </View>
            )}
            <View style={[styles.cameraIconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.imageHelperText, { color: colors.secondaryText }]}>
            Touchez la photo pour la modifier
          </Text>
        </View>

        {/* Champs du formulaire */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nom d'utilisateur</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: errors.displayName ? '#ef4444' : colors.border },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nom d'utilisateur"
              placeholderTextColor={colors.secondaryText}
            />
            {errors.displayName && (
              <Text style={styles.errorText}>{errors.displayName}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Prénom</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Prénom"
                placeholderTextColor={colors.secondaryText}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nom</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Nom"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Téléphone</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Numéro de téléphone"
              placeholderTextColor={colors.secondaryText}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Adresse</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={address}
              onChangeText={setAddress}
              placeholder="Adresse postale"
              placeholderTextColor={colors.secondaryText}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>À propos de moi</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Quelques mots à propos de vous..."
              placeholderTextColor={colors.secondaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleSubmitEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.card }]} 
              onPress={() => setActiveScreen('main')}
              disabled={isSaving}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Écran de changement de mot de passe
  const renderPasswordScreen = () => {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.formContainer}>
          <View style={styles.passwordInfoBox}>
            <Text style={[styles.passwordInfoText, { color: colors.text }]}>
              Pour changer votre mot de passe, veuillez entrer votre mot de passe actuel puis votre nouveau mot de passe.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Mot de passe actuel</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: errors.currentPassword ? '#ef4444' : colors.border },
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Entrez votre mot de passe actuel"
              placeholderTextColor={colors.secondaryText}
              secureTextEntry
            />
            {errors.currentPassword && (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nouveau mot de passe</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: errors.newPassword ? '#ef4444' : colors.border },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Entrez votre nouveau mot de passe"
              placeholderTextColor={colors.secondaryText}
              secureTextEntry
            />
            {errors.newPassword && (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Confirmer le mot de passe</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: errors.confirmPassword ? '#ef4444' : colors.border },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmez votre nouveau mot de passe"
              placeholderTextColor={colors.secondaryText}
              secureTextEntry
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          <View style={styles.passwordHintContainer}>
            <Text style={[styles.passwordHintText, { color: colors.secondaryText }]}>
              • Votre mot de passe doit comporter au moins 6 caractères
            </Text>
            <Text style={[styles.passwordHintText, { color: colors.secondaryText }]}>
              • Nous vous recommandons d'utiliser des chiffres et des caractères spéciaux
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleSubmitPasswordChange}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Changer le mot de passe</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.card }]} 
              onPress={() => setActiveScreen('main')}
              disabled={isSaving}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Écran des sessions actives
  const renderSessionsScreen = () => {
    // Sessions fictives pour la démo
    const sessions = [
      { id: 1, device: 'iPhone 12', location: 'Bruxelles, BE', lastActive: '15 mai 2025', isCurrent: true },
      { id: 2, device: 'Samsung Galaxy S20', location: 'Namur, BE', lastActive: '10 mai 2025', isCurrent: false },
      { id: 3, device: 'Chrome (Windows)', location: 'Liège, BE', lastActive: '2 mai 2025', isCurrent: false },
    ];

    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.sessionsContainer}>
          <Text style={[styles.sessionsInfoText, { color: colors.text }]}>
            Voici la liste des appareils où vous êtes actuellement connecté. Vous pouvez déconnecter un appareil spécifique ou tous les appareils sauf celui-ci.
          </Text>

          {sessions.map((session) => (
            <View 
              key={session.id} 
              style={[
                styles.sessionItem, 
                { backgroundColor: colors.card },
                session.isCurrent && styles.currentSessionItem
              ]}
            >
              <View style={styles.sessionIconContainer}>
                <Ionicons 
                  name={session.device.includes('iPhone') || session.device.includes('Samsung') ? 'phone-portrait' : 'laptop'}
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionDevice, { color: colors.text }]}>
                  {session.device} {session.isCurrent && '(Cet appareil)'}
                </Text>
                <Text style={[styles.sessionLocation, { color: colors.secondaryText }]}>
                  {session.location}
                </Text>
                <Text style={[styles.sessionDate, { color: colors.secondaryText }]}>
                  Dernière activité: {session.lastActive}
                </Text>
              </View>
              {!session.isCurrent && (
                <TouchableOpacity 
                  style={[styles.sessionLogoutButton, { backgroundColor: colors.border }]}
                  onPress={() => Alert.alert('Déconnexion', `Déconnecté de ${session.device}`)}
                >
                  <Text style={[styles.sessionLogoutText, { color: colors.text }]}>Déconnecter</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.logoutAllButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
            onPress={() => Alert.alert(
              'Déconnexion de tous les appareils',
              'Êtes-vous sûr de vouloir déconnecter tous les autres appareils ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { 
                  text: 'Déconnecter', 
                  style: 'destructive',
                  onPress: () => Alert.alert('Déconnexion', 'Tous les autres appareils ont été déconnectés.')
                }
              ]
            )}
          >
            <MaterialIcons name="logout" size={18} color="#ef4444" />
            <Text style={styles.logoutAllButtonText}>Déconnecter tous les autres appareils</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // Écran de suppression de compte
  const renderDeleteAccountScreen = () => {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.deleteAccountContainer}>
          <View style={styles.warningBox}>
            <MaterialIcons name="warning" size={36} color="#ef4444" style={styles.warningIcon} />
            <Text style={styles.warningTitle}>Attention: Action irréversible</Text>
            <Text style={[styles.warningText, { color: colors.text }]}>
              Vous êtes sur le point de supprimer définitivement votre compte. Cette action ne peut pas être annulée et entraînera la perte de toutes vos données, y compris:
            </Text>
            <View style={styles.bulletPointList}>
              <Text style={[styles.bulletPoint, { color: colors.text }]}>• Tous vos trajets enregistrés</Text>
              <Text style={[styles.bulletPoint, { color: colors.text }]}>• Votre historique d'apprentissage</Text>
              <Text style={[styles.bulletPoint, { color: colors.text }]}>• Vos statistiques et performances</Text>
              <Text style={[styles.bulletPoint, { color: colors.text }]}>• Votre profil et informations personnelles</Text>
            </View>
          </View>

          <View style={styles.confirmDeleteContainer}>
            <Text style={[styles.confirmDeleteText, { color: colors.text }]}>
              Pour confirmer la suppression, veuillez taper "SUPPRIMER" ci-dessous:
            </Text>
            <TextInput
              style={[
                styles.confirmDeleteInput,
                { 
                  backgroundColor: colors.card, 
                  color: colors.text, 
                  borderColor: errors.confirmDelete ? '#ef4444' : colors.border 
                },
              ]}
              value={confirmDelete}
              onChangeText={setConfirmDelete}
              placeholder="Tapez SUPPRIMER"
              placeholderTextColor={colors.secondaryText}
            />
            {errors.confirmDelete && (
              <Text style={styles.errorText}>{errors.confirmDelete}</Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.deleteConfirmButton} 
              onPress={handleDeleteAccount}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.deleteConfirmButtonText}>Supprimer définitivement mon compte</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.card, marginTop: 12 }]} 
              onPress={() => setActiveScreen('main')}
              disabled={isSaving}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Afficher l'écran actif
  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      {activeScreen === 'main' && renderMainScreen()}
      {activeScreen === 'edit' && renderEditScreen()}
      {activeScreen === 'changePassword' && renderPasswordScreen()}
      {activeScreen === 'sessions' && renderSessionsScreen()}
      {activeScreen === 'deleteAccount' && renderDeleteAccountScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshingBanner: {
    backgroundColor: '#3498db',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshingText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  headerBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  
  // Main profile styles
  profileHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 6,
  },
  roleContainer: {
    flexDirection: 'row',
  },
  roleLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  actionsContainer: {
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  actionIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  dangerZone: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 12,
  },
  
  // Edit profile styles
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  imageWrapper: {
    position: 'relative',
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  imageHelperText: {
    marginTop: 8,
    fontSize: 13,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
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
  
  // Password change styles
  passwordInfoBox: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  passwordInfoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  passwordHintContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  passwordHintText: {
    fontSize: 13,
    marginBottom: 4,
  },
  
  // Sessions styles
  sessionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sessionsInfoText: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
  currentSessionItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  sessionIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 8,
  },
  sessionDevice: {
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 2,
  },
  sessionLocation: {
    fontSize: 13,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 12,
  },
  sessionLogoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sessionLogoutText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutAllButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Delete account styles
  deleteAccountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  warningIcon: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  bulletPointList: {
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
  },
  confirmDeleteContainer: {
    marginBottom: 24,
  },
  confirmDeleteText: {
    fontSize: 14,
    marginBottom: 12,
  },
  confirmDeleteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});