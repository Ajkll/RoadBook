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

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import prisma from '../config/prisma';
import logger from '../utils/logger';

// Interfaces pour les types de données
export interface JwtPayload {
  userId: string;
  role: string;
  email?: string;
  displayName?: string;
  tokenId?: string; // Identifiant unique pour chaque token
}

export interface LoginResult {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
}

// Configuration des délais d'expiration des tokens
const ACCESS_TOKEN_EXPIRY = "15m";    // Access token: court (15 minutes)
const REFRESH_TOKEN_EXPIRY = "7d";    // Refresh token: long (7 jours)
const PASSWORD_RESET_EXPIRY = "1h";   // Token de réinitialisation: moyen (1 heure)

// Limite d'essais de connexion échoués avant blocage temporaire
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes

// Map pour suivre les tentatives de connexion échouées
const loginAttempts = new Map<string, { count: number, lastAttempt: number }>();

/**
 * Login function - Authentifie un utilisateur et génère des tokens
 * 
 * @param email - Adresse email de l'utilisateur
 * @param password - Mot de passe en clair
 * @returns Informations utilisateur et tokens d'authentification
 */
export const login = async (email: string, password: string): Promise<LoginResult> => {
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
      } else {
        // Réinitialiser le compteur après la période de blocage
        loginAttempts.delete(ipOrEmail);
      }
    }
    
    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({ 
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
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      incrementLoginAttempts(ipOrEmail);
      throw new Error("Invalid credentials");
    }
    
    // Réinitialiser le compteur d'échecs après succès
    loginAttempts.delete(ipOrEmail);
    
    // Révoquer les anciens tokens s'ils existent
    if (user.refreshTokens && user.refreshTokens.length > 0) {
      await prisma.refreshToken.update({
        where: { id: user.refreshTokens[0].id },
        data: { revoked: true }
      });
    }
    
    // Générer de nouveaux tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Stocker le nouveau refresh token en base de données
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 jours
    
    await prisma.refreshToken.create({
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
  } catch (error) {
    logger.error(`Login error:`, error);
    throw error;
  }
};

/**
 * Refresh access token - Utilise un refresh token pour générer un nouveau access token
 * Implémente la rotation des tokens de rafraîchissement pour plus de sécurité
 * 
 * @param token - Refresh token existant
 * @returns Nouveaux access token et refresh token
 */
export const refreshToken = async (token: string): Promise<TokenResult> => {
  try {
    // Vérifier la signature du refresh token
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";
    const decoded = jwt.verify(token, refreshSecret) as JwtPayload;
    
    // Vérifier que le token existe en base de données et n'est pas révoqué
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });
    
    if (!tokenRecord) {
      throw new Error("Invalid token");
    }
    
    if (tokenRecord.revoked) {
      // Si le token a été révoqué, c'est potentiellement une tentative de réutilisation
      // On révoque tous les tokens de cet utilisateur par sécurité
      await prisma.refreshToken.updateMany({
        where: { userId: decoded.userId },
        data: { revoked: true }
      });
      
      logger.warn(`Token reuse detected for user ${decoded.userId}`);
      throw new Error("Token has been revoked - security breach detected");
    }
    
    if (tokenRecord.expiresAt < new Date()) {
      throw new Error("Token has expired");
    }
    
    // Tout est OK, on va générer de nouveaux tokens
    
    // 1. Révoquer le token actuel (rotation de tokens)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true }
    });
    
    // 2. Générer de nouveaux tokens
    const newTokens = generateTokens(tokenRecord.user);
    
    // 3. Stocker le nouveau refresh token
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 7);
    
    await prisma.refreshToken.create({
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
  } catch (error) {
    logger.error("Token refresh error:", error);
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token signature");
    }
    
    throw error;
  }
};

/**
 * Generate access and refresh tokens
 * 
 * @param user - Utilisateur pour lequel générer les tokens
 * @returns Paire de tokens (access + refresh)
 */
