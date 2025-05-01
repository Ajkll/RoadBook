/**
 * Tests unitaires pour les utilitaires de statistiques
 * 
 * Ces tests vérifient le fonctionnement des fonctions de calcul de statistiques
 * pour les sessions, roadbooks et utilisateurs.
 */

import * as statistics from '../utils/statistics';
import prisma from '../config/prisma';
import { setupBeforeAll, teardownAfterAll, resetDatabase } from './setup';

// Mock prisma
jest.mock('../config/prisma', () => ({
  session: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  roadBook: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  }
}));

// Configuration des tests
beforeAll(async () => {
  await setupBeforeAll();
});

// Nettoyer après tous les tests
afterAll(async () => {
  await teardownAfterAll();
});

// Réinitialiser les mocks entre les tests
beforeEach(async () => {
  jest.clearAllMocks();
  await resetDatabase();
});

describe('Statistics Utilities', () => {
  describe('calculateSessionStatistics', () => {
    it('should calculate session statistics correctly', async () => {
      // Configurer le mock
      const mockSession = {
        id: 'session-1',
        duration: 60, // 60 minutes
        distance: 30, // 30 km
        startTime: new Date('2025-04-24T10:00:00Z'),
        endTime: new Date('2025-04-24T11:00:00Z'),
        weather: 'CLEAR',
        daylight: 'DAY',
        roadTypes: ['HIGHWAY', 'URBAN'],
        validatorId: 'validator-1',
        validationDate: new Date()
      };
      
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      
      // Exécuter la fonction
      const result = await statistics.calculateSessionStatistics('session-1');
      
      // Vérifier les résultats
      expect(result).toMatchObject({
        duration: 60,
        distance: 30,
        averageSpeed: 30, // 30 km / 1h = 30 km/h
        weather: 'CLEAR',
        daylight: 'DAY',
        roadTypes: ['HIGHWAY', 'URBAN'],
        isValidated: true
      });
      
      // Vérifier que le service a été appelé correctement
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-1' }
      });
    });
    
    it('should calculate duration from start/end times if not provided', async () => {
      // Configurer le mock - session sans durée explicite
      const mockSession = {
        id: 'session-2',
        duration: null,
        distance: 20,
        startTime: new Date('2025-04-24T14:00:00Z'),
        endTime: new Date('2025-04-24T15:30:00Z'), // 1h30 = 90 minutes
        weather: 'RAINY',
        daylight: 'DAY',
        roadTypes: ['URBAN'],
        validatorId: null,
        validationDate: null
      };
      
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      
      // Exécuter la fonction
      const result = await statistics.calculateSessionStatistics('session-2');
      
      // Vérifier les résultats
      expect(result.duration).toBe(90); // Devrait calculer 90 minutes
      expect(result.averageSpeed).toBeCloseTo(13.3, 1); // 20 km / 1.5h ≈ 13.3 km/h
      expect(result.isValidated).toBe(false);
    });
    
    it('should handle missing data gracefully', async () => {
      // Configurer le mock - session avec données minimales
      const mockSession = {
        id: 'session-3',
        duration: 45,
        distance: null,
        startTime: new Date(),
        endTime: null,
        weather: null,
        daylight: null,
        roadTypes: null,
        validatorId: null,
        validationDate: null
      };
      
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      
      // Exécuter la fonction
      const result = await statistics.calculateSessionStatistics('session-3');
      
      // Vérifier les résultats
      expect(result.duration).toBe(45);
      expect(result.distance).toBeNull();
      expect(result.averageSpeed).toBeNull(); // Pas calculable sans distance
      expect(result.roadTypes).toEqual([]);
      expect(result.isValidated).toBe(false);
    });
  });
  
  describe('calculatePeriodMetrics', () => {
    it('should calculate period metrics correctly', () => {
      const sessions = [
        { duration: 60, distance: 30 },
        { duration: 45, distance: 20 },
        { duration: 90, distance: 50 }
      ];
      
      const result = statistics.calculatePeriodMetrics(sessions, 'test period');
      
      expect(result).toEqual({
        count: 3,
        totalDuration: 195, // 60 + 45 + 90
        totalDistance: 100, // 30 + 20 + 50
        averageDuration: 65, // 195 / 3
        averageDistance: 33.3 // 100 / 3
      });
    });
    
    it('should handle empty sessions array', () => {
      const result = statistics.calculatePeriodMetrics([], 'empty period');
      
      expect(result).toEqual({
        count: 0,
        totalDuration: 0,
        totalDistance: 0,
        averageDuration: 0,
        averageDistance: 0
      });
    });
    
    it('should handle sessions with missing data', () => {
      const sessions = [
        { duration: 60 }, // Pas de distance
        { distance: 20 }, // Pas de durée
        { duration: null, distance: null } // Aucune donnée
      ];
      
      const result = statistics.calculatePeriodMetrics(sessions, 'incomplete data');
      
      expect(result).toEqual({
        count: 3,
        totalDuration: 60, // Seule la première session a une durée
        totalDistance: 20, // Seule la deuxième session a une distance
        averageDuration: 20, // 60 / 3
        averageDistance: 6.7 // 20 / 3
      });
    });
  });
});