// client/app/services/api/notification.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'ACHIEVEMENT' | 'SYSTEM' | 'MARKETING';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
  expiresAt?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: Record<string, any>;
  imageUrl?: string;
}

export interface NotificationPreferences {
  receiveEmails: boolean;
  receivePushNotifications: boolean;
  receiveAchievementNotifications: boolean;
  receiveSystemNotifications: boolean;
  receiveMarketingNotifications: boolean;
}

/**
 * Service pour gérer les notifications de l'utilisateur
 */
export const notificationApi = {
  /**
   * Récupérer toutes les notifications de l'utilisateur avec pagination
   */
  getNotifications: async (page: number = 1, limit: number = 20): Promise<Notification[]> => {
    try {
      try {
        const response = await apiClient.get('/notifications', {
          params: { page, limit }
        });
        const data = extractApiData<any>(response);
        
        // Gérer le cas où la réponse est un objet contenant un tableau de notifications
        if (data && typeof data === 'object' && data.notifications) {
          logger.info('Notifications API returned an object with a notifications array');
          return data.notifications;
        }
        
        // Sinon, on suppose que c'est directement un tableau
        return data as Notification[];
      } catch (apiError) {
        // Si l'endpoint n'existe pas ou retourne une erreur
        if (apiError.response?.status === 404) {
          logger.warn('Notifications endpoint not available, using fallback data');
          
          // Essayer un autre endpoint
          try {
            const userNotificationsResponse = await apiClient.get('/users/me/notifications');
            return extractApiData<Notification[]>(userNotificationsResponse);
          } catch (fallbackError) {
            logger.error('Failed to get notifications from fallback endpoint:', fallbackError);
            // Retourner un tableau vide si aucun endpoint ne fonctionne
            return [];
          }
        }
        throw apiError;
      }
    } catch (error) {
      // Gestion améliorée des erreurs avec messages spécifiques
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter pour accéder à vos notifications.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer vos notifications. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch notifications:', error);
      throw new Error('Un problème est survenu lors de la récupération de vos notifications. Veuillez rafraîchir la page.');
    }
  },

  /**
   * Récupérer le nombre de notifications non lues
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      try {
        const response = await apiClient.get('/notifications/unread-count');
        const data = extractApiData<{ count: number }>(response);
        return data.count;
      } catch (apiError) {
        // Si l'endpoint n'existe pas, compter manuellement
        if (apiError.response?.status === 404) {
          logger.warn('Unread count endpoint not available, counting manually');
          
          try {
            const notifications = await notificationApi.getNotifications(1, 100);
            return Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;
          } catch (countError) {
            logger.error('Failed to count unread notifications manually:', countError);
            return 0;
          }
        }
        throw apiError;
      }
    } catch (error) {
      // On ne veut pas que cette erreur soit bloquante, on retourne 0 par défaut
      // mais on log l'erreur pour le débogage
      logger.error('Failed to fetch unread notification count:', error);
      return 0;
    }
  },

  /**
   * Marquer une notification comme lue
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      try {
        await apiClient.put(`/notifications/${notificationId}/read`);
      } catch (apiError) {
        // Si l'endpoint n'existe pas, essayer un autre endpoint
        if (apiError.response?.status === 404) {
          logger.warn(`Mark as read endpoint not available for notification ${notificationId}, trying fallback`);
          
          try {
            await apiClient.put(`/users/me/notifications/${notificationId}/read`);
          } catch (fallbackError) {
            logger.error('Failed to mark notification as read with fallback endpoint:', fallbackError);
            // Ne pas relancer d'erreur, l'UI peut toujours marquer la notification comme lue localement
            return;
          }
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Ne pas afficher d'erreur si la notification n'existe plus
        return;
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de marquer la notification comme lue. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw new Error('Impossible de marquer la notification comme lue. Veuillez réessayer.');
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      try {
        await apiClient.put('/notifications/read-all');
      } catch (apiError) {
        // Si l'endpoint n'existe pas, essayer un autre endpoint
        if (apiError.response?.status === 404) {
          logger.warn('Mark all as read endpoint not available, trying fallback');
          
          try {
            await apiClient.put('/users/me/notifications/read-all');
          } catch (fallbackError) {
            logger.error('Failed to mark all notifications as read with fallback endpoint:', fallbackError);
            
            // Dernier recours: marquer individuellement chaque notification comme lue
            try {
              const notifications = await notificationApi.getNotifications();
              if (Array.isArray(notifications)) {
                const unreadNotifications = notifications.filter(n => !n.isRead);
                for (const notification of unreadNotifications) {
                  try {
                    await notificationApi.markAsRead(notification.id);
                  } catch (markError) {
                    logger.error(`Failed to mark notification ${notification.id} as read:`, markError);
                  }
                }
              }
            } catch (getError) {
              logger.error('Failed to get notifications for manual marking as read:', getError);
              throw new Error('Impossible de marquer toutes les notifications comme lues.');
            }
          }
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de marquer les notifications comme lues. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to mark all notifications as read:', error);
      throw new Error('Impossible de marquer toutes les notifications comme lues. Veuillez réessayer.');
    }
  },

  /**
   * Supprimer une notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      try {
        await apiClient.delete(`/notifications/${notificationId}`);
      } catch (apiError) {
        // Si l'endpoint n'existe pas, essayer un autre endpoint
        if (apiError.response?.status === 404) {
          logger.warn(`Delete notification endpoint not available for ID ${notificationId}, trying fallback`);
          
          try {
            await apiClient.delete(`/users/me/notifications/${notificationId}`);
          } catch (fallbackError) {
            logger.error('Failed to delete notification with fallback endpoint:', fallbackError);
            // Ne pas relancer d'erreur, l'UI peut toujours supprimer la notification localement
            return;
          }
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Ne pas afficher d'erreur si la notification n'existe plus
        return;
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de supprimer la notification. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to delete notification ${notificationId}:`, error);
      throw new Error('Impossible de supprimer la notification. Veuillez réessayer.');
    }
  },

  /**
   * Supprimer toutes les notifications
   */
  deleteAllNotifications: async (): Promise<void> => {
    try {
      try {
        await apiClient.delete('/notifications');
      } catch (apiError) {
        // Si l'endpoint n'existe pas, essayer un autre endpoint
        if (apiError.response?.status === 404) {
          logger.warn('Delete all notifications endpoint not available, trying fallback');
          
          try {
            await apiClient.delete('/users/me/notifications');
          } catch (fallbackError) {
            logger.error('Failed to delete all notifications with fallback endpoint:', fallbackError);
            throw new Error('Impossible de supprimer toutes les notifications.');
          }
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de supprimer les notifications. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to delete all notifications:', error);
      throw new Error('Impossible de supprimer toutes les notifications. Veuillez réessayer.');
    }
  },

  /**
   * Obtenir les préférences de notification de l'utilisateur
   */
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    try {
      // Essayons l'API en premier
      try {
        const response = await apiClient.get('/users/me/notification-preferences');
        return extractApiData<NotificationPreferences>(response);
      } catch (apiError) {
        // Si l'endpoint n'existe pas (404), utilisons une solution de secours
        if (apiError.response?.status === 404) {
          logger.warn('Notification preferences endpoint not available, using fallback data');
          
          // Essayons de récupérer les préférences depuis l'API utilisateur
          try {
            const userResponse = await apiClient.get('/users/me');
            const userData = extractApiData<any>(userResponse);
            
            // Vérifions si les données utilisateur contiennent des préférences de notification
            if (userData.notificationPreferences) {
              return userData.notificationPreferences;
            }
          } catch (userError) {
            // Ignorer cette erreur et passer aux valeurs par défaut
            logger.error('Failed to get user data for notification preferences:', userError);
          }
          
          // Retourner les valeurs par défaut
          return {
            receiveEmails: true,
            receivePushNotifications: true,
            receiveAchievementNotifications: true,
            receiveSystemNotifications: true,
            receiveMarketingNotifications: false
          };
        }
        // Si c'est une autre erreur, la propager
        throw apiError;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer vos préférences de notification. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch notification preferences:', error);
      throw new Error('Impossible de récupérer vos préférences de notification. Veuillez réessayer.');
    }
  },

  /**
   * Mettre à jour les préférences de notification
   */
  updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    try {
      try {
        const response = await apiClient.put('/users/me/notification-preferences', preferences);
        return extractApiData<NotificationPreferences>(response);
      } catch (apiError) {
        // Si l'endpoint n'existe pas, essayer un autre endpoint
        if (apiError.response?.status === 404) {
          logger.warn('Update notification preferences endpoint not available, using fallback');
          
          // Essayer de mettre à jour via l'API utilisateur
          try {
            const updateResponse = await apiClient.put('/users/me', { 
              notificationPreferences: preferences 
            });
            const userData = extractApiData<any>(updateResponse);
            
            // Si la mise à jour a réussi
            if (userData.notificationPreferences) {
              return userData.notificationPreferences;
            }
            
            // Sinon, on retourne les paramètres demandés comme si la mise à jour avait réussi
            return {
              ...(await notificationApi.getNotificationPreferences()),
              ...preferences
            };
          } catch (updateError) {
            logger.error('Failed to update notification preferences via fallback:', updateError);
            throw updateError;
          }
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 400) {
        throw new Error('Les préférences de notification fournies sont invalides.');
      } else if (!error.response) {
        throw new Error('Impossible de mettre à jour vos préférences de notification. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to update notification preferences:', error);
      throw new Error('Impossible de mettre à jour vos préférences de notification. Veuillez réessayer.');
    }
  },

  /**
   * Récupérer les notifications par type
   */
  getNotificationsByType: async (type: NotificationType): Promise<Notification[]> => {
    try {
      try {
        const response = await apiClient.get('/notifications', {
          params: { type }
        });
        return extractApiData<Notification[]>(response);
      } catch (apiError) {
        // Si l'endpoint n'existe pas, essayer un autre endpoint ou filtrer manuellement
        if (apiError.response?.status === 404) {
          logger.warn(`Notifications by type endpoint not available for ${type}, filtering manually`);
          
          try {
            const allNotifications = await notificationApi.getNotifications();
            if (Array.isArray(allNotifications)) {
              return allNotifications.filter(n => n.type.toUpperCase() === type);
            }
            return [];
          } catch (fallbackError) {
            logger.error('Failed to get notifications for manual filtering:', fallbackError);
            return [];
          }
        }
        throw apiError;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 400) {
        throw new Error('Le type de notification spécifié est invalide.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer vos notifications. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch notifications of type ${type}:`, error);
      throw new Error('Impossible de récupérer les notifications. Veuillez réessayer.');
    }
  },

  /**
   * Récupérer les notifications par date (à partir d'une date)
   */
  getNotificationsSince: async (date: Date): Promise<Notification[]> => {
    try {
      const since = date.toISOString();
      
      try {
        const response = await apiClient.get('/notifications', {
          params: { since }
        });
        return extractApiData<Notification[]>(response);
      } catch (apiError) {
        // Si l'endpoint n'existe pas, filtrer manuellement
        if (apiError.response?.status === 404) {
          logger.warn('Notifications since date endpoint not available, filtering manually');
          
          try {
            const allNotifications = await notificationApi.getNotifications(1, 100);
            if (Array.isArray(allNotifications)) {
              const dateValue = date.getTime();
              return allNotifications.filter(n => new Date(n.createdAt).getTime() >= dateValue);
            }
            return [];
          } catch (fallbackError) {
            logger.error('Failed to get notifications for manual date filtering:', fallbackError);
            return [];
          }
        }
        throw apiError;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 400) {
        throw new Error('Le format de date spécifié est invalide.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer vos notifications. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch notifications since date:', error);
      throw new Error('Impossible de récupérer les notifications. Veuillez réessayer.');
    }
  },

  /**
   * Enregistrer un token de notification push
   */
  registerPushToken: async (token: string, deviceInfo?: object): Promise<void> => {
    try {
      await apiClient.post('/users/me/push-tokens', {
        token,
        deviceInfo
      });
    } catch (apiError) {
      // Gérer le cas où l'endpoint n'existe pas
      if (apiError.response?.status === 404) {
        logger.warn('Register push token endpoint not available', { token });
        // Ne rien faire, l'opération sera traitée côté client
        return;
      }
      
      // Pour ce type d'opération, ne pas relancer l'erreur à l'utilisateur
      // car cela pourrait bloquer le flux d'onboarding
      logger.error('Failed to register push token:', apiError);
    }
  },

  /**
   * Tester l'envoi d'une notification push (pour vérifier la configuration)
   */
  testPushNotification: async (): Promise<boolean> => {
    try {
      await apiClient.post('/users/me/test-notification');
      return true;
    } catch (apiError) {
      // Gérer le cas où l'endpoint n'existe pas
      if (apiError.response?.status === 404) {
        logger.warn('Test push notification endpoint not available');
        return false;
      }
      
      logger.error('Failed to send test notification:', apiError);
      return false;
    }
  }
};

export default notificationApi;