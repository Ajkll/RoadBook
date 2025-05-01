"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionValidationRequestNotification = exports.createBadgeEarnedNotification = exports.createCompetencyMasteredNotification = exports.createSessionReminderNotification = exports.aggregateSimilarNotifications = exports.cleanupOldNotifications = exports.deleteAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getUserNotifications = exports.createNotificationForUsers = exports.createNotification = void 0;
const prisma_1 = require("../config/prisma");
/**
 * Create a new notification
 */
const createNotification = async (userId, type, title, message, linkUrl) => {
    return prisma_1.prisma.notification.create({
        data: {
            userId,
            type,
            title,
            message,
            linkUrl,
        },
    });
};
exports.createNotification = createNotification;
/**
 * Create notifications for multiple users
 */
const createNotificationForUsers = async (userIds, type, title, message, linkUrl) => {
    const notifications = await prisma_1.prisma.$transaction(userIds.map(userId => prisma_1.prisma.notification.create({
        data: {
            userId,
            type,
            title,
            message,
            linkUrl,
        },
    })));
    return notifications.length;
};
exports.createNotificationForUsers = createNotificationForUsers;
/**
 * Get notifications for a user with pagination
 */
const getUserNotifications = async (userId, params = {}) => {
    const { page = 1, limit = 20, includeRead = true } = params;
    const skip = (page - 1) * limit;
    // Create where clause
    const whereClause = { userId };
    if (!includeRead) {
        whereClause.isRead = false;
    }
    // Execute queries in parallel
    const [notifications, total, unreadCount] = await Promise.all([
        prisma_1.prisma.notification.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limit,
        }),
        prisma_1.prisma.notification.count({
            where: whereClause,
        }),
        prisma_1.prisma.notification.count({
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
exports.getUserNotifications = getUserNotifications;
/**
 * Get unread notification count for a user
 */
const getUnreadCount = async (userId) => {
    return prisma_1.prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
};
exports.getUnreadCount = getUnreadCount;
/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
    return prisma_1.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });
};
exports.markAsRead = markAsRead;
/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
    const result = await prisma_1.prisma.notification.updateMany({
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
exports.markAllAsRead = markAllAsRead;
/**
 * Delete a notification
 */
const deleteNotification = async (notificationId) => {
    try {
        await prisma_1.prisma.notification.delete({
            where: { id: notificationId },
        });
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.deleteNotification = deleteNotification;
/**
 * Delete all notifications for a user
 */
const deleteAllNotifications = async (userId) => {
    const result = await prisma_1.prisma.notification.deleteMany({
        where: { userId },
    });
    return result.count;
};
exports.deleteAllNotifications = deleteAllNotifications;
/**
 * Clean up old read notifications (e.g., for maintenance)
 * By default, removes notifications older than 30 days that have been read
 */
const cleanupOldNotifications = async (daysOld = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await prisma_1.prisma.notification.deleteMany({
        where: {
            isRead: true,
            createdAt: {
                lt: cutoffDate,
            },
        },
    });
    return result.count;
};
exports.cleanupOldNotifications = cleanupOldNotifications;
/**
 * Aggregate similar notifications to prevent notification spam
 * This can be called periodically by a scheduled job
 */
const aggregateSimilarNotifications = async (userId) => {
    // Get recent unread notifications
    const recentNotifications = await prisma_1.prisma.notification.findMany({
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
    const notificationsByType = {};
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
            await prisma_1.prisma.notification.update({
                where: { id: notifications[0].id },
                data: {
                    message: `Vous avez ${notifications.length} notifications de ce type`,
                    title: `${notifications.length} ${notifications[0].title}`,
                },
            });
            // Delete the others
            await prisma_1.prisma.notification.deleteMany({
                where: {
                    id: { in: idsToDelete },
                },
            });
            aggregatedCount += idsToDelete.length;
        }
    }
    return aggregatedCount;
};
exports.aggregateSimilarNotifications = aggregateSimilarNotifications;
/**
 * Create a session reminder notification
 */
const createSessionReminderNotification = async (userId, sessionId, sessionDate, sessionTitle) => {
    // Format date for display
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    const formattedDate = sessionDate.toLocaleDateString('fr-FR', dateOptions);
    return (0, exports.createNotification)(userId, 'SESSION_REMINDER', 'Rappel de session', `Rappel: Vous avez une session de conduite prévue le ${formattedDate} (${sessionTitle})`, `/sessions/${sessionId}`);
};
exports.createSessionReminderNotification = createSessionReminderNotification;
/**
 * Create a competency mastered notification
 */
const createCompetencyMasteredNotification = async (userId, competencyId, competencyName, roadbookId) => {
    return (0, exports.createNotification)(userId, 'COMPETENCY_MASTERED', 'Compétence maîtrisée', `Félicitations! Vous avez maîtrisé la compétence "${competencyName}"`, `/roadbooks/${roadbookId}/competencies/${competencyId}`);
};
exports.createCompetencyMasteredNotification = createCompetencyMasteredNotification;
/**
 * Create a badge earned notification
 */
const createBadgeEarnedNotification = async (userId, badgeId, badgeName) => {
    return (0, exports.createNotification)(userId, 'BADGE_EARNED', 'Badge obtenu', `Félicitations! Vous avez obtenu le badge "${badgeName}"`, `/profile/badges`);
};
exports.createBadgeEarnedNotification = createBadgeEarnedNotification;
/**
 * Send session validation request notification to guide/instructor
 */
const createSessionValidationRequestNotification = async (validatorId, sessionId, apprenticeName) => {
    return (0, exports.createNotification)(validatorId, 'SESSION_VALIDATION', 'Demande de validation', `${apprenticeName} vous demande de valider une session de conduite`, `/sessions/${sessionId}/validate`);
};
exports.createSessionValidationRequestNotification = createSessionValidationRequestNotification;
