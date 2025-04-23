"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Create a proper mock for all Prisma operations we need
const mockPrisma = {
    user: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
    },
    refreshToken: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        updateMany: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        deleteMany: globals_1.jest.fn(),
    },
    passwordReset: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        updateMany: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        deleteMany: globals_1.jest.fn(),
    },
    roadBook: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
    },
    session: {
        create: globals_1.jest.fn(),
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
    },
    $transaction: globals_1.jest.fn((operations) => Promise.all(operations)),
    $disconnect: globals_1.jest.fn(),
};
// Type the mock with PrismaClient interface
const prismaMock = mockPrisma;
// Export the mock for use in tests
exports.default = prismaMock;
