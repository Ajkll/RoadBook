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
 * - DELETE /:id: Suppression d'un utilisateur (soi-même ou admin)
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
const validation_middleware_1 = require("../../middleware/validation.middleware");
const router = express_1.default.Router();
// ---- Routes pour l'utilisateur actuel (/me) ----
/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private - Requires authentication
 */
router.get("/me", auth_middleware_1.authenticateJWT, userController.getCurrentUser);
/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private - Requires authentication
 */
router.put("/me", auth_middleware_1.authenticateJWT, userController.updateCurrentUser);
/**
 * @route   PUT /api/users/me/password
 * @desc    Change current user password
 * @access  Private - Requires authentication
 */
router.put("/me/password", auth_middleware_1.authenticateJWT, validation_middleware_1.validateChangePassword, userController.changePassword);
// ---- Routes administratives ----
/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Admin only
 */
router.get("/", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRoles)("ADMIN"), userController.getAllUsers);
// ---- Routes par ID utilisateur ----
/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private - User can view their own profile, instructors/admins can view any profile
 */
router.get("/:id", auth_middleware_1.authenticateJWT, userController.getUserById);
/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private - User can update their own profile, admins can update any profile
 */
router.put("/:id", auth_middleware_1.authenticateJWT, userController.updateUser);
/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private - User can delete their own account, admins can delete any account
 */
router.delete("/:id", auth_middleware_1.authenticateJWT, userController.deleteUser);
exports.default = router;
