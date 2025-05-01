import { Request, Response } from 'express';
import * as notificationController from '../controllers/notification.controller';
import * as notificationService from '../services/notification.service';
import { prisma } from '../config/prisma';

// Mock notification service
jest.mock('../services/notification.service');
// Mock prisma
jest.mock('../config/prisma', () => ({
  prisma: {
    notification: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Notification Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnValue({});
    responseStatus = jest.fn().mockReturnThis();

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user1' },
    };

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('should get user notifications successfully', async () => {
      const mockNotifications = {
        notifications: [{ id: 'notif1', title: 'Test Notification' }],
        total: 1,
        unreadCount: 1,
      };
      
      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      await notificationController.getUserNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith('user1', expect.any(Object));
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockNotifications);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await notificationController.getUserNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication required'
      }));
    });

    it('should pass pagination parameters to service', async () => {
      mockRequest.query = {
        page: '2',
        limit: '10',
        includeRead: 'false',
      };

      await notificationController.getUserNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        'user1',
        {
          page: 2,
          limit: 10,
          includeRead: false,
        }
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread count successfully', async () => {
      (notificationService.getUnreadCount as jest.Mock).mockResolvedValue(5);

      await notificationController.getUnreadCount(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.getUnreadCount).toHaveBeenCalledWith('user1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ count: 5 });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await notificationController.getUnreadCount(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      mockRequest.params = { notificationId: 'notif1' };
      
      const updatedNotification = {
        id: 'notif1',
        userId: 'user1',
        isRead: true,
      };
      
      (notificationService.markAsRead as jest.Mock).mockResolvedValue(updatedNotification);

      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(updatedNotification);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 403 if notification belongs to another user', async () => {
      mockRequest.params = { notificationId: 'notif1' };
      
      const updatedNotification = {
        id: 'notif1',
        userId: 'user2', // Different user
        isRead: true,
      };
      
      (notificationService.markAsRead as jest.Mock).mockResolvedValue(updatedNotification);

      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(403);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      (notificationService.markAllAsRead as jest.Mock).mockResolvedValue(10);

      await notificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('user1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: '10 notifications marked as read'
      }));
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await notificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      mockRequest.params = { notificationId: 'notif1' };
      
      // Mock finding the notification
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
      });
      
      // Mock deleting the notification
      (notificationService.deleteNotification as jest.Mock).mockResolvedValue(true);

      await notificationController.deleteNotification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.deleteNotification).toHaveBeenCalledWith('notif1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Notification deleted successfully'
      }));
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await notificationController.deleteNotification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 404 if notification not found', async () => {
      mockRequest.params = { notificationId: 'notif1' };
      
      // Mock notification not found
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

      await notificationController.deleteNotification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(404);
    });

    it('should return 403 if notification belongs to another user', async () => {
      mockRequest.params = { notificationId: 'notif1' };
      
      // Mock finding notification belonging to another user
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: 'notif1',
        userId: 'user2',
      });

      await notificationController.deleteNotification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications successfully', async () => {
      (notificationService.deleteAllNotifications as jest.Mock).mockResolvedValue(5);

      await notificationController.deleteAllNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.deleteAllNotifications).toHaveBeenCalledWith('user1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: '5 notifications deleted'
      }));
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await notificationController.deleteAllNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });
  });

  describe('cleanupOldNotifications', () => {
    it('should clean up old notifications successfully as admin', async () => {
      mockRequest.user = { id: 'admin1', role: 'ADMIN' };
      
      (notificationService.cleanupOldNotifications as jest.Mock).mockResolvedValue(15);

      await notificationController.cleanupOldNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.cleanupOldNotifications).toHaveBeenCalledWith(30); // Default daysOld
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: '15 old notifications deleted'
      }));
    });

    it('should return 403 if not admin', async () => {
      mockRequest.user = { id: 'user1', role: 'APPRENTICE' };

      await notificationController.cleanupOldNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(403);
    });

    it('should use custom daysOld parameter', async () => {
      mockRequest.user = { id: 'admin1', role: 'ADMIN' };
      mockRequest.query = { daysOld: '60' };
      
      (notificationService.cleanupOldNotifications as jest.Mock).mockResolvedValue(20);

      await notificationController.cleanupOldNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(notificationService.cleanupOldNotifications).toHaveBeenCalledWith(60);
    });
  });
});