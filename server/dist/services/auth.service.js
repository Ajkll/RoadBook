"use strict";
/**
 * AUTH SERVICE
 *
 * Ce service gère toutes les opérations liées à l'authentification:
 * - Login et génération de tokens JWT (access + refresh)
 * - Vérification et rafraîchissement des tokens
 * - Révocation des tokens (logout)
 * - Réinitialisation des mots de passe
 *
 * Le système utilise une approche à double token pour sécuriser l'authentification:
 * - Un access token de courte durée (15 min) pour l'autorisation d'API
 * - Un refresh token de longue durée (7 jours) pour obtenir de nouveaux access tokens
 *
 * Sécurité renforcée:
 * - Tokens de rotation pour le rafraîchissement
 * - Détection des tentatives de réutilisation de tokens
 * - Blocage temporaire après échecs multiples
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completePasswordReset = exports.initiatePasswordReset = exports.verifyAccessToken = exports.revokeRefreshToken = exports.revokeRefreshTokens = exports.refreshToken = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../utils/logger"));
// Configuration des délais d'expiration des tokens
const ACCESS_TOKEN_EXPIRY = "15m"; // Access token: court (15 minutes)
const REFRESH_TOKEN_EXPIRY = "7d"; // Refresh token: long (7 jours)
const PASSWORD_RESET_EXPIRY = "1h"; // Token de réinitialisation: moyen (1 heure)
// Limite d'essais de connexion échoués avant blocage temporaire
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes
// Map pour suivre les tentatives de connexion échouées
const loginAttempts = new Map();
/**
 * Login function - Authentifie un utilisateur et génère des tokens
 *
 * @param email - Adresse email de l'utilisateur
 * @param password - Mot de passe en clair
 * @returns Informations utilisateur et tokens d'authentification
 */
const login = async (email, password) => {
    try {
        email = email.toLowerCase().trim();
        // Vérifier si l'utilisateur est temporairement bloqué après trop d'échecs
        const ipOrEmail = email; // Dans une implémentation réelle, on utiliserait l'IP + email
        const attempts = loginAttempts.get(ipOrEmail);
        if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS) {
            // Vérifier si le délai de blocage est écoulé
            const lockoutTime = attempts.lastAttempt + LOGIN_LOCKOUT_DURATION;
            if (Date.now() < lockoutTime) {
                const remainingMinutes = Math.ceil((lockoutTime - Date.now()) / (60 * 1000));
                throw new Error(`Account temporarily locked. Try again in ${remainingMinutes} minutes`);
            }
            else {
                // Réinitialiser le compteur après la période de blocage
                loginAttempts.delete(ipOrEmail);
            }
        }
        // Trouver l'utilisateur par email
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: {
                refreshTokens: {
                    where: { revoked: false },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        if (!user) {
            incrementLoginAttempts(ipOrEmail);
            throw new Error("Invalid credentials");
        }
        // Vérifier le mot de passe avec bcrypt
        const passwordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordValid) {
            incrementLoginAttempts(ipOrEmail);
            throw new Error("Invalid credentials");
        }
        // Réinitialiser le compteur d'échecs après succès
        loginAttempts.delete(ipOrEmail);
        // Révoquer les anciens tokens s'ils existent
        if (user.refreshTokens && user.refreshTokens.length > 0) {
            await prisma_1.default.refreshToken.update({
                where: { id: user.refreshTokens[0].id },
                data: { revoked: true }
            });
        }
        // Générer de nouveaux tokens
        const { accessToken, refreshToken } = generateTokens(user);
        // Stocker le nouveau refresh token en base de données
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 jours
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: expiryDate
            }
        });
        // Retourner les informations utilisateur sans données sensibles
        const { passwordHash, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken
        };
    }
    catch (error) {
        logger_1.default.error(`Login error:`, error);
        throw error;
    }
};
exports.login = login;
/**
 * Refresh access token - Utilise un refresh token pour générer un nouveau access token
 * Implémente la rotation des tokens de rafraîchissement pour plus de sécurité
 *
 * @param token - Refresh token existant
 * @returns Nouveaux access token et refresh token
 */
