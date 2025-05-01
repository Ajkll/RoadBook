import { Request, Response } from 'express';
import * as marketplaceService from '../services/marketplace.service';
import { ListingStatus, ListingType } from '@prisma/client';

/**
 * Create a new marketplace listing
 */
export const createListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const listing = await marketplaceService.createListing(userId, req.body);
    res.status(201).json(listing);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get all marketplace listings with filtering and pagination
 */
export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', sort = 'createdAt', order = 'desc' } = req.query;
    
    // Parse filters from query params
    const filters: any = {};
    
    if (req.query.type) {
      filters.type = req.query.type as ListingType;
    }
    
    if (req.query.status) {
      filters.status = req.query.status as ListingStatus;
    }
    
    if (req.query.minPrice) {
      filters.minPrice = parseFloat(req.query.minPrice as string);
    }
    
    if (req.query.maxPrice) {
      filters.maxPrice = parseFloat(req.query.maxPrice as string);
    }
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    
    const result = await marketplaceService.getListings(
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as 'asc' | 'desc',
      },
      filters
    );
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get a listing by ID
 */
export const getListingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await marketplaceService.getListingById(id);
    
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    
    res.status(200).json(listing);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Update a listing
 */
export const updateListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const listing = await marketplaceService.updateListing(id, userId, req.body);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message.includes('permission')) {
      res.status(403).json({ message: error.message });
    } else if (error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * Delete a listing
 */
export const deleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const result = await marketplaceService.deleteListing(id, userId);
    res.status(200).json({ success: result });
  } catch (error: any) {
    if (error.message.includes('permission')) {
      res.status(403).json({ message: error.message });
    } else if (error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * Change listing status
 */
export const changeListingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    if (!status || !Object.values(ListingStatus).includes(status as ListingStatus)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }
    
    const listing = await marketplaceService.changeListingStatus(id, userId, status as ListingStatus);
    res.status(200).json(listing);
  } catch (error: any) {
    if (error.message.includes('permission')) {
      res.status(403).json({ message: error.message });
    } else if (error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * Get listings for a specific seller
 */
export const getSellerListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const { page = '1', limit = '10', sort = 'createdAt', order = 'desc' } = req.query;
    
    const result = await marketplaceService.getSellerListings(
      userId,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as 'asc' | 'desc',
      }
    );
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Create a purchase (simulated transaction)
 */
export const createPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listingId, quantity = 1 } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    if (!listingId) {
      res.status(400).json({ message: 'listingId is required' });
      return;
    }
    
    const purchase = await marketplaceService.createPurchase(
      listingId,
      userId,
      parseInt(quantity as string)
    );
    
    res.status(201).json(purchase);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get purchase history for current user
 */
export const getUserPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const { page = '1', limit = '10', sort = 'purchaseDate', order = 'desc' } = req.query;
    
    const result = await marketplaceService.getUserPurchases(
      userId,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as 'asc' | 'desc',
      }
    );
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get purchases for a specific listing
 */
export const getListingPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const { page = '1', limit = '10', sort = 'purchaseDate', order = 'desc' } = req.query;
    
    const result = await marketplaceService.getListingPurchases(
      id,
      userId,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as 'asc' | 'desc',
      }
    );
    
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('permission')) {
      res.status(403).json({ message: error.message });
    } else if (error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * Get purchase details
 */
export const getPurchaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const purchase = await marketplaceService.getPurchaseById(id, userId);
    res.status(200).json(purchase);
  } catch (error: any) {
    if (error.message.includes('permission')) {
      res.status(403).json({ message: error.message });
    } else if (error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * Search marketplace listings
 */
export const searchListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    
    if (!query) {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }
    
    const { page = '1', limit = '10', sort = 'createdAt', order = 'desc' } = req.query;
    
    const result = await marketplaceService.searchListings(
      query as string,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as 'asc' | 'desc',
      }
    );
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};