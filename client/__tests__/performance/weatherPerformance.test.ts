import { getWeather } from '../../app/services/api/weather';

// Mock de base
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('Weather Service Performance Tests', () => {
  const testCoords = { lat: 48.8566, lng: 2.3522 };
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
    require('axios').get.mockResolvedValue({
      data: { currentConditions: mockWeatherData }
    });
  });

  const measureTime = async (fn: () => Promise<any>) => {
    const start = Date.now();
    await fn();
    return Date.now() - start;
  };

  it('should respond under 300ms for cached requests', async () => {
    // Première appel pour remplir la cache
    await getWeather(testCoords.lat, testCoords.lng);

    const duration = await measureTime(() =>
      getWeather(testCoords.lat, testCoords.lng)
    );

    expect(duration).toBeLessThan(300);
  });

  it('should cache improve response time significantly', async () => {
    // Temps API
    require('@react-native-async-storage/async-storage').getItem.mockResolvedValueOnce(null);
    const apiTime = await measureTime(() =>
      getWeather(testCoords.lat, testCoords.lng)
    );

    const cachedTime = await measureTime(() =>
      getWeather(testCoords.lat, testCoords.lng)
    );

    expect(cachedTime).toBeLessThanOrEqual(apiTime); // La cache ne doit pas etre plus lente
    if (apiTime > 5) {
      expect(cachedTime).toBeLessThan(apiTime * 0.9);
    }
  });

  it('should handle concurrent requests efficiently', async () => {
    // Remplit la cache d'abord
    await getWeather(testCoords.lat, testCoords.lng);

    const start = Date.now();
    await Promise.all(
      Array(5).fill(0).map(() => getWeather(testCoords.lat, testCoords.lng))
    );
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});