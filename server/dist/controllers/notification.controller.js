"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldNotifications = exports.deleteAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getUserNotifications = void 0;
const notificationService = __importStar(require("../services/notification.service"));
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Get all notifications for the authenticated user
 */
const getUserNotifications = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const includeRead = req.query.includeRead !== 'false';
        const result = await notificationService.getUserNotifications(userId, {
            page,
            limit,
            includeRead,
        });
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.default.error(`Error getting user notifications: ${error.message}`);
        return res.status(500).json({ message: 'Failed to retrieve notifications' });
    }
};
exports.getUserNotifications = getUserNotifications;
/**
 * Get unread notification count for the authenticated user
 */
const getUnreadCount = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const count = await notificationService.getUnreadCount(userId);
        return res.status(200).json({ count });
    }
    catch (error) {
        logger_1.default.error(`Error getting unread count: ${error.message}`);
        return res.status(500).json({ message: 'Failed to get unread count' });
    }
};
exports.getUnreadCount = getUnreadCount;
/**
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
    }
    catch (error) {
        logger_1.default.error(`Error marking notification as read: ${error.message}`);
        return res.status(500).json({ message: 'Failed to mark notification as read' });
    }
};
exports.markAsRead = markAsRead;
/**
 * Mark all notifications as read for the authenticated user
 */
const markAllAsRead = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const count = await notificationService.markAllAsRead(userId);
        return res.status(200).json({ message: `${count} notifications marked as read` });
    }
    catch (error) {
        logger_1.default.error(`Error marking all notifications as read: ${error.message}`);
        return res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
};
exports.markAllAsRead = markAllAsRead;
/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { notificationId } = req.params;
        // Need to check ownership before deleting
        const notification = await prisma_1.prisma.notification.findUnique({
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
    }
    catch (error) {
        logger_1.default.error(`Error deleting notification: ${error.message}`);
        return res.status(500).json({ message: 'Failed to delete notification' });
    }
};
exports.deleteNotification = deleteNotification;
/**
 * Delete all notifications for the authenticated user
 */
const deleteAllNotifications = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const count = await notificationService.deleteAllNotifications(userId);
        return res.status(200).json({ message: `${count} notifications deleted` });
    }
    catch (error) {
        logger_1.default.error(`Error deleting all notifications: ${error.message}`);
        return res.status(500).json({ message: 'Failed to delete all notifications' });
    }
};
exports.deleteAllNotifications = deleteAllNotifications;
/**
 * Maintenance endpoint for cleaning up old notifications
 * This would typically be called by a scheduled job, not directly by a user
 */
const cleanupOldNotifications = async (req, res) => {
    var _a;
    try {
        // Only admins can trigger this
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin privileges required' });
        }
        const daysOld = req.query.daysOld ? parseInt(req.query.daysOld) : 30;
        const count = await notificationService.cleanupOldNotifications(daysOld);
        return res.status(200).json({ message: `${count} old notifications deleted` });
    }
    catch (error) {
        logger_1.default.error(`Error cleaning up old notifications: ${error.message}`);
        return res.status(500).json({ message: 'Failed to clean up old notifications' });
    }
};
exports.cleanupOldNotifications = cleanupOldNotifications;
