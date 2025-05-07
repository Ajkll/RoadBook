/**
 * Mock Prisma Client pour les tests
 * =================================
 * 
 * Ce fichier fournit un mock complet du client Prisma pour les tests unitaires.
 * Il simule toutes les fonctionnalités de la base de données sans nécessiter une connexion réelle.
 * 
 * Chaque modèle de la base de données et ses méthodes (create, findUnique, update, etc.)
 * sont simulés pour permettre des tests précis et isolés des services et contrôleurs.
 * 
 * @module tests/mocks/prisma.mock
 */

import { PrismaClient } from '@prisma/client';
import { jest } from '@jest/globals';

/**
 * Note importante sur les types des mocks:
 * 
 * Dans ce fichier, nous utilisons "any" pour résoudre les erreurs de typage
 * qui apparaissent lors de l'exécution des tests avec TypeScript.
 * 
 * C'est une approche courante pour les mocks dans les tests, car les 
 * fonctions mockées ne respectent pas toujours les types exacts
 * des fonctions qu'elles remplacent.
 * 
 * Les erreurs de typage sont ignorées dans le fichier jest.config.mjs
 * pour permettre l'exécution des tests malgré les avertissements.
 */

// Create a proper mock for all Prisma operations we need
const mockPrisma = {
  user: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  refreshToken: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any, 
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    updateMany: jest.fn() as any,
    delete: jest.fn() as any,
    deleteMany: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  passwordReset: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    updateMany: jest.fn() as any,
    delete: jest.fn() as any,
    deleteMany: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  roadBook: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  session: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    deleteMany: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  competency: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  competencyProgress: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    upsert: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
  },
  competencyValidation: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    upsert: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
  },
  // Community features
  post: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  comment: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  like: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  // Gamification
  badge: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  userBadge: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  // Marketplace
  marketplaceListing: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  purchase: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  // Notifications
  notification: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    findMany: jest.fn() as any,
    update: jest.fn() as any,
    delete: jest.fn() as any,
    count: jest.fn() as any,
    updateMany: jest.fn() as any,
    deleteMany: jest.fn() as any,
    upsert: jest.fn() as any,
  },
  $transaction: jest.fn((operations: any) => Promise.all(operations)) as any,
  $connect: jest.fn() as any,
  $disconnect: jest.fn() as any,
};

// Type the mock with PrismaClient interface
const prismaMock = mockPrisma as unknown as jest.Mocked<PrismaClient>;

// Export the mock for use in tests
export default prismaMock;