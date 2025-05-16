// client/app/services/simpleAuthStorage.ts
import { logger } from '../utils/logger';
import { User } from '../types/auth.types';

/**
 * Approche simplifiée pour le stockage des données d'authentification
 * Stocke toutes les données en mémoire (variables) plutôt que dans un stockage persistant
 */

// Variables de stockage en mémoire
let authCredentials: {
  email: string | null;
  password: string | null;
} = {
  email: null, 
  password: null
};

// Informations utilisateur stockées en mémoire
let currentUser: User | null = null;
let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;

// Fonction pour sauvegarder les identifiants de connexion
export function saveCredentials(email: string, password: string): void {
  try {
    if (!email || !password) {
      logger.error('SimpleAuth: Cannot save empty credentials');
      return;
    }
    
    authCredentials = { email, password };
    logger.info(`SimpleAuth: Saved credentials for ${email}`);
  } catch (error) {
    logger.error('SimpleAuth: Error saving credentials:', error);
  }
}

// Fonction pour récupérer les identifiants
export function getCredentials(): { email: string | null; password: string | null } {
  return { ...authCredentials };
}

// Fonction pour sauvegarder les données utilisateur
export function saveUserData(user: User | null, accessToken?: string, refreshToken?: string): void {
  try {
    currentUser = user;
    
    if (accessToken) {
      currentAccessToken = accessToken;
    }
    
    if (refreshToken) {
      currentRefreshToken = refreshToken;
    }
    
    logger.info(`SimpleAuth: Saved user data for ${user?.email || 'unknown user'}`);
  } catch (error) {
    logger.error('SimpleAuth: Error saving user data:', error);
  }
}

// Fonction pour récupérer les données utilisateur
export function getUserData(): { user: User | null; accessToken: string | null; refreshToken: string | null } {
  return {
    user: currentUser,
    accessToken: currentAccessToken,
    refreshToken: currentRefreshToken
  };
}

// Fonction pour effacer toutes les données
export function clearAuthData(): void {
  try {
    // Note: on peut choisir de conserver les identifiants mais effacer le reste
    // authCredentials = { email: null, password: null };
    currentUser = null;
    currentAccessToken = null;
    currentRefreshToken = null;
    logger.info('SimpleAuth: All auth data cleared');
  } catch (error) {
    logger.error('SimpleAuth: Error clearing auth data:', error);
  }
}

// Fonction pour vérifier si l'utilisateur est authentifié
export function isAuthenticated(): boolean {
  return !!currentUser && !!currentAccessToken;
}

// Exporter un objet avec toutes les fonctions
const simpleAuthStorage = {
  saveCredentials,
  getCredentials,
  saveUserData,
  getUserData,
  clearAuthData,
  isAuthenticated
};

export default simpleAuthStorage;