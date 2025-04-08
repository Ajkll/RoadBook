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

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from '../config/prisma';

// Interface for JWT payload
interface JwtPayload {
  userId: string;
  role: string;
  email?: string;
  displayName?: string;
}

// Interface for login result
interface LoginResult {
  user: any;
  accessToken: string;
  refreshToken: string;
}

// Token validity duration
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

/**
 * Login function
 */
export const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error("Invalid credentials");
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new Error("Invalid credentials");
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Store refresh token in database
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
    
    await prisma.refreshToken.create({
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
  } catch (error) {
    console.error(`Login error:`, error);
    throw new Error("Invalid credentials");
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (token: string) => {
  try {
    // Verify the refresh token
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";
    const decoded = jwt.verify(token, refreshSecret) as JwtPayload;
    
    // Check if token is in database and not revoked
    const tokenRecord = await prisma.refreshToken.findUnique({
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
    const accessToken = jwt.sign(
      { 
        userId: decoded.userId, 
        role: decoded.role
      },
      jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    return { accessToken };
  } catch (error) {
    console.error("Token refresh error:", error);
    throw new Error("Invalid or expired token");
  }
};

/**
 * Generate access and refresh tokens
 */
const generateTokens = (user: any) => {
  // Create payload
  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    displayName: user.displayName
  };
  
  // Generate access token
  const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
  const accessToken = jwt.sign(
    payload, 
    jwtSecret, 
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  // Generate refresh token
  const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";
  const refreshToken = jwt.sign(
    payload,
    refreshSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Revoke a specific refresh token (for logout)
 */
export const revokeRefreshToken = async (token: string) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true }
    });
    
    return true;
  } catch (error) {
    console.error(`Error revoking token:`, error);
    throw error;
  }
};

/**
 * Verify access token and return payload
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
  return jwt.verify(token, jwtSecret) as JwtPayload;
};