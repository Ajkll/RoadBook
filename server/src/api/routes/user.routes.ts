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

import express from "express";
import * as userController from "../../controllers/user.controller";
import * as competencyController from "../../controllers/competency.controller";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";
import { 
  validateChangePassword,
  validateProfilePicture
} from "../../middleware/validation.middleware";

const router = express.Router();

// ---- Routes pour l'utilisateur actuel (/me) ----

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private - Requires authentication
 */
router.get("/me", authenticate, userController.getCurrentUser);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private - Requires authentication
 */
router.put("/me", authenticate, userController.updateCurrentUser);

/**
 * @route   PUT /api/users/me/password
 * @desc    Change current user password
 * @access  Private - Requires authentication
 */
router.put(
  "/me/password", 
  authenticate, 
  validateChangePassword, 
  userController.changePassword
);

/**
 * @route   POST /api/users/me/profile-picture
 * @desc    Upload or update current user's profile picture
 * @access  Private - Requires authentication
 */
router.post(
  "/me/profile-picture",
  authenticate,
  validateProfilePicture,
  userController.uploadProfilePicture
);

/**
 * @route   DELETE /api/users/me/profile-picture
 * @desc    Delete current user's profile picture
 * @access  Private - Requires authentication
 */
router.delete(
  "/me/profile-picture",
  authenticate,
  userController.deleteProfilePicture
);

// ---- Routes administratives ----

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Admin only
 */
router.get(
  "/", 
  authenticate, 
  authorizeRoles("ADMIN"), 
  userController.getAllUsers
);

// ---- Routes par ID utilisateur ----

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private - User can view their own profile, instructors/admins can view any profile
 */
router.get(
  "/:id", 
  authenticate, 
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private - User can update their own profile, admins can update any profile
 */
router.put(
  "/:id", 
  authenticate, 
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private - User can delete their own account, admins can delete any account
 */
router.delete(
  "/:id",
  authenticate,
  userController.deleteUser
);

/**
 * @route   GET /api/users/:id/competencies/stats
 * @desc    Get competency statistics for a user
 * @access  Private - Self, instructor, or admin
 */
router.get(
  "/:id/competencies/stats",
  authenticate,
  competencyController.getApprenticeCompetencyStats
);

export default router;