const refreshToken = async (token) => {
    try {
        // Vérifier la signature du refresh token
        const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";
        const decoded = jsonwebtoken_1.default.verify(token, refreshSecret);
        // Vérifier que le token existe en base de données et n'est pas révoqué
        const tokenRecord = await prisma_1.default.refreshToken.findUnique({
            where: { token },
            include: { user: true }
        });
        if (!tokenRecord) {
            throw new Error("Invalid token");
        }
        if (tokenRecord.revoked) {
            // Si le token a été révoqué, c'est potentiellement une tentative de réutilisation
            // On révoque tous les tokens de cet utilisateur par sécurité
            await prisma_1.default.refreshToken.updateMany({
                where: { userId: decoded.userId },
                data: { revoked: true }
            });
            logger_1.default.warn(`Token reuse detected for user ${decoded.userId}`);
            throw new Error("Token has been revoked - security breach detected");
        }
        if (tokenRecord.expiresAt < new Date()) {
            throw new Error("Token has expired");
        }
        // Tout est OK, on va générer de nouveaux tokens
        // 1. Révoquer le token actuel (rotation de tokens)
        await prisma_1.default.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revoked: true }
        });
        // 2. Générer de nouveaux tokens
        const newTokens = generateTokens(tokenRecord.user);
        // 3. Stocker le nouveau refresh token
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 7);
        await prisma_1.default.refreshToken.create({
            data: {
                token: newTokens.refreshToken,
                userId: tokenRecord.userId,
                expiresAt: newExpiryDate
            }
        });
        // 4. Retourner les nouveaux tokens
        return {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken
        };
    }
    catch (error) {
        logger_1.default.error("Token refresh error:", error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error("Token has expired");
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error("Invalid token signature");
        }
        throw error;
    }
};
exports.refreshToken = refreshToken;
/**
 * Generate access and refresh tokens
 *
 * @param user - Utilisateur pour lequel générer les tokens
 * @returns Paire de tokens (access + refresh)
 */
const generateTokens = (user) => {
    // Générer un identifiant unique pour ce token
    const tokenId = (0, uuid_1.v4)();
    // Créer le payload avec les données essentielles
    const payload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        displayName: user.displayName,
        tokenId
    };
    // Générer l'access token (courte durée)
    const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
    const accessToken = jsonwebtoken_1.default.sign(payload, jwtSecret, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        jwtid: tokenId
    });
    // Générer le refresh token (longue durée)
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";
    const refreshToken = jsonwebtoken_1.default.sign(payload, refreshSecret, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        jwtid: tokenId
    });
    return { accessToken, refreshToken };
};
/**
 * Revoke refresh tokens - Utilisé pour la déconnexion et en cas de compromission
 *
 * @param token - Token spécifique à révoquer (optionnel)
 * @param userId - ID utilisateur dont on veut révoquer tous les tokens (optionnel)
 * @returns Succès de l'opération
 */
const revokeRefreshTokens = async (options) => {
    try {
        const { token, userId } = options;
        if (!token && !userId) {
            throw new Error("Either token or userId must be provided");
        }
        if (token) {
            // Révoquer un token spécifique
            await prisma_1.default.refreshToken.updateMany({
                where: { token },
                data: { revoked: true }
            });
        }
        if (userId) {
            // Révoquer tous les tokens d'un utilisateur
            await prisma_1.default.refreshToken.updateMany({
                where: { userId },
                data: { revoked: true }
            });
        }
        return true;
    }
    catch (error) {
        logger_1.default.error(`Error revoking tokens:`, error);
        throw error;
    }
};
exports.revokeRefreshTokens = revokeRefreshTokens;
/**
 * Backward compatibility function
 */
const revokeRefreshToken = async (token) => {
    return (0, exports.revokeRefreshTokens)({ token });
};
exports.revokeRefreshToken = revokeRefreshToken;
/**
 * Verify access token - Vérifie un access token et retourne son payload
 *
 * @param token - Access token à vérifier
 * @returns Payload décodé du token
 */
