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

import express from "express";
import * as userController from "../../controllers/user.controller";
import { authenticateJWT, authorizeRoles } from "../../middleware/auth.middleware";

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticateJWT, userController.getCurrentUser);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put("/me", authenticateJWT, userController.updateCurrentUser);

/**
 * @route   PUT /api/users/me/password
 * @desc    Change current user password
 * @access  Private
 */
router.put("/me/password", authenticateJWT, userController.changePassword);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get("/", authenticateJWT, authorizeRoles("ADMIN"), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get("/:id", authenticateJWT, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (own profile or admin)
 * @access  Private/Admin
 */
router.put("/:id", authenticateJWT, userController.updateUser);

export default router;