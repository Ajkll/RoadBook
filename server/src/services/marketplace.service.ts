import { Prisma, PrismaClient, MarketplaceListing, ListingStatus, ListingType, Purchase } from '@prisma/client';
import { prisma } from '../config/prisma';

// Pagination type
type PaginationParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
};

// Filter type
type FilterParams = {
  type?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  status?: ListingStatus;
  search?: string;
};

/**
 * Create a new marketplace listing
 * @param sellerId ID of the seller
 * @param data Listing data
 * @returns Created listing
 */
export const createListing = async (
  sellerId: string,
  data: {
    title: string;
    description: string;
    price: number;
    type: ListingType;
    imageUrls?: string[];
  }
): Promise<MarketplaceListing> => {
  // Validate user role
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { role: true },
  });

  // Only instructors and admins can create listings
  if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
    throw new Error('Only instructors and administrators can create marketplace listings');
  }

  // Validate price
  if (data.price < 0) {
    throw new Error('Price cannot be negative');
  }

  return prisma.marketplaceListing.create({
    data: {
      sellerId,
      title: data.title,
      description: data.description,
      price: data.price,
      type: data.type,
      status: ListingStatus.DRAFT, // Start as draft
      imageUrls: data.imageUrls || [],
    },
  });
};

/**
 * Get all marketplace listings with filtering and pagination
 * @param params Pagination parameters
 * @param filters Filter parameters
 * @returns Listings with pagination info
 */
export const getListings = async (
  params: PaginationParams = {},
  filters: FilterParams = {}
): Promise<{ listings: MarketplaceListing[]; total: number; pages: number }> => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
  const skip = (page - 1) * limit;
  
  // Build filter
  const whereClause: Prisma.MarketplaceListingWhereInput = {
    status: ListingStatus.ACTIVE, // By default, only show active listings
  };
  
  // Apply additional filters if provided
  if (filters.type) {
    whereClause.type = filters.type;
  }
  
  if (filters.status) {
    whereClause.status = filters.status;
  }
  
  // Initialize price filter if any price filter is specified
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    whereClause.price = {};
    
    if (filters.minPrice !== undefined) {
      whereClause.price.gte = filters.minPrice;
    }
    
    if (filters.maxPrice !== undefined) {
      whereClause.price.lte = filters.maxPrice;
    }
  }
  
  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  
  // Count total listings
  const total = await prisma.marketplaceListing.count({ where: whereClause });
  
  // Get listings with pagination
  const listings = await prisma.marketplaceListing.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { [sort]: order },
    include: {
      seller: {
        select: {
          id: true,
          displayName: true,
          profilePicture: true,
          role: true,
        },
      },
      _count: {
        select: {
          purchases: true,
        },
      },
    },
  });
  
  return {
    listings: listings as any, // Type cast because of _count
    total,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get a listing by ID
 * @param listingId ID of the listing
 * @returns Listing with details
 */
export const getListingById = async (
  listingId: string
): Promise<MarketplaceListing | null> => {
  return prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    include: {
      seller: {
        select: {
          id: true,
          displayName: true,
          profilePicture: true,
          role: true,
          email: true,
          phoneNumber: true,
        },
      },
      _count: {
        select: {
          purchases: true,
        },
      },
    },
  }) as any; // Type cast because of _count
};

/**
 * Update a listing
 * @param listingId ID of the listing
 * @param userId ID of the user making the update
 * @param data Updated listing data
 * @returns Updated listing
 */
export const updateListing = async (
  listingId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    price: number;
    type: ListingType;
    status: ListingStatus;
    imageUrls: string[];
  }>
): Promise<MarketplaceListing> => {
  // Check if listing exists and belongs to user
  const existingListing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });
  
  if (!existingListing) {
    throw new Error('Listing not found');
  }
  
  // Check permission - must be seller or admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  if (existingListing.sellerId !== userId && user?.role !== 'ADMIN') {
    throw new Error('You do not have permission to update this listing');
  }
  
  // Validate price if provided
  if (data.price !== undefined && data.price < 0) {
    throw new Error('Price cannot be negative');
  }
  
  // Update listing
  return prisma.marketplaceListing.update({
    where: { id: listingId },
    data: data as Prisma.MarketplaceListingUpdateInput,
  });
};

/**
 * Delete a listing
 * @param listingId ID of the listing
 * @param userId ID of the user making the deletion
 * @returns Success boolean
 */