const generateTokens = (user: any) => {
  // Générer un identifiant unique pour ce token
  const tokenId = uuidv4();
  
  // Créer le payload avec les données essentielles
  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    displayName: user.displayName,
    tokenId
  };
  
  // Générer l'access token (courte durée)
  const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
  const accessToken = jwt.sign(
    payload, 
    jwtSecret, 
    { 
      expiresIn: ACCESS_TOKEN_EXPIRY,
      jwtid: tokenId
    }
  );
  
  // Générer le refresh token (longue durée)
  const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-token-secret";
  const refreshToken = jwt.sign(
    payload,
    refreshSecret,
    { 
      expiresIn: REFRESH_TOKEN_EXPIRY,
      jwtid: tokenId
    }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Revoke refresh tokens - Utilisé pour la déconnexion et en cas de compromission
 * 
 * @param token - Token spécifique à révoquer (optionnel)
 * @param userId - ID utilisateur dont on veut révoquer tous les tokens (optionnel)
 * @returns Succès de l'opération
 */
export const revokeRefreshTokens = async (options: { token?: string, userId?: string }) => {
  try {
    const { token, userId } = options;
    
    if (!token && !userId) {
      throw new Error("Either token or userId must be provided");
    }
    
    if (token) {
      // Révoquer un token spécifique
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revoked: true }
      });
    }
    
    if (userId) {
      // Révoquer tous les tokens d'un utilisateur
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true }
      });
    }
    
    return true;
  } catch (error) {
    logger.error(`Error revoking tokens:`, error);
    throw error;
  }
};

/**
 * Backward compatibility function
 */
export const revokeRefreshToken = async (token: string) => {
  return revokeRefreshTokens({ token });
};

/**
 * Verify access token - Vérifie un access token et retourne son payload
 * 
 * @param token - Access token à vérifier
 * @returns Payload décodé du token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
  return jwt.verify(token, jwtSecret) as JwtPayload;
};

/**
 * Initiate password reset - Génère un token de réinitialisation de mot de passe
 * Dans une implémentation réelle, enverra un email à l'utilisateur
 * 
 * @param email - Email de l'utilisateur
 * @returns Token de réinitialisation
 */
export const initiatePasswordReset = async (email: string): Promise<string> => {
  try {
    email = email.toLowerCase().trim();
    
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      // mais on log l'erreur côté serveur
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      throw new Error("If this email exists in our system, a reset link has been sent");
    }
    
    // Révoquer tous les tokens de réinitialisation précédents pour cet utilisateur
    await prisma.passwordReset.updateMany({
      where: { userId: user.id },
      data: { revoked: true }
    });
    
    // Générer un token cryptographiquement sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    
    // Date d'expiration (1 heure)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);
    
    // Stocker le token hashé en base de données dans le modèle PasswordReset
    await prisma.passwordReset.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: expiryDate
      }
    });
    
    // En réalité, on enverrait un email avec un lien contenant ce token
    // Mais pour ce POC, on retourne simplement le token
    logger.info(`Password reset token generated for user: ${user.id}`);
    
    return resetToken;
  } catch (error) {
    logger.error(`Password reset initiation error:`, error);
    throw error;
  }
};

/**
 * Complete password reset - Réinitialise le mot de passe avec un token valide
 * 
 * @param token - Token de réinitialisation
 * @param newPassword - Nouveau mot de passe
 * @returns Succès de l'opération
 */
export const completePasswordReset = async (token: string, newPassword: string): Promise<boolean> => {
  try {
    // Récupérer tous les tokens de réinitialisation non-expirés et non-révoqués
    const resetRequests = await prisma.passwordReset.findMany({
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
      const tokenValid = await bcrypt.compare(token, request.token);
      if (tokenValid) {
        validResetRequest = request;
        break;
      }
    }
    
    if (!validResetRequest) {
      throw new Error("Invalid reset token");
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: validResetRequest.userId },
      data: { passwordHash: hashedPassword }
    });
    
    // Révoquer tous les tokens de rafraîchissement existants pour des raisons de sécurité
    await prisma.refreshToken.updateMany({
      where: { userId: validResetRequest.userId },
      data: { revoked: true }
    });
    
    // Marquer tous les tokens de réinitialisation comme utilisés pour cet utilisateur
    await prisma.passwordReset.updateMany({
      where: { userId: validResetRequest.userId },
      data: { revoked: true }
    });
    
    logger.info(`Password reset completed successfully for user: ${validResetRequest.userId}`);
    return true;
  } catch (error) {
    logger.error(`Password reset completion error:`, error);
    throw error;
  }
};

/**
 * Utility function to increment login attempts
 */
function incrementLoginAttempts(key: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(key);
  
  if (attempts) {
    attempts.count += 1;
    attempts.lastAttempt = now;
  } else {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
  }
  
  // Log if approaching lockout
  if (loginAttempts.get(key)?.count === MAX_LOGIN_ATTEMPTS - 1) {
    logger.warn(`Login attempt threshold approaching for: ${key}`);
  }
}