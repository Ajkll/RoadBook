// client/app/services/secureStorage.ts
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

// Import SecureStore with robust error handling
let SecureStore;

// Créer une implémentation de fallback en mémoire
const createFallbackSecureStore = (reason) => {
  logger.warn(`Creating fallback SecureStore implementation: ${reason}`);
  
  return {
    setItemAsync: async (key, value) => {
      try {
        logger.info(`[Fallback] Saving ${key} to inMemoryStorage (reason: ${reason})`);
        if (!key) return null;
        
        // First try AsyncStorage if available
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage')?.default;
          if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
            await AsyncStorage.setItem(key, value);
            logger.info(`[Fallback] Saved ${key} to AsyncStorage`);
            return null;
          }
        } catch (asyncError) {
          logger.warn(`[Fallback] AsyncStorage not available: ${asyncError.message}`);
        }
        
        // If we're on web, try localStorage
        if (Platform.OS === 'web') {
          try { 
            localStorage.setItem(key, value);
            logger.info(`[Fallback] Saved ${key} to localStorage`);
            return null;
          } catch (webError) {
            logger.warn(`[Fallback] localStorage failed: ${webError.message}`);
          }
        }
        
        // Last resort - in-memory storage
        inMemoryStorage.set(key, value);
        logger.info(`[Fallback] Saved ${key} to inMemoryStorage`);
        return null;
      } catch (e) {
        logger.error(`[Fallback] Complete error in setItemAsync: ${e.message}`);
        return null;
      }
    },
    getItemAsync: async (key) => {
      try {
        logger.info(`[Fallback] Getting ${key} (reason: ${reason})`);
        if (!key) return null;
        
        // First try AsyncStorage if available
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage')?.default;
          if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
            const value = await AsyncStorage.getItem(key);
            logger.info(`[Fallback] Retrieved ${key} from AsyncStorage: ${value ? 'found' : 'not found'}`);
            // If found in AsyncStorage, return it
            if (value) return value;
          }
        } catch (asyncError) {
          logger.warn(`[Fallback] AsyncStorage get failed: ${asyncError.message}`);
        }
        
        // If we're on web, try localStorage
        if (Platform.OS === 'web') {
          try { 
            const value = localStorage.getItem(key);
            logger.info(`[Fallback] Retrieved ${key} from localStorage: ${value ? 'found' : 'not found'}`);
            // If found in localStorage, return it
            if (value) return value;
          } catch (webError) {
            logger.warn(`[Fallback] localStorage get failed: ${webError.message}`);
          }
        }
        
        // Last resort - in-memory storage
        const value = inMemoryStorage.get(key) || null;
        logger.info(`[Fallback] Retrieved ${key} from inMemoryStorage: ${value ? 'found' : 'not found'}`);
        return value;
      } catch (e) {
        logger.error(`[Fallback] Complete error in getItemAsync: ${e.message}`);
        return null;
      }
    },
    deleteItemAsync: async (key) => {
      try {
        logger.info(`[Fallback] Deleting ${key} (reason: ${reason})`);
        if (!key) return null;
        
        let success = false;
        
        // Try AsyncStorage if available
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage')?.default;
          if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
            await AsyncStorage.removeItem(key);
            logger.info(`[Fallback] Removed ${key} from AsyncStorage`);
            success = true;
          }
        } catch (asyncError) {
          logger.warn(`[Fallback] AsyncStorage remove failed: ${asyncError.message}`);
        }
        
        // Try localStorage on web
        if (Platform.OS === 'web') {
          try { 
            localStorage.removeItem(key);
            logger.info(`[Fallback] Removed ${key} from localStorage`);
            success = true;
          } catch (webError) {
            logger.warn(`[Fallback] localStorage remove failed: ${webError.message}`);
          }
        }
        
        // Always try in-memory storage
        inMemoryStorage.delete(key);
        logger.info(`[Fallback] Removed ${key} from inMemoryStorage`);
        success = true;
        
        return null;
      } catch (e) {
        logger.error(`[Fallback] Complete error in deleteItemAsync: ${e.message}`);
        return null;
      }
    }
  };
};

