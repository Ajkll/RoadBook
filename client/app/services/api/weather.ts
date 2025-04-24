import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversineDistance } from '../../utils/firebase/driveSessionUtils';

// Configuration du cache
const API_KEY = 'EBCPXGKNCZ8PU7UXYDYZQGFSJ';
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
async function cleanCache() {
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
      }
    }

    // garder seulement les MAX_CACHE_ITEMS plus récents
    itemsToKeep.sort((a, b) => b.createdAt - a.createdAt);
    const finalKeys = itemsToKeep.slice(0, MAX_CACHE_ITEMS).map((_, index) => validKeys[index]);

    await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify(finalKeys));
  } catch (error) {
    console.error('Erreur lors du nettoyage de la cache:', error);
  }
}

// pour trouver dans la cache
async function findInCache(
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
      }
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la recherche dans la cache:', error);
    return null;
  }
}

// pour ajouter à la cache
async function addToCache(item: WeatherCacheItem): Promise<void> {
  try {
    await cleanCache();

    const key = `${CACHE_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const keysString = await AsyncStorage.getItem(CACHE_KEYS_KEY);
    const keys = keysString ? (JSON.parse(keysString) as string[]) : [];

    await AsyncStorage.setItem(key, JSON.stringify(item));
    await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify([...keys, key]));
  } catch (error) {
    console.error("Erreur lors de l'ajout à notre cache météo:", error);
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
) => {
  try {
    console.log(' Appel à getWeather avec:', {
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

    const cached = await findInCache(
      latitude,
      longitude,
      effectiveTimestamp,
      timePrecision,
      distancePrecision
    );
    if (cached) {
      console.log('Données trouvées dans la cache:', {
        source: 'cache',
        cachedData: cached.data,
        cacheDate: new Date(cached.createdAt).toISOString(),
        originalTimestamp: new Date(cached.timestamp).toISOString(),
      });
      return cached.data;
    }

    if (!isConnected) {
      console.log('Pas de connexion : null');
      return null;
    }

    const dateParam = timestamp ? new Date(timestamp).toISOString().split('T')[0] : '';
    const url = `${BASE_URL}${latitude},${longitude}${dateParam ? `/${dateParam}` : ''}`;
    const response = await axios.get(url, {
      params: {
        key: API_KEY,
        unitGroup: 'metric',
        include: 'current',
      },
    });

    const data = timestamp
      ? response.data.days?.[0]?.hours?.find(
          (h: any) => new Date(h.datetime).getHours() === new Date(timestamp).getHours()
        )
      : response.data.currentConditions;

    if (!data) {
      console.log('aucune donnée dans la réponse API');
      return null;
    }

    const weatherData = {
      temperature: data.temp,
      conditions: data.conditions,
      windSpeed: data.windspeed,
      visibility: data.visibility,
      humidity: data.humidity,
      pressure: data.pressure,
    };

    await addToCache({
      latitude,
      longitude,
      timestamp: effectiveTimestamp,
      data: weatherData,
      createdAt: Date.now(),
    });

    console.log('Données sauvegardées dans la cache');

    return weatherData;
  } catch (error) {
    console.error('Erreur dans getWeather:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
};
