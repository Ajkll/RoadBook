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
exports.searchListings = exports.getPurchaseById = exports.getListingPurchases = exports.getUserPurchases = exports.createPurchase = exports.getSellerListings = exports.changeListingStatus = exports.deleteListing = exports.updateListing = exports.getListingById = exports.getListings = exports.createListing = void 0;
const marketplaceService = __importStar(require("../services/marketplace.service"));
const client_1 = require("@prisma/client");
/**
 * Create a new marketplace listing
 */
const createListing = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const listing = await marketplaceService.createListing(userId, req.body);
        res.status(201).json(listing);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createListing = createListing;
/**
 * Get all marketplace listings with filtering and pagination
 */
const getListings = async (req, res) => {
    try {
        const { page = '1', limit = '10', sort = 'createdAt', order = 'desc' } = req.query;
        // Parse filters from query params
        const filters = {};
        if (req.query.type) {
            filters.type = req.query.type;
        }
        if (req.query.status) {
            filters.status = req.query.status;
        }
        if (req.query.minPrice) {
            filters.minPrice = parseFloat(req.query.minPrice);
        }
        if (req.query.maxPrice) {
            filters.maxPrice = parseFloat(req.query.maxPrice);
        }
        if (req.query.search) {
            filters.search = req.query.search;
        }
        const result = await marketplaceService.getListings({
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sort,
            order: order,
        }, filters);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getListings = getListings;
/**
 * Get a listing by ID
 */
const getListingById = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await marketplaceService.getListingById(id);
        if (!listing) {
            res.status(404).json({ message: 'Listing not found' });
            return;
        }
        res.status(200).json(listing);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getListingById = getListingById;
/**
 * Update a listing
 */
const updateListing = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const listing = await marketplaceService.updateListing(id, userId, req.body);
        res.status(200).json(listing);
    }
    catch (error) {
        if (error.message.includes('permission')) {
            res.status(403).json({ message: error.message });
        }
        else if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        }
        else {
            res.status(400).json({ message: error.message });
        }
    }
};
exports.updateListing = updateListing;
/**
 * Delete a listing
 */
const deleteListing = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const result = await marketplaceService.deleteListing(id, userId);
        res.status(200).json({ success: result });
    }
    catch (error) {
        if (error.message.includes('permission')) {
            res.status(403).json({ message: error.message });
        }
        else if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        }
        else {
            res.status(400).json({ message: error.message });
        }
    }
};
exports.deleteListing = deleteListing;
/**
 * Change listing status
 */
const changeListingStatus = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        if (!status || !Object.values(client_1.ListingStatus).includes(status)) {
            res.status(400).json({ message: 'Invalid status value' });
            return;
        }
        const listing = await marketplaceService.changeListingStatus(id, userId, status);
        res.status(200).json(listing);
    }
    catch (error) {
        if (error.message.includes('permission')) {
            res.status(403).json({ message: error.message });
        }
        else if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        }
        else {
            res.status(400).json({ message: error.message });
        }
    }
};
exports.changeListingStatus = changeListingStatus;
/**
 * Get listings for a specific seller
 */
const getSellerListings = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { page = '1', limit = '10', sort = 'createdAt', order = 'desc' } = req.query;
        const result = await marketplaceService.getSellerListings(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sort,
            order: order,
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getSellerListings = getSellerListings;
/**
 * Create a purchase (simulated transaction)
 */
const createPurchase = async (req, res) => {
    var _a;
    try {
        const { listingId, quantity = 1 } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        if (!listingId) {
            res.status(400).json({ message: 'listingId is required' });
            return;
        }
        const purchase = await marketplaceService.createPurchase(listingId, userId, parseInt(quantity));
        res.status(201).json(purchase);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createPurchase = createPurchase;
/**
 * Get purchase history for current user
 */
const getUserPurchases = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { page = '1', limit = '10', sort = 'purchaseDate', order = 'desc' } = req.query;
        const result = await marketplaceService.getUserPurchases(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sort,
            order: order,
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getUserPurchases = getUserPurchases;
/**
 * Get purchases for a specific listing
 */
const getListingPurchases = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { page = '1', limit = '10', sort = 'purchaseDate', order = 'desc' } = req.query;
        const result = await marketplaceService.getListingPurchases(id, userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sort,
            order: order,
        });
        res.status(200).json(result);
    }
    catch (error) {
        if (error.message.includes('permission')) {
            res.status(403).json({ message: error.message });
        }
        else if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        }
        else {
            res.status(400).json({ message: error.message });
        }
    }
};
exports.getListingPurchases = getListingPurchases;
/**
 * Get purchase details
 */
const getPurchaseById = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const purchase = await marketplaceService.getPurchaseById(id, userId);
        res.status(200).json(purchase);
    }
    catch (error) {
        if (error.message.includes('permission')) {
            res.status(403).json({ message: error.message });
        }
        else if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        }
        else {
            res.status(400).json({ message: error.message });
        }
    }
};
exports.getPurchaseById = getPurchaseById;
/**
 * Search marketplace listings
 */
const searchListings = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            res.status(400).json({ message: 'Search query is required' });
            return;
        }
        const { page = '1', limit = '10', sort = 'createdAt', order = 'desc' } = req.query;
        const result = await marketplaceService.searchListings(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sort,
            order: order,
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.searchListings = searchListings;
