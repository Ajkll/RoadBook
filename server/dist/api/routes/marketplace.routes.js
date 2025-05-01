"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const marketplaceController = __importStar(require("../../controllers/marketplace.controller"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
/**
 * @route GET /api/marketplace
 * @desc Get all marketplace listings with filtering and pagination
 * @access Public
 */
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    (0, express_validator_1.query)('sort').optional().isString(),
    (0, express_validator_1.query)('order').optional().isIn(['asc', 'desc']),
    (0, express_validator_1.query)('type').optional().isIn(Object.values(client_1.ListingType)),
    (0, express_validator_1.query)('status').optional().isIn(Object.values(client_1.ListingStatus)),
    (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.query)('search').optional().isString(),
    validation_middleware_1.validateRequest,
], marketplaceController.getListings);
/**
 * @route GET /api/marketplace/search
 * @desc Search marketplace listings
 * @access Public
 */
router.get('/search', [
    (0, express_validator_1.query)('query').isString().notEmpty().withMessage('Search query is required'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    (0, express_validator_1.query)('sort').optional().isString(),
    (0, express_validator_1.query)('order').optional().isIn(['asc', 'desc']),
    validation_middleware_1.validateRequest,
], marketplaceController.searchListings);
/**
 * @route GET /api/marketplace/seller
 * @desc Get listings for the authenticated seller
 * @access Private
 */
router.get('/seller', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    (0, express_validator_1.query)('sort').optional().isString(),
    (0, express_validator_1.query)('order').optional().isIn(['asc', 'desc']),
    validation_middleware_1.validateRequest,
], marketplaceController.getSellerListings);
/**
 * @route GET /api/marketplace/purchases
 * @desc Get purchase history for the authenticated user
 * @access Private
 */
router.get('/purchases', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    (0, express_validator_1.query)('sort').optional().isString(),
    (0, express_validator_1.query)('order').optional().isIn(['asc', 'desc']),
    validation_middleware_1.validateRequest,
], marketplaceController.getUserPurchases);
/**
 * @route GET /api/marketplace/purchases/:id
 * @desc Get purchase details by ID
 * @access Private
 */
router.get('/purchases/:id', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid purchase ID is required'),
    validation_middleware_1.validateRequest,
], marketplaceController.getPurchaseById);
/**
 * @route GET /api/marketplace/:id
 * @desc Get a marketplace listing by ID
 * @access Public
 */
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid listing ID is required'),
    validation_middleware_1.validateRequest,
], marketplaceController.getListingById);
/**
 * @route GET /api/marketplace/:id/purchases
 * @desc Get purchases for a specific listing (seller only)
 * @access Private
 */
router.get('/:id/purchases', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid listing ID is required'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    (0, express_validator_1.query)('sort').optional().isString(),
    (0, express_validator_1.query)('order').optional().isIn(['asc', 'desc']),
    validation_middleware_1.validateRequest,
], marketplaceController.getListingPurchases);
/**
 * @route POST /api/marketplace
 * @desc Create a new marketplace listing
 * @access Private
 */
router.post('/', auth_middleware_1.authenticate, [
    (0, express_validator_1.body)('title').isString().notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('description').isString().notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('type').isIn(Object.values(client_1.ListingType)).withMessage('Valid listing type is required'),
    (0, express_validator_1.body)('imageUrls').optional().isArray(),
    (0, express_validator_1.body)('imageUrls.*').optional().isURL().withMessage('Valid image URLs are required'),
    validation_middleware_1.validateRequest,
], marketplaceController.createListing);
/**
 * @route POST /api/marketplace/purchase
 * @desc Purchase a listing (simulated transaction)
 * @access Private
 */
router.post('/purchase', auth_middleware_1.authenticate, [
    (0, express_validator_1.body)('listingId').isUUID().withMessage('Valid listing ID is required'),
    (0, express_validator_1.body)('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    validation_middleware_1.validateRequest,
], marketplaceController.createPurchase);
/**
 * @route PUT /api/marketplace/:id
 * @desc Update a listing
 * @access Private
 */
router.put('/:id', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid listing ID is required'),
    (0, express_validator_1.body)('title').optional().isString().notEmpty().withMessage('Title cannot be empty'),
    (0, express_validator_1.body)('description').optional().isString().notEmpty().withMessage('Description cannot be empty'),
    (0, express_validator_1.body)('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('type').optional().isIn(Object.values(client_1.ListingType)).withMessage('Valid listing type is required'),
    (0, express_validator_1.body)('imageUrls').optional().isArray(),
    (0, express_validator_1.body)('imageUrls.*').optional().isURL().withMessage('Valid image URLs are required'),
    validation_middleware_1.validateRequest,
], marketplaceController.updateListing);
/**
 * @route PATCH /api/marketplace/:id/status
 * @desc Change listing status (publish, archive, etc.)
 * @access Private
 */
router.patch('/:id/status', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid listing ID is required'),
    (0, express_validator_1.body)('status').isIn(Object.values(client_1.ListingStatus)).withMessage('Valid status is required'),
    validation_middleware_1.validateRequest,
], marketplaceController.changeListingStatus);
/**
 * @route DELETE /api/marketplace/:id
 * @desc Delete a listing
 * @access Private
 */
router.delete('/:id', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid listing ID is required'),
    validation_middleware_1.validateRequest,
], marketplaceController.deleteListing);
exports.default = router;
