import { Request, Response } from 'express';
import * as badgeController from '../controllers/badge.controller';
import * as badgeService from '../services/badge.service';

// Mock badge service
jest.mock('../services/badge.service');

describe('Badge Controller', () => {
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
      user: { id: 'user123' },
    };

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    jest.clearAllMocks();
  });

  describe('getAllBadges', () => {
    it('should get all badges successfully', async () => {
      const mockBadges = [{ id: 'badge1', name: 'Test Badge' }];
      (badgeService.getAllBadges as jest.Mock).mockResolvedValue(mockBadges);

      await badgeController.getAllBadges(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getAllBadges).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockBadges);
    });

    it('should handle errors', async () => {
      (badgeService.getAllBadges as jest.Mock).mockRejectedValue(new Error('Test error'));

      await badgeController.getAllBadges(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getAllBadges).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Failed to retrieve badges'
      }));
    });
  });

  describe('getBadgeById', () => {
    it('should get a badge by id successfully', async () => {
      const mockBadge = { id: 'badge1', name: 'Test Badge' };
      mockRequest.params = { badgeId: 'badge1' };
      (badgeService.getBadgeById as jest.Mock).mockResolvedValue(mockBadge);

      await badgeController.getBadgeById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getBadgeById).toHaveBeenCalledWith('badge1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockBadge);
    });

    it('should return 404 when badge not found', async () => {
      mockRequest.params = { badgeId: 'nonexistent' };
      (badgeService.getBadgeById as jest.Mock).mockResolvedValue(null);

      await badgeController.getBadgeById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getBadgeById).toHaveBeenCalledWith('nonexistent');
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Badge not found'
      }));
    });
  });

  describe('getUserBadges', () => {
    it('should get user badges successfully', async () => {
      const mockUserBadges = [{ id: 'ub1', userId: 'user123', badgeId: 'badge1' }];
      mockRequest.params = { userId: 'user123' };
      (badgeService.getUserBadges as jest.Mock).mockResolvedValue(mockUserBadges);

      await badgeController.getUserBadges(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getUserBadges).toHaveBeenCalledWith('user123');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockUserBadges);
    });
  });

  describe('getMyBadges', () => {
    it('should get current user badges successfully', async () => {
      const mockUserBadges = [{ id: 'ub1', userId: 'user123', badgeId: 'badge1' }];
      (badgeService.getUserBadges as jest.Mock).mockResolvedValue(mockUserBadges);

      await badgeController.getMyBadges(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getUserBadges).toHaveBeenCalledWith('user123');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockUserBadges);
    });

    it('should return 401 when not authenticated', async () => {
      mockRequest.user = undefined;

      await badgeController.getMyBadges(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getUserBadges).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication required'
      }));
    });
  });

  describe('awardBadge', () => {
    it('should award a badge successfully', async () => {
      const mockUserBadge = { 
        id: 'ub1', 
        userId: 'user123', 
        badgeId: 'badge1',
        badge: { name: 'Test Badge' }
      };
      mockRequest.body = { userId: 'user123', badgeId: 'badge1' };
      (badgeService.awardBadge as jest.Mock).mockResolvedValue(mockUserBadge);

      await badgeController.awardBadge(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.awardBadge).toHaveBeenCalledWith('user123', 'badge1');
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockUserBadge);
    });

    it('should return 400 when missing required fields', async () => {
      mockRequest.body = { userId: 'user123' }; // Missing badgeId

      await badgeController.awardBadge(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.awardBadge).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User ID and badge ID are required'
      }));
    });

    it('should return 409 when user already has the badge', async () => {
      mockRequest.body = { userId: 'user123', badgeId: 'badge1' };
      const error = new Error('User already has this badge');
      (badgeService.awardBadge as jest.Mock).mockRejectedValue(error);

      await badgeController.awardBadge(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.awardBadge).toHaveBeenCalledWith('user123', 'badge1');
      expect(responseStatus).toHaveBeenCalledWith(409);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User already has this badge'
      }));
    });
  });

  describe('revokeBadge', () => {
    it('should revoke a badge successfully', async () => {
      mockRequest.params = { userId: 'user123', badgeId: 'badge1' };

      await badgeController.revokeBadge(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.revokeBadge).toHaveBeenCalledWith('user123', 'badge1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Badge revoked successfully'
      }));
    });
  });

  describe('checkAndAwardMyBadges', () => {
    it('should check and award badges successfully', async () => {
      const mockAwardedBadges = [{ 
        id: 'ub1', 
        userId: 'user123', 
        badgeId: 'badge1',
        badge: { name: 'Test Badge' }
      }];
      (badgeService.checkAndAwardBadges as jest.Mock).mockResolvedValue(mockAwardedBadges);

      await badgeController.checkAndAwardMyBadges(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.checkAndAwardBadges).toHaveBeenCalledWith('user123');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        message: '1 new badge(s) awarded',
        badges: mockAwardedBadges
      });
    });

    it('should return 401 when not authenticated', async () => {
      mockRequest.user = undefined;

      await badgeController.checkAndAwardMyBadges(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.checkAndAwardBadges).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication required'
      }));
    });
  });

  describe('Admin operations', () => {
    describe('createBadge', () => {
      it('should create a badge successfully', async () => {
        const mockBadge = { 
          id: 'badge1', 
          name: 'Test Badge',
          description: 'Test Description',
          imageUrl: 'http://test.com/badge.png',
          category: 'TEST',
          criteria: 'TEST_CRITERIA'
        };
        mockRequest.body = { 
          name: 'Test Badge',
          description: 'Test Description',
          imageUrl: 'http://test.com/badge.png',
          category: 'TEST',
          criteria: 'TEST_CRITERIA'
        };
        (badgeService.createBadge as jest.Mock).mockResolvedValue(mockBadge);

        await badgeController.createBadge(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(badgeService.createBadge).toHaveBeenCalledWith(mockRequest.body);
        expect(responseStatus).toHaveBeenCalledWith(201);
        expect(responseJson).toHaveBeenCalledWith(mockBadge);
      });
    });

    describe('updateBadge', () => {
      it('should update a badge successfully', async () => {
        const mockBadge = { 
          id: 'badge1', 
          name: 'Updated Badge',
          description: 'Updated Description',
          imageUrl: 'http://test.com/badge.png',
          category: 'TEST',
          criteria: 'TEST_CRITERIA'
        };
        mockRequest.params = { badgeId: 'badge1' };
        mockRequest.body = { name: 'Updated Badge', description: 'Updated Description' };
        (badgeService.updateBadge as jest.Mock).mockResolvedValue(mockBadge);

        await badgeController.updateBadge(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(badgeService.updateBadge).toHaveBeenCalledWith('badge1', mockRequest.body);
        expect(responseStatus).toHaveBeenCalledWith(200);
        expect(responseJson).toHaveBeenCalledWith(mockBadge);
      });
    });

    describe('deleteBadge', () => {
      it('should delete a badge successfully', async () => {
        mockRequest.params = { badgeId: 'badge1' };

        await badgeController.deleteBadge(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(badgeService.deleteBadge).toHaveBeenCalledWith('badge1');
        expect(responseStatus).toHaveBeenCalledWith(200);
        expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Badge deleted successfully'
        }));
      });
    });
  });

  describe('getBadgesByCategory', () => {
    it('should get badges by category successfully', async () => {
      const mockBadges = [{ id: 'badge1', name: 'Test Badge', category: 'BEGINNER' }];
      mockRequest.params = { category: 'BEGINNER' };
      (badgeService.getBadgesByCategory as jest.Mock).mockResolvedValue(mockBadges);

      await badgeController.getBadgesByCategory(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getBadgesByCategory).toHaveBeenCalledWith('BEGINNER');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockBadges);
    });
  });

  describe('getBadgeLeaderboard', () => {
    it('should get badge leaderboard successfully', async () => {
      const mockLeaderboard = [
        { id: 'user1', displayName: 'User 1', _count: { receivedBadges: 10 } }
      ];
      (badgeService.getBadgeLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);

      await badgeController.getBadgeLeaderboard(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getBadgeLeaderboard).toHaveBeenCalledWith(10); // Default limit
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockLeaderboard);
    });

    it('should respect the limit parameter', async () => {
      const mockLeaderboard = [
        { id: 'user1', displayName: 'User 1', _count: { receivedBadges: 10 } }
      ];
      mockRequest.query = { limit: '5' };
      (badgeService.getBadgeLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);

      await badgeController.getBadgeLeaderboard(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(badgeService.getBadgeLeaderboard).toHaveBeenCalledWith(5);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockLeaderboard);
    });
  });
});