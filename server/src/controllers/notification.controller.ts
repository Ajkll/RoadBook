import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import { prisma } from '../config/prisma';
import logger from '../utils/logger';

/**
 * Get all notifications for the authenticated user
 */
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const includeRead = req.query.includeRead !== 'false';
    
    const result = await notificationService.getUserNotifications(userId, {
      page,
      limit,
      includeRead,
    });
    
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Error getting user notifications: ${error.message}`);
    return res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
};

/**
 * Get unread notification count for the authenticated user
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const count = await notificationService.getUnreadCount(userId);
    
    return res.status(200).json({ count });
  } catch (error: any) {
    logger.error(`Error getting unread count: ${error.message}`);
    return res.status(500).json({ message: 'Failed to get unread count' });
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { notificationId } = req.params;
    
    // Verify the notification belongs to the user
    const notification = await notificationService.markAsRead(notificationId);
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to access this notification' });
    }
    
    return res.status(200).json(notification);
  } catch (error: any) {
    logger.error(`Error marking notification as read: ${error.message}`);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

/**
 * Mark all notifications as read for the authenticated user
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const count = await notificationService.markAllAsRead(userId);
    
    return res.status(200).json({ message: `${count} notifications marked as read` });
  } catch (error: any) {
    logger.error(`Error marking all notifications as read: ${error.message}`);
    return res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { notificationId } = req.params;
    
    // Need to check ownership before deleting
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this notification' });
    }
    
    const success = await notificationService.deleteNotification(notificationId);
    
    if (!success) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    logger.error(`Error deleting notification: ${error.message}`);
    return res.status(500).json({ message: 'Failed to delete notification' });
  }
};

/**
 * Delete all notifications for the authenticated user
 */
export const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const count = await notificationService.deleteAllNotifications(userId);
    
    return res.status(200).json({ message: `${count} notifications deleted` });
  } catch (error: any) {
    logger.error(`Error deleting all notifications: ${error.message}`);
    return res.status(500).json({ message: 'Failed to delete all notifications' });
  }
};

/**
 * Maintenance endpoint for cleaning up old notifications
 * This would typically be called by a scheduled job, not directly by a user
 */
export const cleanupOldNotifications = async (req: Request, res: Response) => {
  try {
    // Only admins can trigger this
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }
    
    const daysOld = req.query.daysOld ? parseInt(req.query.daysOld as string) : 30;
    
    const count = await notificationService.cleanupOldNotifications(daysOld);
    
    return res.status(200).json({ message: `${count} old notifications deleted` });
  } catch (error: any) {
    logger.error(`Error cleaning up old notifications: ${error.message}`);
    return res.status(500).json({ message: 'Failed to clean up old notifications' });
  }
};
