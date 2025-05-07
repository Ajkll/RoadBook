import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as marketplaceController from '../../controllers/marketplace.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { ListingType, ListingStatus } from '@prisma/client';

const router = Router();

/**
 * @route GET /api/marketplace
 * @desc Get all marketplace listings with filtering and pagination
 * @access Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']),
    query('type').optional().isIn(Object.values(ListingType)),
    query('status').optional().isIn(Object.values(ListingStatus)),
    query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('search').optional().isString(),
    validateRequest,
  ],
  marketplaceController.getListings
);

/**
 * @route GET /api/marketplace/search
 * @desc Search marketplace listings
 * @access Public
 */
router.get(
  '/search',
  [
    query('query').isString().notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']),
    validateRequest,
  ],
  marketplaceController.searchListings
);

/**
 * @route GET /api/marketplace/seller
 * @desc Get listings for the authenticated seller
 * @access Private
 */
router.get(
  '/seller',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']),
    validateRequest,
  ],
  marketplaceController.getSellerListings
);

/**
 * @route GET /api/marketplace/purchases
 * @desc Get purchase history for the authenticated user
 * @access Private
 */
router.get(
  '/purchases',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']),
    validateRequest,
  ],
  marketplaceController.getUserPurchases
);

/**
 * @route GET /api/marketplace/purchases/:id
 * @desc Get purchase details by ID
 * @access Private
 */
router.get(
  '/purchases/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid purchase ID is required'),
    validateRequest,
  ],
  marketplaceController.getPurchaseById
);

/**
 * @route GET /api/marketplace/:id
 * @desc Get a marketplace listing by ID
 * @access Public
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid listing ID is required'),
    validateRequest,
  ],
  marketplaceController.getListingById
);

/**
 * @route GET /api/marketplace/:id/purchases
 * @desc Get purchases for a specific listing (seller only)
 * @access Private
 */
router.get(
  '/:id/purchases',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid listing ID is required'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']),
    validateRequest,
  ],
  marketplaceController.getListingPurchases
);

/**
 * @route POST /api/marketplace
 * @desc Create a new marketplace listing
 * @access Private
 */
router.post(
  '/',
  authenticate,
  [
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('description').isString().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('type').isIn(Object.values(ListingType)).withMessage('Valid listing type is required'),
    body('imageUrls').optional().isArray(),
    body('imageUrls.*').optional().isURL().withMessage('Valid image URLs are required'),
    validateRequest,
  ],
  marketplaceController.createListing
);

/**
 * @route POST /api/marketplace/purchase
 * @desc Purchase a listing (simulated transaction)
 * @access Private
 */
router.post(
  '/purchase',
  authenticate,
  [
    body('listingId').isUUID().withMessage('Valid listing ID is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    validateRequest,
  ],
  marketplaceController.createPurchase
);

/**
 * @route PUT /api/marketplace/:id
 * @desc Update a listing
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid listing ID is required'),
    body('title').optional().isString().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().isString().notEmpty().withMessage('Description cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('type').optional().isIn(Object.values(ListingType)).withMessage('Valid listing type is required'),
    body('imageUrls').optional().isArray(),
    body('imageUrls.*').optional().isURL().withMessage('Valid image URLs are required'),
    validateRequest,
  ],
  marketplaceController.updateListing
);

/**
 * @route PATCH /api/marketplace/:id/status
 * @desc Change listing status (publish, archive, etc.)
 * @access Private
 */
router.patch(
  '/:id/status',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid listing ID is required'),
    body('status').isIn(Object.values(ListingStatus)).withMessage('Valid status is required'),
    validateRequest,
  ],
  marketplaceController.changeListingStatus
);

/**
 * @route DELETE /api/marketplace/:id
 * @desc Delete a listing
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid listing ID is required'),
    validateRequest,
  ],
  marketplaceController.deleteListing
);

export default router;