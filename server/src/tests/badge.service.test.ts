import { Badge, PrismaClient, User, UserBadge } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import * as badgeService from '../services/badge.service';
import { mockPrisma } from './mocks/prisma.mock';
import { prisma } from '../config/prisma';
import { checkBadgeCriteria } from '../utils/badge-criteria';

jest.mock('../config/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../utils/badge-criteria', () => ({
  checkBadgeCriteria: jest.fn(),
}));

describe('Badge Service', () => {
  const mockCheckBadgeCriteria = checkBadgeCriteria as jest.MockedFunction<typeof checkBadgeCriteria>;

  beforeEach(() => {
    mockReset(mockPrisma);
    jest.clearAllMocks();
  });

  // Sample data
  const sampleBadge: Badge = {
    id: 'badge1',
    name: 'First Session',
    description: 'Completed first driving session',
    imageUrl: '/badges/first-session.svg',
    category: 'BEGINNER',
    criteria: 'FIRST_SESSION',
  };

  const sampleUser: User = {
    id: 'user1',
    email: 'user@example.com',
    passwordHash: 'hash',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'APPRENTICE',
    nationalRegisterNumber: null,
    birthDate: null,
    phoneNumber: null,
    profilePicture: null,
    address: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleUserBadge: UserBadge = {
    id: 'ub1',
    userId: 'user1',
    badgeId: 'badge1',
    awardedAt: new Date(),
  };

  describe('getAllBadges', () => {
    it('should return all badges with user count', async () => {
      const expectedBadges = [{
        ...sampleBadge,
        _count: { userBadges: 5 },
      }];
      
      mockPrisma.badge.findMany.mockResolvedValue(expectedBadges);

      const result = await badgeService.getAllBadges();

      expect(mockPrisma.badge.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { userBadges: true } } },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(expectedBadges);
    });
  });

  describe('getBadgeById', () => {
    it('should return a badge by id', async () => {
      mockPrisma.badge.findUnique.mockResolvedValue(sampleBadge);

      const result = await badgeService.getBadgeById('badge1');

      expect(mockPrisma.badge.findUnique).toHaveBeenCalledWith({
        where: { id: 'badge1' },
      });
      expect(result).toEqual(sampleBadge);
    });

    it('should return null if badge not found', async () => {
      mockPrisma.badge.findUnique.mockResolvedValue(null);

      const result = await badgeService.getBadgeById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserBadges', () => {
    it('should return badges for a user', async () => {
      const userBadgesWithBadge = [{
        ...sampleUserBadge,
        badge: sampleBadge,
      }];
      
      mockPrisma.userBadge.findMany.mockResolvedValue(userBadgesWithBadge);

      const result = await badgeService.getUserBadges('user1');

      expect(mockPrisma.userBadge.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: { badge: true },
        orderBy: { awardedAt: 'desc' },
      });
      expect(result).toEqual(userBadgesWithBadge);
    });
  });

  describe('awardBadge', () => {
    it('should award a badge to a user', async () => {
      const userBadgeWithBadge = {
        ...sampleUserBadge,
        badge: sampleBadge,
      };
      
      mockPrisma.userBadge.findFirst.mockResolvedValue(null);
      mockPrisma.userBadge.create.mockResolvedValue(userBadgeWithBadge);
      mockPrisma.notification.create.mockResolvedValue({} as any);

      const result = await badgeService.awardBadge('user1', 'badge1');

      expect(mockPrisma.userBadge.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user1', badgeId: 'badge1' },
      });
      expect(mockPrisma.userBadge.create).toHaveBeenCalledWith({
        data: { userId: 'user1', badgeId: 'badge1' },
        include: { badge: true },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(result).toEqual(userBadgeWithBadge);
    });

    it('should throw an error if user already has the badge', async () => {
      mockPrisma.userBadge.findFirst.mockResolvedValue(sampleUserBadge);

      await expect(badgeService.awardBadge('user1', 'badge1')).rejects.toThrow('User already has this badge');

      expect(mockPrisma.userBadge.create).not.toHaveBeenCalled();
    });
  });

  describe('revokeBadge', () => {
    it('should revoke a badge from a user', async () => {
      mockPrisma.userBadge.deleteMany.mockResolvedValue({ count: 1 });

      await badgeService.revokeBadge('user1', 'badge1');

      expect(mockPrisma.userBadge.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1', badgeId: 'badge1' },
      });
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should check criteria and award new badges', async () => {
      const userWithBadges = {
        ...sampleUser,
        receivedBadges: [{ badgeId: 'existingBadge' }],
      };
      
      const badges = [
        sampleBadge,
        { ...sampleBadge, id: 'badge2', name: 'Second Badge' },
        { ...sampleBadge, id: 'existingBadge', name: 'Existing Badge' },
      ];
      
      const userBadgeWithBadge = {
        ...sampleUserBadge,
        badge: sampleBadge,
      };

      mockPrisma.user.findUnique.mockResolvedValue(userWithBadges);
      mockPrisma.badge.findMany.mockResolvedValue(badges);
      mockCheckBadgeCriteria.mockImplementation(async (userId, criteria) => {
        // Only return true for the first badge to simulate meeting criteria
        return userId === 'user1' && badges[0].id === 'badge1';
      });
      mockPrisma.userBadge.findFirst.mockResolvedValue(null);
      mockPrisma.userBadge.create.mockResolvedValue(userBadgeWithBadge);
      mockPrisma.notification.create.mockResolvedValue({} as any);

      const result = await badgeService.checkAndAwardBadges('user1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: { receivedBadges: { select: { badgeId: true } } },
      });
      expect(mockCheckBadgeCriteria).toHaveBeenCalledTimes(2); // Should be called for non-existing badges
      expect(mockPrisma.userBadge.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(userBadgeWithBadge);
    });

    it('should throw an error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(badgeService.checkAndAwardBadges('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('Badge management (admin functions)', () => {
    it('should create a new badge', async () => {
      mockPrisma.badge.create.mockResolvedValue(sampleBadge);

      const result = await badgeService.createBadge(sampleBadge);

      expect(mockPrisma.badge.create).toHaveBeenCalledWith({
        data: sampleBadge,
      });
      expect(result).toEqual(sampleBadge);
    });

    it('should update a badge', async () => {
      const updatedBadge = { ...sampleBadge, name: 'Updated Badge Name' };
      mockPrisma.badge.update.mockResolvedValue(updatedBadge);

      const result = await badgeService.updateBadge('badge1', { name: 'Updated Badge Name' });

      expect(mockPrisma.badge.update).toHaveBeenCalledWith({
        where: { id: 'badge1' },
        data: { name: 'Updated Badge Name' },
      });
      expect(result).toEqual(updatedBadge);
    });

    it('should delete a badge and its associations', async () => {
      mockPrisma.userBadge.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.badge.delete.mockResolvedValue(sampleBadge);

      await badgeService.deleteBadge('badge1');

      expect(mockPrisma.userBadge.deleteMany).toHaveBeenCalledWith({
        where: { badgeId: 'badge1' },
      });
      expect(mockPrisma.badge.delete).toHaveBeenCalledWith({
        where: { id: 'badge1' },
      });
    });
  });

  describe('getBadgesByCategory', () => {
    it('should return badges filtered by category', async () => {
      mockPrisma.badge.findMany.mockResolvedValue([sampleBadge]);

      const result = await badgeService.getBadgesByCategory('BEGINNER');

      expect(mockPrisma.badge.findMany).toHaveBeenCalledWith({
        where: { category: 'BEGINNER' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([sampleBadge]);
    });
  });

  describe('getBadgeLeaderboard', () => {
    it('should return a leaderboard of users with badge counts', async () => {
      const leaderboardData = [
        {
          id: 'user1',
          displayName: 'Test User',
          profilePicture: null,
          _count: { receivedBadges: 10 },
          receivedBadges: [{ badge: { name: 'Badge 1', imageUrl: '/img.svg', category: 'TEST' }, awardedAt: new Date() }],
        },
      ];
      
      mockPrisma.user.findMany.mockResolvedValue(leaderboardData);

      const result = await badgeService.getBadgeLeaderboard(5);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          displayName: true,
          profilePicture: true,
          _count: expect.any(Object),
          receivedBadges: expect.any(Object),
        }),
        orderBy: expect.any(Object),
        take: 5,
      });
      expect(result).toEqual(leaderboardData);
    });
  });
});
