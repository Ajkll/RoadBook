/**
 * Tests pour le service des sessions
 * 
 * Ces tests vérifient le bon fonctionnement des fonctions du service de sessions:
 * - Création d'une session
 * - Récupération d'une session par ID
 * - Mise à jour d'une session
 * - Validation d'une session
 */

import * as sessionService from '../services/session.service';
import prisma from '../config/prisma';
import { setupBeforeAll, teardownAfterAll, resetDatabase } from './setup';

// Mock prisma pour les tests
jest.mock('../config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  roadBook: {
    findUnique: jest.fn(),
  },
  competencyValidation: {
    deleteMany: jest.fn(),
  },
  comment: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
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

describe('Session Service', () => {
  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      // Données de test
      const sessionData = {
        roadbookId: 'roadbook-1',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 heure plus tard
        duration: 60,
        startLocation: 'Start point',
        endLocation: 'End point',
        distance: 25.5,
        weather: 'CLEAR' as const,
        daylight: 'DAY' as const,
        roadTypes: ['HIGHWAY', 'URBAN'],
        notes: 'Test session',
        apprenticeId: 'user-1',
      };
      
      const mockRoadbook = { id: 'roadbook-1', apprenticeId: 'user-1' };
      const mockApprentice = { id: 'user-1', displayName: 'Test User' };
      const mockSession = { 
        id: 'session-1', 
        ...sessionData,
        apprentice: { id: 'user-1', displayName: 'Test User', profilePicture: null },
        validator: null
      };
      
      // Configurer les mocks
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue(mockRoadbook);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockApprentice);
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);
      
      // Exécuter la fonction
      const result = await sessionService.createSession(sessionData);
      
      // Vérifier les appels
      expect(prisma.roadBook.findUnique).toHaveBeenCalledWith({
        where: { id: sessionData.roadbookId }
      });
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: sessionData.apprenticeId }
      });
      
      expect(prisma.session.create).toHaveBeenCalled();
      
      // Vérifier le résultat
      expect(result).toEqual(mockSession);
    });
    
    it('should throw an error if roadbook not found', async () => {
      const sessionData = {
        roadbookId: 'non-existent',
        date: new Date(),
        startTime: new Date(),
        apprenticeId: 'user-1',
      };
      
      // Configurer les mocks
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Vérifier que l'exception est levée
      await expect(sessionService.createSession(sessionData as any)).rejects.toThrow('Roadbook not found');
    });
  });
  
  describe('getSessionById', () => {
    it('should return session with relations', async () => {
      const mockSession = {
        id: 'session-1',
        roadbookId: 'roadbook-1',
        apprenticeId: 'user-1',
        date: new Date(),
        startTime: new Date(),
        roadbook: {
          id: 'roadbook-1',
          title: 'Test Roadbook',
          status: 'ACTIVE',
          apprenticeId: 'user-1',
          guideId: 'user-2'
        },
        apprentice: {
          id: 'user-1',
          displayName: 'Test Apprentice',
          profilePicture: null
        },
        validator: null,
        competencyValidations: [],
        comments: []
      };
      
      // Configurer le mock
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      
      // Exécuter la fonction
      const result = await sessionService.getSessionById('session-1');
      
      // Vérifier l'appel
      expect(prisma.session.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'session-1' }
      }));
      
      // Vérifier le résultat
      expect(result).toEqual(mockSession);
    });
    
    it('should throw an error if session not found', async () => {
      // Configurer le mock
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Vérifier que l'exception est levée
      await expect(sessionService.getSessionById('non-existent')).rejects.toThrow('Session not found');
    });
  });
  
  describe('checkSessionAccess', () => {
    it('should return true if user is the apprentice', async () => {
      const mockSession = {
        id: 'session-1',
        roadbook: {
          apprenticeId: 'user-1',
          guideId: 'user-2'
        }
      };
      
      // Configurer le mock
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      
      // Exécuter la fonction
      const result = await sessionService.checkSessionAccess('session-1', 'user-1');
      
      // Vérifier le résultat
      expect(result).toBe(true);
    });
    
    it('should return true if user is the guide', async () => {
      const mockSession = {
        id: 'session-1',
        roadbook: {
          apprenticeId: 'user-1',
          guideId: 'user-2'
        }
      };
      
      // Configurer le mock
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      
      // Exécuter la fonction
      const result = await sessionService.checkSessionAccess('session-1', 'user-2');
      
      // Vérifier le résultat
      expect(result).toBe(true);
    });
    
    it('should return true if user is an admin', async () => {
      const mockSession = {
        id: 'session-1',
        roadbook: {
          apprenticeId: 'user-1',
          guideId: 'user-2'
        }
      };
      
      const mockUser = {
        role: 'ADMIN'
      };
      
      // Configurer les mocks
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      // Exécuter la fonction
      const result = await sessionService.checkSessionAccess('session-1', 'admin-user');
      
      // Vérifier le résultat
      expect(result).toBe(true);
    });
    
    it('should return false if user has no role and is not related to the session', async () => {
      const mockSession = {
        id: 'session-1',
        roadbook: {
          apprenticeId: 'user-1',
          guideId: 'user-2'
        }
      };
      
      const mockUser = {
        role: 'APPRENTICE'
      };
      
      // Configurer les mocks
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      // Exécuter la fonction
      const result = await sessionService.checkSessionAccess('session-1', 'other-user');
      
      // Vérifier le résultat
      expect(result).toBe(false);
    });
  });
  
  describe('validateSession', () => {
    it('should validate a session successfully by guide', async () => {
      const mockSession = {
        id: 'session-1',
        roadbook: {
          guideId: 'guide-user'
        },
        validatorId: null,
        validationDate: null,
        notes: 'Original notes'
      };
      
      const mockUser = {
        id: 'guide-user',
        role: 'GUIDE'
      };
      
      const mockValidatedSession = {
        ...mockSession,
        validatorId: 'guide-user',
        validationDate: expect.any(Date),
        notes: 'Original notes\n\nValidation: Test validation',
        apprentice: { id: 'user-1', displayName: 'Test Apprentice', profilePicture: null },
        validator: { id: 'guide-user', displayName: 'Test Guide', profilePicture: null }
      };
      
      // Configurer les mocks
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.update as jest.Mock).mockResolvedValue(mockValidatedSession);
      
      // Exécuter la fonction
      const result = await sessionService.validateSession('session-1', 'guide-user', 'Test validation');
      
      // Vérifier les appels
      expect(prisma.session.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          validatorId: 'guide-user',
          validationDate: expect.any(Date),
          notes: 'Original notes\n\nValidation: Test validation'
        })
      }));
      
      // Vérifier le résultat
      expect(result).toEqual(mockValidatedSession);
    });
    
    it('should throw an error if user is unauthorized', async () => {
      const mockSession = {
        id: 'session-1',
        roadbook: {
          guideId: 'guide-user'
        }
      };
      
      const mockUser = {
        id: 'other-user',
        role: 'APPRENTICE'
      };
      
      // Configurer les mocks
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      // Vérifier que l'exception est levée
      await expect(sessionService.validateSession('session-1', 'other-user')).rejects.toThrow('Unauthorized to validate this session');
    });
  });
});