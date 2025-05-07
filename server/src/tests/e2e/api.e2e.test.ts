/**
 * Tests end-to-end pour l'API RoadBook
 * ===================================
 * 
 * Ces tests vérifient le comportement complet de l'API
 * en simulant des appels HTTP réels.
 */

import { TestLogger, TestType } from '../utils/test-logger';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Configuration pour les tests
const API_URL = process.env.TEST_API_URL || 'http://localhost:4000/api';
let prisma: PrismaClient;
const testEmail = 'e2e-test@example.com';
const testPassword = 'SecurePassword123!';
let testUserId: string;
let authToken: string;

// Désactiver tous les tests par défaut
// Ils seront activés manuellement en dev lorsque l'API est démarrée
const runTests = false;

// Logger pour une meilleure visibilité des tests
TestLogger.startSuite('API End-to-End Tests', TestType.E2E);

beforeAll(async () => {
  if (!runTests) return;
  
  // Initialiser le client Prisma pour les tests
  prisma = new PrismaClient();
  
  // Créer un utilisateur de test
  const passwordHash = await bcrypt.hash(testPassword, 10);
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      passwordHash,
      displayName: 'E2E Test User',
      firstName: 'E2E',
      lastName: 'Test',
      role: 'USER',
    },
  });
  
  testUserId = user.id;
  TestLogger.info(`Utilisateur de test créé avec ID: ${testUserId}`);
  
  // Se connecter pour récupérer un token
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  
  const loginData = await loginResponse.json();
  authToken = loginData.accessToken;
  TestLogger.info('Token d\'authentification obtenu');
});

afterAll(async () => {
  if (!runTests) return;
  
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
  TestLogger.endSuite('API End-to-End Tests', true);
});

describe('API Endpoints', () => {
  // Ce test est désactivé car il n'est pas encore implémenté
  it.skip('GET /api/users/me should return the current user', async () => {
    if (!runTests) {
      return TestLogger.warning('Test ignoré - API non disponible');
    }
    
    TestLogger.startTest('Récupération du profil utilisateur');
    
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.id).toBe(testUserId);
    expect(data.email).toBe(testEmail);
    
    TestLogger.success('Profil utilisateur récupéré avec succès');
  });
  
  it.skip('POST /api/auth/refresh should refresh the token', async () => {
    if (!runTests) {
      return TestLogger.warning('Test ignoré - API non disponible');
    }
    
    TestLogger.startTest('Rafraîchissement du token');
    
    // Simulation d'un refresh token (à adapter selon votre implémentation)
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    
    const loginData = await loginResponse.json();
    const refreshToken = loginData.refreshToken;
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    
    TestLogger.success('Token rafraîchi avec succès');
  });
});