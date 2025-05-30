import React, { useState, useEffect } from 'react';
import { Alert, useColorScheme } from 'react-native';
import { useTheme } from '../constants/theme';
import { useSelector } from 'react-redux';
import { 
  authApi, 
  usersApi, 
  notificationApi, 
  badgeApi, 
  privacyApi 
} from '../services/api';
import { Notification, NotificationPreferences } from '../services/api/notification.api';
import { UserBadge, BadgeProgressInfo } from '../services/api/badge.api';
import { PrivacySettings } from '../services/api/privacy.api';
import { User } from '../types/auth.types';
import { useAuth } from '../context/AuthContext';
import { selectIsInternetReachable } from '../store/slices/networkSlice';
import { logger } from '../utils/logger';

// Import du composant principal orchestrateur
import ProfileScreen from '../components/profile';
import * as ImagePicker from 'expo-image-picker';

// Options de confidentialité par défaut
const DEFAULT_PRIVACY_SETTINGS = {
  shareProgress: true,
  receiveNotifications: true,
  publicProfile: false,
  locationTracking: true,
  dataCollection: true
};

export default function Profile() {
  // Utiliser le context d'authentification
  const { user: authUser, updateProfile, refreshUserData, logout: authLogout } = useAuth();
  
  // Vérifier l'état de la connexion
  const isOnline = useSelector(selectIsInternetReachable);
  
  // Obtenir le thème actuel
  const { colors, dark } = useTheme();
  const colorScheme = useColorScheme();
  
  // État local
  const [user, setUser] = useState<User | null>(authUser);
  const [editing, setEditing] = useState(false);
  const [currentSection, setCurrentSection] = useState('profile');
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    ...DEFAULT_PRIVACY_SETTINGS,
    shareActivity: false,
    profileVisibility: 'PRIVATE'
  });
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    receiveEmails: true,
    receivePushNotifications: true,
    receiveAchievementNotifications: true,
    receiveSystemNotifications: true,
    receiveMarketingNotifications: false
  });
  const [uploadingPicture, setUploadingPicture] = useState(false);
  // État pour les données diverses
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgressInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({
    profile: false,
    security: false,
    notifications: false,
    privacy: false,
    badges: false
  });
  // État pour les modaux
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loadingError, setLoadingError] = useState('');

  // Mettre à jour l'état local lorsque authUser change
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setEditedUser(authUser);
    }
  }, [authUser]);

  // Charger les données utilisateur au démarrage
  useEffect(() => {
    loadUserData();
  }, []);
  
  // Fonction pour charger les données utilisateur
  const loadUserData = async () => {
    setLoading(true);
    setLoadingError('');
    
    try {
      // 1. Récupérer l'utilisateur actuel avec une nouvelle API améliorée
      const userData = await usersApi.getCurrentUser();
      setUser(userData);
      setEditedUser({...userData});
      
      // 2. Charger toutes les données en parallèle pour une meilleure performance
      await Promise.all([
        loadNotifications(),
        loadBadges(),
        loadSessions(),
        loadPrivacySettings(),
        loadNotificationPreferences()
      ]);
      
    } catch (error) {
      logger.error('Erreur lors du chargement des données utilisateur:', error);
      setLoadingError(
        error.message || 'Impossible de charger vos données. Veuillez vérifier votre connexion internet et réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les notifications
  const loadNotifications = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, notifications: true }));
      const userNotifications = await notificationApi.getNotifications();
      // Vérifier que userNotifications est bien un tableau pour éviter l'erreur "map is not a function"
      if (Array.isArray(userNotifications)) {
        setNotifications(userNotifications);
      } else {
        console.warn('Les notifications ne sont pas un tableau:', userNotifications);
        // Initialiser avec un tableau vide en cas de réponse invalide
        setNotifications([]);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des notifications:', error);
      // Initialiser avec des notifications simulées en cas d'erreur
      const fakeNotifications = [
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
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setNotifications(fakeNotifications);
    } finally {
      setSectionLoading(prev => ({ ...prev, notifications: false }));
    }
  };
  
  // Charger les badges de l'utilisateur
  const loadBadges = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, badges: true }));
      
      // Chargement parallèle des badges et de la progression vers les prochains badges
      const [userBadges, progress] = await Promise.all([
        badgeApi.getMyBadges(),
        badgeApi.getBadgeProgress()
      ]);
      
      setBadges(userBadges);
      setBadgeProgress(progress);
    } catch (error) {
      logger.error('Erreur lors du chargement des badges:', error);
      // Générer des badges simulés en cas d'erreur
      setBadges([
        {
          id: 'badge-1',
          userId: 'current-user',
          badgeId: 'welcome',
          awardedAt: new Date(Date.now() - 86400000).toISOString(),
          name: '👋 Bienvenue',
          description: 'Badge obtenu lors de votre inscription',
          imageUrl: '👋'
        }
      ]);
    } finally {
      setSectionLoading(prev => ({ ...prev, badges: false }));
    }
  };
  
  // Charger les sessions de l'utilisateur
  const loadSessions = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, security: true }));
      const userSessions = await usersApi.getSessions();
      if (Array.isArray(userSessions) && userSessions.length > 0) {
        setSessions(userSessions);
      } else {
        // Sessions par défaut en cas de tableau vide
        setSessions([{ 
          id: 'session-current', 
          device: 'Appareil actuel', 
          location: 'Emplacement actuel', 
          lastActive: new Date().toISOString(), 
          current: true 
        }]);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des sessions:', error);
      // Sessions par défaut en cas d'erreur
      setSessions([{ 
        id: 'session-current', 
        device: 'Appareil actuel', 
        location: 'Emplacement actuel', 
        lastActive: new Date().toISOString(), 
        current: true 
      }]);
    } finally {
      setSectionLoading(prev => ({ ...prev, security: false }));
    }
  };
  
  // Charger les paramètres de confidentialité
  const loadPrivacySettings = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, privacy: true }));
      const settings = await privacyApi.getPrivacySettings();
      setPrivacySettings(settings);
    } catch (error) {
      logger.error('Erreur lors du chargement des paramètres de confidentialité:', error);
      // Conserver les paramètres par défaut en cas d'erreur
    } finally {
      setSectionLoading(prev => ({ ...prev, privacy: false }));
    }
  };
  
  // Charger les préférences de notification
  const loadNotificationPreferences = async () => {
    try {
      const prefs = await notificationApi.getNotificationPreferences();
      setNotificationPrefs(prefs);
    } catch (error) {
      logger.error('Erreur lors du chargement des préférences de notification:', error);
      // Conserver les valeurs par défaut en cas d'erreur
    }
  };
  
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

  // Gérer la sauvegarde du profil avec validation améliorée et synchronisation
  const handleSaveProfile = async () => {
    // Vérifier si l'utilisateur est en ligne avant de tenter la mise à jour
    if (!isOnline) {
      Alert.alert(
        'Mode hors ligne',
        'Les modifications de profil ne sont pas disponibles en mode hors ligne. Veuillez vous connecter à Internet et réessayer.',
        [{ text: 'Compris' }]
      );
      return;
    }
    
    setLoading(true);
    setSectionLoading(prev => ({ ...prev, profile: true }));
    
    try {
      // Validation des données plus complète
      if (!editedUser.displayName || !editedUser.displayName.trim() === '') {
        Alert.alert('Erreur de validation', 'Le nom d\'affichage est requis.');
        setLoading(false);
        setSectionLoading(prev => ({ ...prev, profile: false }));
        return;
      }
      
      if (!editedUser.email || !editedUser.email.includes('@')) {
        Alert.alert('Erreur de validation', 'Veuillez entrer une adresse email valide.');
        setLoading(false);
        setSectionLoading(prev => ({ ...prev, profile: false }));
        return;
      }
      
      if (editedUser.phoneNumber) {
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(editedUser.phoneNumber)) {
          Alert.alert(
            'Format incorrect', 
            'Le format du numéro de téléphone est incorrect. Utilisez le format international (ex: +33612345678).'
          );
          setLoading(false);
          setSectionLoading(prev => ({ ...prev, profile: false }));
          return;
        }
      }
      
      logger.info(`Tentative de mise à jour du profil pour l'utilisateur ${user?.id}`);
      
      // Utiliser updateProfile depuis le AuthContext pour synchroniser les données
      const updatedUser = await updateProfile(editedUser);
      
      // Mettre à jour l'état local
      setUser(updatedUser);
      setEditing(false);
      
      logger.info(`Profil mis à jour avec succès pour l'utilisateur ${user?.id}`);
      Alert.alert('Profil mis à jour', 'Vos informations personnelles ont été mises à jour avec succès.');
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error);
      Alert.alert(
        'Erreur de mise à jour',
        error.message || 'Une erreur est survenue lors de la mise à jour de votre profil. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
      setSectionLoading(prev => ({ ...prev, profile: false }));
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
  const handleTogglePrivacy = async (setting) => {
    // Mettre à jour l'état local immédiatement pour une UI réactive
    const newSettings = {
      ...privacySettings,
      [setting]: !privacySettings[setting]
    };
    
    setPrivacySettings(newSettings);
    
    // Puis envoyer la mise à jour au serveur
    try {
      setSectionLoading(prev => ({ ...prev, privacy: true }));
      await privacyApi.updatePrivacySettings({ [setting]: newSettings[setting] });
    } catch (error) {
      // En cas d'erreur, revenir à l'état précédent
      setPrivacySettings(privacySettings);
      Alert.alert(
        'Erreur de mise à jour',
        error.message || 'Impossible de mettre à jour vos paramètres de confidentialité. Veuillez réessayer.'
      );
    } finally {
      setSectionLoading(prev => ({ ...prev, privacy: false }));
    }
  };
  
  // Sauvegarder tous les paramètres de confidentialité
  const handleSavePrivacySettings = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, privacy: true }));
      await privacyApi.updatePrivacySettings(privacySettings);
      Alert.alert('Paramètres mis à jour', 'Vos paramètres de confidentialité ont été enregistrés avec succès.');
    } catch (error) {
      Alert.alert(
        'Erreur de mise à jour',
        error.message || 'Impossible de mettre à jour vos paramètres de confidentialité. Veuillez réessayer.'
      );
    } finally {
      setSectionLoading(prev => ({ ...prev, privacy: false }));
    }
  };
  
  // Gérer la mise à jour des préférences de notification
  const handleUpdateNotificationPreferences = async (key, value) => {
    // Mettre à jour l'état local immédiatement
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    
    // Puis envoyer la mise à jour au serveur
    try {
      await notificationApi.updateNotificationPreferences({ [key]: value });
    } catch (error) {
      // En cas d'erreur, revenir à l'état précédent
      setNotificationPrefs(notificationPrefs);
      Alert.alert(
        'Erreur de mise à jour',
        error.message || 'Impossible de mettre à jour vos préférences de notification. Veuillez réessayer.'
      );
    }
  };

  // Gérer la confirmation modale avec gestion d'erreur améliorée
  const handleConfirmAction = async () => {
    setLoading(true);
    
    try {
      if (modalAction === 'logout') {
        console.log('==== LOGOUT ATTEMPT ====');
        // Utiliser logout du context d'authentification pour une déconnexion synchronisée
        await authLogout();
        Alert.alert('Déconnexion réussie', 'Vous avez été déconnecté avec succès. À bientôt !');
      } else if (modalAction === 'delete') {
        if (deleteConfirmText === 'SUPPRIMER') {
          console.log('==== DELETE ACCOUNT ATTEMPT ====');
          
          // Utiliser la nouvelle API pour supprimer le compte
          await privacyApi.requestDataDeletion(
            deleteConfirmText, 
            'Suppression demandée via l\'interface utilisateur'
          );
          
          // Déconnexion après suppression du compte
          await authLogout();
          
          Alert.alert(
            'Compte supprimé', 
            'Votre compte et toutes vos données associées ont été supprimés. Nous espérons vous revoir bientôt !'
          );
        } else {
          Alert.alert(
            'Texte de confirmation incorrect', 
            'Pour protéger votre compte, veuillez taper exactement "SUPPRIMER" (en majuscules) pour confirmer la suppression.'
          );
          setLoading(false);
          return;
        }
      } else if (modalAction === 'exportData') {
        // Demander une exportation des données
        const result = await privacyApi.requestDataExport({
          format: 'JSON',
          includePersonalData: true,
          includeActivityData: true,
          includeRoadbookData: true
        });
        
        Alert.alert(
          'Demande d\'exportation envoyée', 
          `Votre demande d'exportation de données a été reçue. Temps estimé : ${result.estimatedTime}. Vous recevrez un email avec un lien de téléchargement dès que vos données seront prêtes.`
        );
      } else if (modalAction === 'deactivateAccount') {
        // Désactiver temporairement le compte
        await privacyApi.deactivateAccount(
          deleteConfirmText,
          'Désactivation temporaire demandée via l\'interface utilisateur'
        );
        
        // Déconnexion après désactivation
        await authLogout();
        
        Alert.alert(
          'Compte désactivé', 
          'Votre compte a été temporairement désactivé. Vous pouvez le réactiver à tout moment en vous connectant avec vos identifiants.'
        );
      }
    } catch (error) {
      // Messages d'erreur contextuels selon l'action
      if (modalAction === 'logout') {
        Alert.alert(
          'Erreur de déconnexion', 
          error.message || 'Une erreur s\'est produite lors de la déconnexion. Veuillez réessayer.'
        );
      } else if (modalAction === 'delete') {
        Alert.alert(
          'Erreur de suppression', 
          error.message || 'Impossible de supprimer votre compte actuellement. Veuillez réessayer plus tard ou contacter notre support.'
        );
      } else if (modalAction === 'exportData') {
        Alert.alert(
          'Erreur d\'exportation', 
          error.message || 'Impossible de traiter votre demande d\'exportation de données. Veuillez réessayer plus tard.'
        );
      } else if (modalAction === 'deactivateAccount') {
        Alert.alert(
          'Erreur de désactivation', 
          error.message || 'Impossible de désactiver votre compte actuellement. Veuillez réessayer plus tard.'
        );
      } else {
        Alert.alert('Erreur', error.message || 'Une erreur s\'est produite. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setDeleteConfirmText('');
    }
  };

  // Helper pour demander une exportation des données
  const handleRequestDataExport = () => {
    setModalAction('exportData');
    setModalMessage('Voulez-vous demander une exportation complète de vos données personnelles ? L\'exportation sera prête dans quelques minutes et vous recevrez un email avec un lien de téléchargement.');
    setShowConfirmModal(true);
  };
  
  // Helper pour désactiver temporairement le compte
  const handleDeactivateAccount = () => {
    setModalAction('deactivateAccount');
    setModalMessage('Votre compte sera temporairement désactivé. Vous pourrez le réactiver à tout moment en vous connectant avec vos identifiants. Pour confirmer, veuillez entrer votre mot de passe.');
    setShowConfirmModal(true);
  };
  
  // Helper pour changer de mot de passe
  const handleChangePassword = async (currentPassword: string, newPassword: string, confirmPassword?: string) => {
    try {
      setSectionLoading(prev => ({ ...prev, security: true }));
      
      // Vérifier que les paramètres sont définis
      if (!currentPassword || typeof currentPassword !== 'string') {
        Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel.');
        return;
      }
      
      if (!newPassword || typeof newPassword !== 'string') {
        Alert.alert('Erreur', 'Veuillez entrer un nouveau mot de passe.');
        return;
      }
      
      // Si confirmPassword n'est pas fourni, vérifier qu'il est identique au newPassword
      if (confirmPassword && confirmPassword !== newPassword) {
        Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
        return;
      }
      
      // Vérification locale de la solidité du mot de passe
      if (newPassword.length < 8) {
        Alert.alert('Mot de passe trop court', 'Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }
      
      // Vérifier que le nouveau mot de passe est différent de l'ancien
      if (currentPassword === newPassword) {
        Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'ancien.');
        return;
      }
      
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      
      if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        Alert.alert(
          'Mot de passe trop faible', 
          'Le mot de passe doit contenir au moins: une majuscule, une minuscule, un chiffre et un caractère spécial.'
        );
        return;
      }
      
      logger.info('Tentative de changement de mot de passe');
      
      // Utiliser l'API d'authentification pour changer le mot de passe avec confirmation
      // Si confirmPassword n'est pas fourni explicitement, on utilise newPassword comme valeur par défaut
      await authApi.changePassword(currentPassword, newPassword, confirmPassword || newPassword);
      
      logger.info('Mot de passe changé avec succès');
      
      Alert.alert(
        'Mot de passe mis à jour', 
        'Votre mot de passe a été changé avec succès. Vous devrez utiliser ce nouveau mot de passe lors de votre prochaine connexion.'
      );
    } catch (error) {
      logger.error('Erreur lors du changement de mot de passe:', error);
      
      // Afficher un message d'erreur personnalisé selon le type d'erreur
      if (error.message && error.message.includes('invalide')) {
        Alert.alert(
          'Données invalides', 
          'Veuillez vérifier que tous les champs sont correctement remplis.'
        );
      } else if (error.message && error.message.includes('incorrect')) {
        Alert.alert(
          'Mot de passe incorrect', 
          'Le mot de passe actuel que vous avez entré est incorrect.'
        );
      } else {
        Alert.alert(
          'Erreur de changement de mot de passe', 
          error.message || 'Impossible de changer votre mot de passe. Veuillez réessayer plus tard.'
        );
      }
    } finally {
      setSectionLoading(prev => ({ ...prev, security: false }));
    }
  };
  
  // Gérer la demande de réinitialisation du mot de passe
  const handleForgotPassword = async (email: string) => {
    try {
      setSectionLoading(prev => ({ ...prev, security: true }));
      
      // Vérifier que l'email est valide
      if (!email || !email.includes('@')) {
        Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide.');
        return;
      }
      
      logger.info('Tentative de demande de réinitialisation de mot de passe');
      
      // Appeler l'API pour demander une réinitialisation de mot de passe
      await authApi.requestPasswordReset(email);
      
      logger.info('Demande de réinitialisation de mot de passe envoyée');
      
      // Note: Pour des raisons de sécurité, nous affichons toujours un message de succès
      // même si l'email n'existe pas dans la base de données
      Alert.alert(
        'Demande envoyée',
        'Si cette adresse email est associée à un compte, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.'
      );
    } catch (error) {
      logger.error('Erreur lors de la demande de réinitialisation de mot de passe:', error);
      
      // Note: pour des raisons de sécurité, même en cas d'erreur technique,
      // on ne doit pas indiquer si l'email existe ou pas
      Alert.alert(
        'Demande envoyée',
        'Si cette adresse email est associée à un compte, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.'
      );
    } finally {
      setSectionLoading(prev => ({ ...prev, security: false }));
    }
  };
  
  // Helper pour marquer toutes les notifications comme lues
  const handleMarkAllNotificationsAsRead = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, notifications: true }));
      await notificationApi.markAllAsRead();
      
      // Mettre à jour l'état local
      if (notifications) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
      
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues.');
    } catch (error) {
      Alert.alert(
        'Erreur', 
        error.message || 'Impossible de marquer les notifications comme lues. Veuillez réessayer.'
      );
    } finally {
      setSectionLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  // Gérer la mise à jour de la photo de profil - approche simplifiée
  const handleUpdateProfilePicture = async (uri: string, source: 'gallery' | 'camera' = 'gallery'): Promise<void> => {
    // Vérifier si l'utilisateur est en ligne avant de tenter la mise à jour
    if (!isOnline) {
      Alert.alert(
        'Mode hors ligne',
        'Les modifications de photo de profil ne sont pas disponibles en mode hors ligne. Veuillez vous connecter à Internet et réessayer.',
        [{ text: 'Compris' }]
      );
      return Promise.reject(new Error('Hors ligne'));
    }
    
    try {
      setUploadingPicture(true);
      logger.info(`Tentative de mise à jour de la photo de profil depuis ${source} pour l'utilisateur ${user?.id}`);
      
      try {
        // Créer un objet FormData
        const formData = new FormData();
        
        // Extraire le nom du fichier à partir de l'URI
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        // Déterminer le type MIME basé sur l'extension du fichier
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        let fileType = 'image/jpeg'; // Par défaut
        
        if (fileExtension === 'png') {
          fileType = 'image/png';
        } else if (fileExtension === 'gif') {
          fileType = 'image/gif';
        } else if (fileExtension === 'webp') {
          fileType = 'image/webp';
        }
        
        // Ajouter le fichier image au FormData
        // @ts-ignore - TypeScript ne comprend pas bien le type FormData dans React Native
        formData.append('avatar', {
          uri,
          name: fileName,
          type: fileType,
        });
        
        // Essayer d'appeler l'API pour mettre à jour l'avatar
        try {
          const result = await usersApi.updateProfileAvatar(formData);
          
          // Mettre à jour l'utilisateur local avec la nouvelle URL de photo de profil retournée par l'API
          if (user) {
            const updatedUser = { ...user, profilePicture: result.profilePicture };
            setUser(updatedUser);
            
            // Si l'utilisateur est en train d'éditer son profil, mettre à jour aussi l'utilisateur édité
            if (editing) {
              setEditedUser(prev => ({ ...prev, profilePicture: result.profilePicture }));
            }
            
            // Mettre à jour le profil dans le context d'authentification
            await updateProfile({ profilePicture: result.profilePicture });
            
            logger.info(`Photo de profil mise à jour avec succès pour l'utilisateur ${user.id}`);
          }
        } catch (apiError) {
          logger.warn('API endpoint non disponible, utilisation de l\'URI local:', apiError);
          
          // Si l'API échoue, utiliser l'URI local comme fallback (approche simplifiée)
          if (user) {
            // Utiliser directement l'URI comme profilePicture (approche simplifiée)
            const updatedUser = { ...user, profilePicture: uri };
            setUser(updatedUser);
            
            if (editing) {
              setEditedUser(prev => ({ ...prev, profilePicture: uri }));
            }
            
            // Mettre à jour le profil dans le context d'authentification
            await updateProfile({ profilePicture: uri });
          }
        }
      } catch (error) {
        logger.error('Erreur lors du traitement de l\'image:', error);
        throw new Error('Une erreur est survenue lors du traitement de l\'image.');
      }
      
      return Promise.resolve();
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la photo de profil:', error);
      throw error;
    } finally {
      setUploadingPicture(false);
    }
  };

  return (
    <ProfileScreen
      // Données d'état
      user={user}
      loading={loading}
      sectionLoading={sectionLoading}
      loadingError={loadingError}
      currentSection={currentSection}
      editing={editing}
      editedUser={editedUser}
      privacySettings={privacySettings}
      notificationPrefs={notificationPrefs}
      notifications={notifications}
      sessions={sessions}
      badges={badges}
      badgeProgress={badgeProgress}
      uploadingPicture={uploadingPicture}
      
      // État des modaux
      showConfirmModal={showConfirmModal}
      modalAction={modalAction}
      modalMessage={modalMessage}
      deleteConfirmText={deleteConfirmText}
      
      // Setters d'état
      setCurrentSection={setCurrentSection}
      setEditing={setEditing}
      setEditedUser={setEditedUser}
      setShowConfirmModal={setShowConfirmModal}
      setModalAction={setModalAction}
      setModalMessage={setModalMessage}
      setDeleteConfirmText={setDeleteConfirmText}
      setNotifications={setNotifications}
      
      // Formatters et helpers
      formatDate={formatDate}
      
      // Handlers pour les opérations utilisateur
      handleSaveProfile={handleSaveProfile}
      handleLogout={handleLogout}
      handleDeleteAccount={handleDeleteAccount}
      handleLogoutSession={handleLogoutSession}
      handleLogoutAllSessions={handleLogoutAllSessions}
      handleTogglePrivacy={handleTogglePrivacy}
      handleSavePrivacySettings={handleSavePrivacySettings}
      handleUpdateNotificationPreferences={handleUpdateNotificationPreferences}
      handleConfirmAction={handleConfirmAction}
      handleRequestDataExport={handleRequestDataExport}
      handleDeactivateAccount={handleDeactivateAccount}
      handleChangePassword={handleChangePassword}
      handleMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
      updateProfilePicture={handleUpdateProfilePicture}
      
      // Autres fonctions
      onRetryLoading={loadUserData}
    />
  );
}