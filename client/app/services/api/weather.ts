import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversineDistance } from '../../utils/firebase/driveSessionUtils';
import Constants from 'expo-constants';
import { ENV } from '../../services/config/env';
import { logger } from '../../utils/logger';

// Configuration du cache
const API_KEY = ENV.WEATHER_API_KEY;
const BASE_URL =
  'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';
const CACHE_PREFIX = '@WEATHER_CACHE_';
const MAX_CACHE_ITEMS = 50;
const CACHE_KEYS_KEY = '@WEATHER_CACHE_KEYS';
const CACHE_LIFETIME_MS = 30 * 24 * 60 * 60 * 500; // temps de validité dans notre cache (15 jours si pas modifier)

interface WeatherCacheItem {
  latitude: number;
  longitude: number;
  timestamp: number; // date postérieur de la demande météo
  data: {
    temperature: number;
    conditions: string;
    windSpeed: number;
    visibility: number;
    humidity: number;
    pressure: number;
  };
  createdAt: number; // Date de création du cache
}

// pour nettoyer la cache
export async function cleanCache() {
  try {
    const keysString = await AsyncStorage.getItem(CACHE_KEYS_KEY);
    if (!keysString) return;

    const keys = JSON.parse(keysString) as string[];
    const now = Date.now();
    const validKeys: string[] = [];
    const itemsToKeep: WeatherCacheItem[] = [];

    for (const key of keys) {
      const itemString = await AsyncStorage.getItem(key);
      if (itemString) {
        const item = JSON.parse(itemString) as WeatherCacheItem;
        if (now - item.createdAt <= CACHE_LIFETIME_MS) {
          validKeys.push(key);
          itemsToKeep.push(item);
        }
      } else {
        logger.error(`Item non trouvé dans le cache pour la clé: ${key}`);
      }
    }

    // garder seulement les MAX_CACHE_ITEMS plus récents
    itemsToKeep.sort((a, b) => b.createdAt - a.createdAt);
    const finalKeys = itemsToKeep.slice(0, MAX_CACHE_ITEMS).map((_, index) => validKeys[index]);

    await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify(finalKeys));
  } catch (error) {
    logger.error('Erreur lors du nettoyage de la cache:', error);
  }
}

// pour trouver dans la cache
export async function findInCache(
  latitude: number,
  longitude: number,
  timestamp: number,
  timePrecisionHours: number,
  distancePrecisionMeters: number
): Promise<WeatherCacheItem | null> {
  try {
    const keysString = await AsyncStorage.getItem(CACHE_KEYS_KEY);
    if (!keysString) return null;

    const keys = JSON.parse(keysString) as string[];
    const now = Date.now();

    for (const key of keys) {
      const itemString = await AsyncStorage.getItem(key);
      if (itemString) {
        const item = JSON.parse(itemString) as WeatherCacheItem;

        // validité temporelle
        const isTimeValid =
          Math.abs(item.timestamp - timestamp) <= timePrecisionHours * 60 * 60 * 1000;

        // validité géographique
        const distance = haversineDistance(latitude, longitude, item.latitude, item.longitude);
        const isLocationValid = distance <= distancePrecisionMeters / 1000; // Conversion en km

        if (isTimeValid && isLocationValid && now - item.createdAt <= CACHE_LIFETIME_MS) {
          return item;
        }
      } else {
        logger.error(`Item de cache non trouvé pour la clé: ${key}`);
      }
    }
    return null;
  } catch (error) {
    logger.error('Erreur lors de la recherche dans la cache:', error);
    return null;
  }
}

