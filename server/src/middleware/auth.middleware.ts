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

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define user payload interface
export interface JwtPayload {
  userId: string;
  id: string; // Alias for userId for compatibility
  role: string;
  email?: string;
  displayName?: string;
  iat?: number;
  exp?: number;
}

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to verify JWT access token
 * This adds the decoded user to the request object
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Add user data to request
    req.user = {
      ...decoded,
      id: decoded.userId  // Ensure id is available for compatibility
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
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

/**
 * Middleware to authorize based on user roles
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

/**
 * Middleware to require admin role
 */
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
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

/**
 * Optional authentication middleware
 * Will add user to request if token is valid, but continue even if no token
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      req.user = {
        ...decoded,
        id: decoded.userId  // Ensure id is available for compatibility
      };
    }
    
    // Always continue to next middleware
    next();
  } catch (error) {
    // On error, just continue without setting user
    next();
  }
};