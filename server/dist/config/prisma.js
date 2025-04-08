"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Determine database URL based on environment
const getDatabaseUrl = () => {
    if (process.env.NODE_ENV === "test") {
        return process.env.TEST_DATABASE_URL;
    }
    return process.env.DATABASE_URL;
};
// Initialize Prisma client with appropriate URL
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: getDatabaseUrl(),
        },
    },
    log: process.env.NODE_ENV === "development"
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
});
exports.default = prisma;