// pour ajouter à la cache
export async function addToCache(item: WeatherCacheItem): Promise<void> {
  try {
    await cleanCache();

    const key = `${CACHE_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const keysString = await AsyncStorage.getItem(CACHE_KEYS_KEY);
    const keys = keysString ? (JSON.parse(keysString) as string[]) : [];

    await AsyncStorage.setItem(key, JSON.stringify(item));
    await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify([...keys, key]));
  } catch (error) {
    logger.error("Erreur lors de l'ajout à notre cache météo:", error);
  }
}

// Fonction principale de requetes api (VisualCrossingWebServices)
export const getWeather = async (
  latitude: number,
  longitude: number,
  timestamp?: number,
  options?: {
    timePrecisionHours?: number;
    distancePrecisionMeters?: number;
  }
): Promise<WeatherCacheItem['data'] | null> => {
  try {
    // Validate input parameters
    if (typeof latitude !== 'number' || isNaN(latitude)) {
      logger.error('getWeather: Invalid latitude parameter', { latitude });
      return null;
    }
    if (typeof longitude !== 'number' || isNaN(longitude)) {
      logger.error('getWeather: Invalid longitude parameter', { longitude });
      return null;
    }
    if (timestamp && (isNaN(timestamp) || timestamp < 0)) {
      logger.error('getWeather: Invalid timestamp parameter', { timestamp });
      return null;
    }

    logger.debug('Appel à getWeather avec:', {
      latitude,
      longitude,
      timestamp,
      requestedAt: new Date(timestamp || Date.now()).toISOString(),
    });

    const store = require('../../store/store').default;
    const state = store.getState();
    const isConnected = state.network.isConnected;

    const effectiveTimestamp = timestamp || Date.now();
    const timePrecision = options?.timePrecisionHours ?? 1;
    const distancePrecision = options?.distancePrecisionMeters ?? 1000;

    // Try to find in cache first
    try {
      const cached = await findInCache(
        latitude,
        longitude,
        effectiveTimestamp,
        timePrecision,
        distancePrecision
      );
      if (cached) {
        logger.debug('Données trouvées dans la cache:', {
          source: 'cache',
          cachedData: cached.data,
          cacheDate: new Date(cached.createdAt).toISOString(),
          originalTimestamp: new Date(cached.timestamp).toISOString(),
        });
        return cached.data;
      }
    } catch (cacheError) {
      logger.warn('Erreur lors de la recherche dans le cache:', cacheError);
      // Continue execution - we'll try to fetch from API
    }

    // If offline and no cache hit, return null
    if (!isConnected) {
      logger.info('Pas de connexion réseau disponible, impossible de récupérer les données météo');
      return null;
    }

    /**
   * Helper function to perform API request with retry capability
   */
  const fetchWithRetry = async (url: string, params: any, maxRetries = 3, retryDelay = 1000): Promise<any> => {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await axios.get(url, {
          params,
          timeout: 10000, // 10 second timeout
        });
      } catch (error) {
        lastError = error;
        
        // Only retry network errors or 5xx server errors
        const shouldRetry = axios.isAxiosError(error) && (
          !error.response || 
          (error.response.status >= 500 && error.response.status < 600) ||
          error.code === 'ECONNABORTED'
        );
        
        if (shouldRetry && attempt < maxRetries) {
          logger.warn(`Échec de la requête API météo (tentative ${attempt}/${maxRetries}), nouvelle tentative dans ${retryDelay}ms`, {
            url,
            error: axios.isAxiosError(error) ? error.message : 'Unknown error',
          });
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Increase delay for next attempt (exponential backoff)
          retryDelay *= 2;
        } else {
          // Last attempt or not a retryable error
          throw error;
        }
      }
    }
    
    throw lastError; // Should never reach this point but needed for TypeScript
  };

    // Prepare API request
    try {
      const dateParam = timestamp ? new Date(timestamp).toISOString().split('T')[0] : '';
      const url = `${BASE_URL}${latitude},${longitude}${dateParam ? `/${dateParam}` : ''}`;
      
      logger.debug('Requête API météo vers:', { url });
      
      const response = await fetchWithRetry(url, {
        key: API_KEY,
        unitGroup: 'metric',
        include: 'current',
      });

      // Validate response data
      if (!response.data) {
        logger.warn('Réponse API météo vide');
        return null;
      }

      // Extract relevant data based on whether we're looking for historical or current weather
      const data = timestamp
        ? response.data.days?.[0]?.hours?.find(
            (h: any) => new Date(h.datetime).getHours() === new Date(timestamp).getHours()
          )
        : response.data.currentConditions;

      if (!data) {
        logger.warn('Aucune donnée météo dans la réponse API', { 
          timestamp: timestamp ? new Date(timestamp).toISOString() : 'current',
          responseFormat: JSON.stringify(response.data).substring(0, 200) + '...' 
        });
        return null;
      }

      // Transform API data to our format
      const weatherData = {
        temperature: data.temp,
        conditions: data.conditions,
        windSpeed: data.windspeed,
        visibility: data.visibility,
        humidity: data.humidity,
        pressure: data.pressure,
      };

      // Cache the result
      try {
        await addToCache({
          latitude,
          longitude,
          timestamp: effectiveTimestamp,
          data: weatherData,
          createdAt: Date.now(),
        });
        logger.debug('Données météo sauvegardées dans le cache');
      } catch (cacheError) {
        logger.warn('Échec de mise en cache des données météo:', cacheError);
        // Continue execution - cache failure shouldn't prevent returning valid data
      }

      return weatherData;
    } catch (apiError) {
      if (axios.isAxiosError(apiError)) {
        if (apiError.code === 'ECONNABORTED') {
          logger.error('Timeout lors de la requête API météo:', {
            latitude,
            longitude,
            timestamp: timestamp ? new Date(timestamp).toISOString() : 'current',
          });
        } else if (apiError.response) {
          logger.error('Erreur API météo avec réponse:', {
            status: apiError.response.status,
            statusText: apiError.response.statusText,
            data: apiError.response.data,
          });
        } else if (apiError.request) {
          logger.error('Erreur API météo sans réponse (problème réseau probable)');
        } else {
          logger.error('Erreur lors de la configuration de la requête API météo:', apiError.message);
        }
      } else {
        logger.error('Erreur inconnue lors de la requête API météo:', {
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
          stack: apiError instanceof Error ? apiError.stack : undefined,
        });
      }
      return null;
    }
  } catch (error) {
    logger.error('Erreur générale dans getWeather:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      latitude,
      longitude,
      timestamp: timestamp ? new Date(timestamp).toISOString() : 'current',
    });
    return null;
  }
};