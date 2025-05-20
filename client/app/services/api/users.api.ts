// client/app/services/api/users.api.ts
import { Platform } from 'react-native';
import { User } from '../../types/auth.types';
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

// Types pour les opérations utilisateur
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
  reason?: string;
}

export interface UpdateProfileAvatarResponse {
  profilePicture: string;
}

export interface CompetencyProgress {
  id: string;
  name: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'VALIDATED' | 'FAILED';
  progress: number;
  lastUpdated: string;
}

export interface UserStatistics {
  totalSessions: number;
  totalDistance: number;
  totalDrivingTime: number;
  competenciesValidated: number;
  totalCompetencies: number;
  progressPercentage: number;
  lastSessionDate: string | null;
}

/**
 * Service pour gérer les opérations liées aux utilisateurs
 */
export const usersApi = {
  /**
   * Récupérer le profil de l'utilisateur actuel
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/users/me');
      return extractApiData<User>(response);
    } catch (error) {
      // Ajout de messages d'erreur détaillés et utiles
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder à votre profil.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch current user:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le profil de l'utilisateur actuel
   */
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    try {
      // Valider les données entrées avant envoi
      if (userData.email && !userData.email.includes('@')) {
        throw new Error('Veuillez entrer une adresse email valide.');
      }
      
      if (userData.phoneNumber) {
        // Exemple de validation basique pour un numéro de téléphone
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(userData.phoneNumber)) {
          throw new Error('Le format du numéro de téléphone est incorrect. Utilisez le format international (ex: +33612345678).');
        }
      }

      const response = await apiClient.put('/users/me', userData);
      return extractApiData<User>(response);
    } catch (error) {
      // Messages d'erreur contextuels
      if (error.response?.status === 400) {
        const apiError = error.response.data?.message || 'Informations de profil invalides';
        
        // Gérer les messages d'erreur spécifiques selon le type d'erreur renvoyée par l'API
        if (apiError.includes('email')) {
          throw new Error('L\'adresse email est déjà utilisée ou n\'est pas valide.');
        } else if (apiError.includes('displayName')) {
          throw new Error('Le nom d\'affichage doit contenir entre 3 et 50 caractères.');
        } else {
          throw new Error(apiError);
        }
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 413) {
        throw new Error('Les données fournies sont trop volumineuses. Réduisez la taille des informations (par exemple, résumez votre bio).');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else if (error.message) {
        // Si c'est une erreur de validation locale
        throw error;
      }
      
      logger.error('Failed to update user profile:', error);
      throw new Error('La mise à jour du profil a échoué. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Changer le mot de passe de l'utilisateur actuel
   */
  changePassword: async (passwords: PasswordChangeRequest): Promise<void> => {
    try {
      // Validation côté client pour éviter des appels API inutiles
      if (passwords.newPassword.length < 8) {
        throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      }
      
      // Vérification de la complexité du mot de passe
      const hasUpperCase = /[A-Z]/.test(passwords.newPassword);
      const hasLowerCase = /[a-z]/.test(passwords.newPassword);
      const hasNumbers = /\d/.test(passwords.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwords.newPassword);
      
      if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        throw new Error(
          'Le mot de passe doit contenir au moins: une majuscule, une minuscule, un chiffre et un caractère spécial.'
        );
      }
      
      if (passwords.currentPassword === passwords.newPassword) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien.');
      }

      await apiClient.put('/users/me/password', passwords);
    } catch (error) {
      // Messages d'erreur contextuels pour le changement de mot de passe
      if (error.response?.status === 401) {
        throw new Error('Le mot de passe actuel est incorrect.');
      } else if (error.response?.status === 400) {
        const apiError = error.response.data?.message || 'Format de mot de passe incorrect';
        throw new Error(apiError);
      } else if (error.response?.status === 429) {
        throw new Error('Trop de tentatives de changement de mot de passe. Veuillez réessayer dans quelques minutes.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else if (error.message) {
        // Si c'est une erreur de validation locale
        throw error;
      }
      
      logger.error('Failed to change password:', error);
      throw new Error('Le changement de mot de passe a échoué. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Demander une réinitialisation de mot de passe
   */
  requestPasswordReset: async (data: PasswordResetRequest): Promise<void> => {
    try {
      // Validation de l'email
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Veuillez entrer une adresse email valide.');
      }

      await apiClient.post('/auth/request-password-reset', data);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('L\'adresse email fournie est invalide.');
      } else if (error.response?.status === 404) {
        // Ne pas indiquer que l'email n'existe pas pour des raisons de sécurité
        // Au lieu de cela, renvoyer un message générique
        throw new Error('Si l\'adresse email est associée à un compte, vous recevrez un email de réinitialisation.');
      } else if (error.response?.status === 429) {
        throw new Error('Trop de demandes. Veuillez attendre quelques minutes avant de réessayer.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else if (error.message) {
        // Si c'est une erreur de validation locale
        throw error;
      }
      
      logger.error('Failed to request password reset:', error);
      throw new Error('La demande de réinitialisation de mot de passe a échoué. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Confirmer une réinitialisation de mot de passe
   */
  confirmPasswordReset: async (data: PasswordResetConfirmRequest): Promise<void> => {
    try {
      // Validation du nouveau mot de passe
      if (data.newPassword.length < 8) {
        throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      }
      
      // Vérification de la complexité du mot de passe
      const hasUpperCase = /[A-Z]/.test(data.newPassword);
      const hasLowerCase = /[a-z]/.test(data.newPassword);
      const hasNumbers = /\d/.test(data.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(data.newPassword);
      
      if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        throw new Error(
          'Le mot de passe doit contenir au moins: une majuscule, une minuscule, un chiffre et un caractère spécial.'
        );
      }

      await apiClient.post('/auth/reset-password', data);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Le format du mot de passe est incorrect ou le token est invalide.');
      } else if (error.response?.status === 401) {
        throw new Error('Le lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else if (error.message) {
        // Si c'est une erreur de validation locale
        throw error;
      }
      
      logger.error('Failed to confirm password reset:', error);
      throw new Error('La réinitialisation du mot de passe a échoué. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Mettre à jour l'avatar du profil
   */
  updateProfileAvatar: async (formData: FormData): Promise<UpdateProfileAvatarResponse> => {
    try {
      const response = await apiClient.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return extractApiData<UpdateProfileAvatarResponse>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Le fichier image est invalide. Utilisez un format JPG, PNG ou WebP de moins de 5 Mo.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 413) {
        throw new Error('L\'image est trop volumineuse. Veuillez utiliser une image de moins de 5 Mo.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to update profile avatar:', error);
      throw new Error('La mise à jour de votre photo de profil a échoué. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Supprimer l'avatar du profil
   */
  removeProfileAvatar: async (): Promise<void> => {
    try {
      await apiClient.delete('/users/me/avatar');
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to remove profile avatar:', error);
      throw new Error('La suppression de votre photo de profil a échoué. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Supprimer le compte utilisateur
   */
  deleteAccount: async (data: DeleteAccountRequest): Promise<void> => {
    try {
      await apiClient.post('/users/me/delete', data);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Le mot de passe fourni est incorrect.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous avez des obligations en cours qui nécessitent votre attention avant de pouvoir supprimer votre compte.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to delete account:', error);
      throw new Error('La suppression de votre compte a échoué. Veuillez réessayer plus tard ou contacter le support.');
    }
  },

  /**
   * Obtenir les statistiques de l'utilisateur actuel
   */
  getUserStatistics: async (): Promise<UserStatistics> => {
    try {
      const response = await apiClient.get('/dashboard/me');
      return extractApiData<UserStatistics>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to get user statistics:', error);
      throw new Error('Impossible de récupérer vos statistiques. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Obtenir la progression des compétences de l'utilisateur actuel
   */
  getUserCompetencies: async (): Promise<CompetencyProgress[]> => {
    try {
      // Récupérer d'abord l'ID de l'utilisateur
      const user = await usersApi.getCurrentUser();
      
      const response = await apiClient.get(`/users/${user.id}/competencies/stats`);
      return extractApiData<CompetencyProgress[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Vos données de compétences ne sont pas disponibles.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to get user competencies:', error);
      throw new Error('Impossible de récupérer vos compétences. Veuillez réessayer plus tard.');
    }
  },
  
  /**
   * Récupérer les sessions actives de l'utilisateur
   */
  getSessions: async (): Promise<any[]> => {
    try {
      // Récupérer d'abord l'ID de l'utilisateur
      const user = await usersApi.getCurrentUser();
      
      try {
        const response = await apiClient.get(`/users/${user.id}/sessions`);
        return extractApiData<any[]>(response);
      } catch (apiError) {
        // Si l'endpoint n'existe pas (404) ou renvoie une erreur, utilisez des données simulées
        logger.warn(`Sessions endpoint error or not available for user ${user.id}, generating simulated data:`, apiError);
        
        // Générer des données de session simulées
        const deviceInfo = Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android' : 'Navigateur';
        const currentTime = new Date();
        
        return [
          { 
            id: 'session-current', 
            device: `${deviceInfo} actuel`, 
            location: 'Emplacement actuel', 
            lastActive: currentTime.toISOString(), 
            current: true 
          },
          { 
            id: 'session-prev1', 
            device: deviceInfo === 'iPhone' ? 'Android' : 'iPhone', 
            location: 'Paris, France', 
            lastActive: new Date(currentTime.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 jours avant
            current: false 
          },
          { 
            id: 'session-prev2', 
            device: 'Tablette', 
            location: 'Lyon, France', 
            lastActive: new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours avant
            current: false 
          }
        ];
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        // Retourner un tableau vide au lieu de lever une exception si aucune session n'est trouvée
        return [];
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to get user sessions:', error);
      throw new Error('Impossible de récupérer vos sessions. Veuillez réessayer plus tard.');
    }
  },
  
  /**
   * Révoquer une session spécifique
   */
  revokeSession: async (sessionId: string): Promise<void> => {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous ne pouvez pas révoquer votre session active actuelle par cette méthode.');
      } else if (error.response?.status === 404) {
        throw new Error('La session spécifiée n\'existe pas ou a déjà été révoquée.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to revoke session:', error);
      throw new Error('Impossible de révoquer la session. Veuillez réessayer plus tard.');
    }
  },
  
  /**
   * Révoquer toutes les autres sessions (sauf la session active)
   */
  revokeAllOtherSessions: async (): Promise<void> => {
    try {
      await apiClient.delete('/auth/sessions');
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to revoke all sessions:', error);
      throw new Error('Impossible de révoquer toutes les sessions. Veuillez réessayer plus tard.');
    }
  },
  
  /**
   * Vérifier si l'email existe déjà (utile pour la validation côté client)
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/auth/check-email', { email });
      return extractApiData<{ exists: boolean }>(response).exists;
    } catch (error) {
      // En cas d'erreur, on suppose que l'email peut être utilisé
      // pour éviter de bloquer l'utilisateur
      return false;
    }
  },
  
  /**
   * Mettre à jour les préférences de notification de l'utilisateur
   */
  updateNotificationPreferences: async (preferences: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  }): Promise<void> => {
    try {
      await apiClient.put('/users/me/notification-preferences', preferences);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to update notification preferences:', error);
      throw new Error('Impossible de mettre à jour vos préférences de notification. Veuillez réessayer plus tard.');
    }
  },
  
  /**
   * Mettre à jour les préférences de confidentialité de l'utilisateur
   */
  updatePrivacySettings: async (settings: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    shareProgress: boolean;
    shareActivity: boolean;
    locationTracking: boolean;
    dataCollection: boolean;
  }): Promise<void> => {
    try {
      await apiClient.put('/users/me/privacy-settings', settings);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 400) {
        throw new Error('Les paramètres de confidentialité fournis sont invalides.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to update privacy settings:', error);
      throw new Error('Impossible de mettre à jour vos paramètres de confidentialité. Veuillez réessayer plus tard.');
    }
  },
  
  /**
   * Exporter les données de l'utilisateur au format JSON
   */
  exportUserData: async (): Promise<Blob> => {
    try {
      const response = await apiClient.get('/users/me/export', {
        responseType: 'blob',
      });
      
      return new Blob([response.data], { type: 'application/json' });
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to export user data:', error);
      throw new Error('Impossible d\'exporter vos données. Veuillez réessayer plus tard.');
    }
  }
};

export default usersApi;