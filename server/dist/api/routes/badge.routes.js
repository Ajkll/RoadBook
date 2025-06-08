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
const badgeController = __importStar(require("../../controllers/badge.controller"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Badge schema for validation
const badgeSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Badge name must be at least 3 characters long'),
    description: zod_1.z.string().min(5, 'Description must be at least 5 characters long'),
    imageUrl: zod_1.z.string().url('Image URL must be a valid URL'),
    category: zod_1.z.string().min(1, 'Category is required'),
    criteria: zod_1.z.string().min(1, 'Criteria is required'),
});
const awardBadgeSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    badgeId: zod_1.z.string().uuid('Invalid badge ID format'),
});
// Public routes
router.get('/', badgeController.getAllBadges);
router.get('/categories/:category', badgeController.getBadgesByCategory);
router.get('/leaderboard', badgeController.getBadgeLeaderboard);
router.get('/:badgeId', badgeController.getBadgeById);
// User authenticated routes
router.get('/users/me', auth_middleware_1.authenticate, badgeController.getMyBadges);
router.get('/users/:userId', auth_middleware_1.authenticate, badgeController.getUserBadges);
router.post('/check', auth_middleware_1.authenticate, badgeController.checkAndAwardMyBadges);
// Admin only routes
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.authorizeAdmin, (0, validation_middleware_1.validateRequest)(badgeSchema), badgeController.createBadge);
router.put('/:badgeId', auth_middleware_1.authenticate, auth_middleware_1.authorizeAdmin, (0, validation_middleware_1.validateRequest)(badgeSchema), badgeController.updateBadge);
router.delete('/:badgeId', auth_middleware_1.authenticate, auth_middleware_1.authorizeAdmin, badgeController.deleteBadge);
router.post('/award', auth_middleware_1.authenticate, auth_middleware_1.authorizeAdmin, (0, validation_middleware_1.validateRequest)(awardBadgeSchema), badgeController.awardBadge);
router.delete('/:badgeId/users/:userId', auth_middleware_1.authenticate, auth_middleware_1.authorizeAdmin, badgeController.revokeBadge);
exports.default = router;
