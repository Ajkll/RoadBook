"use strict";
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
const authController = __importStar(require("../../controllers/auth.controller"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const router = express_1.default.Router();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validation_middleware_1.validateRegister, authController.register);
/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
router.post("/login", validation_middleware_1.validateLogin, authController.login);
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
router.post("/forgot-password", validation_middleware_1.validateForgotPassword, authController.forgotPassword);
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password", validation_middleware_1.validateResetPassword, authController.resetPassword);
exports.default = router;
