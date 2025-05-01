"use strict";
/**
 * ROUTES INDEX
 *
 * Ce fichier agit comme point d'entrée pour toutes les routes API:
 * - /auth: Routes d'authentification (login, register, etc.)
 * - /users: Routes utilisateur (profil, mise à jour, etc.)
 * - /roadbooks: Routes des carnets de route (création, mise à jour, etc.)
 * - /sessions: Routes des sessions de conduite (détails, validation, etc.)
 * - /competencies: Routes des compétences (taxonomie, progression, validation)
 * - /badges: Routes des badges (gamification, récompenses)
 * - /community: Routes de la communauté (posts, commentaires, likes)
 * - /marketplace: Routes du marketplace (annonces, achats, ventes)
 * - /notifications: Routes des notifications (alertes, messages)
 * - /dashboard: Routes du tableau de bord (statistiques, activité récente)
 * - /status: Statut de l'API
 * - /health: Vérification santé de l'API
 * - /: Documentation des endpoints disponibles
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const roadbook_routes_1 = __importDefault(require("./roadbook.routes"));
const session_routes_1 = __importDefault(require("./session.routes"));
const competency_routes_1 = __importDefault(require("./competency.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const badge_routes_1 = __importDefault(require("./badge.routes"));
const community_routes_1 = __importDefault(require("./community.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const marketplace_routes_1 = __importDefault(require("./marketplace.routes"));
const router = (0, express_1.Router)();
// Mount route handlers
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/roadbooks', roadbook_routes_1.default);
router.use('/sessions', session_routes_1.default);
router.use('/competencies', competency_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
router.use('/badges', badge_routes_1.default);
router.use('/community', community_routes_1.default);
router.use('/notifications', notification_routes_1.default);
router.use('/marketplace', marketplace_routes_1.default);
// API status route
router.get('/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        server: 'RoadBook API'
    });
});
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        healthy: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});
// API documentation route
router.get('/', (req, res) => {
    res.json({
        message: 'RoadBook API Documentation',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register - Create a new user account',
                login: 'POST /api/auth/login - Authenticate and get tokens',
                logout: 'POST /api/auth/logout - Logout and invalidate tokens',
                refreshToken: 'POST /api/auth/refresh-token - Get a new access token',
                verify: 'GET /api/auth/verify - Verify token validity'
            },
            badges: {
                list: 'GET /api/badges - Get all available badges',
                getById: 'GET /api/badges/:badgeId - Get a specific badge',
                byCategory: 'GET /api/badges/categories/:category - Get badges by category',
                leaderboard: 'GET /api/badges/leaderboard - Get badge leaderboard',
                myBadges: 'GET /api/badges/users/me - Get current user badges',
                userBadges: 'GET /api/badges/users/:userId - Get badges for a specific user',
                checkBadges: 'POST /api/badges/check - Check and award new badges for current user',
                create: 'POST /api/badges - Create a new badge (admin)',
                update: 'PUT /api/badges/:badgeId - Update a badge (admin)',
                delete: 'DELETE /api/badges/:badgeId - Delete a badge (admin)',
                award: 'POST /api/badges/award - Award a badge to a user (admin)',
                revoke: 'DELETE /api/badges/:badgeId/users/:userId - Revoke a badge from a user (admin)'
            },
            users: {
                me: 'GET /api/users/me - Get current user profile',
                update: 'PUT /api/users/me - Update current user profile',
                changePassword: 'PUT /api/users/me/password - Change password',
                getById: 'GET /api/users/:id - Get a specific user',
                updateUser: 'PUT /api/users/:id - Update a user',
                sessions: 'GET /api/users/:userId/sessions - Get sessions for a specific user'
            },
            roadbooks: {
                list: 'GET /api/roadbooks - Get all roadbooks for current user',
                create: 'POST /api/roadbooks - Create a new roadbook',
                guided: 'GET /api/roadbooks/guided - Get roadbooks where user is guide',
                get: 'GET /api/roadbooks/:id - Get roadbook details',
                update: 'PUT /api/roadbooks/:id - Update a roadbook',
                delete: 'DELETE /api/roadbooks/:id - Delete a roadbook',
                updateStatus: 'PATCH /api/roadbooks/:id/status - Update roadbook status',
                assignGuide: 'POST /api/roadbooks/:id/guide - Assign a guide to a roadbook',
                sessions: 'GET /api/roadbooks/:id/sessions - Get roadbook sessions',
                createSession: 'POST /api/roadbooks/:id/sessions - Create a new session'
            },
            sessions: {
                getById: 'GET /api/sessions/:id - Get session details',
                update: 'PUT /api/sessions/:id - Update a session',
                delete: 'DELETE /api/sessions/:id - Delete a session',
                validate: 'POST /api/sessions/:id/validate - Validate a session',
                addComment: 'POST /api/sessions/:id/comments - Add a comment to a session'
            },
            competencies: {
                list: 'GET /api/competencies - Get all competencies',
                single: 'GET /api/competencies/:id - Get a specific competency',
                phase: 'GET /api/competencies/phases/:phase - Get competencies for a phase',
                roadbookProgress: 'GET /api/roadbooks/:roadbookId/competencies - Get competency progress for a roadbook',
                updateStatus: 'PUT /api/roadbooks/:roadbookId/competencies/:competencyId - Update competency status',
                detail: 'GET /api/roadbooks/:roadbookId/competencies/:competencyId/detail - Get detailed competency progress',
                sessionValidations: 'GET /api/sessions/:sessionId/competencies - Get competency validations for a session',
                validate: 'POST /api/sessions/:sessionId/competencies/validate - Validate competencies in a session',
                apprenticeStats: 'GET /api/users/:apprenticeId/competencies/stats - Get apprentice competency statistics'
            },
            community: {
                list: 'GET /api/community - Get all posts with pagination',
                search: 'GET /api/community/search - Search posts by query',
                createPost: 'POST /api/community - Create a new post',
                userPosts: 'GET /api/community/users/:userId - Get posts by a specific user',
                getPost: 'GET /api/community/:postId - Get a specific post with comments',
                updatePost: 'PUT /api/community/:postId - Update a post',
                deletePost: 'DELETE /api/community/:postId - Delete a post',
                addComment: 'POST /api/community/:postId/comments - Add a comment to a post',
                deleteComment: 'DELETE /api/community/comments/:commentId - Delete a comment',
                likePost: 'POST /api/community/:postId/likes - Like a post',
                unlikePost: 'DELETE /api/community/:postId/likes - Unlike a post',
                getLikes: 'GET /api/community/:postId/likes - Get users who liked a post',
                checkLike: 'GET /api/community/:postId/likes/check - Check if user has liked a post'
            },
            notifications: {
                list: 'GET /api/notifications - Get all notifications for current user',
                unreadCount: 'GET /api/notifications/unread-count - Get unread notification count',
                markAsRead: 'PUT /api/notifications/:notificationId/read - Mark a notification as read',
                markAllAsRead: 'PUT /api/notifications/read-all - Mark all notifications as read',
                delete: 'DELETE /api/notifications/:notificationId - Delete a notification',
                deleteAll: 'DELETE /api/notifications - Delete all notifications',
                cleanup: 'POST /api/notifications/cleanup - Clean up old notifications (admin)'
            },
            marketplace: {
                list: 'GET /api/marketplace - Get all marketplace listings with filtering',
                search: 'GET /api/marketplace/search - Search marketplace listings',
                sellerListings: 'GET /api/marketplace/seller - Get listings for the authenticated seller',
                purchases: 'GET /api/marketplace/purchases - Get purchase history for authenticated user',
                purchaseDetails: 'GET /api/marketplace/purchases/:id - Get purchase details by ID',
                listingDetails: 'GET /api/marketplace/:id - Get a marketplace listing by ID',
                listingPurchases: 'GET /api/marketplace/:id/purchases - Get purchases for a specific listing',
                createListing: 'POST /api/marketplace - Create a new marketplace listing',
                purchase: 'POST /api/marketplace/purchase - Purchase a listing (simulated transaction)',
                updateListing: 'PUT /api/marketplace/:id - Update a listing',
                changeStatus: 'PATCH /api/marketplace/:id/status - Change listing status',
                deleteListing: 'DELETE /api/marketplace/:id - Delete a listing'
            },
            dashboard: {
                me: 'GET /api/dashboard/me - Get current user dashboard',
                activity: 'GET /api/dashboard/activity - Get recent activity',
                apprentice: 'GET /api/dashboard/apprentice/:id - Get apprentice statistics',
                roadbook: 'GET /api/dashboard/roadbook/:id - Get roadbook statistics'
            }
        },
        rootEndpoints: {
            status: 'GET /api/status - Get API status',
            health: 'GET /api/health - Health check',
            docs: 'GET /api - This documentation'
        }
    });
});
exports.default = router;
