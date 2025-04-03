// client/app/services/secureStorage.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Pour les environnements web où SecureStore n'est pas disponible
const inMemoryStorage = new Map<string, string>();

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
    if (Platform.OS === 'web') {
      inMemoryStorage.set(key, value);
      // Alternativement, on pourrait utiliser localStorage pour le web
      // localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

// Fonction pour récupérer une valeur
export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return inMemoryStorage.get(key) || null;
      // Alternativement pour le web
      // return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    return null;
  }
}

// Fonction pour supprimer une valeur
export async function removeItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      inMemoryStorage.delete(key);
      // Alternativement pour le web
      // localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
  }
}

// Fonctions d'aide spécifiques à l'authentification
export async function saveAuthData(
  accessToken: string,
  refreshToken: string,
  user: any
): Promise<void> {
  await saveItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  await saveItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  await saveItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function clearAuthData(): Promise<void> {
  await removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  await removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  await removeItem(STORAGE_KEYS.USER);
}

export async function getAuthData(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
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
