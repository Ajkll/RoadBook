"use strict";
/**
 * AUTH CONTROLLER
 *
 * Ce contrôleur gère les routes d'authentification:
 * - Inscription (register): création d'un compte et génération de tokens
 * - Connexion (login): authentification et génération de tokens
 * - Déconnexion (logout): révocation des tokens
 * - Rafraîchissement (refresh-token): obtention d'un nouveau access token
 * - Vérification (verify): validation d'un token existant
 * - Réinitialisation de mot de passe (forgot-password, reset-password)
 *
 * Les contrôleurs sont responsables de:
 * - Traiter les requêtes HTTP
 * - Valider les entrées
 * - Appeler les services appropriés
 * - Formater et renvoyer les réponses
 * - Gérer les erreurs de manière cohérente
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
exports.resetPassword = exports.forgotPassword = exports.verifyToken = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/auth.service"));
const userService = __importStar(require("../services/user.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Register - Inscription d'un nouvel utilisateur
 *
 * @route POST /api/auth/register
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const register = async (req, res) => {
    try {
        logger_1.default.info(`Registration attempt for email: ${req.body.email}`);
        // Extract and sanitize user data from request body
        const userData = {
            email: (req.body.email || "").trim().toLowerCase(),
            password: req.body.password,
            displayName: (req.body.displayName || "").trim(),
            firstName: req.body.firstName ? req.body.firstName.trim() : undefined,
            lastName: req.body.lastName ? req.body.lastName.trim() : undefined,
            phoneNumber: req.body.phoneNumber,
            nationalRegisterNumber: req.body.nationalRegisterNumber,
            birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
            address: req.body.address,
            bio: req.body.bio,
            role: req.body.role || "APPRENTICE"
        };
        // Create the user
        const newUser = await userService.createUser(userData);
        // Log successful registration
        logger_1.default.info(`User registered successfully: ${newUser.id}`);
        // Login the user to generate tokens
        const { user, accessToken, refreshToken } = await authService.login(userData.email, userData.password);
        // Configure secure cookie for refresh token
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/auth' // Restreindre le cookie aux routes d'auth
        });
        // Set authorization header
        res.header("Authorization", `Bearer ${accessToken}`);
        // Return success response
        return res.status(201).json({
            status: "success",
            message: "User registered successfully",
            user,
            accessToken,
            refreshToken // Inclus dans la réponse pour les clients mobiles
        });
    }
    catch (error) {
        logger_1.default.error(`Registration error: ${error.message}`, error);
        // Return appropriate error responses based on error type
        if (error.message.includes("already exists")) {
            return res.status(409).json({
                status: "error",
                message: error.message
            });
        }
        else if (error.message.includes("required")) {
            return res.status(400).json({
                status: "error",
                message: error.message
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Registration failed",
            error: error.message
        });
    }
};
exports.register = register;
/**
 * Login - Authentification d'un utilisateur
 *
 * @route POST /api/auth/login
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Log login attempt (sans le mot de passe)
        logger_1.default.info(`Login attempt for user: ${email}`);
        // Authenticate user
        const result = await authService.login(email, password);
        // Set HTTP-only cookie with refresh token
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/auth' // Restreindre le cookie aux routes d'auth
        });
        // Set authorization header
        res.header("Authorization", `Bearer ${result.accessToken}`);
        // Log successful login
        logger_1.default.info(`User logged in successfully: ${result.user.id}`);
        // Return success response
        return res.status(200).json({
            status: "success",
            message: "Login successful",
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken // Inclus pour les clients mobiles
        });
    }
    catch (error) {
        logger_1.default.warn(`Login failed: ${error.message}`);
        // Personnaliser le message d'erreur selon le type d'erreur
        if (error.message.includes("temporarily locked")) {
            return res.status(429).json({
                status: "error",
                message: error.message
            });
        }
        // Message générique pour éviter les fuites d'information
        return res.status(401).json({
            status: "error",
            message: "Invalid email or password"
        });
    }
};
exports.login = login;
/**
 * Logout - Déconnexion d'un utilisateur
 *
 * @route POST /api/auth/logout
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const logout = async (req, res) => {
    var _a;
    try {
        // Récupérer l'ID utilisateur du token JWT si disponible
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // Récupérer le token depuis le cookie ou le corps de la requête
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (userId) {
            // Si on a l'ID utilisateur, on révoque tous ses tokens
            logger_1.default.info(`Logging out user: ${userId}`);
            await authService.revokeRefreshTokens({ userId });
        }
        else if (refreshToken) {
            // Sinon, on révoque juste le token spécifique
            logger_1.default.info(`Revoking specific refresh token`);
            await authService.revokeRefreshTokens({ token: refreshToken });
        }
        else {
            logger_1.default.warn("Logout called without user ID or refresh token");
        }
        // Supprimer le cookie de rafraîchissement
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            path: '/api/auth'
        });
        // Réponse de succès
        return res.status(200).json({
            status: "success",
            message: "Logout successful"
        });
    }
    catch (error) {
        // On considère la déconnexion comme réussie même en cas d'erreur côté serveur
        logger_1.default.error(`Logout error: ${error}`);
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            path: '/api/auth'
        });
        return res.status(200).json({
            status: "success",
            message: "Logout successful"
        });
    }
};
exports.logout = logout;
/**
 * Refresh token - Génère un nouveau access token avec un refresh token valide
 *
 * @route POST /api/auth/refresh-token
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const refreshToken = async (req, res) => {
    try {
        // Récupérer le token depuis le cookie ou le corps de la requête
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                status: "error",
                message: "Refresh token is required"
            });
        }
        // Obtenir de nouveaux tokens
        const result = await authService.refreshToken(refreshToken);
        // Si un nouveau refresh token a été généré (rotation)
        if (result.refreshToken) {
            // Mettre à jour le cookie
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/api/auth'
            });
        }
        // Mettre à jour l'en-tête d'autorisation
        res.header("Authorization", `Bearer ${result.accessToken}`);
        // Réponse de succès
        return res.status(200).json({
            status: "success",
            accessToken: result.accessToken,
            refreshToken: result.refreshToken // Pour les clients mobiles
        });
    }
    catch (error) {
        logger_1.default.warn(`Token refresh failed: ${error.message}`);
        // Si le token est expiré ou invalide, supprimer le cookie
        if (error.message.includes("expired") || error.message.includes("invalid")) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: 'lax',
                path: '/api/auth'
            });
        }
        // Message d'erreur approprié
        return res.status(401).json({
            status: "error",
            message: error.message || "Invalid or expired refresh token"
        });
    }
};
exports.refreshToken = refreshToken;
/**
 * Verify token - Vérifie un token d'accès existant
 *
 * @route GET /api/auth/verify
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                valid: false,
                message: "Token is missing"
            });
        }
        const token = authHeader.split(" ")[1];
        // Vérifier le token
        const decoded = authService.verifyAccessToken(token);
        // Réponse de succès
        return res.status(200).json({
            status: "success",
            valid: true,
            user: decoded
        });
    }
    catch (error) {
        logger_1.default.debug(`Token verification failed: ${error.message}`);
        // Statut HTTP 200 pour pouvoir analyser la réponse côté client
        return res.status(200).json({
            status: "error",
            valid: false,
            message: error.message || "Invalid or expired token"
        });
    }
};
exports.verifyToken = verifyToken;
/**
 * Forgot password - Initie le processus de réinitialisation de mot de passe
 *
 * @route POST /api/auth/forgot-password
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                status: "error",
                message: "Email is required"
            });
        }
        // Initier la réinitialisation du mot de passe
        await authService.initiatePasswordReset(email);
        // Note: Pour des raisons de sécurité, on renvoie toujours un succès
        // même si l'email n'existe pas dans la base de données
        return res.status(200).json({
            status: "success",
            message: "If this email exists in our system, a reset link has been sent"
        });
    }
    catch (error) {
        logger_1.default.error(`Password reset initiation error: ${error.message}`);
        // On renvoie toujours un succès pour éviter les fuites d'information
        return res.status(200).json({
            status: "success",
            message: "If this email exists in our system, a reset link has been sent"
        });
    }
};
exports.forgotPassword = forgotPassword;
/**
 * Reset password - Réinitialise le mot de passe avec un token valide
 *
 * @route POST /api/auth/reset-password
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({
                status: "error",
                message: "Token and new password are required"
            });
        }
        // Réinitialiser le mot de passe
        await authService.completePasswordReset(token, newPassword);
        return res.status(200).json({
            status: "success",
            message: "Password has been reset successfully"
        });
    }
    catch (error) {
        logger_1.default.error(`Password reset error: ${error.message}`);
        return res.status(400).json({
            status: "error",
            message: error.message || "Failed to reset password"
        });
    }
};
exports.resetPassword = resetPassword;