export const deleteListing = async (
  listingId: string,
  userId: string
): Promise<boolean> => {
  // Check if listing exists and user has permission
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    include: {
      purchases: {
        select: { id: true },
        take: 1,
      }
    }
  });
  
  if (!listing) {
    throw new Error('Listing not found');
  }
  
  // Check permission
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  if (listing.sellerId !== userId && user?.role !== 'ADMIN') {
    throw new Error('You do not have permission to delete this listing');
  }
  
  // If there are purchases, archive instead of delete
  if (listing.purchases && listing.purchases.length > 0) {
    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { status: ListingStatus.ARCHIVED },
    });
    return true;
  }
  
  // If no purchases, delete the listing
  await prisma.marketplaceListing.delete({ where: { id: listingId } });
  return true;
};

/**
 * Change listing status (publish, archive, etc.)
 * @param listingId ID of the listing
 * @param userId ID of the user making the status change
 * @param status New status
 * @returns Updated listing
 */
export const changeListingStatus = async (
  listingId: string,
  userId: string,
  status: ListingStatus
): Promise<MarketplaceListing> => {
  // Check if listing exists and user has permission
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });
  
  if (!listing) {
    throw new Error('Listing not found');
  }
  
  // Check permission
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  if (listing.sellerId !== userId && user?.role !== 'ADMIN') {
    throw new Error('You do not have permission to update this listing');
  }
  
  // If attempting to publish, perform validation
  if (status === ListingStatus.ACTIVE) {
    const completeCheck = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { 
        title: true, 
        description: true, 
        price: true,
        imageUrls: true 
      },
    });
    
    // Check for required fields
    if (!completeCheck?.title || !completeCheck.description || completeCheck.price === undefined) {
      throw new Error('Cannot publish incomplete listing. Title, description, and price are required.');
    }
    
    // Require at least one image
    if (!completeCheck.imageUrls || completeCheck.imageUrls.length === 0) {
      throw new Error('Cannot publish listing without at least one image');
    }
  }
  
  // Update status
  return prisma.marketplaceListing.update({
    where: { id: listingId },
    data: { status },
  });
};

/**
 * Get listings for a specific seller
 * @param sellerId ID of the seller
 * @param params Pagination parameters
 * @returns Listings with pagination info
 */
export const getSellerListings = async (
  sellerId: string,
  params: PaginationParams = {}
): Promise<{ listings: MarketplaceListing[]; total: number; pages: number }> => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
  const skip = (page - 1) * limit;
  
  // Count total listings by seller
  const total = await prisma.marketplaceListing.count({ where: { sellerId } });
  
  // Get listings with pagination
  const listings = await prisma.marketplaceListing.findMany({
    where: { sellerId },
    skip,
    take: limit,
    orderBy: { [sort]: order },
    include: {
      _count: {
        select: {
          purchases: true,
        },
      },
    },
  });
  
  return {
    listings: listings as any, // Type cast because of _count
    total,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Create a purchase (simulated transaction)
 * @param listingId ID of the listing to purchase
 * @param buyerId ID of the buyer
 * @param quantity Quantity to purchase
 * @returns Created purchase
 */
export const createPurchase = async (
  listingId: string,
  buyerId: string,
  quantity: number = 1
): Promise<Purchase> => {
  // Validate quantity
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }
  
  // Get listing details
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      sellerId: true,
      price: true,
      status: true,
      title: true,
    },
  });
  
  if (!listing) {
    throw new Error('Listing not found');
  }
  
  // Check if listing is active
  if (listing.status !== ListingStatus.ACTIVE) {
    throw new Error('This listing is not available for purchase');
  }
  
  // Prevent buying own listing
  if (listing.sellerId === buyerId) {
    throw new Error('You cannot purchase your own listing');
  }
  
  // Calculate total price
  const totalPrice = listing.price * quantity;
  
  // Create purchase in transaction
  const purchase = await prisma.$transaction(async (tx) => {
    // Create purchase record
    const purchase = await tx.purchase.create({
      data: {
        listingId,
        buyerId,
        quantity,
        totalPrice,
        status: 'COMPLETED', // For POC, transactions are immediately completed
      },
    });
    
    // If a service or course was purchased, create a notification for the seller
    if (listing.title.includes('Cours') || listing.title.includes('Formation')) {
      await tx.notification.create({
        data: {
          userId: listing.sellerId,
          type: 'MARKETPLACE_UPDATE',
          title: 'Nouvelle réservation',
          message: `Un utilisateur a réservé votre service "${listing.title}"`,
          linkUrl: `/marketplace/purchases/${purchase.id}`,
        },
      });
      
      // Also create notification for buyer
      await tx.notification.create({
        data: {
          userId: buyerId,
          type: 'MARKETPLACE_UPDATE',
          title: 'Achat confirmé',
          message: `Votre réservation pour "${listing.title}" est confirmée`,
          linkUrl: `/marketplace/purchases/${purchase.id}`,
        },
      });
    }
    
    return purchase;
  });
  
  return purchase;
};

