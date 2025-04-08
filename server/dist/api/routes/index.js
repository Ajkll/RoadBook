"use strict";
/**
 * ROUTES INDEX
 *
 * Ce fichier agit comme point d'entrée pour toutes les routes API:
 * - /auth: Routes d'authentification (login, register, etc.)
 * - /users: Routes utilisateur (profil, mise à jour, etc.)
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
const router = (0, express_1.Router)();
// Mount route handlers
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/roadbooks', roadbook_routes_1.default);
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
            users: {
                me: 'GET /api/users/me - Get current user profile',
                update: 'PUT /api/users/me - Update current user profile',
                changePassword: 'PUT /api/users/me/password - Change password',
                getById: 'GET /api/users/:id - Get a specific user',
                updateUser: 'PUT /api/users/:id - Update a user'
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
