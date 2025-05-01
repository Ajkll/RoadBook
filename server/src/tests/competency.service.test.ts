/**
 * Tests unitaires pour le service des compétences
 * 
 * Ces tests vérifient le fonctionnement des fonctions du service de compétences:
 * - Récupération des compétences
 * - Gestion de la progression des apprentis
 * - Validation des compétences
 */

import * as competencyService from '../services/competency.service';
import prisma from '../config/prisma';
import { setupBeforeAll, teardownAfterAll, resetDatabase } from './setup';

// Mock prisma pour les tests
jest.mock('../config/prisma', () => ({
  competency: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  competencyProgress: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  competencyValidation: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  roadBook: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  }
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

describe('Competency Service', () => {
  describe('getAllCompetencies', () => {
    it('should retrieve all competencies', async () => {
      // Données de test
      const mockCompetencies = [
        { id: 'comp-1', name: 'Basic Control', phase: 'PHASE1', category: 'CONTROL', order: 1 },
        { id: 'comp-2', name: 'Gear Shifting', phase: 'PHASE1', category: 'CONTROL', order: 2 },
        { id: 'comp-3', name: 'City Driving', phase: 'PHASE2', category: 'TRAFFIC_RULES', order: 1 }
      ];
      
      // Configurer le mock
      (prisma.competency.findMany as jest.Mock).mockResolvedValue(mockCompetencies);
      
      // Exécuter la fonction
      const result = await competencyService.getAllCompetencies();
      
      // Vérifier les résultats
      expect(result).toEqual(mockCompetencies);
      expect(prisma.competency.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { phase: 'asc' },
          { order: 'asc' }
        ]
      });
    });
    
    it('should filter competencies by phase', async () => {
      // Données de test
      const mockCompetencies = [
        { id: 'comp-1', name: 'Basic Control', phase: 'PHASE1', category: 'CONTROL', order: 1 },
        { id: 'comp-2', name: 'Gear Shifting', phase: 'PHASE1', category: 'CONTROL', order: 2 }
      ];
      
      // Configurer le mock
      (prisma.competency.findMany as jest.Mock).mockResolvedValue(mockCompetencies);
      
      // Exécuter la fonction avec filtre de phase
      const result = await competencyService.getAllCompetencies(competencyService.LearningPhase.PHASE1);
      
      // Vérifier les résultats
      expect(result).toEqual(mockCompetencies);
      expect(prisma.competency.findMany).toHaveBeenCalledWith({
        where: { phase: 'PHASE1' },
        orderBy: [
          { phase: 'asc' },
          { order: 'asc' }
        ]
      });
    });
    
    it('should filter competencies by category', async () => {
      // Données de test
      const mockCompetencies = [
        { id: 'comp-1', name: 'Basic Control', phase: 'PHASE1', category: 'CONTROL', order: 1 },
        { id: 'comp-2', name: 'Gear Shifting', phase: 'PHASE1', category: 'CONTROL', order: 2 }
      ];
      
      // Configurer le mock
      (prisma.competency.findMany as jest.Mock).mockResolvedValue(mockCompetencies);
      
      // Exécuter la fonction avec filtre de catégorie
      const result = await competencyService.getAllCompetencies(
        undefined, 
        competencyService.CompetencyCategory.CONTROL
      );
      
      // Vérifier les résultats
      expect(result).toEqual(mockCompetencies);
      expect(prisma.competency.findMany).toHaveBeenCalledWith({
        where: { category: 'CONTROL' },
        orderBy: [
          { phase: 'asc' },
          { order: 'asc' }
        ]
      });
    });
  });
  
  describe('getCompetencyById', () => {
    it('should retrieve a competency by ID', async () => {
      // Données de test
      const mockCompetency = { 
        id: 'comp-1', 
        name: 'Basic Control', 
        phase: 'PHASE1', 
        category: 'CONTROL', 
        order: 1,
        description: 'Basic vehicle control skills'
      };
      
      // Configurer le mock
      (prisma.competency.findUnique as jest.Mock).mockResolvedValue(mockCompetency);
      
      // Exécuter la fonction
      const result = await competencyService.getCompetencyById('comp-1');
      
      // Vérifier les résultats
      expect(result).toEqual(mockCompetency);
      expect(prisma.competency.findUnique).toHaveBeenCalledWith({
        where: { id: 'comp-1' }
      });
    });
    
    it('should throw an error if competency not found', async () => {
      // Configurer le mock pour retourner null
      (prisma.competency.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Vérifier que l'exception est levée
      await expect(competencyService.getCompetencyById('non-existent')).rejects.toThrow('Competency not found');
    });
  });
  
  describe('updateCompetencyStatus', () => {
    it('should update an existing competency progress', async () => {
      // Données de test
      const roadbookId = 'roadbook-1';
      const competencyId = 'comp-1';
      const userId = 'user-1';
      const status = competencyService.CompetencyStatus.IN_PROGRESS;
      const notes = 'Making good progress';
      
      // Configurer les mocks
      const mockRoadbook = { 
        apprenticeId: 'apprentice-1', 
        guideId: userId 
      };
      const mockCompetency = { id: competencyId, name: 'Basic Control' };
      const mockExistingProgress = { 
        id: 'progress-1', 
        roadbookId, 
        competencyId, 
        status: competencyService.CompetencyStatus.NOT_STARTED, 
        notes: null 
      };
      const mockUpdatedProgress = { 
        ...mockExistingProgress, 
        status, 
        notes, 
        lastPracticed: expect.any(Date),
        competency: mockCompetency
      };
      
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue(mockRoadbook);
      (prisma.competency.findUnique as jest.Mock).mockResolvedValue(mockCompetency);
      (prisma.competencyProgress.findFirst as jest.Mock).mockResolvedValue(mockExistingProgress);
      (prisma.competencyProgress.update as jest.Mock).mockResolvedValue(mockUpdatedProgress);
      
      // Exécuter la fonction
      const result = await competencyService.updateCompetencyStatus(
        roadbookId, 
        competencyId, 
        status, 
        notes, 
        userId
      );
      
      // Vérifier les résultats
      expect(result).toEqual(mockUpdatedProgress);
      expect(prisma.competencyProgress.update).toHaveBeenCalledWith({
        where: { id: mockExistingProgress.id },
        data: expect.objectContaining({
          status,
          notes,
          lastPracticed: expect.any(Date)
        }),
        include: { competency: true }
      });
    });
    
    it('should create a new competency progress if none exists', async () => {
      // Données de test
      const roadbookId = 'roadbook-1';
      const competencyId = 'comp-1';
      const userId = 'user-1';
      const apprenticeId = 'apprentice-1';
      const status = competencyService.CompetencyStatus.IN_PROGRESS;
      const notes = 'Starting to learn this skill';
      
      // Configurer les mocks
      const mockRoadbook = { 
        apprenticeId, 
        guideId: userId 
      };
      const mockCompetency = { id: competencyId, name: 'Basic Control' };
      const mockNewProgress = { 
        id: 'progress-1', 
        roadbookId, 
        competencyId, 
        apprenticeId,
        status, 
        notes, 
        lastPracticed: expect.any(Date),
        competency: mockCompetency
      };
      
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue(mockRoadbook);
      (prisma.competency.findUnique as jest.Mock).mockResolvedValue(mockCompetency);
      (prisma.competencyProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.competencyProgress.create as jest.Mock).mockResolvedValue(mockNewProgress);
      
      // Exécuter la fonction
      const result = await competencyService.updateCompetencyStatus(
        roadbookId, 
        competencyId, 
        status, 
        notes, 
        userId
      );
      
      // Vérifier les résultats
      expect(result).toEqual(mockNewProgress);
      expect(prisma.competencyProgress.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          roadbookId,
          competencyId,
          apprenticeId,
          status,
          notes,
          lastPracticed: expect.any(Date)
        }),
        include: { competency: true }
      });
    });
    
    it('should throw an error if unauthorized', async () => {
      // Données de test
      const roadbookId = 'roadbook-1';
      const competencyId = 'comp-1';
      const userId = 'unauthorized-user';
      
      // Configurer les mocks
      const mockRoadbook = { 
        apprenticeId: 'apprentice-1', 
        guideId: 'guide-1' 
      };
      const mockCompetency = { id: competencyId, name: 'Basic Control' };
      const mockUser = { role: 'APPRENTICE' };
      
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue(mockRoadbook);
      (prisma.competency.findUnique as jest.Mock).mockResolvedValue(mockCompetency);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      // Vérifier que l'exception est levée
      await expect(competencyService.updateCompetencyStatus(
        roadbookId, 
        competencyId, 
        competencyService.CompetencyStatus.IN_PROGRESS, 
        null, 
        userId
      )).rejects.toThrow('Unauthorized to update competency status');
    });
  });
  
  describe('validateCompetencies', () => {
    it('should validate multiple competencies for a session', async () => {
      // Données de test
      const sessionId = 'session-1';
      const validatorId = 'guide-1';
      const validations = [
        { competencyId: 'comp-1', validated: true, notes: 'Excellent mastery' },
        { competencyId: 'comp-2', validated: false, notes: 'Needs more practice' }
      ];
      
      // Configurer les mocks
      const mockSession = {
        id: sessionId,
        roadbookId: 'roadbook-1',
        apprenticeId: 'apprentice-1',
        roadbook: {
          guideId: validatorId
        }
      };
      
      const mockCompetency1 = { id: 'comp-1', name: 'Basic Control' };
      const mockCompetency2 = { id: 'comp-2', name: 'Gear Shifting' };
      
      const mockResult1 = {
        id: 'validation-1',
        sessionId,
        competencyId: 'comp-1',
        validated: true,
        notes: 'Excellent mastery',
        competency: mockCompetency1,
        validator: { id: validatorId, displayName: 'Guide Name' }
      };
      
      const mockResult2 = {
        id: 'validation-2',
        sessionId,
        competencyId: 'comp-2',
        validated: false,
        notes: 'Needs more practice',
        competency: mockCompetency2,
        validator: { id: validatorId, displayName: 'Guide Name' }
      };
      
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.competency.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockCompetency1)
        .mockResolvedValueOnce(mockCompetency2);
      (prisma.competencyValidation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.competencyValidation.create as jest.Mock)
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);
      
      // Pour le cas où validated=true, on mettra à jour le statut de la compétence
      jest.spyOn(competencyService, 'updateCompetencyStatus').mockResolvedValue(null as any);
      
      // Exécuter la fonction
      const result = await competencyService.validateCompetencies(
        sessionId,
        validations,
        validatorId
      );
      
      // Vérifier les résultats
      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[0].result).toEqual(mockResult1);
      expect(result[1].success).toBe(true);
      expect(result[1].result).toEqual(mockResult2);
      
      // La première compétence est validée, donc on doit mettre à jour son statut
      expect(competencyService.updateCompetencyStatus).toHaveBeenCalledTimes(1);
      expect(competencyService.updateCompetencyStatus).toHaveBeenCalledWith(
        mockSession.roadbookId,
        'comp-1',
        competencyService.CompetencyStatus.MASTERED,
        expect.stringContaining('Validated during session'),
        validatorId
      );
    });
    
    it('should throw an error if session not found', async () => {
      // Configurer le mock
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Vérifier que l'exception est levée
      await expect(competencyService.validateCompetencies(
        'non-existent',
        [{ competencyId: 'comp-1', validated: true }],
        'validator-1'
      )).rejects.toThrow('Session not found');
    });
    
    it('should throw an error if unauthorized', async () => {
      // Données de test
      const sessionId = 'session-1';
      const unauthorizedValidatorId = 'unauthorized-user';
      
      // Configurer les mocks
      const mockSession = {
        id: sessionId,
        roadbookId: 'roadbook-1',
        roadbook: {
          guideId: 'guide-1'
        }
      };
      
      const mockUser = { role: 'APPRENTICE' };
      
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      // Vérifier que l'exception est levée
      await expect(competencyService.validateCompetencies(
        sessionId,
        [{ competencyId: 'comp-1', validated: true }],
        unauthorizedValidatorId
      )).rejects.toThrow('Unauthorized to validate competencies');
    });
  });
});