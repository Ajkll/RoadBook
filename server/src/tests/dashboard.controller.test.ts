/**
 * Tests unitaires pour le contrôleur du tableau de bord
 * 
 * Ces tests vérifient le fonctionnement des fonctions du contrôleur du tableau de bord:
 * - getCurrentUserDashboard
 * - getApprenticeStatistics
 * - getRoadbookStatistics
 * - getRecentActivity
 */

import * as dashboardController from '../controllers/dashboard.controller';
import * as statistics from '../utils/statistics';
import prisma from '../config/prisma';
import { Request, Response } from 'express';
import { setupBeforeAll, teardownAfterAll, resetDatabase } from './setup';

// Mock prisma pour les tests
jest.mock('../config/prisma', () => ({
  roadBook: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  session: {
    findMany: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  comment: {
    findMany: jest.fn(),
  }
}));

// Mock des fonctions de statistiques
jest.mock('../utils/statistics', () => ({
  calculateApprenticeStatistics: jest.fn(),
  calculateRoadbookStatistics: jest.fn(),
}));

// Configurer l'environnement de test
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

describe('Dashboard Controller', () => {
  // Mock pour la requête
  const mockRequest = (userId = 'user-1', role = 'APPRENTICE', params = {}, query = {}) => {
    return {
      user: { userId, role },
      params,
      query,
    } as Request;
  };

  // Mock pour la réponse
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  describe('getCurrentUserDashboard', () => {
    it('should return dashboard data for an apprentice', async () => {
      // Configurer les mocks
      const req = mockRequest('user-1', 'APPRENTICE');
      const res = mockResponse();
      
      const mockStatsResult = {
        apprentice: { id: 'user-1', name: 'Test User' },
        overview: { totalSessions: 5 }
      };
      
      const mockRoadbooks = [{ id: 'roadbook-1', title: 'Test Roadbook' }];
      const mockSessions = [{ id: 'session-1', date: new Date() }];
      const mockNotifications = [{ id: 'notif-1', title: 'Test Notification' }];
      
      (statistics.calculateApprenticeStatistics as jest.Mock).mockResolvedValue(mockStatsResult);
      (prisma.roadBook.findMany as jest.Mock).mockResolvedValue(mockRoadbooks);
      (prisma.session.findMany as jest.Mock).mockResolvedValue(mockSessions);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      
      // Exécuter la fonction
      await dashboardController.getCurrentUserDashboard(req, res);
      
      // Vérifier les appels et résultats
      expect(statistics.calculateApprenticeStatistics).toHaveBeenCalledWith('user-1');
      expect(prisma.roadBook.findMany).toHaveBeenCalled();
      expect(prisma.session.findMany).toHaveBeenCalled();
      expect(prisma.notification.findMany).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          apprenticeStats: mockStatsResult,
          recentRoadbooks: mockRoadbooks,
          recentSessions: mockSessions,
          notifications: mockNotifications
        })
      }));
    });
    
    it('should return pending validations for a guide', async () => {
      // Configurer les mocks
      const req = mockRequest('guide-1', 'GUIDE');
      const res = mockResponse();
      
      const mockRoadbooks = [{ id: 'roadbook-1', title: 'Test Roadbook' }];
      const mockSessions = [{ id: 'session-1', date: new Date() }];
      const mockPendingValidations = [{ id: 'session-2', date: new Date() }];
      const mockNotifications = [{ id: 'notif-1', title: 'Test Notification' }];
      
      (prisma.roadBook.findMany as jest.Mock).mockResolvedValue(mockRoadbooks);
      (prisma.session.findMany as jest.Mock)
        .mockResolvedValueOnce(mockSessions) // Pour la première requête des sessions récentes
        .mockResolvedValueOnce(mockPendingValidations); // Pour la deuxième requête des validations en attente
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      
      // Exécuter la fonction
      await dashboardController.getCurrentUserDashboard(req, res);
      
      // Vérifier les appels et résultats
      expect(prisma.session.findMany).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          apprenticeStats: null, // Pour un guide, pas de statistiques d'apprenti
          pendingValidations: mockPendingValidations
        })
      }));
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Configurer les mocks
      const req = { user: undefined } as Request;
      const res = mockResponse();
      
      // Exécuter la fonction
      await dashboardController.getCurrentUserDashboard(req, res);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: 'Not authenticated'
      }));
    });
  });
  
  describe('getApprenticeStatistics', () => {
    it('should return statistics for an apprentice', async () => {
      // Configurer les mocks
      const req = mockRequest('user-1', 'ADMIN', { id: 'apprentice-1' });
      const res = mockResponse();
      
      const mockStatsResult = {
        apprentice: { id: 'apprentice-1', name: 'Test Apprentice' },
        overview: { totalSessions: 10 }
      };
      
      (statistics.calculateApprenticeStatistics as jest.Mock).mockResolvedValue(mockStatsResult);
      
      // Exécuter la fonction
      await dashboardController.getApprenticeStatistics(req, res);
      
      // Vérifier les appels et résultats
      expect(statistics.calculateApprenticeStatistics).toHaveBeenCalledWith('apprentice-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: mockStatsResult
      }));
    });
    
    it('should check permissions for a guide', async () => {
      // Configurer les mocks
      const req = mockRequest('guide-1', 'GUIDE', { id: 'apprentice-1' });
      const res = mockResponse();
      
      // Guide n'a pas accès à cet apprenti
      (prisma.roadBook.findFirst as jest.Mock).mockResolvedValue(null);
      
      // Exécuter la fonction
      await dashboardController.getApprenticeStatistics(req, res);
      
      // Vérifier les résultats (refus d'accès)
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('Not authorized')
      }));
      
      // Guide a accès à cet apprenti (deuxième test)
      jest.clearAllMocks();
      (prisma.roadBook.findFirst as jest.Mock).mockResolvedValue({ id: 'roadbook-1' });
      
      const mockStatsResult = {
        apprentice: { id: 'apprentice-1', name: 'Test Apprentice' },
        overview: { totalSessions: 10 }
      };
      
      (statistics.calculateApprenticeStatistics as jest.Mock).mockResolvedValue(mockStatsResult);
      
      // Réexécuter la fonction
      await dashboardController.getApprenticeStatistics(req, res);
      
      // Maintenant on doit avoir accès
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('getRoadbookStatistics', () => {
    it('should return statistics for a roadbook', async () => {
      // Configurer les mocks
      const req = mockRequest('user-1', 'APPRENTICE', { id: 'roadbook-1' });
      const res = mockResponse();
      
      // Utilisateur a accès au roadbook
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({ 
        apprenticeId: 'user-1', 
        guideId: 'guide-1' 
      });
      
      const mockStatsResult = {
        summary: { totalSessions: 5 },
        distributions: { weather: { 'CLEAR': 3 } }
      };
      
      (statistics.calculateRoadbookStatistics as jest.Mock).mockResolvedValue(mockStatsResult);
      
      // Exécuter la fonction
      await dashboardController.getRoadbookStatistics(req, res);
      
      // Vérifier les appels et résultats
      expect(statistics.calculateRoadbookStatistics).toHaveBeenCalledWith('roadbook-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: mockStatsResult
      }));
    });
    
    it('should return 404 if roadbook not found', async () => {
      // Configurer les mocks
      const req = mockRequest('user-1', 'APPRENTICE', { id: 'roadbook-1' });
      const res = mockResponse();
      
      // Roadbook n'existe pas
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Exécuter la fonction
      await dashboardController.getRoadbookStatistics(req, res);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: 'Roadbook not found'
      }));
    });
  });
});