/**
 * Get purchase history for a user
 * @param userId ID of the user
 * @param params Pagination parameters
 * @returns Purchases with pagination info
 */
export const getUserPurchases = async (
  userId: string,
  params: PaginationParams = {}
): Promise<{ purchases: Purchase[]; total: number; pages: number }> => {
  const { page = 1, limit = 10, sort = 'purchaseDate', order = 'desc' } = params;
  const skip = (page - 1) * limit;
  
  // Count total purchases
  const total = await prisma.purchase.count({ where: { buyerId: userId } });
  
  // Get purchases with pagination
  const purchases = await prisma.purchase.findMany({
    where: { buyerId: userId },
    skip,
    take: limit,
    orderBy: { [sort]: order },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          type: true,
          imageUrls: true,
          seller: {
            select: {
              id: true,
              displayName: true,
              profilePicture: true,
            },
          },
        },
      },
    },
  });
  
  return {
    purchases: purchases as any,
    total,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get purchases for a specific listing
 * @param listingId ID of the listing
 * @param sellerId ID of the seller (for validation)
 * @param params Pagination parameters
 * @returns Purchases with pagination info
 */
export const getListingPurchases = async (
  listingId: string,
  sellerId: string,
  params: PaginationParams = {}
): Promise<{ purchases: Purchase[]; total: number; pages: number }> => {
  const { page = 1, limit = 10, sort = 'purchaseDate', order = 'desc' } = params;
  const skip = (page - 1) * limit;
  
  // Check if listing belongs to seller
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });
  
  if (!listing) {
    throw new Error('Listing not found');
  }
  
  // Check permission
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { role: true },
  });
  
  if (listing.sellerId !== sellerId && user?.role !== 'ADMIN') {
    throw new Error('You do not have permission to view these purchases');
  }
  
  // Count total purchases
  const total = await prisma.purchase.count({ where: { listingId } });
  
  // Get purchases with pagination
  const purchases = await prisma.purchase.findMany({
    where: { listingId },
    skip,
    take: limit,
    orderBy: { [sort]: order },
    include: {
      buyer: {
        select: {
          id: true,
          displayName: true,
          profilePicture: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });
  
  return {
    purchases: purchases as any,
    total,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get purchase details
 * @param purchaseId ID of the purchase
 * @param userId ID of the user requesting details
 * @returns Purchase details
 */
export const getPurchaseById = async (
  purchaseId: string,
  userId: string
): Promise<Purchase | null> => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          type: true,
          imageUrls: true,
          sellerId: true,
          seller: {
            select: {
              id: true,
              displayName: true,
              profilePicture: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      },
      buyer: {
        select: {
          id: true,
          displayName: true,
          profilePicture: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });
  
  if (!purchase) {
    throw new Error('Purchase not found');
  }
  
  // Check if user is buyer, seller, or admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  if (
    purchase.buyerId !== userId && 
    purchase.listing.sellerId !== userId && 
    user?.role !== 'ADMIN'
  ) {
    throw new Error('You do not have permission to view this purchase');
  }
  
  return purchase;
};

/**
 * Search marketplace listings
 * @param query Search query
 * @param params Pagination parameters
 * @returns Filtered listings with pagination info
 */
export const searchListings = async (
  query: string,
  params: PaginationParams = {}
): Promise<{ listings: MarketplaceListing[]; total: number; pages: number }> => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
  const skip = (page - 1) * limit;
  
  // Build search filter
  const whereClause: Prisma.MarketplaceListingWhereInput = {
    AND: [
      { status: ListingStatus.ACTIVE }, // Only show active listings
      {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
    ],
  };
  
  // Count total matching listings
  const total = await prisma.marketplaceListing.count({ where: whereClause });
  
  // Get listings with pagination
  const listings = await prisma.marketplaceListing.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { [sort]: order },
    include: {
      seller: {
        select: {
          id: true,
          displayName: true,
          profilePicture: true,
          role: true,
        },
      },
      _count: {
        select: {
          purchases: true,
        },
      },
    },
  });
  
  return {
    listings: listings as any, // Type cast because of _count
    total,
    pages: Math.ceil(total / limit),
  };
};