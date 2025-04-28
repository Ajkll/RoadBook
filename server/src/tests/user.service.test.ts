// server/src/tests/user.service.test.ts
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { UserRole } from "@prisma/client";
import * as userService from "../services/user.service";
import * as authService from "../services/auth.service";
import bcrypt from "bcrypt";

// Mock modules
jest.mock('bcrypt');
jest.mock("../config/prisma", () => import("../tests/mocks/prisma.mock"));
jest.mock("../services/auth.service");

// Import mocked prisma
import prisma from "../config/prisma";

// Type for auth service mocks
type SuccessResult = { success: boolean };

// Setup mocks
const mockCompare = jest.fn().mockResolvedValue(true);
const mockHash = jest.fn().mockImplementation((password: string, salt: number) => 
  Promise.resolve(`hashed_${password}`)
);
(bcrypt.compare as jest.Mock) = mockCompare;
(bcrypt.hash as jest.Mock) = mockHash;

// Set up auth service mocks
(authService.revokeRefreshTokens as jest.Mock) = jest.fn().mockImplementation(
  async () => ({ success: true } as SuccessResult)
);

// Helper pour créer un mock d'utilisateur
const createMockUser = (email = "test.user@example.com", role = "APPRENTICE", id = "mock-user-id") => {
  return {
    id,
    email,
    passwordHash: `hashed_Password123!`,
    displayName: "Test User",
    firstName: "Test",
    lastName: "User",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    bio: null,
    nationalRegisterNumber: null,
    birthDate: null,
    phoneNumber: null,
    profilePicture: null,
    address: null,
  };
};

