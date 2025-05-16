// client/app/services/api/notification.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
};

/**
 * Service pour gérer les notifications de l'utilisateur
 */
export const notificationApi = {
  /**
   * Récupérer toutes les notifications de l'utilisateur
   */
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get('/notifications');
      return extractApiData<Notification[]>(response);
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
      throw error;
    }
  },

  /**
   * Récupérer le nombre de notifications non lues
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      const data = extractApiData<{ count: number }>(response);
      return data.count;
    } catch (error) {
      logger.error('Failed to fetch unread notification count:', error);
      throw error;
    }
  },

  /**
   * Marquer une notification comme lue
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      logger.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.put('/notifications/read-all');
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Supprimer une notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      logger.error(`Failed to delete notification ${notificationId}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer toutes les notifications
   */
  deleteAllNotifications: async (): Promise<void> => {
    try {
      await apiClient.delete('/notifications');
    } catch (error) {
      logger.error('Failed to delete all notifications:', error);
      throw error;
    }
  },
};

export default notificationApi;