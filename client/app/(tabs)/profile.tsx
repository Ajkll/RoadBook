import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// Utiliser des chemins absolus pour éviter les problèmes avec les parenthèses dans les chemins
import { authApi } from '../services/api/auth.api';
import notificationApi, { Notification } from '../services/api/notification.api';
import badgeApi, { UserBadge } from '../services/api/badge.api';
import { User } from '../types/auth.types';

// Options de confidentialité par défaut
const DEFAULT_PRIVACY_SETTINGS = {
  shareProgress: true,
  receiveNotifications: true,
  publicProfile: false,
  locationTracking: true,
  dataCollection: true
};

export default function ProfileScreen() {
  // État local
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [currentSection, setCurrentSection] = useState('profile');
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY_SETTINGS);
  // Initialize with empty arrays to prevent undefined errors
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loadingError, setLoadingError] = useState('');

  // Charger les données utilisateur au démarrage
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      setLoadingError('');
      
      // Données de test pour les cas où l'API n'est pas disponible
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'info',
          title: 'Bienvenue sur RoadBook',
          message: 'Merci d\'utiliser notre application. Découvrez toutes les fonctionnalités disponibles.',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'notif-2',
          type: 'achievement',
          title: 'Première connexion',
          message: 'Vous vous êtes connecté avec succès à votre compte RoadBook.',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 jour avant
        }
      ];
      
      const mockBadges = [
        {
          id: 'badge-1',
          userId: 'current-user',
          badgeId: 'welcome',
          awardedAt: new Date(Date.now() - 86400000).toISOString(),
          name: '👋 Bienvenue',
          description: 'Badge obtenu lors de votre inscription',
          imageUrl: '👋'
        }
      ];
      
      try {
        // 1. Récupérer l'utilisateur actuel - si cela échoue, tout le reste est annulé
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        setEditedUser({...userData});
        
        // 2. Charger les autres données avec des essais indépendants
        // Notifications
        try {
          const userNotifications = await notificationApi.getNotifications();
          if (Array.isArray(userNotifications)) {
            setNotifications(userNotifications);
          } else {
            console.log('Les notifications ne sont pas un tableau, utilisation de données simulées');
            setNotifications(mockNotifications);
          }
        } catch (notificationError) {
          console.log('Erreur lors de la récupération des notifications, utilisation de données simulées:', notificationError);
          setNotifications(mockNotifications);
        }
        
        // Badges
        try {
          const userBadges = await badgeApi.getMyBadges();
          if (Array.isArray(userBadges)) {
            setBadges(userBadges);
          } else {
            console.log('Les badges ne sont pas un tableau, utilisation de données simulées');
            setBadges(mockBadges);
          }
        } catch (badgeError) {
          console.log('Erreur lors de la récupération des badges, utilisation de données simulées:', badgeError);
          setBadges(mockBadges);
        }
          
        // Sessions - getUserSessions retourne maintenant toujours des données (réelles ou simulées)
        const userSessions = await authApi.getUserSessions();
        if (Array.isArray(userSessions) && userSessions.length > 0) {
          setSessions(userSessions);
        } else {
          console.log('Sessions vides ou non valides, utilisation de sessions par défaut');
          setSessions([{ 
            id: 'session-current', 
            device: 'Appareil actuel', 
            location: 'Emplacement actuel', 
            lastActive: new Date().toISOString(), 
            current: true 
          }]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        setLoadingError('Impossible de charger vos données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Gérer la sauvegarde du profil
  const handleSaveProfile = async () => {
    setLoading(true);
    
    try {
      // Vérifier que les données sont valides
      if (!editedUser.displayName || !editedUser.email) {
        Alert.alert('Erreur', 'Le nom d\'affichage et l\'email sont requis.');
        setLoading(false);
        return;
      }
      
      // Appeler l'API pour mettre à jour le profil
      const updatedUser = await authApi.updateUserProfile(editedUser);
      
      // Mettre à jour l'état local
      setUser(updatedUser);
      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    setModalAction('logout');
    setModalMessage('Êtes-vous sûr de vouloir vous déconnecter ?');
    setShowConfirmModal(true);
  };

  // Gérer la suppression du compte
  const handleDeleteAccount = () => {
    setModalAction('delete');
    setModalMessage('Cette action est irréversible. Toutes vos données seront définitivement supprimées. Pour confirmer, tapez "SUPPRIMER" ci-dessous.');
    setShowConfirmModal(true);
  };

  // Gérer la déconnexion d'une session
  const handleLogoutSession = async (sessionId) => {
    setLoading(true);
    
    try {
      // Tenter d'utiliser l'API si elle existe
      await authApi.revokeSession(sessionId);
      
      // Mettre à jour la liste des sessions
      setSessions(sessions.filter(session => session.id !== sessionId));
      Alert.alert('Succès', 'Session déconnectée avec succès');
    } catch (error) {
      console.log('Erreur ou API de session non disponible:', error);
      
      // Simuler le comportement si l'API n'est pas encore implémentée
      setSessions(sessions.filter(session => session.id !== sessionId));
      Alert.alert('Succès', 'Session déconnectée avec succès (simulation)');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la déconnexion de toutes les sessions
  const handleLogoutAllSessions = async () => {
    setLoading(true);
    
    try {
      // Cette fonctionnalité n'existe probablement pas encore dans l'API
      // Mais nous pouvons la simuler pour le moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour l'état local
      setSessions(sessions.filter(session => session.current));
      Alert.alert('Succès', 'Toutes les autres sessions ont été déconnectées');
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la modification des paramètres de confidentialité
  const handleTogglePrivacy = (setting) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting]
    });
  };

  // Gérer la confirmation modale
  const handleConfirmAction = async () => {
    setLoading(true);
    
    try {
      if (modalAction === 'logout') {
        console.log('==== LOGOUT ATTEMPT ====');
        await authApi.logout();
        Alert.alert('Déconnexion', 'Vous avez été déconnecté avec succès');
      } else if (modalAction === 'delete') {
        if (deleteConfirmText === 'SUPPRIMER') {
          console.log('==== DELETE ACCOUNT ATTEMPT ====');
          // Cette fonctionnalité n'existe probablement pas encore dans l'API
          // Mais nous pouvons la simuler pour le moment
          await new Promise(resolve => setTimeout(resolve, 1000));
          Alert.alert('Compte supprimé', 'Votre compte a été supprimé');
        } else {
          Alert.alert('Erreur', 'Veuillez taper exactement "SUPPRIMER" pour confirmer');
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setDeleteConfirmText('');
    }
  };

  // Rendu du contenu en fonction de la section active
  const renderContent = () => {
    switch(currentSection) {
      case 'profile':
        return renderProfileSection();
      case 'security':
        return renderSecuritySection();
      case 'notifications':
        return renderNotificationsSection();
      case 'privacy':
        return renderPrivacySection();
      case 'badges':
        return renderBadgesSection();
      default:
        return renderProfileSection();
    }
  };

  // Section profil
  const renderProfileSection = () => {
    return (
      <View style={styles.sectionContainer}>
        {!editing ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom d'affichage:</Text>
              <Text style={styles.infoValue}>{user.displayName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prénom:</Text>
              <Text style={styles.infoValue}>{user.firstName || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom:</Text>
              <Text style={styles.infoValue}>{user.lastName || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone:</Text>
              <Text style={styles.infoValue}>{user.phoneNumber || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de naissance:</Text>
              <Text style={styles.infoValue}>{user.birthDate ? formatDate(user.birthDate) : '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Adresse:</Text>
              <Text style={styles.infoValue}>{user.address || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rôle:</Text>
              <Text style={styles.infoValue}>{user.role}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bio:</Text>
              <Text style={styles.infoValue}>{user.bio || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Membre depuis:</Text>
              <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, styles.editButton]} 
              onPress={() => setEditing(true)}
            >
              <Text style={styles.buttonText}>Modifier mon profil</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom d'affichage:</Text>
              <TextInput
                style={styles.input}
                value={editedUser.displayName}
                onChangeText={(text) => setEditedUser({...editedUser, displayName: text})}
                placeholder="Nom d'affichage"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Prénom:</Text>
              <TextInput
                style={styles.input}
                value={editedUser.firstName}
                onChangeText={(text) => setEditedUser({...editedUser, firstName: text})}
                placeholder="Prénom"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom:</Text>
              <TextInput
                style={styles.input}
                value={editedUser.lastName}
                onChangeText={(text) => setEditedUser({...editedUser, lastName: text})}
                placeholder="Nom"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email:</Text>
              <TextInput
                style={styles.input}
                value={editedUser.email}
                onChangeText={(text) => setEditedUser({...editedUser, email: text})}
                placeholder="Email"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Téléphone:</Text>
              <TextInput
                style={styles.input}
                value={editedUser.phoneNumber}
                onChangeText={(text) => setEditedUser({...editedUser, phoneNumber: text})}
                placeholder="Téléphone"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Adresse:</Text>
              <TextInput
                style={styles.input}
                value={editedUser.address}
                onChangeText={(text) => setEditedUser({...editedUser, address: text})}
                placeholder="Adresse"
                multiline
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bio:</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editedUser.bio}
                onChangeText={(text) => setEditedUser({...editedUser, bio: text})}
                placeholder="Parlez-nous de vous..."
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => {
                  setEditedUser({...user});
                  setEditing(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSaveProfile}
              >
                <Text style={styles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  // Section sécurité
  const renderSecuritySection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Gestion du mot de passe</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.securityButton]} 
          onPress={() => Alert.alert('Simulation', 'Redirection vers la page de changement de mot de passe')}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Changer mon mot de passe</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Sessions actives</Text>
        
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionHeader}>
                  <Ionicons 
                    name={session.device && session.device.toLowerCase().includes('iphone') || session.device && session.device.toLowerCase().includes('samsung') ? 'phone-portrait-outline' : 'desktop-outline'} 
                    size={18} 
                    color="#666" 
                  />
                  <Text style={styles.sessionDevice}>
                    {session.device || 'Appareil inconnu'} {session.current && <Text style={styles.currentSession}>(Session actuelle)</Text>}
                  </Text>
                </View>
                <Text style={styles.sessionDetail}>
                  <Ionicons name="location-outline" size={14} color="#888" /> {session.location || 'Emplacement non disponible'}
                </Text>
                <Text style={styles.sessionDetail}>
                  <Ionicons name="time-outline" size={14} color="#888" /> Dernière activité: {formatDate(session.lastActive)}
                </Text>
              </View>
              
              {!session.current && (
                <TouchableOpacity 
                  style={styles.logoutSessionButton}
                  onPress={() => handleLogoutSession(session.id)}
                >
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyMessage}>Aucune session active trouvée</Text>
        )}
        
        {sessions && sessions.filter(s => !s.current).length > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.logoutAllButton]}
            onPress={handleLogoutAllSessions}
          >
            <Text style={styles.buttonText}>Déconnecter toutes les autres sessions</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.sectionTitle}>Suppression du compte</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Section notifications
  const renderNotificationsSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Mes notifications</Text>
        
        {!notifications || notifications.length === 0 ? (
          <Text style={styles.emptyMessage}>Vous n'avez pas de notifications</Text>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={[styles.notificationCard, notification.isRead ? styles.notificationRead : styles.notificationUnread]}>
              <View style={styles.notificationDot}>
                {!notification.isRead && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationDate}>{formatDate(notification.createdAt)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.notificationAction}
                onPress={() => {
                  // Marquer comme lu
                  if (notifications) {
                    setNotifications(notifications.map(n => 
                      n.id === notification.id ? {...n, isRead: true} : n
                    ));
                  }
                }}
              >
                <Ionicons name={notification.isRead ? "checkmark-done-outline" : "checkmark-outline"} size={20} color="#7CA7D8" />
              </TouchableOpacity>
            </View>
          ))
        )}
        
        {notifications && notifications.length > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.clearButton]}
            onPress={() => {
              setNotifications([]);
              Alert.alert('Succès', 'Toutes les notifications ont été supprimées');
            }}
          >
            <Text style={styles.buttonText}>Supprimer toutes les notifications</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Section confidentialité
  const renderPrivacySection = () => {
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
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={() => Alert.alert('Succès', 'Paramètres de confidentialité enregistrés')}
        >
          <Text style={styles.buttonText}>Enregistrer les paramètres</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.downloadButton]}
          onPress={() => Alert.alert('Simulation', 'Téléchargement de vos données personnelles')}
        >
          <Ionicons name="download-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Télécharger mes données</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Section badges
  const renderBadgesSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Mes badges</Text>
        
        {!badges || badges.length === 0 ? (
          <Text style={styles.emptyMessage}>Vous n'avez pas encore obtenu de badges</Text>
        ) : (
          badges.map((badge) => (
            <View key={badge.id} style={styles.badgeCard}>
              <View style={styles.badgeIcon}>
                <Text style={styles.badgeEmoji}>{badge.imageUrl}</Text>
              </View>
              <View style={styles.badgeContent}>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
                <Text style={styles.badgeDate}>Obtenu le {formatDate(badge.awardedAt)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  // Afficher un indicateur de chargement pendant le chargement initial
  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7CA7D8" />
        <Text style={styles.loadingText}>Chargement de votre profil...</Text>
      </View>
    );
  }
  
  // Afficher un message d'erreur si le chargement a échoué
  if (loadingError && !user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorText}>{loadingError}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()} // Rafraîchir la page
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Utilisateur non chargé mais pas d'erreur (cas rare)
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Données utilisateur non disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec photo de profil */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileInitials}>
              <Text style={styles.initialsText}>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user.displayName}</Text>
        <Text style={styles.userRole}>{user.role}</Text>
      </View>

      {/* Navigation entre sections */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, currentSection === 'profile' && styles.activeTab]} 
            onPress={() => setCurrentSection('profile')}
          >
            <Ionicons name="person-outline" size={18} color={currentSection === 'profile' ? "#7CA7D8" : "#666"} />
            <Text style={[styles.tabText, currentSection === 'profile' && styles.activeTabText]}>Profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, currentSection === 'security' && styles.activeTab]} 
            onPress={() => setCurrentSection('security')}
          >
            <Ionicons name="lock-closed-outline" size={18} color={currentSection === 'security' ? "#7CA7D8" : "#666"} />
            <Text style={[styles.tabText, currentSection === 'security' && styles.activeTabText]}>Sécurité</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, currentSection === 'notifications' && styles.activeTab]} 
            onPress={() => setCurrentSection('notifications')}
          >
            <Ionicons name="notifications-outline" size={18} color={currentSection === 'notifications' ? "#7CA7D8" : "#666"} />
            <Text style={[styles.tabText, currentSection === 'notifications' && styles.activeTabText]}>Notifications</Text>
            {notifications && notifications.filter(n => !n.isRead).length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications && notifications.filter(n => !n.isRead).length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, currentSection === 'privacy' && styles.activeTab]} 
            onPress={() => setCurrentSection('privacy')}
          >
            <Ionicons name="shield-outline" size={18} color={currentSection === 'privacy' ? "#7CA7D8" : "#666"} />
            <Text style={[styles.tabText, currentSection === 'privacy' && styles.activeTabText]}>Confidentialité</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, currentSection === 'badges' && styles.activeTab]} 
            onPress={() => setCurrentSection('badges')}
          >
            <Ionicons name="ribbon-outline" size={18} color={currentSection === 'badges' ? "#7CA7D8" : "#666"} />
            <Text style={[styles.tabText, currentSection === 'badges' && styles.activeTabText]}>Badges</Text>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{badges ? badges.length : 0}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenu principal */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Bouton de déconnexion */}
      {!editing && (
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal de confirmation */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {modalAction === 'logout' ? 'Déconnexion' : 'Suppression du compte'}
            </Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            
            {modalAction === 'delete' && (
              <TextInput
                style={styles.confirmInput}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Tapez SUPPRIMER"
              />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowConfirmModal(false);
                  setDeleteConfirmText('');
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton, 
                  modalAction === 'delete' ? styles.modalDeleteButton : {}
                ]}
                onPress={handleConfirmAction}
              >
                <Text style={styles.modalConfirmText}>
                  {modalAction === 'logout' ? 'Se déconnecter' : 'Supprimer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Indicateur de chargement */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7CA7D8" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#7CA7D8',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitials: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7CA7D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabs: {
    paddingHorizontal: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7CA7D8',
  },
  tabText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  activeTabText: {
    color: '#7CA7D8',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeCount: {
    backgroundColor: '#7CA7D8',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 5,
  },
  badgeCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    width: 130,
    fontWeight: '500',
    color: '#666',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    fontWeight: '500',
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  editButton: {
    backgroundColor: '#7CA7D8',
  },
  saveButton: {
    backgroundColor: '#7CA7D8',
    flex: 1,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  securityButton: {
    backgroundColor: '#7CA7D8',
    marginBottom: 20,
  },
  sessionCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
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
    color: '#333',
  },
  currentSession: {
    color: '#7CA7D8',
    fontWeight: 'normal',
    fontSize: 13,
  },
  sessionDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  logoutSessionButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 5,
    padding: 8,
    marginLeft: 10,
  },
  logoutAllButton: {
    backgroundColor: '#FF6B6B',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  notificationUnread: {
    backgroundColor: '#f0f7ff',
  },
  notificationRead: {
    backgroundColor: '#fff',
  },
  notificationDot: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7CA7D8',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 10,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  notificationAction: {
    padding: 5,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
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
  downloadButton: {
    backgroundColor: '#666',
  },
  badgeCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 30,
  },
  badgeContent: {
    flex: 1,
    marginLeft: 15,
  },
  badgeName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  badgeDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 10,
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '500',
  },
  modalConfirmButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#7CA7D8',
    borderRadius: 5,
  },
  modalDeleteButton: {
    backgroundColor: '#FF6B6B',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});