// Essayer de charger expo-secure-store
try {
  // Essai d'import dynamique
  logger.info('Attempting to load expo-secure-store module');
  
  try {
    // Essai avec import standard
    SecureStore = require('expo-secure-store');
    logger.info('expo-secure-store loaded successfully via require');
  } catch (requireError) {
    logger.warn(`require('expo-secure-store') failed: ${requireError.message}`);
    
    // Essai alternatif
    try {
      SecureStore = require('expo-secure-store/build/SecureStore');
      logger.info('expo-secure-store loaded through alternate path');
    } catch (altError) {
      logger.error(`Alternative loading also failed: ${altError.message}`);
      throw new Error('All loading attempts failed');
    }
  }
  
  // Vérifier que SecureStore a les méthodes attendues
  if (!SecureStore || typeof SecureStore !== 'object') {
    logger.error('SecureStore is not an object after loading');
    SecureStore = createFallbackSecureStore('module loaded but is not an object');
  } 
  else if (!SecureStore.setItemAsync || !SecureStore.getItemAsync || !SecureStore.deleteItemAsync) {
    logger.error('SecureStore API methods missing - got methods: ' + 
      Object.keys(SecureStore).filter(k => typeof SecureStore[k] === 'function').join(', '));
    
    // Test basic API methods
    const missingMethods = ['setItemAsync', 'getItemAsync', 'deleteItemAsync']
      .filter(method => typeof SecureStore[method] !== 'function');
    
    logger.error(`Missing SecureStore methods: ${missingMethods.join(', ')}`);
    SecureStore = createFallbackSecureStore('API methods missing or invalid');
  }
  else {
    // SecureStore semble correct - faisons un test supplémentaire
    logger.info('SecureStore module loaded with all required methods');
    
    // Tester les méthodes avec un bloc try/catch pour s'assurer qu'elles fonctionnent
    try {
      // Test rapide des méthodes pour s'assurer qu'elles sont bien des fonctions
      if (
        typeof SecureStore.setItemAsync !== 'function' ||
        typeof SecureStore.getItemAsync !== 'function' ||
        typeof SecureStore.deleteItemAsync !== 'function'
      ) {
        throw new Error('One or more methods are not functions');
      }
      
      // Test de fonctionnement avec une opération réelle
      try {
        const TEST_KEY = '__SECURE_STORE_TEST_KEY__';
        const TEST_VALUE = 'test_' + Date.now();
        
        // Test write
        logger.info('Testing SecureStore with actual write operation...');
        await SecureStore.setItemAsync(TEST_KEY, TEST_VALUE);
        
        // Test read
        const readValue = await SecureStore.getItemAsync(TEST_KEY);
        if (readValue !== TEST_VALUE) {
          throw new Error(`Read test failed: expected "${TEST_VALUE}" but got "${readValue}"`);
        }
        
        // Test delete
        await SecureStore.deleteItemAsync(TEST_KEY);
        const deletedValue = await SecureStore.getItemAsync(TEST_KEY);
        if (deletedValue !== null) {
          throw new Error('Delete test failed: value still exists after deletion');
        }
        
        logger.info('SecureStore operational test PASSED - all operations working');
      } catch (testError) {
        logger.error(`SecureStore operational test FAILED: ${testError.message}`);
        throw new Error(`SecureStore operational test failed: ${testError.message}`);
      }
      
      logger.info('SecureStore methods validated - ready to use');
    } catch (methodError) {
      logger.error(`SecureStore method validation failed: ${methodError.message}`);
      SecureStore = createFallbackSecureStore('method validation failed');
    }
  }
} catch (error) {
  logger.error(`Failed to load expo-secure-store module: ${error.message}`);
  // Créer une implémentation de secours si le module ne se charge pas
  SecureStore = createFallbackSecureStore('module loading completely failed');
}

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
export async function saveItem(key: string, value: string | null | undefined): Promise<void> {
  try {
    // Validate inputs to prevent errors
    if (!key) {
      logger.error("saveItem: Key cannot be null or empty");
      return;
    }
    
    // Ensure value is always a string, even if null/undefined
    const safeValue = value === null || value === undefined ? "" : String(value);
    
    console.log(`Saving ${key} value with length: ${safeValue.length}`);

    if (Platform.OS === 'web') {
      // Use localStorage for persistence in web environments if available
      if (useLocalStorage()) {
        try {
          localStorage.setItem(key, safeValue);
          console.log(`Saved ${key} to localStorage`);
        } catch (webError) {
          logger.error(`Failed to save ${key} to localStorage:`, webError);
          // Fallback to in-memory storage
          inMemoryStorage.set(key, safeValue);
          console.log(`Fallback: Saved ${key} to inMemoryStorage`);
        }
      } else {
        inMemoryStorage.set(key, safeValue);
        console.log(`Saved ${key} to inMemoryStorage`);
      }
    } else {
      // Verify SecureStore is available before using it
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        try {
          await SecureStore.setItemAsync(key, safeValue);
          console.log(`Saved ${key} to SecureStore`);
        } catch (secureStoreError) {
          logger.error(`SecureStore.setItemAsync failed for ${key}:`, secureStoreError);
          
          // Try to use AsyncStorage as fallback if available
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
              await AsyncStorage.setItem(key, safeValue);
              logger.warn(`Fallback: Saved ${key} using AsyncStorage`);
            } else {
              throw new Error('AsyncStorage fallback not available');
            }
          } catch (asyncStorageError) {
            logger.error(`Complete storage failure for ${key}:`, asyncStorageError);
            // Last resort - use in-memory storage
            inMemoryStorage.set(key, safeValue);
            logger.warn(`Emergency fallback: Saved ${key} to inMemoryStorage`);
          }
        }
      } else {
        logger.error(`SecureStore.setItemAsync not available for key ${key}`);
        // Fallback to in-memory storage
        inMemoryStorage.set(key, safeValue);
        logger.warn(`Missing API fallback: Saved ${key} to inMemoryStorage`);
      }
    }
  } catch (error) {
    logger.error(`Error saving ${key}:`, error);
    // Even if everything else fails, still try to save to in-memory storage
    try {
      inMemoryStorage.set(key, value === null || value === undefined ? "" : String(value));
      logger.warn(`Last resort fallback: Saved ${key} to inMemoryStorage after all other methods failed`);
    } catch (finalError) {
      logger.error(`Catastrophic failure saving ${key}:`, finalError);
    }
  }
}

