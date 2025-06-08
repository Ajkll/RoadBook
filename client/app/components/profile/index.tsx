import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/auth.types';
import { 
  Notification, 
  NotificationPreferences,
  UserBadge, 
  BadgeProgressInfo,
  PrivacySettings 
} from '../../services/api';

// Import des composants de profil
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileInformation from './ProfileInformation';
import SecuritySection from './SecuritySection';
import NotificationsSection from './NotificationsSection';
import PrivacySection from './PrivacySection';
import BadgesSection from './BadgesSection';
import ConfirmModal from './ConfirmModal';
import Loading from './Loading';
import LoadingError from './LoadingError';
import LoadingOverlay from './LoadingOverlay';

// Interface pour les props du composant principal ProfileScreen
interface ProfileScreenProps {
  // Données d'état
  user: User | null;
  loading: boolean;
  sectionLoading: Record<string, boolean>;
  loadingError: string;
  currentSection: string;
  editing: boolean;
  editedUser: Partial<User>;
  privacySettings: PrivacySettings;
  notificationPrefs: NotificationPreferences;
  notifications: Notification[];
  sessions: any[];
  badges: UserBadge[];
  badgeProgress: BadgeProgressInfo[];
  uploadingPicture?: boolean;
  
  // État des modaux
  showConfirmModal: boolean;
  modalAction: string;
  modalMessage: string;
  deleteConfirmText: string;
  
  // Setters d'état
  setCurrentSection: (section: string) => void;
  setEditing: (editing: boolean) => void;
  setEditedUser: (user: Partial<User>) => void;
  setShowConfirmModal: (show: boolean) => void;
  setModalAction: (action: string) => void;
  setModalMessage: (message: string) => void;
  setDeleteConfirmText: (text: string) => void;
  setNotifications: (notifications: Notification[]) => void;
  
  // Formatters et helpers
  formatDate: (dateString: string) => string;
  
  // Handlers pour les opérations utilisateur
  handleSaveProfile: () => Promise<void>;
  handleLogout: () => void;
  handleDeleteAccount: () => void;
  handleLogoutSession: (sessionId: string) => Promise<void>;
  handleLogoutAllSessions: () => Promise<void>;
  handleTogglePrivacy: (setting: keyof PrivacySettings) => void;
  handleSavePrivacySettings: () => Promise<void>;
  handleUpdateNotificationPreferences: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
  handleConfirmAction: () => Promise<void>;
  handleRequestDataExport: () => void;
  handleDeactivateAccount: () => void;
  handleChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  handleForgotPassword?: (email: string) => Promise<void>;
  handleMarkAllNotificationsAsRead: () => Promise<void>;
  updateProfilePicture?: (uri: string) => Promise<void>;
  
  // Autres fonctions
  onRetryLoading: () => void;
}

export default function ProfileScreen({
  user,
  loading,
  sectionLoading,
  loadingError,
  currentSection,
  setCurrentSection,
  editing,
  setEditing,
  editedUser,
  setEditedUser,
  privacySettings,
  notifications,
  sessions,
  badges,
  uploadingPicture,
  showConfirmModal,
  setShowConfirmModal,
  modalAction,
  setModalAction,
  modalMessage,
  setModalMessage,
  deleteConfirmText,
  setDeleteConfirmText,
  formatDate,
  handleSaveProfile,
  handleLogout,
  handleDeleteAccount,
  handleLogoutSession,
  handleLogoutAllSessions,
  handleTogglePrivacy,
  handleSavePrivacySettings,
  handleRequestDataExport,
  handleConfirmAction,
  handleChangePassword,
  handleForgotPassword,
  setNotifications,
  updateProfilePicture,
  onRetryLoading
}: ProfileScreenProps) {
  const { colors, dark } = useTheme();
  
  // Afficher un indicateur de chargement pendant le chargement initial
  if (loading && !user) {
    return <Loading />;
  }
  
  // Afficher un message d'erreur si le chargement a échoué
  if (loadingError && !user) {
    return <LoadingError errorMessage={loadingError} onRetry={onRetryLoading} />;
  }
  
  // Utilisateur non chargé mais pas d'erreur (cas rare)
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Données utilisateur non disponibles</Text>
      </View>
    );
  }
  
  // Rendu du contenu en fonction de la section active
  const renderContent = () => {
    switch(currentSection) {
      case 'profile':
        return (
          <ProfileInformation
            user={user}
            editing={editing}
            editedUser={editedUser}
            setEditedUser={setEditedUser}
            setEditing={setEditing}
            handleSaveProfile={handleSaveProfile}
            formatDate={formatDate}
          />
        );
      case 'security':
        return (
          <SecuritySection
            sessions={sessions}
            handleLogoutSession={handleLogoutSession}
            handleLogoutAllSessions={handleLogoutAllSessions}
            handleDeleteAccount={handleDeleteAccount}
            handleChangePassword={handleChangePassword}
            handleForgotPassword={handleForgotPassword}
            formatDate={formatDate}
            sectionLoading={sectionLoading?.security}
          />
        );
      case 'notifications':
        return (
          <NotificationsSection
            notifications={notifications}
            setNotifications={setNotifications}
            formatDate={formatDate}
          />
        );
      case 'privacy':
        return (
          <PrivacySection
            privacySettings={privacySettings}
            handleTogglePrivacy={handleTogglePrivacy}
            handleSavePrivacySettings={handleSavePrivacySettings}
            handleRequestDataExport={handleRequestDataExport}
            sectionLoading={sectionLoading?.privacy}
          />
        );
      case 'badges':
        return (
          <BadgesSection
            badges={badges}
            formatDate={formatDate}
          />
        );
      default:
        return (
          <ProfileInformation
            user={user}
            editing={editing}
            editedUser={editedUser}
            setEditedUser={setEditedUser}
            setEditing={setEditing}
            handleSaveProfile={handleSaveProfile}
            formatDate={formatDate}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header avec photo de profil */}
      <ProfileHeader 
        user={user} 
        updateProfilePicture={updateProfilePicture} 
      />

      {/* Navigation entre sections */}
      <ProfileTabs 
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        notifications={notifications}
        badges={badges}
      />

      {/* Contenu principal */}
      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Bouton de déconnexion */}
      {!editing && (
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.danger }]} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal de confirmation */}
      <ConfirmModal
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        modalAction={modalAction}
        modalMessage={modalMessage}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        handleConfirmAction={handleConfirmAction}
      />

      {/* Indicateur de chargement */}
      <LoadingOverlay loading={loading} />
    </View>
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
  },
  content: {
    flex: 1,
    padding: 15,
  },
  logoutButton: {
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
});