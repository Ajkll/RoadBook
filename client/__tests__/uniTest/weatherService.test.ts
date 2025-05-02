import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversineDistance } from '../../app/utils/firebase/driveSessionUtils';

// Mock des dépendances
jest.mock('axios');
jest.mock('../../app/utils/firebase/driveSessionUtils');
jest.mock('../../app/store/store', () => ({
  default: {
    getState: jest.fn(() => ({
      network: { isConnected: true }
    }))
  }
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn()
}));

const createMockWeatherData = (overrides = {}) => ({
  temperature: 15,
  conditions: 'Partly cloudy',
  windSpeed: 10,
  visibility: 10,
  humidity: 50,
  pressure: 1015,
  ...overrides
});

const createMockCacheItem = (overrides = {}) => ({
  latitude: 48.8566,
  longitude: 2.3522,
  timestamp: Date.now(),
  data: createMockWeatherData(),
  createdAt: Date.now(),
  ...overrides
});

const { cleanCache, findInCache, addToCache } = require('../../app/services/api/weather');

describe('Weather Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (haversineDistance as jest.Mock).mockImplementation(() => 0.5);
  });
  describe('Error Handling', () => {
    it('should log error when cleanCache fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await cleanCache();

      expect(consoleSpy).toHaveBeenCalledWith('Erreur lors du nettoyage de la cache:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should log error when findInCache fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await findInCache(48.8566, 2.3522, Date.now(), 1, 1000);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Erreur lors de la recherche dans la cache:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should log error when addToCache fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await addToCache(createMockCacheItem());

      expect(consoleSpy).toHaveBeenCalledWith("Erreur lors de l'ajout à notre cache météo:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
  describe('Cache Management', () => {
    it('should clean cache by removing expired items', async () => {
      const freshItem = createMockCacheItem({ createdAt: Date.now() - 1000 });
      const expiredItem = createMockCacheItem({ createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000 + 1) });

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(['@WEATHER_CACHE_1', '@WEATHER_CACHE_2']))
        .mockResolvedValueOnce(JSON.stringify(freshItem))
        .mockResolvedValueOnce(JSON.stringify(expiredItem));

      await cleanCache();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@WEATHER_CACHE_KEYS',
        JSON.stringify(['@WEATHER_CACHE_1']) // Seul le fresh item devrait rester
      );
    });

    it('should find valid cache item matching criteria', async () => {
      const mockItem = createMockCacheItem();

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(['@WEATHER_CACHE_1']))
        .mockResolvedValueOnce(JSON.stringify(mockItem));

      const result = await findInCache(48.8566, 2.3522, Date.now(), 1, 1000);
      expect(result).toEqual(mockItem);
    });

    it('should not find cache item when distance is too far', async () => {
      (haversineDistance as jest.Mock).mockReturnValue(2);
      const mockItem = createMockCacheItem();

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(['@WEATHER_CACHE_1']))
        .mockResolvedValueOnce(JSON.stringify(mockItem));

      const result = await findInCache(49.8566, 2.3522, Date.now(), 1, 1000);
      expect(result).toBeNull();
    });

    it('should add new item to cache and update keys', async () => {
      const mockItem = createMockCacheItem();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await addToCache(mockItem);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('@WEATHER_CACHE_'),
        JSON.stringify(mockItem)
      );
    });
  });
});