describe("User Service", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user with correct data", async () => {
      // Arrange
      const userData = {
        email: "test.create@example.com",
        password: "Password123!",
        displayName: "Test User",
        firstName: "Test",
        lastName: "User",
        role: "APPRENTICE",
      };
      
      const mockCreatedUser = {
        id: "mock-id-123",
        email: userData.email,
        displayName: userData.displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        passwordHash: "hashed_password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Mock the Prisma findUnique call to return null (no existing user)
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      // Mock the Prisma create call to return our mock user
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockCreatedUser);

      // Act
      const createdUser = await userService.createUser(userData);

      // Assert
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(userData.email.toLowerCase());
      expect(createdUser.displayName).toBe(userData.displayName);
      expect(createdUser.firstName).toBe(userData.firstName);
      expect(createdUser.lastName).toBe(userData.lastName);
      expect(createdUser.role).toBe(userData.role);
      
      // Verify Prisma was called with correct parameters
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email.toLowerCase() }
      });
      
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email.toLowerCase(),
          displayName: userData.displayName,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          passwordHash: expect.any(String)
        })
      });
      
      // Verify bcrypt was called
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    });

    it("should normalize email to lowercase", async () => {
      // Arrange
      const userData = {
        email: "TEST.EMAIL@EXAMPLE.COM",
        password: "Password123!",
        displayName: "Test User",
      };
      
      const mockCreatedUser = {
        id: "mock-id-123",
        email: "test.email@example.com", // Lowercase
        displayName: userData.displayName,
        passwordHash: "hashed_password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Mock the Prisma findUnique call to return null (no existing user)
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      // Mock the Prisma create call to return our mock user
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockCreatedUser);

      // Act
      const createdUser = await userService.createUser(userData);

      // Assert
      expect(createdUser.email).toBe("test.email@example.com");
      
      // Verify the email was normalized before checking if it exists
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test.email@example.com" }
      });
    });

    it("should throw an error when creating a user with an existing email", async () => {
      // Arrange
      const userData = {
        email: "test.duplicate@example.com",
        password: "Password123!",
        displayName: "Test User",
      };

      // Mock findUnique to return an existing user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "existing-user",
        email: userData.email,
      });

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(
        "User with this email already exists"
      );
      
      // Verify findUnique was called but create was not
      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should throw an error when required fields are missing", async () => {
      // Arrange - Missing email
      const missingEmail = {
        password: "Password123!",
        displayName: "Test User",
      };

      // Act & Assert
      await expect(userService.createUser(missingEmail as any)).rejects.toThrow(
        "Email, password and displayName are required"
      );
      
      // Verify prisma wasn't called
      expect(prisma.user.findUnique).not.toHaveBeenCalled();

      // Arrange - Missing password
      const missingPassword = {
        email: "test.missing@example.com",
        displayName: "Test User",
      };

      // Act & Assert
      await expect(userService.createUser(missingPassword as any)).rejects.toThrow(
        "Email, password and displayName are required"
      );
      
      // Verify prisma wasn't called
      expect(prisma.user.findUnique).not.toHaveBeenCalled();

      // Arrange - Missing displayName
      const missingDisplayName = {
        email: "test.missing@example.com",
        password: "Password123!",
      };

      // Act & Assert
      await expect(userService.createUser(missingDisplayName as any)).rejects.toThrow(
        "Email, password and displayName are required"
      );
      
      // Verify prisma wasn't called
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
    
    it("should throw an error when creating a user with existing national register number", async () => {
      // Arrange
      const nationalRegisterNumber = "12345678901";
      
      const userData = {
        email: "test.user2@example.com",
        password: "Password123!",
        displayName: "Test User 2",
        nationalRegisterNumber
      };
      
      // Mock findUnique for email check
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.email) {
          return Promise.resolve(null); // Email is not taken
        }
        if (args.where.nationalRegisterNumber) {
          return Promise.resolve({ id: "existing-user", nationalRegisterNumber }); // National register is taken
        }
        return Promise.resolve(null);
      });
      
      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(
        "User with this national register number already exists"
      );
      
      // Verify both checks were made
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("should return user without password hash", async () => {
      // Arrange
      const userId = "user-id-123";
      const mockUser = createMockUser("test@example.com", "APPRENTICE", userId);
      
      // Mock findUnique to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      // Act
      const foundUser = await userService.getUserById(userId);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(userId);
      expect(foundUser.email).toBe(mockUser.email);
      expect((foundUser as any).passwordHash).toBeUndefined();
      
      // Verify prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });

    it("should include relations when requested", async () => {
      // Arrange
      const userId = "user-id-123";
      const mockUser = {
        ...createMockUser("test@example.com", "APPRENTICE", userId),
        ownedRoadbooks: [],
        guidedRoadbooks: [],
        receivedBadges: []
      };
      
      // Mock findUnique to return a user with relations
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      // Act
      const foundUser = await userService.getUserById(userId, true);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(userId);
      expect(foundUser.ownedRoadbooks).toBeDefined();
      expect(foundUser.guidedRoadbooks).toBeDefined();
      expect(foundUser.receivedBadges).toBeDefined();
      expect((foundUser as any).passwordHash).toBeUndefined();
      
      // Verify prisma was called with include option
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: expect.objectContaining({
          ownedRoadbooks: expect.any(Object),
          guidedRoadbooks: expect.any(Object),
          receivedBadges: expect.any(Object)
        })
      });
    });

    it("should throw an error for non-existent user", async () => {
      // Arrange
      const userId = "non-existent-id";
      
      // Mock findUnique to return null
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(
        "User not found"
      );
      
      // Verify prisma was called
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });
  });
  
  describe("getUserByEmail", () => {
    it("should return user with password hash when includePassword is true", async () => {
      // Arrange
      const email = "test.user@example.com";
      const mockUser = createMockUser(email);
      
      // Mock findUnique to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Act
      const foundUser = await userService.getUserByEmail(email, true);
      
      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(mockUser.id);
      expect(foundUser.email).toBe(email);
      // With includePassword=true, passwordHash should be retained
      expect((foundUser as any).passwordHash).toBeDefined();
      
      // Verify prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() }
      });
    });
    
    it("should return user without password hash when includePassword is false", async () => {
      // Arrange
      const email = "test.user@example.com";
      const mockUser = createMockUser(email);
      
      // Mock findUnique to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Act
      const foundUser = await userService.getUserByEmail(email, false);
      
      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(mockUser.id);
      expect(foundUser.email).toBe(email);
      expect((foundUser as any).passwordHash).toBeUndefined();
      
      // Verify prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() }
      });
    });
    
    it("should normalize email before search", async () => {
      // Arrange
      const email = "test.normalized@example.com";
      const uppercaseEmail = "TEST.NORMALIZED@EXAMPLE.COM";
      const mockUser = createMockUser(email);
      
      // Mock findUnique to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Act
      const foundUser = await userService.getUserByEmail(uppercaseEmail);
      
      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(mockUser.id);
      expect(foundUser.email).toBe(email);
      
      // Verify prisma was called with normalized email
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() }
      });
    });
    
    it("should throw an error for non-existent email", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      
      // Mock findUnique to return null
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(userService.getUserByEmail(email)).rejects.toThrow(
        "User not found"
      );
      
      // Verify prisma was called with the correct email
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() }
      });
    });
  });

  describe("updateUser", () => {
    it("should update user profile data", async () => {
      // Arrange
      const userId = "user-id-123";
      const mockUser = createMockUser("test@example.com", "APPRENTICE", userId);
      
      const updateData = {
        displayName: "Updated Name",
        firstName: "Updated",
        lastName: "User",
        bio: "This is an updated bio"
      };
      
      // Mock findUnique to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Mock update to return updated user
      const updatedMockUser = {
        ...mockUser,
        ...updateData
      };
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(updatedMockUser);

      // Act
      const updatedUser = await userService.updateUser(userId, updateData);

      // Assert
      expect(updatedUser.displayName).toBe(updateData.displayName);
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      expect(updatedUser.bio).toBe(updateData.bio);
      expect(updatedUser.email).toBe(mockUser.email); // Should not change
      
      // Verify prisma calls
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData
      });
    });

    it("should hash password when updating password", async () => {
      // Arrange
      const userId = "user-id-123";
      const mockUser = createMockUser("test@example.com", "APPRENTICE", userId);
      const newPassword = "NewPassword123!";
      const newPasswordHash = `hashed_${newPassword}`;
      
      // Mock findUnique to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Mock update to return updated user
      const updatedMockUser = {
        ...mockUser,
        passwordHash: newPasswordHash
      };
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(updatedMockUser);
      
      // Act
      const updatedUser = await userService.updateUser(userId, { 
        password: newPassword 
      });
      
      // Assert
      expect(updatedUser.id).toBe(userId);
      
      // Verify bcrypt was called to hash the password
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      
      // Verify prisma update was called with passwordHash, not password
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });
    });
    
    it("should throw error when updating to an email that's already in use", async () => {
      // Arrange
      const userId = "user-id-123";
      const existingEmail = "existing@example.com";
      const mockUser = createMockUser("test@example.com", "APPRENTICE", userId);
      
      // Mock findUnique for the target user
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === userId) {
          return Promise.resolve(mockUser);
        }
        if (args.where.email === existingEmail) {
          return Promise.resolve({ id: "other-user", email: existingEmail });
        }
        return Promise.resolve(null);
      });
      
      // Act & Assert
      await expect(userService.updateUser(userId, {
        email: existingEmail
      })).rejects.toThrow("Email is already in use");
      
      // Verify prisma calls
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it("should throw error when updating to a national register number that's already in use", async () => {
      // Arrange
      const userId = "user-id-123";
      const existingNationalRegisterNumber = "12345678901";
      const mockUser = createMockUser("test@example.com", "APPRENTICE", userId);
      
      // Mock findUnique for different queries
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === userId) {
          return Promise.resolve(mockUser);
        }
        if (args.where.nationalRegisterNumber === existingNationalRegisterNumber) {
          return Promise.resolve({ 
            id: "other-user", 
            nationalRegisterNumber: existingNationalRegisterNumber 
          });
        }
        return Promise.resolve(null);
      });
      
      // Act & Assert
      await expect(userService.updateUser(userId, {
        nationalRegisterNumber: existingNationalRegisterNumber
      })).rejects.toThrow("National register number is already in use");
      
      // Verify prisma calls
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it("should enforce permissions when updating another user", async () => {
      // Arrange
      const regularUserId = "regular-user-id";
      const targetUserId = "target-user-id";
      const adminUserId = "admin-user-id";
      
      const mockRegularUser = createMockUser("regular@example.com", "APPRENTICE", regularUserId);
      const mockTargetUser = createMockUser("target@example.com", "APPRENTICE", targetUserId);
      const mockAdminUser = createMockUser("admin@example.com", "ADMIN", adminUserId);
      
      // Mock findUnique to return appropriate users
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === regularUserId) {
          return Promise.resolve(mockRegularUser);
        }
        if (args.where.id === targetUserId) {
          return Promise.resolve(mockTargetUser);
        }
        if (args.where.id === adminUserId) {
          return Promise.resolve(mockAdminUser);
        }
        return Promise.resolve(null);
      });
      
      // Mock update for the admin case
      const updatedMockUser = {
        ...mockTargetUser,
        displayName: "Changed by admin"
      };
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(updatedMockUser);
      
      // Act & Assert - Regular user cannot update another user
      await expect(userService.updateUser(targetUserId, {
        displayName: "Changed by regular user"
      }, regularUserId)).rejects.toThrow("Unauthorized to update this user");
      
      // Act - Admin can update another user
      const updatedByAdmin = await userService.updateUser(targetUserId, {
        displayName: "Changed by admin"  
      }, adminUserId);
      
      // Assert
      expect(updatedByAdmin.displayName).toBe("Changed by admin");
      
      // Verify appropriate prisma calls
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(3); // Target + Regular + Admin user lookups
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: targetUserId },
        data: { displayName: "Changed by admin" }
      });
    });
  });

  describe("changePassword", () => {
    it("should change user password successfully", async () => {
      // Arrange
      const userId = "user-id-123";
      const originalPassword = "Password123!";
      const newPassword = "NewSecurePassword123!";
      const originalPasswordHash = `hashed_${originalPassword}`;
      const newPasswordHash = `hashed_${newPassword}`;
      
      const mockUser = {
        ...createMockUser("test@example.com", "APPRENTICE", userId),
        passwordHash: originalPasswordHash
      };
      
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: newPassword
      };
      
      // Mock password compare to return true for valid password
      mockCompare.mockResolvedValueOnce(true);
      
      // Mock password hash to return new hash
      mockHash.mockResolvedValueOnce(newPasswordHash);
      
      // Mock findUnique to return the user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Mock update to return updated user
      const updatedMockUser = {
        ...mockUser,
        passwordHash: newPasswordHash
      };
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(updatedMockUser);
      
      // Act
      const result = await userService.changePassword(userId, passwordData);
      
      // Assert
      expect(result.success).toBe(true);
      
      // Verify bcrypt was called correctly
      expect(bcrypt.compare).toHaveBeenCalledWith(originalPassword, originalPasswordHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      
      // Verify prisma update was called
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });
      
      // Check that authService.revokeRefreshTokens was called
      expect(authService.revokeRefreshTokens).toHaveBeenCalledWith({ userId });
    });
    
    it("should throw error if current password is incorrect", async () => {
      // Arrange
      const userId = "user-id-123";
      const originalPassword = "Password123!";
      const wrongPassword = "WrongPassword123!";
      const newPassword = "NewPassword123!";
      
      const mockUser = {
        ...createMockUser("test@example.com", "APPRENTICE", userId),
        passwordHash: `hashed_${originalPassword}`
      };
      
      const passwordData = {
        currentPassword: wrongPassword,
        newPassword: newPassword
      };
      
      // Mock password compare to return false for wrong password
      mockCompare.mockResolvedValueOnce(false);
      
      // Mock findUnique to return the user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Act & Assert
      await expect(userService.changePassword(userId, passwordData)).rejects.toThrow(
        "Current password is incorrect"
      );
      
      // Verify bcrypt was called but prisma update wasn't
      expect(bcrypt.compare).toHaveBeenCalledWith(wrongPassword, mockUser.passwordHash);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(authService.revokeRefreshTokens).not.toHaveBeenCalled();
    });
    
    it("should throw error if new password is same as current", async () => {
      // Arrange
      const userId = "user-id-123";
      const originalPassword = "Password123!";
      
      const mockUser = {
        ...createMockUser("test@example.com", "APPRENTICE", userId),
        passwordHash: `hashed_${originalPassword}`
      };
      
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: originalPassword
      };
      
      // Mock password compare to return true for valid password
      mockCompare.mockResolvedValueOnce(true);
      
      // Mock findUnique to return the user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Act & Assert
      await expect(userService.changePassword(userId, passwordData)).rejects.toThrow(
        "New password must be different from current password"
      );
      
      // Verify bcrypt was called but prisma update wasn't
      expect(bcrypt.compare).toHaveBeenCalledWith(originalPassword, mockUser.passwordHash);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(authService.revokeRefreshTokens).not.toHaveBeenCalled();
    });
    
    it("should throw error if required fields are missing", async () => {
      // Arrange
      const userId = "user-id-123";
      
      // Act & Assert - Missing current password
      await expect(userService.changePassword(userId, {
        newPassword: "NewPassword123!"
      } as any)).rejects.toThrow("Current password and new password are required");
      
      // Act & Assert - Missing new password
      await expect(userService.changePassword(userId, {
        currentPassword: "Password123!"  
      } as any)).rejects.toThrow("Current password and new password are required");
      
      // Verify no prisma or bcrypt calls were made
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it("should throw error for non-existent user", async () => {
      // Arrange
      const userId = "non-existent-id";
      const passwordData = {
        currentPassword: "Password123!",
        newPassword: "NewPassword123!"
      };
      
      // Mock findUnique to return null
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(userService.changePassword(userId, passwordData)).rejects.toThrow(
        "User not found"
      );
      
      // Verify findUnique was called but no other operations
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
  
  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      // Arrange
      const userId = "user-id-123";
      const mockUser = createMockUser("test@example.com", "APPRENTICE", userId);
      
      // Mock findUnique to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Mock deleteMany for refresh tokens
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 2 });
      
      // Mock delete for user
      (prisma.user.delete as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Act
      const result = await userService.deleteUser(userId);
      
      // Assert
      expect(result.success).toBe(true);
      
      // Verify prisma calls
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId }
      });
      
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });
    
    it("should throw error for non-existent user", async () => {
      // Arrange
      const userId = "non-existent-id";
      
      // Mock findUnique to return null
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(userService.deleteUser(userId)).rejects.toThrow(
        "User not found"
      );
      
      // Verify findUnique was called but not the other operations
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
    
    it("should enforce permissions when deleting another user", async () => {
      // Arrange
      const regularUserId = "regular-user-id";
      const targetUserId = "target-user-id";
      const adminUserId = "admin-user-id";
      
      const mockRegularUser = createMockUser("regular@example.com", "APPRENTICE", regularUserId);
      const mockTargetUser = createMockUser("target@example.com", "APPRENTICE", targetUserId);
      const mockAdminUser = createMockUser("admin@example.com", "ADMIN", adminUserId);
      
      // Mock findUnique for different user lookups
      (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === regularUserId) {
          return Promise.resolve(mockRegularUser);
        }
        if (args.where.id === targetUserId) {
          return Promise.resolve(mockTargetUser);
        }
        if (args.where.id === adminUserId) {
          return Promise.resolve(mockAdminUser);
        }
        return Promise.resolve(null);
      });
      
      // Mock deleteMany and delete for the admin case
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
      (prisma.user.delete as jest.Mock).mockResolvedValueOnce(mockTargetUser);
      
      // Act & Assert - Non-admin cannot delete another user
      await expect(userService.deleteUser(targetUserId, regularUserId)).rejects.toThrow(
        "Unauthorized to delete this user"
      );
      
      // Act - Admin can delete another user
      const result = await userService.deleteUser(targetUserId, adminUserId);
      
      // Assert
      expect(result.success).toBe(true);
      
      // Verify appropriate prisma calls
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(3); // All three users looked up
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: targetUserId }
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: targetUserId }
      });
    });
  });
  
  describe("getAllUsers", () => {
    it("should return a list of users with pagination", async () => {
      // Arrange
      const mockUsers = [
        createMockUser("user1@example.com", "APPRENTICE", "user1-id"),
        createMockUser("user2@example.com", "GUIDE", "user2-id"),
        createMockUser("user3@example.com", "INSTRUCTOR", "user3-id"),
        createMockUser("admin@example.com", "ADMIN", "admin-id"),
        createMockUser("john.doe@example.com", "APPRENTICE", "john-id")
      ];
      
      // Mock findMany to return users
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce(mockUsers.map(user => ({
        ...user,
        _count: {
          ownedRoadbooks: 2,
          guidedRoadbooks: 1,
          receivedBadges: 3
        }
      })));
      
      // Mock count to return total
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(5);
      
      // Act
      const result = await userService.getAllUsers({});
      
      // Assert
      expect(result.users).toHaveLength(5);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.limit).toBe(20); // Default limit
      expect(result.pagination.offset).toBe(0); // Default offset
      expect(result.pagination.pages).toBe(1);
      expect(result.pagination.currentPage).toBe(1);
      
      // Verify prisma calls
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 20,
        skip: 0,
        orderBy: { createdAt: "desc" }
      }));
      
      expect(prisma.user.count).toHaveBeenCalled();
    });
    
    it("should filter users by role", async () => {
      // Arrange
      const mockUsers = [
        createMockUser("user1@example.com", "APPRENTICE", "user1-id"),
        createMockUser("john.doe@example.com", "APPRENTICE", "john-id")
      ];
      
      // Mock findMany to return filtered users
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce(mockUsers.map(user => ({
        ...user,
        _count: {
          ownedRoadbooks: 2,
          guidedRoadbooks: 0,
          receivedBadges: 1
        }
      })));
      
      // Mock count to return total
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(2);
      
      // Act
      const result = await userService.getAllUsers({ role: "APPRENTICE" });
      
      // Assert
      expect(result.users).toHaveLength(2);
      result.users.forEach(user => {
        expect(user.role).toBe("APPRENTICE");
      });
      
      // Verify prisma calls
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { role: "APPRENTICE" }
      }));
      
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: "APPRENTICE" }
      });
    });
    
    it("should filter users by search term", async () => {
      // Arrange
      const mockUsers = [
        createMockUser("john.doe@example.com", "APPRENTICE", "john-id")
      ];
      
      // Mock findMany to return search results
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce(mockUsers.map(user => ({
        ...user,
        _count: {
          ownedRoadbooks: 2,
          guidedRoadbooks: 0,
          receivedBadges: 1
        }
      })));
      
      // Mock count to return total
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(1);
      
      // Act
      const result = await userService.getAllUsers({ search: "john" });
      
      // Assert
      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe("john.doe@example.com");
      
      // Verify prisma calls with OR search condition
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          OR: expect.arrayContaining([
            expect.objectContaining({ email: expect.objectContaining({ contains: "john" }) })
          ])
        }
      }));
    });
    
    it("should apply pagination correctly", async () => {
      // Arrange
      const mockUsers = [
        createMockUser("user3@example.com", "INSTRUCTOR", "user3-id"),
        createMockUser("admin@example.com", "ADMIN", "admin-id")
      ];
      
      // Mock findMany to return paginated users
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce(mockUsers.map(user => ({
        ...user,
        _count: {
          ownedRoadbooks: 0,
          guidedRoadbooks: 0,
          receivedBadges: 0
        }
      })));
      
      // Mock count to return total
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(5);
      
      // Act
      const result = await userService.getAllUsers({ limit: 2, offset: 2 });
      
      // Assert
      expect(result.users).toHaveLength(2);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.offset).toBe(2);
      expect(result.pagination.pages).toBe(3); // 5 users / 2 per page = 3 pages (ceiling)
      expect(result.pagination.currentPage).toBe(2); // Page 2
      
      // Verify prisma calls
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 2,
        skip: 2
      }));
    });
    
    it("should apply sorting correctly", async () => {
      // Arrange
      const mockUsers = [
        createMockUser("admin@example.com", "ADMIN", "admin-id"),
        createMockUser("john.doe@example.com", "APPRENTICE", "john-id"),
        createMockUser("user1@example.com", "APPRENTICE", "user1-id"),
        createMockUser("user2@example.com", "GUIDE", "user2-id"),
        createMockUser("user3@example.com", "INSTRUCTOR", "user3-id")
      ];
      
      // Mock findMany to return sorted users
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce(mockUsers.map(user => ({
        ...user,
        _count: {
          ownedRoadbooks: 0,
          guidedRoadbooks: 0,
          receivedBadges: 0
        }
      })));
      
      // Mock count to return total
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(5);
      
      // Act - Sort by email ascending
      const result = await userService.getAllUsers({ 
        orderBy: "email",
        orderDirection: "asc"
      });
      
      // Assert
      expect(result.users).toHaveLength(5);
      
      // Verify prisma calls
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { email: "asc" }
      }));
    });
    
    it("should default to a safe sorting field if invalid field provided", async () => {
      // Arrange
      const mockUsers = [
        createMockUser("user1@example.com", "APPRENTICE", "user1-id"),
        createMockUser("user2@example.com", "GUIDE", "user2-id"),
        createMockUser("user3@example.com", "INSTRUCTOR", "user3-id"),
        createMockUser("admin@example.com", "ADMIN", "admin-id"),
        createMockUser("john.doe@example.com", "APPRENTICE", "john-id")
      ];
      
      // Mock findMany to return users
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce(mockUsers.map(user => ({
        ...user,
        _count: {
          ownedRoadbooks: 0,
          guidedRoadbooks: 0,
          receivedBadges: 0
        }
      })));
      
      // Mock count to return total
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(5);
      
      // Act - Try to sort by a non-existent field
      const result = await userService.getAllUsers({ 
        orderBy: "nonExistentField" as any,
      });
      
      // Assert - Should default to createdAt
      expect(result.users).toHaveLength(5);
      
      // Verify prisma calls default to createdAt
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { createdAt: "desc" }
      }));
    });
  });
});
