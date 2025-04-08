"use strict";
/**
 * USER ROUTES
 *
 * Ce fichier définit les routes liées aux utilisateurs:
 * - GET /me: Récupération du profil de l'utilisateur connecté
 * - PUT /me: Mise à jour du profil de l'utilisateur connecté
 * - PUT /me/password: Changement de mot de passe
 * - GET /:id: Récupération d'un profil utilisateur par ID
 * - PUT /:id: Mise à jour d'un profil (soi-même ou admin)
 * - GET /: Liste de tous les utilisateurs (admin uniquement)
 *
 * Toutes ces routes sont protégées et nécessitent une authentification
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController = __importStar(require("../../controllers/user.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", auth_middleware_1.authenticateJWT, userController.getCurrentUser);
/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put("/me", auth_middleware_1.authenticateJWT, userController.updateCurrentUser);
/**
 * @route   PUT /api/users/me/password
 * @desc    Change current user password
 * @access  Private
 */
router.put("/me/password", auth_middleware_1.authenticateJWT, userController.changePassword);
/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get("/", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRoles)("ADMIN"), userController.getAllUsers);
/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get("/:id", auth_middleware_1.authenticateJWT, userController.getUserById);
/**
 * @route   PUT /api/users/:id
 * @desc    Update user (own profile or admin)
 * @access  Private/Admin
 */
router.put("/:id", auth_middleware_1.authenticateJWT, userController.updateUser);
exports.default = router;
