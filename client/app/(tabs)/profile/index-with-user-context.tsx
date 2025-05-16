// client/app/(tabs)/profile/index-with-user-context.tsx
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { logger } from '../../utils/logger';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../context/UserContext'; // Utiliser notre nouveau contexte
import { useAuth } from '../../context/AuthContext'; // Pour la déconnexion

/**
 * Écran du profil utilisateur avec UserContext
 * Utilise les données centralisées et les fonctions de mise à jour du contexte
 */
export default function ProfileScreen() {
  const { userData, isLoading: isUserLoading, refreshUserData, updateUserAvatar } = useUser();
  const { logout, isLoading: isAuthLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  // État pour gérer quelle vue est affichée
  const [activeScreen, setActiveScreen] = useState('main'); // 'main', 'edit', 'changePassword', 'sessions', 'deleteAccount'
  
  // Rafraîchir les données utilisateur au chargement
  useEffect(() => {
    handleRefresh();
  }, []);

  /**
   * Rafraîchit les données utilisateur
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      logger.info('Refreshing user data in profile page');
      
      // Utiliser la fonction centralisée pour rafraîchir les données
      await refreshUserData();
      logger.info('User data refreshed successfully');
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
   * Utilise la fonction centralisée pour mettre à jour l'avatar
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
        // Utiliser la fonction centralisée pour mettre à jour l'avatar
        await updateUserAvatar(result.assets[0].uri);
        Alert.alert('Succès', 'Votre photo de profil a été mise à jour avec succès.');
      }
    } catch (error) {
      logger.error('Erreur lors de la sélection d\'image', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo de profil. Veuillez réessayer.');
    }
  };

  // Afficher un indicateur de chargement pendant le chargement initial
  if ((isUserLoading || isAuthLoading) && activeScreen === 'main' && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Chargement du profil...</Text>
      </View>
    );
  }
  
  // Écran quand l'utilisateur n'est pas chargé
  if (!userData && activeScreen === 'main') {
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
          onPress={handleLogout}
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
            onPress={handleImagePick}
          >
            {userData?.profilePicture ? (
              <Image source={{ uri: userData.profilePicture }} style={styles.profileImage} />
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
              {userData?.displayName || 'Utilisateur'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.secondaryText }]}>
              {userData?.email || 'email@exemple.com'}
            </Text>
            <View style={styles.roleContainer}>
              <Text style={[styles.roleLabel, { backgroundColor: colors.primary, color: colors.background }]}>
                {userData?.role || 'APPRENTICE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section des statistiques (nouvelles données du contexte enrichi) */}
        {userData?.stats && (
          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes statistiques</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {userData.stats.totalSessions || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Sessions</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {userData.stats.totalDistance || 0} km
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Distance</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {userData.stats.badgesCount || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Badges</Text>
              </View>
            </View>
            
            {userData.stats.competencyProgress && (
              <View style={styles.competencyProgressBar}>
                <View 
                  style={[
                    styles.competencySegment, 
                    { 
                      backgroundColor: '#4CAF50',
                      flex: userData.stats.competencyProgress.mastered || 1,
                    }
                  ]}
                />
                <View 
                  style={[
                    styles.competencySegment, 
                    { 
                      backgroundColor: '#FFC107',
                      flex: userData.stats.competencyProgress.inProgress || 1,
                    }
                  ]}
                />
                <View 
                  style={[
                    styles.competencySegment, 
                    { 
                      backgroundColor: '#E0E0E0',
                      flex: userData.stats.competencyProgress.notStarted || 1,
                    }
                  ]}
                />
              </View>
            )}
            
            <Text style={[styles.competencyLabel, { color: colors.secondaryText }]}>
              Progression des compétences
            </Text>
          </View>
        )}

        {/* Section des actions du profil */}
        <View style={[styles.actionsContainer, { backgroundColor: colors.card, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mon Compte</Text>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => router.push('/profile/edit')}
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
            onPress={() => router.push('/profile/change-password')}
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
            onPress={() => router.push('/profile/sessions')}
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
            onPress={() => router.push('/profile/delete-account')}
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

  // Le composant Principal
  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {renderMainScreen()}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
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
  
  // Profile header styles
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
  
  // Stats styles
  statsContainer: {
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  competencyProgressBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  competencySegment: {
    height: '100%',
  },
  competencyLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Actions styles
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
  
  // Danger zone styles
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
});