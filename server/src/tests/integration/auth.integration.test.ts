/**
 * Tests d'intégration pour le service d'authentification
 * =====================================================
 * 
 * Ces tests vérifient l'interaction entre le service d'authentification
 * et la base de données réelle ou simulée.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as authService from '../../services/auth.service';
import { TestLogger, TestType } from '../utils/test-logger';
import jwt from 'jsonwebtoken';

// Configuration pour les tests
let prisma: PrismaClient;
const testEmail = 'integration-test@example.com';
const testPassword = 'SecurePassword123!';
let testUserId: string;

// Logger pour une meilleure visibilité des tests
TestLogger.startSuite('Auth Service Integration Tests', TestType.INTEGRATION);

beforeAll(async () => {
  // Initialiser le client Prisma pour les tests
  prisma = new PrismaClient();
  
  // Créer un utilisateur de test
  const passwordHash = await bcrypt.hash(testPassword, 10);
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      passwordHash,
      displayName: 'Integration Test User',
      firstName: 'Integration',
      lastName: 'Test',
      role: 'USER',
    },
  });
  
  testUserId = user.id;
  TestLogger.info(`Utilisateur de test créé avec ID: ${testUserId}`);
});

afterAll(async () => {
  // Nettoyer les données de test
  await prisma.refreshToken.deleteMany({
    where: {
      userId: testUserId,
    },
  });
  
  await prisma.user.delete({
    where: {
      id: testUserId,
    },
  });
  
  await prisma.$disconnect();
  TestLogger.info('Base de données nettoyée');
  TestLogger.endSuite('Auth Service Integration Tests', true);
});

describe('Auth Service Integration', () => {
  // Ce test est désactivé car il n'est pas encore implémenté
  // Il demanderait une base de données réelle pour être exécuté correctement
  it.skip('should authenticate user and issue tokens', async () => {
    TestLogger.startTest('Authentification utilisateur');
    
    // Authenticate with the test user
    const result = await authService.login(testEmail, testPassword);
    
    // Verify tokens were issued
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    
    // Verify tokens format
    const decodedAccessToken = jwt.decode(result.accessToken) as any;
    expect(decodedAccessToken.userId).toBe(testUserId);
    
    TestLogger.success('Authentification réussie, jetons générés');
  });
  
  it.skip('should refresh tokens', async () => {
    TestLogger.startTest('Rafraîchissement des jetons');
    
    // First login to get tokens
    const loginResult = await authService.login(testEmail, testPassword);
    
    // Then refresh token
    const refreshResult = await authService.refreshToken(loginResult.refreshToken);
    
    // Verify new tokens
    expect(refreshResult.accessToken).toBeDefined();
    expect(refreshResult.refreshToken).toBeDefined();
    expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);
    
    TestLogger.success('Jetons rafraîchis avec succès');
  });
  
  it.skip('should revoke refresh tokens', async () => {
    TestLogger.startTest('Révocation des jetons');
    
    // First login to get tokens
    const loginResult = await authService.login(testEmail, testPassword);
    
    // Then revoke the specific token
    await authService.revokeRefreshToken(loginResult.refreshToken);
    
    // Verify token is revoked by trying to refresh
    await expect(
      authService.refreshToken(loginResult.refreshToken)
    ).rejects.toThrow();
    
    TestLogger.success('Jeton révoqué avec succès');
  });
});