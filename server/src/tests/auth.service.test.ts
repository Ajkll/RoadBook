// server/src/tests/auth.service.test.ts
import * as authService from "../services/auth.service";
import jwt from "jsonwebtoken";
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Define our own fail function
function fail(message: string): void {
  expect(true).toBe(false, message);
}

// Mocking dependencies
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ userId: 'mock-user-id', role: 'APPRENTICE', email: 'mock@example.com' })),
  TokenExpiredError: jest.fn(function() { this.name = 'TokenExpiredError' }),
  JsonWebTokenError: jest.fn(function() { this.name = 'JsonWebTokenError' })
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({ toString: () => 'mock-reset-token' })),
}));

// Prisma is already mocked by jest.config.mjs

// Import the mocked prisma
import prisma from "../config/prisma";

describe("Auth Service", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'mock-user-id',
      email: 'auth.test@example.com',
      passwordHash: 'hashed-password',
      displayName: 'Mock User',
      role: 'APPRENTICE',
      refreshTokens: []
    });
    
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      id: 'token-id',
      token: 'mock-token',
      userId: 'mock-user-id',
      revoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
      user: {
        id: 'mock-user-id',
        email: 'auth.test@example.com',
        role: 'APPRENTICE'
      }
    });
    
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
      id: 'new-token-id',
      token: 'mock-token',
      userId: 'mock-user-id',
      revoked: false
    });
    
    (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'token-id-1',
        token: 'mock-token-1',
        userId: 'mock-user-id',
        revoked: false
      },
      {
        id: 'token-id-2',
        token: 'mock-token-2',
        userId: 'mock-user-id',
        revoked: false
      }
    ]);
  });

  describe("Login", () => {
    it("should authenticate user and return tokens", async () => {
      // Act
      const result = await authService.login("auth.test@example.com", "Password123!");
      
      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
    
    it("should normalize email for login", async () => {
      // Act
      await authService.login("AUTH.TEST@EXAMPLE.COM", "Password123!");
      
      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "auth.test@example.com" }
        })
      );
    });
    
    it("should throw error for invalid credentials", async () => {
      // Setup for non-existent user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Act & Assert - Email inexistant
      await expect(authService.login("nonexistent@example.com", "Password123!")).rejects.toThrow(
        "Invalid credentials"
      );
      
      // Setup for invalid password
      const mockCompare = require('bcrypt').compare as jest.Mock;
      mockCompare.mockResolvedValueOnce(false);
      
      // Act & Assert - Mauvais mot de passe
      await expect(authService.login("auth.test@example.com", "WrongPassword123!")).rejects.toThrow(
        "Invalid credentials"
      );
    });
  });

  describe("Token Refresh", () => {
    it("should issue new tokens when refreshing with valid token", async () => {
      // Act
      const refreshResult = await authService.refreshToken("mock-token");
      
      // Assert
      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      
      // Verify token was revoked and new one created
      expect(prisma.refreshToken.update).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
    
    it("should throw error for invalid refresh token", async () => {
      // Setup for JWT verification error
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });
      
      // Act & Assert
      await expect(authService.refreshToken("invalid-token")).rejects.toThrow();
    });
    
    it("should throw error for revoked refresh token", async () => {
      // Setup for revoked token
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'token-id',
        token: 'mock-token',
        userId: 'mock-user-id',
        revoked: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      });
      
      // Act & Assert
      await expect(authService.refreshToken("mock-token")).rejects.toThrow(
        "Token has been revoked"
      );
    });
  });

  describe("Token Revocation", () => {
    it("should revoke a specific refresh token", async () => {
      // Setup
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
      
      // Act
      const result = await authService.revokeRefreshToken("mock-token");
      
      // Assert
      expect(result).toBe(true);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: "mock-token" },
        data: { revoked: true }
      });
    });
    
    it("should revoke all tokens for a user", async () => {
      // Setup
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValueOnce({ count: 2 });
      
      // Act
      const result = await authService.revokeRefreshTokens({ userId: "mock-user-id" });
      
      // Assert
      expect(result).toBe(true);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: "mock-user-id" },
        data: { revoked: true }
      });
    });
  });

  describe("Token Verification", () => {
    it("should verify and decode a valid access token", () => {
      // Setup
      const mockPayload = { 
        userId: "mock-user-id", 
        email: "mock@example.com", 
        role: "APPRENTICE" 
      };
      (jwt.verify as jest.Mock).mockReturnValueOnce(mockPayload);
      
      // Act
      const decoded = authService.verifyAccessToken("mock-token");
      
      // Assert
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });
    
    it("should throw error for invalid access token", () => {
      // Setup
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });
      
      // Act & Assert
      expect(() => authService.verifyAccessToken("invalid-token")).toThrow();
    });
  });

  describe("Password Reset", () => {
    it("should generate a reset token for a valid email", async () => {
      // Setup
      (prisma.passwordReset.create as jest.Mock).mockResolvedValueOnce({
        id: 'reset-token-id',
        token: 'hashed-reset-token',
        userId: 'mock-user-id'
      });
      
      // Act
      try {
        const resetToken = await authService.initiatePasswordReset("valid@example.com");
        
        // Assert
        expect(resetToken).toBeDefined();
        expect(typeof resetToken).toBe("string");
        expect(prisma.passwordReset.create).toHaveBeenCalled();
        expect(prisma.passwordReset.updateMany).toHaveBeenCalled();
      } catch (error) {
        fail(`Should not have thrown error: ${error}`);
      }
    });
    
    it("should not reveal if email exists when requesting password reset", async () => {
      // Setup for non-existent email
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(authService.initiatePasswordReset("nonexistent@example.com")).rejects.toThrow(
        /If this email exists in our system/
      );
    });
    
    it("should normalize email for password reset", async () => {
      // Setup
      (prisma.passwordReset.create as jest.Mock).mockResolvedValueOnce({
        id: 'reset-token-id',
        token: 'hashed-reset-token',
        userId: 'mock-user-id'
      });
      
      // Act
      try {
        await authService.initiatePasswordReset("UPPERCASE@EXAMPLE.COM");
        
        // Assert
        expect(prisma.user.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { email: "uppercase@example.com" }
          })
        );
      } catch (error) {
        fail(`Should not have thrown error: ${error}`);
      }
    });
    
    it("should complete password reset with valid token", async () => {
      // Setup
      (prisma.passwordReset.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'reset-id',
          token: 'hashed-token',
          userId: 'user-id',
          revoked: false,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          user: { id: 'user-id' }
        }
      ]);
      
      const mockCompare = require('bcrypt').compare as jest.Mock;
      mockCompare.mockResolvedValueOnce(true);
      
      // Act
      const result = await authService.completePasswordReset("valid-token", "NewPassword123!");
      
      // Assert
      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
      expect(prisma.passwordReset.updateMany).toHaveBeenCalled();
    });
  });
});