// Fonction pour récupérer une valeur
export async function getItem(key: string): Promise<string | null> {
  try {
    // Validate key
    if (!key) {
      logger.error("getItem: Key cannot be null or empty");
      return null;
    }

    if (Platform.OS === 'web') {
      // Use localStorage for web if available
      if (useLocalStorage()) {
        try {
          const value = localStorage.getItem(key);
          console.log(`Retrieved ${key} from localStorage: ${value ? 'found' : 'not found'}`);
          return value;
        } catch (webError) {
          logger.error(`Failed to retrieve ${key} from localStorage:`, webError);
          // Fall back to in-memory storage
          const fallbackValue = inMemoryStorage.get(key) || null;
          logger.warn(`Fallback: Retrieved ${key} from inMemoryStorage`);
          return fallbackValue;
        }
      } else {
        const value = inMemoryStorage.get(key) || null;
        console.log(`Retrieved ${key} from inMemoryStorage: ${value ? 'found' : 'not found'}`);
        return value;
      }
    }
    
    // For native platforms, try SecureStore first
    if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
      try {
        const value = await SecureStore.getItemAsync(key);
        console.log(`Retrieved ${key} from SecureStore: ${value ? 'found' : 'not found'}`);
        return value;
      } catch (secureStoreError) {
        logger.error(`SecureStore.getItemAsync failed for ${key}:`, secureStoreError);
        
        // Try AsyncStorage as fallback
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
            const asyncValue = await AsyncStorage.getItem(key);
            logger.warn(`Fallback: Retrieved ${key} from AsyncStorage: ${asyncValue ? 'found' : 'not found'}`);
            return asyncValue;
          }
        } catch (asyncError) {
          logger.error(`AsyncStorage fallback failed for ${key}:`, asyncError);
        }
        
        // Last resort, check in-memory storage
        const memoryValue = inMemoryStorage.get(key) || null;
        logger.warn(`Emergency fallback: Retrieved ${key} from inMemoryStorage: ${memoryValue ? 'found' : 'not found'}`);
        return memoryValue;
      }
    } else {
      logger.error(`SecureStore.getItemAsync not available for key ${key}`);
      
      // Try AsyncStorage if SecureStore is not available
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
          const asyncValue = await AsyncStorage.getItem(key);
          logger.warn(`API missing fallback: Retrieved ${key} from AsyncStorage: ${asyncValue ? 'found' : 'not found'}`);
          return asyncValue;
        }
      } catch (asyncError) {
        logger.error(`AsyncStorage fallback failed for ${key}:`, asyncError);
      }
      
      // If all else fails, try in-memory storage
      const memoryValue = inMemoryStorage.get(key) || null;
      logger.warn(`Last resort: Retrieved ${key} from inMemoryStorage: ${memoryValue ? 'found' : 'not found'}`);
      return memoryValue;
    }
  } catch (error) {
    logger.error(`Error retrieving ${key}:`, error);
    
    // Final attempt - check in-memory as absolute last resort
    try {
      const lastResortValue = inMemoryStorage.get(key) || null;
      logger.warn(`Final attempt: Retrieved ${key} from inMemoryStorage after all methods failed`);
      return lastResortValue;
    } catch (finalError) {
      logger.error(`Catastrophic failure retrieving ${key}:`, finalError);
      return null;
    }
  }
}

