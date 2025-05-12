"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchListings = exports.getPurchaseById = exports.getListingPurchases = exports.getUserPurchases = exports.createPurchase = exports.getSellerListings = exports.changeListingStatus = exports.deleteListing = exports.updateListing = exports.getListingById = exports.getListings = exports.createListing = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
/**
 * Create a new marketplace listing
 * @param sellerId ID of the seller
 * @param data Listing data
 * @returns Created listing
 */
const createListing = async (sellerId, data) => {
    // Validate user role
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: sellerId },
        select: { role: true },
    });
    // Only instructors and admins can create listings
    if ((user === null || user === void 0 ? void 0 : user.role) !== 'INSTRUCTOR' && (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
        throw new Error('Only instructors and administrators can create marketplace listings');
    }
    // Validate price
    if (data.price < 0) {
        throw new Error('Price cannot be negative');
    }
    return prisma_1.prisma.marketplaceListing.create({
        data: {
            sellerId,
            title: data.title,
            description: data.description,
            price: data.price,
            type: data.type,
            status: client_1.ListingStatus.DRAFT, // Start as draft
            imageUrls: data.imageUrls || [],
        },
    });
};
exports.createListing = createListing;
/**
 * Get all marketplace listings with filtering and pagination
 * @param params Pagination parameters
 * @param filters Filter parameters
 * @returns Listings with pagination info
 */
