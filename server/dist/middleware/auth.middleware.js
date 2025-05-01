"use strict";
/**
 * AUTH MIDDLEWARE
 *
 * Ce middleware gère l'authentification et l'autorisation:
 * - authenticateJWT: Vérifie la validité du JWT et ajoute les données utilisateur à la requête
 * - authorizeRoles: Vérifie si l'utilisateur a les rôles requis pour accéder à une ressource
 * - optionalAuth: Authentifie l'utilisateur si un token est fourni, mais continue sans erreur sinon
 *
 * Ces middlewares peuvent être appliqués à n'importe quelle route pour la protéger
 * ou pour accéder aux données de l'utilisateur authentifié.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorizeAdmin = exports.authorizeRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware to verify JWT access token
 * This adds the decoded user to the request object
 */
const authenticate = (req, res, next) => {
    try {
        // Get the auth header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized - token missing"
            });
        }
        const token = authHeader.split(" ")[1];
        // Verify the token
        const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Add user data to request
        req.user = {
            ...decoded,
            id: decoded.userId // Ensure id is available for compatibility
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                status: "error",
                message: "Token expired",
                code: "TOKEN_EXPIRED"
            });
        }
        return res.status(403).json({
            status: "error",
            message: "Forbidden - invalid token"
        });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to authorize based on user roles
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized - not authenticated"
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden - insufficient privileges",
                requiredRoles: roles,
                userRole: req.user.role
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
/**
 * Middleware to require admin role
 */
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized - not authenticated"
        });
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            status: "error",
            message: "Forbidden - admin privileges required"
        });
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
/**
 * Optional authentication middleware
 * Will add user to request if token is valid, but continue even if no token
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            req.user = {
                ...decoded,
                id: decoded.userId // Ensure id is available for compatibility
            };
        }
        // Always continue to next middleware
        next();
    }
    catch (error) {
        // On error, just continue without setting user
        next();
    }
};
exports.optionalAuth = optionalAuth;
