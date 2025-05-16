"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// Prisma client singleton pour environnement serverless
const client_1 = require("@prisma/client");
require("dotenv/config");
// PrismaClient est attaché au global pour éviter les connexions multiples en dev
exports.prisma = global.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
if (process.env.NODE_ENV !== 'production')
    global.prisma = exports.prisma;
