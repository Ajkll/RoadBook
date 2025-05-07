import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWeather, findInCache } from '../../app/services/api/weather';

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('../../app/utils/firebase/driveSessionUtils', () => ({
  haversineDistance: jest.fn(() => 0.5),
}));

// Mock du store redux (tres simplifier)
const mockStore = {
  getState: jest.fn(() => ({
    network: { isConnected: true }
  }))
};
jest.mock('../../app/store/store', () => ({
  default: mockStore
}));

describe('Weather Service - Real Integration Tests', () => {
  const mockWeatherData = {
    temperature: 15,
    conditions: 'Partly cloudy',
    windSpeed: 10,
    visibility: 10,
    humidity: 50,
    pressure: 1015
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // configuration par default
    mockStore.getState.mockImplementation(() => ({
      network: { isConnected: true }
    }));

    // mock de base pour AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) => {
      if (key === '@WEATHER_CACHE_KEYS') return JSON.stringify([]);
      return null;
    });

    // mock de base pour axios
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        currentConditions: {
          temp: mockWeatherData.temperature,
          conditions: mockWeatherData.conditions,
          windspeed: mockWeatherData.windSpeed,
          visibility: mockWeatherData.visibility,
          humidity: mockWeatherData.humidity,
          pressure: mockWeatherData.pressure
        }
      }
    });
  });

  it('should fetch fresh data from API when no cache exists', async () => {
    const result = await getWeather(48.8566, 2.3522);

    expect(result).toEqual(mockWeatherData);
    expect(axios.get).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should return cached data when valid cache exists', async () => {
    //cache valide
    const cacheKey = `@WEATHER_CACHE_${Date.now()}`;
    const cacheItem = {
      latitude: 48.8566,
      longitude: 2.3522,
      timestamp: Date.now(),
      data: mockWeatherData,
      createdAt: Date.now()
    };

    (AsyncStorage.getItem as jest.Mock)
      .mockImplementationOnce(async (key) => JSON.stringify([cacheKey])) // keys
      .mockImplementationOnce(async (key) => JSON.stringify(cacheItem));

    const result = await getWeather(48.8566, 2.3522);

    expect(result).toEqual(mockWeatherData);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should return null when offline and no cache', async () => {
    mockStore.getState.mockImplementationOnce(() => ({
      network: { isConnected: false }
    }));

    const result = await getWeather(48.8566, 2.3522);

    expect(result).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });
  describe('Edge Cases', () => {
    it('should handle empty cache keys in findInCache', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null); // Pas de clef de cache

      const result = await findInCache(48.8566, 2.3522, Date.now(), 1, 1000);
      expect(result).toBeNull();
    });

    it('should return null when API returns no data', async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: { currentConditions: null }
      });

      const result = await getWeather(48.8566, 2.3522);
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await getWeather(48.8566, 2.3522);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
  it('should fetch fresh data when cache is expired', async () => {
    // cache expiré
    const cacheKey = `@WEATHER_CACHE_${Date.now()}`;
    const cacheItem = {
      latitude: 48.8566,
      longitude: 2.3522,
      timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000 + 1), // 30 jours
      data: mockWeatherData,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000 + 1) //  30 jours
    };

    (AsyncStorage.getItem as jest.Mock)
      .mockImplementationOnce(async (key) => JSON.stringify([cacheKey])) // keys
      .mockImplementationOnce(async (key) => JSON.stringify(cacheItem));

    const result = await getWeather(48.8566, 2.3522);

    expect(result).toEqual(mockWeatherData);
    expect(axios.get).toHaveBeenCalled();
  });
});