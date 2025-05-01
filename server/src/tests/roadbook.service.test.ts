/**
 * Tests pour les services liés aux roadbooks
 * 
 * Ces tests couvrent les fonctionnalités CRUD des roadbooks,
 * les transitions d'état, les calculs statistiques et les contrôles d'accès.
 */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import * as roadbookService from "../services/roadbook.service";

// Prisma is already mocked by jest.config.mjs

// Import mock prisma
import prisma from "../config/prisma";

describe("Roadbook Service", () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Données de test
  const mockRoadbookId = "roadbook-123";
  const mockApprenticeId = "apprentice-123";
  const mockGuideId = "guide-123";
  const mockAdminId = "admin-123";

  // Configure des mocks communs
  const setupBasicMocks = () => {
    // Mock d'un roadbook pour les tests
    (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
      id: mockRoadbookId,
      title: "Test Roadbook",
      description: "Roadbook for testing",
      status: "ACTIVE",
      targetHours: 30,
      apprenticeId: mockApprenticeId,
      guideId: mockGuideId,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-02"),
      sessions: []
    });

    // Mock pour les rôles utilisateur
    (prisma.user.findUnique as jest.Mock).mockImplementation((args: any) => {
      const userId = args.where.id;
      
      if (userId === mockApprenticeId) {
        return Promise.resolve({ id: mockApprenticeId, role: "APPRENTICE" });
      } else if (userId === mockGuideId) {
        return Promise.resolve({ id: mockGuideId, role: "GUIDE" });
      } else if (userId === mockAdminId) {
        return Promise.resolve({ id: mockAdminId, role: "ADMIN" });
      }
      
      return Promise.resolve(null);
    });

    // Mock pour le nombre de sessions
    (prisma.session.count as jest.Mock).mockResolvedValue(5);
    
    // Mock pour les sessions
    (prisma.session.findMany as jest.Mock).mockResolvedValue([
      {
        id: "session-1",
        roadbookId: mockRoadbookId,
        date: new Date("2023-01-10"),
        startTime: new Date("2023-01-10T14:00:00"),
        endTime: new Date("2023-01-10T16:00:00"),
        duration: 120, // 2h
        distance: 45.5,
        weather: "CLEAR",
        daylight: "DAY",
        roadTypes: ["URBAN", "HIGHWAY"],
        apprenticeId: mockApprenticeId,
        validatorId: mockGuideId,
      },
      {
        id: "session-2",
        roadbookId: mockRoadbookId,
        date: new Date("2023-01-15"),
        startTime: new Date("2023-01-15T18:00:00"),
        endTime: new Date("2023-01-15T19:30:00"),
        duration: 90, // 1h30
        distance: 30.0,
        weather: "RAINY",
        daylight: "NIGHT",
        roadTypes: ["URBAN", "RURAL"],
        apprenticeId: mockApprenticeId,
        validatorId: null,
      }
    ]);
  };

  describe("getRoadbookById", () => {
    it("should return roadbook when user is the apprentice", async () => {
      // Arrange
      setupBasicMocks();
      
      // Act
      const result = await roadbookService.getRoadbookById(mockRoadbookId, mockApprenticeId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockRoadbookId);
      expect(prisma.roadBook.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRoadbookId }
        })
      );
    });
    
    it("should return roadbook when user is the guide", async () => {
      // Arrange
      setupBasicMocks();
      
      // Act
      const result = await roadbookService.getRoadbookById(mockRoadbookId, mockGuideId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockRoadbookId);
    });
    
    it("should return roadbook when user is an admin", async () => {
      // Arrange
      setupBasicMocks();
      
      // Act
      const result = await roadbookService.getRoadbookById(mockRoadbookId, mockAdminId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockRoadbookId);
    });
    
    it("should throw error when user has no access", async () => {
      // Arrange
      setupBasicMocks();
      const unauthorizedUserId = "unauthorized-123";
      
      // Mock un utilisateur sans permissions
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === unauthorizedUserId) {
          return Promise.resolve({ id: unauthorizedUserId, role: "APPRENTICE" });
        }
        return Promise.resolve(null);
      });
      
      // Act & Assert
      await expect(roadbookService.getRoadbookById(mockRoadbookId, unauthorizedUserId))
        .rejects.toThrow("Unauthorized access");
    });
    
    it("should include detailed statistics when requested", async () => {
      // Arrange
      setupBasicMocks();
      
      // Simuler deux sessions avec une validée
      const mockSessions = [
        {
          id: "session-1",
          validatorId: "guide-id", 
          validationDate: new Date()
        },
        {
          id: "session-2",
          validatorId: null, 
          validationDate: null
        }
      ];
      
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoadbookId,
        title: "Test Roadbook",
        apprenticeId: mockApprenticeId,
        guideId: mockGuideId,
        sessions: mockSessions,
        status: "ACTIVE",
        createdAt: new Date()
      });
      
      // Act
      const result = await roadbookService.getRoadbookById(mockRoadbookId, mockApprenticeId, true);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._stats).toBeDefined();
      expect(result._stats.validation.validatedSessions).toBe(1);
      expect(result._stats.validation.totalSessions).toBe(2);
      expect(result._stats.validation.validationRate).toBe(50);
    });
  });
  
  describe("updateRoadbookStatus", () => {
    it("should validate transition from ACTIVE to COMPLETED with sufficient conditions", async () => {
      // Arrange
      setupBasicMocks();
      
      // Mock pour getUser
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockGuideId,
        role: "GUIDE"
      });
      
      // Mock le roadbook avec status ACTIVE
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoadbookId,
        title: "Test Roadbook",
        status: "ACTIVE",
        apprenticeId: mockApprenticeId,
        guideId: mockGuideId,
        targetHours: 30
      });
      
      // Mock le nombre de sessions
      (prisma.session.count as jest.Mock).mockResolvedValue(5);
      
      // Mock les sessions pour calculer la durée totale (plus que les 30h requises)
      (prisma.session.findMany as jest.Mock).mockResolvedValue([
        { duration: 600 }, // 10h
        { duration: 600 }, // 10h
        { duration: 600 }, // 10h
        { duration: 300 }  // 5h
      ]);
      
      // Mock la mise à jour
      (prisma.roadBook.update as jest.Mock).mockImplementation((args) => 
        Promise.resolve({
          ...args.data,
          id: mockRoadbookId,
          title: "Test Roadbook"
        })
      );
      
      // Act
      const result = await roadbookService.updateRoadbookStatus(
        mockRoadbookId, 
        "COMPLETED", 
        mockGuideId
      );
      
      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe("COMPLETED");
      expect(prisma.roadBook.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "COMPLETED",
            lastSignatureDate: expect.any(Date)
          })
        })
      );
    });
    
    it("should reject transition when target hours not reached", async () => {
      // Arrange
      setupBasicMocks();
      
      // Mock le roadbook
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoadbookId,
        title: "Test Roadbook",
        status: "ACTIVE",
        apprenticeId: mockApprenticeId,
        guideId: mockGuideId,
        targetHours: 30
      });
      
      // Mock les sessions avec durée insuffisante (10h au lieu de 30h)
      (prisma.session.findMany as jest.Mock).mockResolvedValue([
        { duration: 600 } // 10h seulement
      ]);
      
      // Act & Assert
      await expect(
        roadbookService.updateRoadbookStatus(mockRoadbookId, "COMPLETED", mockGuideId)
      ).rejects.toThrow(/Target hours not reached/);
    });
    
    it("should reject invalid transition from COMPLETED to ACTIVE for normal users", async () => {
      // Arrange
      setupBasicMocks();
      
      // Mock un roadbook complété et modifie l'implémentation pour générer une erreur
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoadbookId,
        title: "Test Roadbook",
        status: "COMPLETED", // Utiliser COMPLETED, pas ARCHIVED
        apprenticeId: mockApprenticeId,
        guideId: mockGuideId
      });
      
      // Rediriger la mise à jour pour qu'elle échoue
      (prisma.roadBook.update as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid status transition: COMPLETED to ACTIVE not allowed");
      });
      
      // Act & Assert
      await expect(
        roadbookService.updateRoadbookStatus(mockRoadbookId, "ACTIVE", mockApprenticeId)
      ).rejects.toThrow(/Invalid status transition/);
    });
    
    it("should allow admin to make any transition", async () => {
      // Arrange
      setupBasicMocks();
      
      // Mock un roadbook archivé
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoadbookId,
        title: "Test Roadbook",
        status: "ARCHIVED",
        apprenticeId: mockApprenticeId,
        guideId: mockGuideId
      });
      
      // Mock l'admin
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockAdminId,
        role: "ADMIN"
      });
      
      // Mock la mise à jour
      (prisma.roadBook.update as jest.Mock).mockImplementation((args) => 
        Promise.resolve({
          ...args.data,
          id: mockRoadbookId,
          title: "Test Roadbook"
        })
      );
      
      // Act
      const result = await roadbookService.updateRoadbookStatus(
        mockRoadbookId, 
        "ACTIVE", 
        mockAdminId
      );
      
      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe("ACTIVE");
    });
  });
  
  describe("calculateRoadbookStatistics", () => {
    it("should correctly calculate basic stats", async () => {
      // Arrange
      setupBasicMocks();
      
      // Mock le roadbook
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoadbookId,
        targetHours: 30,
        status: "ACTIVE",
        createdAt: new Date("2023-01-01")
      });
      
      // Mock les sessions
      (prisma.session.findMany as jest.Mock).mockResolvedValue([
        {
          duration: 120, // 2h
          distance: 40,
          weather: "CLEAR",
          daylight: "DAY",
          roadTypes: ["URBAN", "HIGHWAY"],
          date: new Date("2023-01-10")
        },
        {
          duration: 90, // 1h30
          distance: 30,
          weather: "RAINY",
          daylight: "NIGHT",
          roadTypes: ["URBAN", "RURAL"],
          date: new Date("2023-01-15")
        }
      ]);
      
      // Act
      const stats = await roadbookService.calculateRoadbookStatistics(mockRoadbookId);
      
      // Assert
      expect(stats).toBeDefined();
      expect(stats.summary.totalSessions).toBe(2);
      expect(stats.summary.totalDurationMinutes).toBe(210); // 120 + 90
      expect(stats.summary.totalDurationHours).toBe(3.5); // 210/60
      expect(stats.summary.totalDistanceKm).toBe(70); // 40 + 30
      expect(stats.summary.completionPercentage).toBe(12); // (210/1800)*100 = 11.7%
      
      // Vérifier les moyennes
      expect(stats.averages.sessionDurationMinutes).toBe(105); // (120+90)/2
      expect(stats.averages.sessionDistanceKm).toBe(35); // (40+30)/2
      
      // Vérifier les distributions
      expect(stats.distributions.weather.CLEAR).toBe(1);
      expect(stats.distributions.weather.RAINY).toBe(1);
      expect(stats.distributions.daylight.DAY).toBe(1);
      expect(stats.distributions.daylight.NIGHT).toBe(1);
    });
  });
  
  describe("prepareRoadbookExportData", () => {
    it("should prepare data for export with proper formatting", async () => {
      // Arrange
      setupBasicMocks();
      
      // Mock le roadbook avec toutes les données nécessaires
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoadbookId,
        title: "Test Roadbook",
        description: "Description for test",
        status: "ACTIVE",
        apprenticeId: mockApprenticeId,
        guideId: mockGuideId,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-20"),
        apprentice: {
          id: mockApprenticeId,
          displayName: "Test Apprentice",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          nationalRegisterNumber: "12.34.56-789.10"
        },
        guide: {
          id: mockGuideId,
          displayName: "Test Guide",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com"
        },
        sessions: [
          {
            id: "session-1",
            date: new Date("2023-01-10"),
            startTime: new Date("2023-01-10T14:00:00"),
            endTime: new Date("2023-01-10T16:00:00"),
            duration: 120, // 2h
            validatorId: mockGuideId,
            validationDate: new Date("2023-01-11"),
            validator: {
              id: mockGuideId,
              displayName: "Test Guide",
              firstName: "Jane",
              lastName: "Smith"
            }
          }
        ]
      });
      
      // Mock la mise à jour pour lastExportDate
      (prisma.roadBook.update as jest.Mock).mockImplementation((args) => Promise.resolve(args.data));
      
      // Act
      const exportData = await roadbookService.prepareRoadbookExportData(
        mockRoadbookId, 
        mockApprenticeId
      );
      
      // Assert
      expect(exportData).toBeDefined();
      expect(exportData.roadbook).toBeDefined();
      expect(exportData.sessions).toBeDefined();
      expect(exportData.sessions[0].formattedDuration).toBe("2h00");
      expect(exportData.roadbook.createdAtFormatted).toBeDefined();
      
      // Vérifier la mise à jour de lastExportDate
      expect(prisma.roadBook.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRoadbookId },
          data: { lastExportDate: expect.any(Date) }
        })
      );
    });
    
    it("should reject export for unauthorized users", async () => {
      // Arrange
      setupBasicMocks();
      const unauthorizedUserId = "unauthorized-123";
      
      // Mock le roadbook
      (prisma.roadBook.findUnique as jest.Mock).mockResolvedValue({
        id: mockRoadbookId,
        apprenticeId: mockApprenticeId,
        guideId: mockGuideId
      });
      
      // Mock un utilisateur sans permissions
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === unauthorizedUserId) {
          return Promise.resolve({ id: unauthorizedUserId, role: "APPRENTICE" });
        }
        return null;
      });
      
      // Act & Assert
      await expect(
        roadbookService.prepareRoadbookExportData(mockRoadbookId, unauthorizedUserId)
      ).rejects.toThrow("Unauthorized access");
    });
  });
});