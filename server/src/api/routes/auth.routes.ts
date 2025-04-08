/**
 * AUTH ROUTES
 * 
 * Ce fichier définit les routes d'authentification:
 * - POST /register: Inscription d'un nouvel utilisateur
 * - POST /login: Connexion avec email/mot de passe
 * - POST /logout: Déconnexion et révocation du token
 * - POST /refresh-token: Obtention d'un nouveau access token
 * - GET /verify: Vérification de la validité d'un token
 * 
 * Toutes ces routes sont publiques (ne nécessitent pas d'authentification)
 */

import express from "express";
import * as authController from "../../controllers/auth.controller";
import { validateLogin, validateRegister } from "../../middleware/validation.middleware";

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
 * @access  Public
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

export default router;