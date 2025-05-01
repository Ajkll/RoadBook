import { Notification, NotificationType, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';

/**
 * Create a new notification
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  linkUrl?: string
): Promise<Notification> => {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      linkUrl,
    },
  });
};

/**
 * Create notifications for multiple users
 */
export const createNotificationForUsers = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  linkUrl?: string
): Promise<number> => {
  const notifications = await prisma.$transaction(
    userIds.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          linkUrl,
        },
      })
    )
  );

  return notifications.length;
};

/**
 * Get notifications for a user with pagination
 */
export const getUserNotifications = async (
  userId: string,
  params: { page?: number; limit?: number; includeRead?: boolean } = {}
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> => {
  const { page = 1, limit = 20, includeRead = true } = params;
  const skip = (page - 1) * limit;

  // Create where clause
  const whereClause: any = { userId };
  if (!includeRead) {
    whereClause.isRead = false;
  }

  // Execute queries in parallel
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: whereClause,
    }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
  };
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<Notification> => {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId: string): Promise<number> => {
  const result = await prisma.notification.deleteMany({
    where: { userId },
  });

  return result.count;
};

/**
 * Clean up old read notifications (e.g., for maintenance)
 * By default, removes notifications older than 30 days that have been read
 */
export const cleanupOldNotifications = async (daysOld: number = 30): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      isRead: true,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
};

/**
 * Aggregate similar notifications to prevent notification spam
 * This can be called periodically by a scheduled job
 */
export const aggregateSimilarNotifications = async (userId: string): Promise<number> => {
  // Get recent unread notifications
  const recentNotifications = await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
      createdAt: {
        gte: new Date(Date.now() - 12 * 60 * 60 * 1000), // Last 12 hours
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Group by type
  const notificationsByType: Record<string, Notification[]> = {};
  
  recentNotifications.forEach(notification => {
    if (!notificationsByType[notification.type]) {
      notificationsByType[notification.type] = [];
    }
    notificationsByType[notification.type].push(notification);
  });

  let aggregatedCount = 0;

  // Process each group
  for (const [type, notifications] of Object.entries(notificationsByType)) {
    if (notifications.length > 3) {
      // If more than 3 notifications of the same type, aggregate them
      const idsToDelete = notifications.slice(1).map(n => n.id);
      
      // Update first notification to indicate aggregation
      await prisma.notification.update({
        where: { id: notifications[0].id },
        data: {
          message: `Vous avez ${notifications.length} notifications de ce type`,
          title: `${notifications.length} ${notifications[0].title}`,
        },
      });
      
      // Delete the others
      await prisma.notification.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });
      
      aggregatedCount += idsToDelete.length;
    }
  }

  return aggregatedCount;
};

/**
 * Create a session reminder notification
 */
export const createSessionReminderNotification = async (
  userId: string,
  sessionId: string,
  sessionDate: Date,
  sessionTitle: string
): Promise<Notification> => {
  // Format date for display
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  const formattedDate = sessionDate.toLocaleDateString('fr-FR', dateOptions);
  
  return createNotification(
    userId,
    'SESSION_REMINDER',
    'Rappel de session',
    `Rappel: Vous avez une session de conduite prévue le ${formattedDate} (${sessionTitle})`,
    `/sessions/${sessionId}`
  );
};

/**
 * Create a competency mastered notification
 */
export const createCompetencyMasteredNotification = async (
  userId: string,
  competencyId: string,
  competencyName: string,
  roadbookId: string
): Promise<Notification> => {
  return createNotification(
    userId,
    'COMPETENCY_MASTERED',
    'Compétence maîtrisée',
    `Félicitations! Vous avez maîtrisé la compétence "${competencyName}"`,
    `/roadbooks/${roadbookId}/competencies/${competencyId}`
  );
};

/**
 * Create a badge earned notification
 */
export const createBadgeEarnedNotification = async (
  userId: string,
  badgeId: string,
  badgeName: string
): Promise<Notification> => {
  return createNotification(
    userId,
    'BADGE_EARNED',
    'Badge obtenu',
    `Félicitations! Vous avez obtenu le badge "${badgeName}"`,
    `/profile/badges`
  );
};

/**
 * Send session validation request notification to guide/instructor
 */
export const createSessionValidationRequestNotification = async (
  validatorId: string,
  sessionId: string,
  apprenticeName: string
): Promise<Notification> => {
  return createNotification(
    validatorId,
    'SESSION_VALIDATION',
    'Demande de validation',
    `${apprenticeName} vous demande de valider une session de conduite`,
    `/sessions/${sessionId}/validate`
  );
};