// Fonction pour supprimer une valeur
export async function removeItem(key: string): Promise<void> {
  try {
    // Validate key
    if (!key) {
      logger.error("removeItem: Key cannot be null or empty");
      return;
    }
    
    console.log(`Removing ${key} from storage`);

    // Keep track of whether any method succeeded
    let removalSucceeded = false;

    if (Platform.OS === 'web') {
      // Use localStorage for web if available
      if (useLocalStorage()) {
        try {
          localStorage.removeItem(key);
          console.log(`Removed ${key} from localStorage`);
          removalSucceeded = true;
        } catch (webError) {
          logger.error(`Failed to remove ${key} from localStorage:`, webError);
        }
      }
      
      // Always try in-memory storage to be safe (even if localStorage succeeded)
      try {
        inMemoryStorage.delete(key);
        console.log(`Removed ${key} from inMemoryStorage`);
        removalSucceeded = true;
      } catch (memError) {
        logger.error(`Failed to remove ${key} from inMemoryStorage:`, memError);
      }
    } else {
      // For native platforms, try SecureStore first
      if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log(`Removed ${key} from SecureStore`);
          removalSucceeded = true;
        } catch (secureStoreError) {
          logger.error(`SecureStore.deleteItemAsync failed for ${key}:`, secureStoreError);
        }
      } else {
        logger.error(`SecureStore.deleteItemAsync not available for key ${key}`);
      }
      
      // Try AsyncStorage as additional removal method
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
          await AsyncStorage.removeItem(key);
          logger.warn(`Removed ${key} from AsyncStorage`);
          removalSucceeded = true;
        }
      } catch (asyncError) {
        logger.error(`AsyncStorage removal failed for ${key}:`, asyncError);
      }
      
      // Always try in-memory storage to be extra safe
      try {
        inMemoryStorage.delete(key);
        logger.warn(`Removed ${key} from inMemoryStorage`);
        removalSucceeded = true;
      } catch (memError) {
        logger.error(`Failed to remove ${key} from inMemoryStorage:`, memError);
      }
    }
    
    if (!removalSucceeded) {
      logger.warn(`Failed to remove ${key} from ALL storage methods`);
    }
  } catch (error) {
    logger.error(`Error removing ${key}:`, error);
    
    // Final attempt - try to remove from in-memory as last resort
    try {
      inMemoryStorage.delete(key);
      logger.warn(`Final attempt: Removed ${key} from inMemoryStorage after other methods failed`);
    } catch (finalError) {
      logger.error(`Catastrophic failure removing ${key}:`, finalError);
    }
  }
}

