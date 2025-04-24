import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const GEOAPIFY_API_KEY = 'cf42108f59fd40158417cf0be8c3aadb';
const CACHE_PREFIX = '@GEOCODE_';
const MAX_CACHE_ITEMS = 200; // max d'entrés dans le cache
const CACHE_KEYS_KEY = '@GEOCODE_CACHE_KEYS';
const CACHE_LIFETIME_MS = 30 * 24 * 60 * 60 * 10000; // temp de validité : (si non modifier 300 jours)

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const cacheKey = `${CACHE_PREFIX}${lat.toFixed(6)}_${lon.toFixed(6)}`;

  try {
    // 1. Vérifier le cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { address, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_LIFETIME_MS) {
        return address;
      }
      await AsyncStorage.removeItem(cacheKey); // trop vieux
    }

    // 2. Vérifier la connexion
    const { isConnected } = await NetInfo.fetch();
    if (!isConnected) return 'Adresse inconnue (hors ligne)';

    // 3. Requete à l'API
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur API');

    const data = await response.json();
    const address = data.features?.[0]?.properties?.formatted || 'Adresse inconnue';

    // 4. Mise à jour de la cache
    await updateCache(cacheKey, address);

    return address;
  } catch (error) {
    console.error('Erreur de géocodage:', error);
    return 'Adresse inconnue';
  }
}

// gestion spécifique de notre cache
async function updateCache(key: string, address: string) {
  if (address === 'Adresse inconnue') return;

  // 1. Récup la liste des clés
  const cacheKeys = JSON.parse((await AsyncStorage.getItem(CACHE_KEYS_KEY)) || '[]');

  // 2. Ajouter la nouvelle entrée
  const newEntry = {
    address,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(key, JSON.stringify(newEntry));

  // 3. Mettre à jour la liste
  const updatedKeys = [...cacheKeys.filter((k) => k !== key), key];

  // 4. Nettoyer si nécessaire
  if (updatedKeys.length > MAX_CACHE_ITEMS) {
    const oldestKey = updatedKeys.shift();
    if (oldestKey) await AsyncStorage.removeItem(oldestKey);
  }

  // 5. Sauvegarder la nouvelle liste
  await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify(updatedKeys));
}
