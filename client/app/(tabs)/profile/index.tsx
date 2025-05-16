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
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../constants/theme';
import { logger } from '../../utils/logger';

/**
 * Écran principal du profil utilisateur
 * Affiche les informations de l'utilisateur et donne accès aux autres pages de gestion du compte
 */
export default function ProfileScreen() {
  const { logout } = useAuth();
  const { userData, refreshUserData, isLoading } = useUser();
  const { colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Récupérer les informations utilisateur au chargement
  useEffect(() => {
    handleRefresh();
  }, []);

  /**
   * Rafraîchit les données utilisateur depuis le serveur
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      logger.info('Refreshing user data in profile page');
      
      // Add more debug information
      if (userData) {
        logger.info('Current user before refresh:', {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          displayName: userData.displayName
        });
      } else {
        logger.warn('No user data available before refresh');
      }
      
      try {
        await refreshUserData();
        logger.info('User data refreshed successfully');
      } catch (refreshError) {
        // Handle different types of errors
        
        // 1. Handle token/auth errors - handled by AuthContext which will auto-logout
        if (refreshError instanceof Error && 
            (refreshError.message.includes('Session expirée') || 
             refreshError.message.includes('401') ||
             refreshError.message.includes('token'))) {
          logger.warn('Auth error during refresh, handled by AuthContext', refreshError);
          // No need to show an alert - auth context will handle this and redirect to login
          return;
        }
        
        // 2. Handle storage errors during refresh specifically
        if (refreshError instanceof Error && 
            (refreshError.message.includes('saveItem') || 
             refreshError.message.includes("doesn't exist"))) {
          logger.warn('Storage error during refresh, but user data may be available', refreshError);
          // Continue anyway - the UI can still display the user data that was returned
        } else {
          // Re-throw other errors to be handled by the outer catch
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

  // Afficher un indicateur de chargement pendant le chargement initial
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Chargement du profil...</Text>
      </View>
    );
  }
  
  // Vérifier si l'utilisateur est bien chargé
  if (!userData) {
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

  useEffect(() => {
    // Add debug info on component mount
    logger.info(`ProfileScreen mounted - pathname: /profile/index`);
    return () => {
      logger.info('ProfileScreen unmounted');
    };
  }, []);

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
          onPress={() => router.push('/(tabs)/profile/edit')}
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

      {/* Section des actions du profil */}
      <View style={[styles.actionsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mon Compte</Text>

        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={() => router.push('/(tabs)/profile/edit')}
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
          onPress={() => router.push('/(tabs)/profile/change-password')}
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
          onPress={() => router.push('/(tabs)/profile/sessions')}
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
          onPress={() => router.push('/PrivacyScreen')}
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
          onPress={() => router.push('/HelpScreen')}
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
          onPress={() => router.push('/(tabs)/profile/delete-account')}
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
}

const styles = StyleSheet.create({
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
});