// Fonctions d'aide spécifiques à l'authentification
export async function saveAuthData(
  accessToken: string | null | undefined,
  refreshToken: string | null | undefined,
  user: Record<string, unknown> | null | undefined
): Promise<void> {
  console.log('=== SAVE AUTH DATA ===');
  console.log('Saving auth data for user:', user?.email || 'unknown');

  try {
    // Validate all input parameters
    if (!accessToken) {
      logger.error('Missing access token in saveAuthData');
      accessToken = ''; // Use empty string instead of null/undefined
    }
    
    if (!refreshToken) {
      logger.error('Missing refresh token in saveAuthData');
      refreshToken = ''; // Use empty string instead of null/undefined
    }
    
    // Ensure user is an object before stringifying
    if (user && typeof user === 'object') {
      await saveItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await saveItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await saveItem(STORAGE_KEYS.USER, JSON.stringify(user));
      console.log('Auth data saved successfully');
    } else {
      logger.error('Invalid user object provided to saveAuthData:', user);
      // Still save tokens even if user object is invalid
      await saveItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await saveItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      // Use empty object for user data if missing
      await saveItem(STORAGE_KEYS.USER, JSON.stringify({}));
      console.log('Saved tokens but user data was invalid');
    }
  } catch (error) {
    logger.error('Failed to save auth data:', error);
    // Try individual saves to maximize chance of success
    try {
      await saveItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken || '');
      await saveItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || '');
      if (user && typeof user === 'object') {
        await saveItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
      logger.info('Partially saved auth data during error recovery');
    } catch (innerError) {
      logger.error('Complete failure saving auth data:', innerError);
    }
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

// Fonction d'initialisation - à appeler au démarrage pour garantir que le stockage fonctionne
export async function initializeSecureStorage(): Promise<{
  success: boolean;
  storageType: 'secureStore' | 'asyncStorage' | 'localStorage' | 'inMemory';
  reason?: string;
}> {
  try {
    // Test avec une clé spéciale
    const TEST_INIT_KEY = '__SECURE_STORAGE_INIT_TEST__';
    const TEST_VALUE = 'init_' + Date.now();
    
    logger.info('Initializing secure storage...');
    
    // Nettoyer d'abord pour être sûr
    try {
      await removeItem(TEST_INIT_KEY);
    } catch (e) {}
    
    // Tester saveItem
    await saveItem(TEST_INIT_KEY, TEST_VALUE);
    const readValue = await getItem(TEST_INIT_KEY);
    
    // Nettoyer après le test
    try {
      await removeItem(TEST_INIT_KEY);
    } catch (e) {}
    
    if (readValue !== TEST_VALUE) {
      logger.error(`Storage initialization failed: read value "${readValue}" doesn't match written value "${TEST_VALUE}"`);
      return {
        success: false,
        storageType: 'inMemory',
        reason: 'Read value does not match written value'
      };
    }
    
    // Déterminer le type de stockage utilisé
    let storageType: 'secureStore' | 'asyncStorage' | 'localStorage' | 'inMemory';
    
    if (SecureStore && typeof SecureStore.setItemAsync === 'function' && 
        !SecureStore.toString().includes('fallback')) {
      storageType = 'secureStore';
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      storageType = 'localStorage';
    } else {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage')?.default;
        if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
          storageType = 'asyncStorage';
        } else {
          storageType = 'inMemory';
        }
      } catch (e) {
        storageType = 'inMemory';
      }
    }
    
    logger.info(`Storage initialization successful using ${storageType}`);
    return { success: true, storageType };
  } catch (error) {
    logger.error('Storage initialization failed:', error);
    return {
      success: false,
      storageType: 'inMemory',
      reason: error.message
    };
  }
}

