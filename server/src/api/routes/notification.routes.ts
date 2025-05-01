import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../../middleware/auth.middleware';
import * as notificationController from '../../controllers/notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notifications as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

// Admin-only route for cleanup
router.post('/cleanup', authorizeAdmin, notificationController.cleanupOldNotifications);

export default router;
