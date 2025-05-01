/**
 * AUTH ROUTES
 * 
 * Ce fichier définit les routes d'authentification:
 * - POST /register: Inscription d'un nouvel utilisateur
 * - POST /login: Connexion avec email/mot de passe
 * - POST /logout: Déconnexion et révocation du token
 * - POST /refresh-token: Obtention d'un nouveau access token
 * - GET /verify: Vérification de la validité d'un token
 * - POST /forgot-password: Demande de réinitialisation de mot de passe
 * - POST /reset-password: Réinitialisation de mot de passe avec token
 * 
 * Toutes ces routes sont publiques (ne nécessitent pas d'authentification)
 */

import express from "express";
import * as authController from "../../controllers/auth.controller";
import { 
  validateLogin, 
  validateRegister, 
  validateForgotPassword, 
  validateResetPassword 
} from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validateRegister, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
router.post("/login", validateLogin, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Public (but may use JWT if available)
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if access token is valid
 * @access  Public
 */
router.get("/verify", authController.verifyToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password", validateResetPassword, authController.resetPassword);

export default router;