// Fonction de diagnostic pour aider à déboguer les problèmes de stockage
export async function diagnoseStorage(): Promise<{
  status: string;
  details: Record<string, any>;
}> {
  try {
    const details: Record<string, any> = {
      platform: Platform.OS,
      secureStoreAvailable: !!(SecureStore && typeof SecureStore.setItemAsync === 'function'),
      localStorageAvailable: Platform.OS === 'web' && typeof localStorage !== 'undefined',
      inMemoryItemCount: inMemoryStorage.size,
      timestamp: new Date().toISOString()
    };
    
    // Vérifier AsyncStorage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage')?.default;
      details.asyncStorageAvailable = !!(AsyncStorage && typeof AsyncStorage.setItem === 'function');
    } catch (e) {
      details.asyncStorageAvailable = false;
      details.asyncStorageError = e.message;
    }
    
    // Tester les opérations de stockage
    const testResults = {
      secureStore: { write: false, read: false, delete: false, error: null },
      asyncStorage: { write: false, read: false, delete: false, error: null },
      localStorage: { write: false, read: false, delete: false, error: null },
      inMemory: { write: false, read: false, delete: false, error: null }
    };
    
    // Test SecureStore
    if (details.secureStoreAvailable) {
      try {
        const testKey = '__DIAGNOSTIC_SECURE_STORE__';
        const testValue = 'test_' + Date.now();
        
        await SecureStore.setItemAsync(testKey, testValue);
        testResults.secureStore.write = true;
        
        const readValue = await SecureStore.getItemAsync(testKey);
        testResults.secureStore.read = readValue === testValue;
        
        await SecureStore.deleteItemAsync(testKey);
        const deletedValue = await SecureStore.getItemAsync(testKey);
        testResults.secureStore.delete = deletedValue === null;
      } catch (e) {
        testResults.secureStore.error = e.message;
      }
    }
    
    // Test inMemory
    try {
      const testKey = '__DIAGNOSTIC_IN_MEMORY__';
      const testValue = 'test_' + Date.now();
      
      inMemoryStorage.set(testKey, testValue);
      testResults.inMemory.write = true;
      
      const readValue = inMemoryStorage.get(testKey);
      testResults.inMemory.read = readValue === testValue;
      
      inMemoryStorage.delete(testKey);
      testResults.inMemory.delete = !inMemoryStorage.has(testKey);
    } catch (e) {
      testResults.inMemory.error = e.message;
    }
    
    // Ajouter les résultats des tests
    details.testResults = testResults;
    
    // Vérifier si au moins un mécanisme de stockage fonctionne
    const hasWorkingStorage = 
      (testResults.secureStore.write && testResults.secureStore.read) ||
      (testResults.asyncStorage.write && testResults.asyncStorage.read) ||
      (testResults.localStorage.write && testResults.localStorage.read) ||
      (testResults.inMemory.write && testResults.inMemory.read);
    
    return {
      status: hasWorkingStorage ? 'operational' : 'failing',
      details
    };
  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export par défaut
export default secureStorage;
