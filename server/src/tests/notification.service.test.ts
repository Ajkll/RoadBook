import { PrismaClient, Notification, NotificationType } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import * as notificationService from '../services/notification.service';
import { mockPrisma } from './mocks/prisma.mock';
import { prisma } from '../config/prisma';

jest.mock('../config/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Notification Service', () => {
  beforeEach(() => {
    mockReset(mockPrisma);
    jest.clearAllMocks();
  });

  // Sample notification data
  const sampleNotification: Notification = {
    id: 'notif1',
    userId: 'user1',
    type: 'BADGE_EARNED' as NotificationType,
    title: 'New Badge',
    message: 'Congratulations! You earned a new badge',
    isRead: false,
    linkUrl: '/badges',
    createdAt: new Date(),
  };

  describe('createNotification', () => {
    it('should create a notification', async () => {
      mockPrisma.notification.create.mockResolvedValue(sampleNotification);

      const result = await notificationService.createNotification(
        'user1',
        'BADGE_EARNED',
        'New Badge',
        'Congratulations! You earned a new badge',
        '/badges'
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          type: 'BADGE_EARNED',
          title: 'New Badge',
          message: 'Congratulations! You earned a new badge',
          linkUrl: '/badges',
        },
      });
      expect(result).toEqual(sampleNotification);
    });
  });

  describe('createNotificationForUsers', () => {
    it('should create notifications for multiple users', async () => {
      mockPrisma.$transaction.mockResolvedValue([sampleNotification, sampleNotification]);

      const result = await notificationService.createNotificationForUsers(
        ['user1', 'user2'],
        'BADGE_EARNED',
        'New Badge',
        'Congratulations! You earned a new badge',
        '/badges'
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(2); // Should return count of created notifications
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with pagination', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([sampleNotification]);
      mockPrisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const result = await notificationService.getUserNotifications('user1', {
        page: 1,
        limit: 20,
        includeRead: true,
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' },
          skip: 0,
          take: 20,
        })
      );
      expect(result).toEqual({
        notifications: [sampleNotification],
        total: 1,
        unreadCount: 1,
      });
    });

    it('should filter out read notifications if includeRead is false', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      await notificationService.getUserNotifications('user1', {
        includeRead: false,
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1', isRead: false },
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count for a user', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await notificationService.getUnreadCount('user1');

      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          isRead: false,
        },
      });
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const readNotification = { ...sampleNotification, isRead: true };
      mockPrisma.notification.update.mockResolvedValue(readNotification);

      const result = await notificationService.markAsRead('notif1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: { isRead: true },
      });
      expect(result).toEqual(readNotification);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 10 });

      const result = await notificationService.markAllAsRead('user1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      expect(result).toBe(10);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockPrisma.notification.delete.mockResolvedValue(sampleNotification);

      const result = await notificationService.deleteNotification('notif1');

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif1' },
      });
      expect(result).toBe(true);
    });

    it('should return false if deletion fails', async () => {
      mockPrisma.notification.delete.mockRejectedValue(new Error('Not found'));

      const result = await notificationService.deleteNotification('invalid-id');

      expect(result).toBe(false);
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications for a user', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 5 });

      const result = await notificationService.deleteAllNotifications('user1');

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
      expect(result).toBe(5);
    });
  });

  describe('cleanupOldNotifications', () => {
    it('should clean up old read notifications', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 15 });

      const result = await notificationService.cleanupOldNotifications(30);

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          isRead: true,
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
      expect(result).toBe(15);
    });
  });

  describe('aggregateSimilarNotifications', () => {
    it('should aggregate similar notifications', async () => {
      // Mock finding many notifications of the same type
      mockPrisma.notification.findMany.mockResolvedValue([
        { ...sampleNotification, id: 'notif1', type: 'BADGE_EARNED' },
        { ...sampleNotification, id: 'notif2', type: 'BADGE_EARNED' },
        { ...sampleNotification, id: 'notif3', type: 'BADGE_EARNED' },
        { ...sampleNotification, id: 'notif4', type: 'BADGE_EARNED' },
      ]);

      // Mock updating first notification
      mockPrisma.notification.update.mockResolvedValue({} as any);
      
      // Mock deleting aggregated notifications
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 3 });

      const result = await notificationService.aggregateSimilarNotifications('user1');

      // Expecting calls to find notifications, update the first one, and delete the rest
      expect(mockPrisma.notification.findMany).toHaveBeenCalled();
      expect(mockPrisma.notification.update).toHaveBeenCalled();
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalled();
      
      // Should return number of aggregated notifications
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Specialized notification creation functions', () => {
    beforeEach(() => {
      // Mock the base createNotification function
      jest.spyOn(notificationService, 'createNotification').mockResolvedValue(sampleNotification);
    });

    it('should create session reminder notification', async () => {
      const result = await notificationService.createSessionReminderNotification(
        'user1',
        'session1',
        new Date(),
        'Driving practice'
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        'user1',
        'SESSION_REMINDER',
        'Rappel de session',
        expect.any(String),
        '/sessions/session1'
      );
      expect(result).toEqual(sampleNotification);
    });

    it('should create competency mastered notification', async () => {
      const result = await notificationService.createCompetencyMasteredNotification(
        'user1',
        'comp1',
        'Parallel Parking',
        'roadbook1'
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        'user1',
        'COMPETENCY_MASTERED',
        'Compétence maîtrisée',
        expect.stringContaining('Parallel Parking'),
        '/roadbooks/roadbook1/competencies/comp1'
      );
      expect(result).toEqual(sampleNotification);
    });

    it('should create badge earned notification', async () => {
      const result = await notificationService.createBadgeEarnedNotification(
        'user1',
        'badge1',
        'First Drive'
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        'user1',
        'BADGE_EARNED',
        'Badge obtenu',
        expect.stringContaining('First Drive'),
        '/profile/badges'
      );
      expect(result).toEqual(sampleNotification);
    });

    it('should create session validation request notification', async () => {
      const result = await notificationService.createSessionValidationRequestNotification(
        'user1',
        'session1',
        'John Doe'
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        'user1',
        'SESSION_VALIDATION',
        'Demande de validation',
        expect.stringContaining('John Doe'),
        '/sessions/session1/validate'
      );
      expect(result).toEqual(sampleNotification);
    });
  });
});