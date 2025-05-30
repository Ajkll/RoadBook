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
exports.checkAndAwardMyBadges = exports.getBadgeLeaderboard = exports.getBadgesByCategory = exports.deleteBadge = exports.updateBadge = exports.createBadge = exports.revokeBadge = exports.awardBadge = exports.getMyBadges = exports.getUserBadges = exports.getBadgeById = exports.getAllBadges = void 0;
const badgeService = __importStar(require("../services/badge.service"));
/**
 * Get all badges
 */
const getAllBadges = async (req, res) => {
    try {
        const badges = await badgeService.getAllBadges();
        return res.status(200).json(badges);
    }
    catch (error) {
        console.error('Failed to get badges:', error);
        return res.status(500).json({ message: 'Failed to retrieve badges' });
    }
};
exports.getAllBadges = getAllBadges;
/**
 * Get a single badge by ID
 */
const getBadgeById = async (req, res) => {
    try {
        const { badgeId } = req.params;
        const badge = await badgeService.getBadgeById(badgeId);
        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }
        return res.status(200).json(badge);
    }
    catch (error) {
        console.error('Failed to get badge:', error);
        return res.status(500).json({ message: 'Failed to retrieve badge' });
    }
};
exports.getBadgeById = getBadgeById;
/**
 * Get badges for a specific user
 */
const getUserBadges = async (req, res) => {
    try {
        const { userId } = req.params;
        const badges = await badgeService.getUserBadges(userId);
        return res.status(200).json(badges);
    }
    catch (error) {
        console.error('Failed to get user badges:', error);
        return res.status(500).json({ message: 'Failed to retrieve user badges' });
    }
};
exports.getUserBadges = getUserBadges;
/**
 * Get the authenticated user's badges
 */
const getMyBadges = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const badges = await badgeService.getUserBadges(userId);
        return res.status(200).json(badges);
    }
    catch (error) {
        console.error('Failed to get user badges:', error);
        return res.status(500).json({ message: 'Failed to retrieve user badges' });
    }
};
exports.getMyBadges = getMyBadges;
/**
 * Award a badge to a user (admin only)
 */
const awardBadge = async (req, res) => {
    try {
        const { userId, badgeId } = req.body;
        if (!userId || !badgeId) {
            return res.status(400).json({ message: 'User ID and badge ID are required' });
        }
        const userBadge = await badgeService.awardBadge(userId, badgeId);
        return res.status(201).json(userBadge);
    }
    catch (error) {
        console.error('Failed to award badge:', error);
        if (error.message === 'User already has this badge') {
            return res.status(409).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Failed to award badge' });
    }
};
exports.awardBadge = awardBadge;
/**
 * Revoke a badge from a user (admin only)
 */
const revokeBadge = async (req, res) => {
    try {
        const { userId, badgeId } = req.params;
        await badgeService.revokeBadge(userId, badgeId);
        return res.status(200).json({ message: 'Badge revoked successfully' });
    }
    catch (error) {
        console.error('Failed to revoke badge:', error);
        return res.status(500).json({ message: 'Failed to revoke badge' });
    }
};
exports.revokeBadge = revokeBadge;
/**
 * Create a new badge (admin only)
 */
const createBadge = async (req, res) => {
    try {
        const badgeData = req.body;
        const badge = await badgeService.createBadge(badgeData);
        return res.status(201).json(badge);
    }
    catch (error) {
        console.error('Failed to create badge:', error);
        return res.status(500).json({ message: 'Failed to create badge' });
    }
};
exports.createBadge = createBadge;
/**
 * Update a badge (admin only)
 */
const updateBadge = async (req, res) => {
    try {
        const { badgeId } = req.params;
        const badgeData = req.body;
        const badge = await badgeService.updateBadge(badgeId, badgeData);
        return res.status(200).json(badge);
    }
    catch (error) {
        console.error('Failed to update badge:', error);
        return res.status(500).json({ message: 'Failed to update badge' });
    }
};
exports.updateBadge = updateBadge;
/**
 * Delete a badge (admin only)
 */
const deleteBadge = async (req, res) => {
    try {
        const { badgeId } = req.params;
        await badgeService.deleteBadge(badgeId);
        return res.status(200).json({ message: 'Badge deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete badge:', error);
        return res.status(500).json({ message: 'Failed to delete badge' });
    }
};
exports.deleteBadge = deleteBadge;
/**
 * Get badges by category
 */
const getBadgesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const badges = await badgeService.getBadgesByCategory(category);
        return res.status(200).json(badges);
    }
    catch (error) {
        console.error('Failed to get badges by category:', error);
        return res.status(500).json({ message: 'Failed to retrieve badges' });
    }
};
exports.getBadgesByCategory = getBadgesByCategory;
/**
 * Get badge leaderboard
 */
const getBadgeLeaderboard = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const leaderboard = await badgeService.getBadgeLeaderboard(limit);
        return res.status(200).json(leaderboard);
    }
    catch (error) {
        console.error('Failed to get badge leaderboard:', error);
        return res.status(500).json({ message: 'Failed to retrieve leaderboard' });
    }
};
exports.getBadgeLeaderboard = getBadgeLeaderboard;
/**
 * Check and award badges for the authenticated user
 */
const checkAndAwardMyBadges = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const awardedBadges = await badgeService.checkAndAwardBadges(userId);
        return res.status(200).json({
            message: `${awardedBadges.length} new badge(s) awarded`,
            badges: awardedBadges
        });
    }
    catch (error) {
        console.error('Failed to check and award badges:', error);
        return res.status(500).json({ message: 'Failed to check and award badges' });
    }
};
exports.checkAndAwardMyBadges = checkAndAwardMyBadges;
