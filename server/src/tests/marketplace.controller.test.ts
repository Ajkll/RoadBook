import { Request, Response } from 'express';
import * as marketplaceService from '../services/marketplace.service';
import * as marketplaceController from '../controllers/marketplace.controller';
import { ListingStatus, ListingType } from '@prisma/client';

// Mock the marketplace service
jest.mock('../services/marketplace.service');

describe('Marketplace Controller', () => {
  // Mock request and response objects
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseStatus: jest.Mock;
  let responseJson: jest.Mock;

  beforeEach(() => {
    responseStatus = jest.fn().mockReturnThis();
    responseJson = jest.fn().mockReturnThis();

    mockRequest = {
      user: { id: 'user1' },
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };

    jest.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create a listing and return 201 status', async () => {
      // Arrange
      const listingData = {
        title: 'Test Listing',
        description: 'Test Description',
        price: 29.99,
        type: 'SERVICE' as ListingType,
      };

      const createdListing = {
        id: 'listing1',
        ...listingData,
        sellerId: 'user1',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = listingData;
      (marketplaceService.createListing as jest.Mock).mockResolvedValue(createdListing);

      // Act
      await marketplaceController.createListing(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.createListing).toHaveBeenCalledWith('user1', listingData);
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(createdListing);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await marketplaceController.createListing(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.createListing).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 400 if service throws an error', async () => {
      // Arrange
      mockRequest.body = {
        title: 'Test Listing',
        description: 'Test Description',
        price: 29.99,
        type: 'SERVICE',
      };

      const errorMessage = 'Only instructors can create listings';
      (marketplaceService.createListing as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      await marketplaceController.createListing(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('getListings', () => {
    it('should return listings with pagination and filters', async () => {
      // Arrange
      mockRequest.query = {
        page: '2',
        limit: '5',
        sort: 'price',
        order: 'asc',
        type: 'SERVICE',
        minPrice: '10',
        maxPrice: '50',
        search: 'driving',
      };

      const mockResult = {
        listings: [{ id: 'listing1', title: 'Driving Lesson' }],
        total: 10,
        pages: 2,
      };

      (marketplaceService.getListings as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await marketplaceController.getListings(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.getListings).toHaveBeenCalledWith(
        {
          page: 2,
          limit: 5,
          sort: 'price',
          order: 'asc',
        },
        {
          type: 'SERVICE',
          minPrice: 10,
          maxPrice: 50,
          search: 'driving',
        }
      );

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getListingById', () => {
    it('should return a listing by ID', async () => {
      // Arrange
      mockRequest.params = { id: 'listing1' };
      const mockListing = { id: 'listing1', title: 'Test Listing' };
      (marketplaceService.getListingById as jest.Mock).mockResolvedValue(mockListing);

      // Act
      await marketplaceController.getListingById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.getListingById).toHaveBeenCalledWith('listing1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockListing);
    });

    it('should return 404 if listing not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };
      (marketplaceService.getListingById as jest.Mock).mockResolvedValue(null);

      // Act
      await marketplaceController.getListingById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Listing not found' });
    });
  });

  describe('updateListing', () => {
    it('should update a listing and return 200 status', async () => {
      // Arrange
      mockRequest.params = { id: 'listing1' };
      mockRequest.body = { title: 'Updated Title' };
      
      const updatedListing = {
        id: 'listing1',
        title: 'Updated Title',
        description: 'Test Description',
        sellerId: 'user1',
      };
      
      (marketplaceService.updateListing as jest.Mock).mockResolvedValue(updatedListing);

      // Act
      await marketplaceController.updateListing(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.updateListing).toHaveBeenCalledWith(
        'listing1',
        'user1',
        { title: 'Updated Title' }
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(updatedListing);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { id: 'listing1' };

      // Act
      await marketplaceController.updateListing(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.updateListing).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 403 if user does not have permission', async () => {
      // Arrange
      mockRequest.params = { id: 'listing1' };
      mockRequest.body = { title: 'Updated Title' };
      
      const errorMessage = 'You do not have permission to update this listing';
      (marketplaceService.updateListing as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      await marketplaceController.updateListing(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('changeListingStatus', () => {
    it('should change listing status and return 200', async () => {
      // Arrange
      mockRequest.params = { id: 'listing1' };
      mockRequest.body = { status: 'ACTIVE' };
      
      const updatedListing = {
        id: 'listing1',
        title: 'Test Listing',
        status: 'ACTIVE' as ListingStatus,
      };
      
      (marketplaceService.changeListingStatus as jest.Mock).mockResolvedValue(updatedListing);

      // Act
      await marketplaceController.changeListingStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.changeListingStatus).toHaveBeenCalledWith(
        'listing1',
        'user1',
        'ACTIVE'
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(updatedListing);
    });

    it('should return 400 if status is invalid', async () => {
      // Arrange
      mockRequest.params = { id: 'listing1' };
      mockRequest.body = { status: 'INVALID_STATUS' };

      // Act
      await marketplaceController.changeListingStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.changeListingStatus).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Invalid status value' });
    });
  });

  describe('createPurchase', () => {
    it('should create a purchase and return 201 status', async () => {
      // Arrange
      mockRequest.body = { listingId: 'listing1', quantity: '2' };
      
      const createdPurchase = {
        id: 'purchase1',
        listingId: 'listing1',
        buyerId: 'user1',
        quantity: 2,
        totalPrice: 59.98,
        status: 'COMPLETED',
      };
      
      (marketplaceService.createPurchase as jest.Mock).mockResolvedValue(createdPurchase);

      // Act
      await marketplaceController.createPurchase(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.createPurchase).toHaveBeenCalledWith(
        'listing1',
        'user1',
        2
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(createdPurchase);
    });

    it('should return 400 if listingId is missing', async () => {
      // Arrange
      mockRequest.body = { quantity: '2' };

      // Act
      await marketplaceController.createPurchase(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.createPurchase).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'listingId is required' });
    });
  });

  describe('getUserPurchases', () => {
    it('should return user purchases with pagination', async () => {
      // Arrange
      mockRequest.query = {
        page: '1',
        limit: '10',
      };
      
      const mockResult = {
        purchases: [{ id: 'purchase1', listingId: 'listing1' }],
        total: 1,
        pages: 1,
      };
      
      (marketplaceService.getUserPurchases as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await marketplaceController.getUserPurchases(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.getUserPurchases).toHaveBeenCalledWith(
        'user1',
        {
          page: 1,
          limit: 10,
          sort: 'purchaseDate',
          order: 'desc',
        }
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getPurchaseById', () => {
    it('should return purchase details', async () => {
      // Arrange
      mockRequest.params = { id: 'purchase1' };
      
      const mockPurchase = {
        id: 'purchase1',
        listingId: 'listing1',
        buyerId: 'user1',
        listing: { title: 'Test Listing' },
      };
      
      (marketplaceService.getPurchaseById as jest.Mock).mockResolvedValue(mockPurchase);

      // Act
      await marketplaceController.getPurchaseById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.getPurchaseById).toHaveBeenCalledWith('purchase1', 'user1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockPurchase);
    });

    it('should return 403 if user does not have permission', async () => {
      // Arrange
      mockRequest.params = { id: 'purchase1' };
      
      const errorMessage = 'You do not have permission to view this purchase';
      (marketplaceService.getPurchaseById as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      await marketplaceController.getPurchaseById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('searchListings', () => {
    it('should search listings and return results', async () => {
      // Arrange
      mockRequest.query = {
        query: 'driving',
        page: '1',
        limit: '10',
      };
      
      const mockResult = {
        listings: [{ id: 'listing1', title: 'Driving Lesson' }],
        total: 1,
        pages: 1,
      };
      
      (marketplaceService.searchListings as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await marketplaceController.searchListings(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.searchListings).toHaveBeenCalledWith(
        'driving',
        {
          page: 1,
          limit: 10,
          sort: 'createdAt',
          order: 'desc',
        }
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 if query is missing', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await marketplaceController.searchListings(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(marketplaceService.searchListings).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Search query is required' });
    });
  });
});