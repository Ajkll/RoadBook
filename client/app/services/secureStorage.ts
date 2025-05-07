// client/app/services/secureStorage.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

// Pour les environnements web où SecureStore n'est pas disponible
const inMemoryStorage = new Map<string, string>();

// Determine if we can use localStorage for better web persistence
const useLocalStorage = () => {
  if (Platform.OS !== 'web') return false;

  // Check if localStorage is available
  try {
    if (typeof localStorage !== 'undefined') {
      // Test if we can actually use it (might be blocked in some contexts)
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('Using localStorage for web storage');
      return true;
    }
  } catch {
    console.log('localStorage not available, falling back to inMemoryStorage');
  }

  return false;
};

// Clés pour notre stockage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  REDIRECT_PATH: 'redirectAfterLogin',
};

// Fonction pour sauvegarder une valeur
export async function saveItem(key: string, value: string): Promise<void> {
  try {
    console.log(`Saving ${key} value with length: ${value?.length || 0}`);

    if (Platform.OS === 'web') {
      // Use localStorage for persistence in web environments if available
      if (useLocalStorage()) {
        localStorage.setItem(key, value);
        console.log(`Saved ${key} to localStorage`);
      } else {
        inMemoryStorage.set(key, value);
        console.log(`Saved ${key} to inMemoryStorage`);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
      console.log(`Saved ${key} to SecureStore`);
    }
  } catch (error) {
    logger.error(`Error saving ${key}:`, error);
  }
}

// Fonction pour récupérer une valeur
export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web if available
      if (useLocalStorage()) {
        const value = localStorage.getItem(key);
        console.log(`Retrieved ${key} from localStorage: ${value ? 'found' : 'not found'}`);
        return value;
      } else {
        const value = inMemoryStorage.get(key) || null;
        console.log(`Retrieved ${key} from inMemoryStorage: ${value ? 'found' : 'not found'}`);
        return value;
      }
    }
    const value = await SecureStore.getItemAsync(key);
    console.log(`Retrieved ${key} from SecureStore: ${value ? 'found' : 'not found'}`);
    return value;
  } catch (error) {
    logger.error(`Error retrieving ${key}:`, error);
    return null;
  }
}

// Fonction pour supprimer une valeur
export async function removeItem(key: string): Promise<void> {
  try {
    console.log(`Removing ${key} from storage`);

    if (Platform.OS === 'web') {
      // Use localStorage for web if available
      if (useLocalStorage()) {
        localStorage.removeItem(key);
        console.log(`Removed ${key} from localStorage`);
      } else {
        inMemoryStorage.delete(key);
        console.log(`Removed ${key} from inMemoryStorage`);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
      console.log(`Removed ${key} from SecureStore`);
    }
  } catch (error) {
    logger.error(`Error removing ${key}:`, error);
  }
}

// Fonctions d'aide spécifiques à l'authentification
export async function saveAuthData(
  accessToken: string,
  refreshToken: string,
  user: Record<string, unknown>
): Promise<void> {
  console.log('=== SAVE AUTH DATA ===');
  console.log('Saving auth data for user:', user?.email || 'unknown');

  try {
    // Ensure user is an object before stringifying
    if (user && typeof user === 'object') {
      await saveItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await saveItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await saveItem(STORAGE_KEYS.USER, JSON.stringify(user));
      console.log('Auth data saved successfully');
    } else {
      logger.error('Invalid user object provided to saveAuthData:', user);
      throw new Error('Invalid user object');
    }
  } catch (error) {
    logger.error('Failed to save auth data:', error);
    throw error; // Re-throw to allow caller to handle
  }
}

export async function clearAuthData(): Promise<void> {
  await removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  await removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  await removeItem(STORAGE_KEYS.USER);
}

export async function getAuthData(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: Record<string, unknown> | null;
}> {
  const accessToken = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const userJson = await getItem(STORAGE_KEYS.USER);

  return {
    accessToken,
    refreshToken,
    user: userJson ? JSON.parse(userJson) : null,
  };
}

// Exporter toutes les fonctions
const secureStorage = {
  STORAGE_KEYS,
  saveItem,
  getItem,
  removeItem,
  saveAuthData,
  clearAuthData,
  getAuthData
};

export default secureStorage;