const verifyAccessToken = (token) => {
    const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
    return jsonwebtoken_1.default.verify(token, jwtSecret);
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Initiate password reset - Génère un token de réinitialisation de mot de passe
 * Dans une implémentation réelle, enverra un email à l'utilisateur
 *
 * @param email - Email de l'utilisateur
 * @returns Token de réinitialisation
 */
const initiatePasswordReset = async (email) => {
    try {
        email = email.toLowerCase().trim();
        // Vérifier si l'utilisateur existe
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
            // mais on log l'erreur côté serveur
            logger_1.default.warn(`Password reset requested for non-existent email: ${email}`);
            throw new Error("If this email exists in our system, a reset link has been sent");
        }
        // Révoquer tous les tokens de réinitialisation précédents pour cet utilisateur
        await prisma_1.default.passwordReset.updateMany({
            where: { userId: user.id },
            data: { revoked: true }
        });
        // Générer un token cryptographiquement sécurisé
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt_1.default.hash(resetToken, 10);
        // Date d'expiration (1 heure)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);
        // Stocker le token hashé en base de données dans le modèle PasswordReset
        await prisma_1.default.passwordReset.create({
            data: {
                token: hashedToken,
                userId: user.id,
                expiresAt: expiryDate
            }
        });
        // En réalité, on enverrait un email avec un lien contenant ce token
        // Mais pour ce POC, on retourne simplement le token
        logger_1.default.info(`Password reset token generated for user: ${user.id}`);
        return resetToken;
    }
    catch (error) {
        logger_1.default.error(`Password reset initiation error:`, error);
        throw error;
    }
};
exports.initiatePasswordReset = initiatePasswordReset;
/**
 * Complete password reset - Réinitialise le mot de passe avec un token valide
 *
 * @param token - Token de réinitialisation
 * @param newPassword - Nouveau mot de passe
 * @returns Succès de l'opération
 */
const completePasswordReset = async (token, newPassword) => {
    try {
        // Récupérer tous les tokens de réinitialisation non-expirés et non-révoqués
        const resetRequests = await prisma_1.default.passwordReset.findMany({
            where: {
                expiresAt: { gt: new Date() },
                revoked: false
            },
            include: { user: true }
        });
        if (resetRequests.length === 0) {
            throw new Error("Invalid or expired reset token");
        }
        // Chercher le token correspondant
        let validResetRequest = null;
        // Comparer le token fourni avec chaque token hashé en base
        for (const request of resetRequests) {
            const tokenValid = await bcrypt_1.default.compare(token, request.token);
            if (tokenValid) {
                validResetRequest = request;
                break;
            }
        }
        if (!validResetRequest) {
            throw new Error("Invalid reset token");
        }
        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        // Mettre à jour le mot de passe
        await prisma_1.default.user.update({
            where: { id: validResetRequest.userId },
            data: { passwordHash: hashedPassword }
        });
        // Révoquer tous les tokens de rafraîchissement existants pour des raisons de sécurité
        await prisma_1.default.refreshToken.updateMany({
            where: { userId: validResetRequest.userId },
            data: { revoked: true }
        });
        // Marquer tous les tokens de réinitialisation comme utilisés pour cet utilisateur
        await prisma_1.default.passwordReset.updateMany({
            where: { userId: validResetRequest.userId },
            data: { revoked: true }
        });
        logger_1.default.info(`Password reset completed successfully for user: ${validResetRequest.userId}`);
        return true;
    }
    catch (error) {
        logger_1.default.error(`Password reset completion error:`, error);
        throw error;
    }
};
exports.completePasswordReset = completePasswordReset;
/**
 * Utility function to increment login attempts
 */
function incrementLoginAttempts(key) {
    var _a;
    const now = Date.now();
    const attempts = loginAttempts.get(key);
    if (attempts) {
        attempts.count += 1;
        attempts.lastAttempt = now;
    }
    else {
        loginAttempts.set(key, { count: 1, lastAttempt: now });
    }
    // Log if approaching lockout
    if (((_a = loginAttempts.get(key)) === null || _a === void 0 ? void 0 : _a.count) === MAX_LOGIN_ATTEMPTS - 1) {
        logger_1.default.warn(`Login attempt threshold approaching for: ${key}`);
    }
}