const getListings = async (params = {}, filters = {}) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    // Build filter
    const whereClause = {
        status: client_1.ListingStatus.ACTIVE, // By default, only show active listings
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
    const total = await prisma_1.prisma.marketplaceListing.count({ where: whereClause });
    // Get listings with pagination
    const listings = await prisma_1.prisma.marketplaceListing.findMany({
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
        listings: listings, // Type cast because of _count
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.getListings = getListings;
/**
 * Get a listing by ID
 * @param listingId ID of the listing
 * @returns Listing with details
 */
const getListingById = async (listingId) => {
    return prisma_1.prisma.marketplaceListing.findUnique({
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
    }); // Type cast because of _count
};
exports.getListingById = getListingById;
/**
 * Update a listing
 * @param listingId ID of the listing
 * @param userId ID of the user making the update
 * @param data Updated listing data
 * @returns Updated listing
 */
const updateListing = async (listingId, userId, data) => {
    // Check if listing exists and belongs to user
    const existingListing = await prisma_1.prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        select: { sellerId: true },
    });
    if (!existingListing) {
        throw new Error('Listing not found');
    }
    // Check permission - must be seller or admin
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (existingListing.sellerId !== userId && (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
        throw new Error('You do not have permission to update this listing');
    }
    // Validate price if provided
    if (data.price !== undefined && data.price < 0) {
        throw new Error('Price cannot be negative');
    }
    // Update listing
    return prisma_1.prisma.marketplaceListing.update({
        where: { id: listingId },
        data: data,
    });
};
exports.updateListing = updateListing;
/**
 * Delete a listing
 * @param listingId ID of the listing
 * @param userId ID of the user making the deletion
 * @returns Success boolean
 */
const deleteListing = async (listingId, userId) => {
    // Check if listing exists and user has permission
    const listing = await prisma_1.prisma.marketplaceListing.findUnique({
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
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (listing.sellerId !== userId && (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
        throw new Error('You do not have permission to delete this listing');
    }
    // If there are purchases, archive instead of delete
    if (listing.purchases && listing.purchases.length > 0) {
        await prisma_1.prisma.marketplaceListing.update({
            where: { id: listingId },
            data: { status: client_1.ListingStatus.ARCHIVED },
        });
        return true;
    }
    // If no purchases, delete the listing
    await prisma_1.prisma.marketplaceListing.delete({ where: { id: listingId } });
    return true;
};
exports.deleteListing = deleteListing;
/**
 * Change listing status (publish, archive, etc.)
 * @param listingId ID of the listing
 * @param userId ID of the user making the status change
 * @param status New status
 * @returns Updated listing
 */
const changeListingStatus = async (listingId, userId, status) => {
    // Check if listing exists and user has permission
    const listing = await prisma_1.prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        select: { sellerId: true },
    });
    if (!listing) {
        throw new Error('Listing not found');
    }
    // Check permission
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (listing.sellerId !== userId && (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
        throw new Error('You do not have permission to update this listing');
    }
    // If attempting to publish, perform validation
    if (status === client_1.ListingStatus.ACTIVE) {
        const completeCheck = await prisma_1.prisma.marketplaceListing.findUnique({
            where: { id: listingId },
            select: {
                title: true,
                description: true,
                price: true,
                imageUrls: true
            },
        });
        // Check for required fields
        if (!(completeCheck === null || completeCheck === void 0 ? void 0 : completeCheck.title) || !completeCheck.description || completeCheck.price === undefined) {
            throw new Error('Cannot publish incomplete listing. Title, description, and price are required.');
        }
        // Require at least one image
        if (!completeCheck.imageUrls || completeCheck.imageUrls.length === 0) {
            throw new Error('Cannot publish listing without at least one image');
        }
    }
    // Update status
    return prisma_1.prisma.marketplaceListing.update({
        where: { id: listingId },
        data: { status },
    });
};
exports.changeListingStatus = changeListingStatus;
/**
 * Get listings for a specific seller
 * @param sellerId ID of the seller
 * @param params Pagination parameters
 * @returns Listings with pagination info
 */
const getSellerListings = async (sellerId, params = {}) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    // Count total listings by seller
    const total = await prisma_1.prisma.marketplaceListing.count({ where: { sellerId } });
    // Get listings with pagination
    const listings = await prisma_1.prisma.marketplaceListing.findMany({
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
        listings: listings, // Type cast because of _count
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.getSellerListings = getSellerListings;
/**
 * Create a purchase (simulated transaction)
 * @param listingId ID of the listing to purchase
 * @param buyerId ID of the buyer
 * @param quantity Quantity to purchase
 * @returns Created purchase
 */
const createPurchase = async (listingId, buyerId, quantity = 1) => {
    // Validate quantity
    if (quantity <= 0) {
        throw new Error('Quantity must be greater than zero');
    }
    // Get listing details
    const listing = await prisma_1.prisma.marketplaceListing.findUnique({
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
    if (listing.status !== client_1.ListingStatus.ACTIVE) {
        throw new Error('This listing is not available for purchase');
    }
    // Prevent buying own listing
    if (listing.sellerId === buyerId) {
        throw new Error('You cannot purchase your own listing');
    }
    // Calculate total price
    const totalPrice = listing.price * quantity;
    // Create purchase in transaction
    const purchase = await prisma_1.prisma.$transaction(async (tx) => {
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
exports.createPurchase = createPurchase;
/**
 * Get purchase history for a user
 * @param userId ID of the user
 * @param params Pagination parameters
 * @returns Purchases with pagination info
 */
const getUserPurchases = async (userId, params = {}) => {
    const { page = 1, limit = 10, sort = 'purchaseDate', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    // Count total purchases
    const total = await prisma_1.prisma.purchase.count({ where: { buyerId: userId } });
    // Get purchases with pagination
    const purchases = await prisma_1.prisma.purchase.findMany({
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
        purchases: purchases,
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.getUserPurchases = getUserPurchases;
/**
 * Get purchases for a specific listing
 * @param listingId ID of the listing
 * @param sellerId ID of the seller (for validation)
 * @param params Pagination parameters
 * @returns Purchases with pagination info
 */
const getListingPurchases = async (listingId, sellerId, params = {}) => {
    const { page = 1, limit = 10, sort = 'purchaseDate', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    // Check if listing belongs to seller
    const listing = await prisma_1.prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        select: { sellerId: true },
    });
    if (!listing) {
        throw new Error('Listing not found');
    }
    // Check permission
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: sellerId },
        select: { role: true },
    });
    if (listing.sellerId !== sellerId && (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
        throw new Error('You do not have permission to view these purchases');
    }
    // Count total purchases
    const total = await prisma_1.prisma.purchase.count({ where: { listingId } });
    // Get purchases with pagination
    const purchases = await prisma_1.prisma.purchase.findMany({
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
        purchases: purchases,
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.getListingPurchases = getListingPurchases;
/**
 * Get purchase details
 * @param purchaseId ID of the purchase
 * @param userId ID of the user requesting details
 * @returns Purchase details
 */
const getPurchaseById = async (purchaseId, userId) => {
    const purchase = await prisma_1.prisma.purchase.findUnique({
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
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (purchase.buyerId !== userId &&
        purchase.listing.sellerId !== userId &&
        (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
        throw new Error('You do not have permission to view this purchase');
    }
    return purchase;
};
exports.getPurchaseById = getPurchaseById;
/**
 * Search marketplace listings
 * @param query Search query
 * @param params Pagination parameters
 * @returns Filtered listings with pagination info
 */
const searchListings = async (query, params = {}) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    // Build search filter
    const whereClause = {
        AND: [
            { status: client_1.ListingStatus.ACTIVE }, // Only show active listings
            {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
            },
        ],
    };
    // Count total matching listings
    const total = await prisma_1.prisma.marketplaceListing.count({ where: whereClause });
    // Get listings with pagination
    const listings = await prisma_1.prisma.marketplaceListing.findMany({
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
        listings: listings, // Type cast because of _count
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.searchListings = searchListings;
