"use strict";
/**
 * AUTH SERVICE
 *
 * Ce service gère toutes les opérations liées à l'authentification:
 * - Login et génération de tokens JWT (access + refresh)
 * - Vérification et rafraîchissement des tokens
 * - Révocation des tokens (logout)
 *
 * Le système utilise une approche à double token pour sécuriser l'authentification:
 * - Un access token de courte durée (15 min) pour l'autorisation d'API
 * - Un refresh token de longue durée (7 jours) pour obtenir de nouveaux access tokens
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = exports.revokeRefreshToken = exports.refreshToken = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
// Token validity duration
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
/**
 * Login function
 */
const login = async (email, password) => {
    try {
        // Find user by email
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("Invalid credentials");
        }
        // Verify password
        const passwordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordValid) {
            throw new Error("Invalid credentials");
        }
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);
        // Store refresh token in database
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: expiryDate
            }
        });
        // Create user object to return (without password hash)
        const { passwordHash, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken
        };
    }
    catch (error) {
        console.error(`Login error:`, error);
        throw new Error("Invalid credentials");
    }
};
exports.login = login;
/**
 * Refresh access token using refresh token
 */
const refreshToken = async (token) => {
    try {
        // Verify the refresh token
        const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";
        const decoded = jsonwebtoken_1.default.verify(token, refreshSecret);
        // Check if token is in database and not revoked
        const tokenRecord = await prisma_1.default.refreshToken.findUnique({
            where: { token }
        });
        if (!tokenRecord) {
            throw new Error("Invalid token");
        }
        if (tokenRecord.revoked) {
            throw new Error("Token has been revoked");
        }
        if (tokenRecord.expiresAt < new Date()) {
            throw new Error("Token has expired");
        }
        // Generate a new access token
        const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
        const accessToken = jsonwebtoken_1.default.sign({
            userId: decoded.userId,
            role: decoded.role
        }, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
        return { accessToken };
    }
    catch (error) {
        console.error("Token refresh error:", error);
        throw new Error("Invalid or expired token");
    }
};
exports.refreshToken = refreshToken;
/**
 * Generate access and refresh tokens
 */
const generateTokens = (user) => {
    // Create payload
    const payload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        displayName: user.displayName
    };
    // Generate access token
    const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
    const accessToken = jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
    // Generate refresh token
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";
    const refreshToken = jsonwebtoken_1.default.sign(payload, refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { accessToken, refreshToken };
};
/**
 * Revoke a specific refresh token (for logout)
 */
const revokeRefreshToken = async (token) => {
    try {
        await prisma_1.default.refreshToken.updateMany({
            where: { token },
            data: { revoked: true }
        });
        return true;
    }
    catch (error) {
        console.error(`Error revoking token:`, error);
        throw error;
    }
};
exports.revokeRefreshToken = revokeRefreshToken;
/**
 * Verify access token and return payload
 */
const verifyAccessToken = (token) => {
    const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
    return jsonwebtoken_1.default.verify(token, jwtSecret);
};
exports.verifyAccessToken = verifyAccessToken;
