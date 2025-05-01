import { ListingStatus, ListingType, PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock the Prisma client
jest.mock('../config/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '../config/prisma';
import * as marketplaceService from '../services/marketplace.service';

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Marketplace Service', () => {
  // Sample data
  const sampleUser = {
    id: 'user1',
    displayName: 'Test User',
    role: 'INSTRUCTOR',
    email: 'test@example.com',
    profilePicture: null,
    passwordHash: 'hash',
  };

  const sampleListing = {
    id: 'listing1',
    title: 'Test Listing',
    description: 'Test description',
    price: 25.99,
    type: 'SERVICE' as ListingType,
    status: 'ACTIVE' as ListingStatus,
    imageUrls: ['/images/test.jpg'],
    sellerId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const samplePurchase = {
    id: 'purchase1',
    listingId: 'listing1',
    buyerId: 'user2',
    quantity: 1,
    totalPrice: 25.99,
    status: 'COMPLETED',
    purchaseDate: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockReset(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create a new listing for an instructor', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({ ...sampleUser, role: 'INSTRUCTOR' });
      mockPrisma.marketplaceListing.create.mockResolvedValue(sampleListing);
      
      const listingData = {
        title: 'Test Listing',
        description: 'Test description',
        price: 25.99,
        type: 'SERVICE' as ListingType,
      };

      // Act
      const result = await marketplaceService.createListing('user1', listingData);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: { role: true },
      });
      
      expect(mockPrisma.marketplaceListing.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sellerId: 'user1',
          title: 'Test Listing',
          description: 'Test description',
          price: 25.99,
          type: 'SERVICE',
          status: 'DRAFT',
        }),
      });
      
      expect(result).toEqual(sampleListing);
    });

    it('should throw an error if user is not an instructor or admin', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({ ...sampleUser, role: 'APPRENTICE' });
      
      const listingData = {
        title: 'Test Listing',
        description: 'Test description',
        price: 25.99,
        type: 'SERVICE' as ListingType,
      };

      // Act & Assert
      await expect(marketplaceService.createListing('user1', listingData)).rejects.toThrow(
        'Only instructors and administrators can create marketplace listings'
      );
    });

    it('should throw an error if price is negative', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({ ...sampleUser, role: 'INSTRUCTOR' });
      
      const listingData = {
        title: 'Test Listing',
        description: 'Test description',
        price: -5,
        type: 'SERVICE' as ListingType,
      };

      // Act & Assert
      await expect(marketplaceService.createListing('user1', listingData)).rejects.toThrow(
        'Price cannot be negative'
      );
    });
  });

  describe('getListings', () => {
    it('should get listings with filtering and pagination', async () => {
      // Arrange
      const listings = [sampleListing];
      mockPrisma.marketplaceListing.count.mockResolvedValue(1);
      mockPrisma.marketplaceListing.findMany.mockResolvedValue(listings as any);
      
      // Act
      const result = await marketplaceService.getListings(
        { page: 1, limit: 10, sort: 'price', order: 'asc' },
        { type: 'SERVICE', minPrice: 20, maxPrice: 30 }
      );

      // Assert
      expect(mockPrisma.marketplaceListing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'ACTIVE',
          type: 'SERVICE',
          price: { gte: 20, lte: 30 },
        }),
      });
      
      expect(mockPrisma.marketplaceListing.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'ACTIVE',
          type: 'SERVICE',
          price: { gte: 20, lte: 30 },
        }),
        skip: 0,
        take: 10,
        orderBy: { price: 'asc' },
        include: expect.any(Object),
      });
      
      expect(result).toEqual({
        listings,
        total: 1,
        pages: 1,
      });
    });

    it('should apply search filters correctly', async () => {
      // Arrange
      const listings = [sampleListing];
      mockPrisma.marketplaceListing.count.mockResolvedValue(1);
      mockPrisma.marketplaceListing.findMany.mockResolvedValue(listings as any);
      
      // Act
      const result = await marketplaceService.getListings(
        { page: 1, limit: 10 },
        { search: 'driving' }
      );

      // Assert
      expect(mockPrisma.marketplaceListing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'ACTIVE',
          OR: [
            { title: { contains: 'driving', mode: 'insensitive' } },
            { description: { contains: 'driving', mode: 'insensitive' } },
          ],
        }),
      });
      
      expect(result.listings).toEqual(listings);
    });
  });

  describe('getListingById', () => {
    it('should get a listing by ID with seller details', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue(
        { 
          ...sampleListing, 
          seller: sampleUser 
        } as any
      );

      // Act
      const result = await marketplaceService.getListingById('listing1');

      // Assert
      expect(mockPrisma.marketplaceListing.findUnique).toHaveBeenCalledWith({
        where: { id: 'listing1' },
        include: expect.objectContaining({
          seller: expect.any(Object),
        }),
      });
      
      expect(result).toEqual(expect.objectContaining({
        id: 'listing1',
        title: 'Test Listing',
        seller: expect.objectContaining({
          id: 'user1',
          displayName: 'Test User',
        }),
      }));
    });

    it('should return null for non-existent listing', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue(null);

      // Act
      const result = await marketplaceService.getListingById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateListing', () => {
    it('should update a listing if user is the seller', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue({ sellerId: 'user1' });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'INSTRUCTOR' });
      mockPrisma.marketplaceListing.update.mockResolvedValue(
        { ...sampleListing, title: 'Updated Title' } as any
      );
      
      // Act
      const result = await marketplaceService.updateListing(
        'listing1',
        'user1',
        { title: 'Updated Title' }
      );

      // Assert
      expect(mockPrisma.marketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing1' },
        data: { title: 'Updated Title' },
      });
      
      expect(result.title).toBe('Updated Title');
    });

    it('should throw an error if user is not the seller or admin', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue({ sellerId: 'user1' });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'APPRENTICE' });
      
      // Act & Assert
      await expect(
        marketplaceService.updateListing('listing1', 'user2', { title: 'Updated Title' })
      ).rejects.toThrow('You do not have permission to update this listing');
    });

    it('should throw an error if listing does not exist', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue(null);
      
      // Act & Assert
      await expect(
        marketplaceService.updateListing('nonexistent', 'user1', { title: 'Updated Title' })
      ).rejects.toThrow('Listing not found');
    });
  });

  describe('createPurchase', () => {
    it('should create a purchase successfully', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue({
        ...sampleListing,
        title: 'Cours de perfectionnement',
        sellerId: 'seller1',
      });
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      
      mockPrisma.purchase.create.mockResolvedValue(samplePurchase);
      mockPrisma.notification.create.mockResolvedValue({} as any);
      
      // Act
      const result = await marketplaceService.createPurchase('listing1', 'user2', 1);

      // Assert
      expect(mockPrisma.purchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          listingId: 'listing1',
          buyerId: 'user2',
          quantity: 1,
          totalPrice: 25.99,
          status: 'COMPLETED',
        }),
      });
      
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(samplePurchase);
    });

    it('should throw an error if listing does not exist', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue(null);
      
      // Act & Assert
      await expect(
        marketplaceService.createPurchase('nonexistent', 'user2', 1)
      ).rejects.toThrow('Listing not found');
    });

    it('should throw an error if listing is not active', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue({
        ...sampleListing,
        status: 'DRAFT' as ListingStatus,
      });
      
      // Act & Assert
      await expect(
        marketplaceService.createPurchase('listing1', 'user2', 1)
      ).rejects.toThrow('This listing is not available for purchase');
    });

    it('should throw an error if trying to purchase own listing', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue({
        ...sampleListing,
        sellerId: 'user2',
      });
      
      // Act & Assert
      await expect(
        marketplaceService.createPurchase('listing1', 'user2', 1)
      ).rejects.toThrow('You cannot purchase your own listing');
    });
  });

  describe('getUserPurchases', () => {
    it('should get user purchases with pagination', async () => {
      // Arrange
      const purchases = [samplePurchase];
      mockPrisma.purchase.count.mockResolvedValue(1);
      mockPrisma.purchase.findMany.mockResolvedValue(purchases as any);
      
      // Act
      const result = await marketplaceService.getUserPurchases('user2', { page: 1, limit: 10 });

      // Assert
      expect(mockPrisma.purchase.count).toHaveBeenCalledWith({
        where: { buyerId: 'user2' },
      });
      
      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith({
        where: { buyerId: 'user2' },
        skip: 0,
        take: 10,
        orderBy: { purchaseDate: 'desc' },
        include: expect.any(Object),
      });
      
      expect(result).toEqual({
        purchases,
        total: 1,
        pages: 1,
      });
    });
  });

  describe('searchListings', () => {
    it('should search listings by query', async () => {
      // Arrange
      const listings = [sampleListing];
      mockPrisma.marketplaceListing.count.mockResolvedValue(1);
      mockPrisma.marketplaceListing.findMany.mockResolvedValue(listings as any);
      
      // Act
      const result = await marketplaceService.searchListings('driving');

      // Assert
      expect(mockPrisma.marketplaceListing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          AND: [
            { status: 'ACTIVE' },
            {
              OR: [
                { title: { contains: 'driving', mode: 'insensitive' } },
                { description: { contains: 'driving', mode: 'insensitive' } },
              ],
            },
          ],
        }),
      });
      
      expect(result.listings).toEqual(listings);
    });
  });

  describe('changeListingStatus', () => {
    it('should publish a listing with all required fields', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique
        .mockResolvedValueOnce({ sellerId: 'user1' })
        .mockResolvedValueOnce({
          title: 'Test Listing',
          description: 'Description',
          price: 25.99,
          imageUrls: ['/images/test.jpg'],
        });
      
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'INSTRUCTOR' });
      mockPrisma.marketplaceListing.update.mockResolvedValue(
        { ...sampleListing, status: 'ACTIVE' } as any
      );
      
      // Act
      const result = await marketplaceService.changeListingStatus(
        'listing1',
        'user1',
        'ACTIVE' as ListingStatus
      );

      // Assert
      expect(mockPrisma.marketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing1' },
        data: { status: 'ACTIVE' },
      });
      
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw an error if trying to publish incomplete listing', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique
        .mockResolvedValueOnce({ sellerId: 'user1' })
        .mockResolvedValueOnce({
          title: 'Test Listing',
          description: 'Description',
          price: 25.99,
          imageUrls: [], // Empty image URLs
        });
      
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'INSTRUCTOR' });
      
      // Act & Assert
      await expect(
        marketplaceService.changeListingStatus('listing1', 'user1', 'ACTIVE' as ListingStatus)
      ).rejects.toThrow('Cannot publish listing without at least one image');
    });
  });

  describe('deleteListing', () => {
    it('should delete a listing with no purchases', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue({
        sellerId: 'user1',
        purchases: [],
      });
      
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'INSTRUCTOR' });
      mockPrisma.marketplaceListing.delete.mockResolvedValue({} as any);
      
      // Act
      const result = await marketplaceService.deleteListing('listing1', 'user1');

      // Assert
      expect(mockPrisma.marketplaceListing.delete).toHaveBeenCalledWith({
        where: { id: 'listing1' },
      });
      
      expect(result).toBe(true);
    });

    it('should archive instead of delete if listing has purchases', async () => {
      // Arrange
      mockPrisma.marketplaceListing.findUnique.mockResolvedValue({
        sellerId: 'user1',
        purchases: [{ id: 'purchase1' }],
      });
      
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'INSTRUCTOR' });
      mockPrisma.marketplaceListing.update.mockResolvedValue({} as any);
      
      // Act
      const result = await marketplaceService.deleteListing('listing1', 'user1');

      // Assert
      expect(mockPrisma.marketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing1' },
        data: { status: 'ARCHIVED' },
      });
      
      expect(result).toBe(true);
    });
  });
});