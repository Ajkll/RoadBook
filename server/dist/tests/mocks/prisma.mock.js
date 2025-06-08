"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
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
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    refreshToken: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        updateMany: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        deleteMany: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    passwordReset: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        updateMany: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        deleteMany: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    roadBook: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    session: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        deleteMany: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    competency: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    competencyProgress: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
    },
    competencyValidation: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
    },
    // Community features
    post: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    comment: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    like: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    // Gamification
    badge: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    userBadge: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    // Marketplace
    marketplaceListing: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    purchase: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    // Notifications
    notification: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        updateMany: globals_1.jest.fn(),
        deleteMany: globals_1.jest.fn(),
        upsert: globals_1.jest.fn(),
    },
    $transaction: globals_1.jest.fn((operations) => Promise.all(operations)),
    $connect: globals_1.jest.fn(),
    $disconnect: globals_1.jest.fn(),
};
// Type the mock with PrismaClient interface
const prismaMock = mockPrisma;
// Export the mock for use in tests
exports.default = prismaMock;
