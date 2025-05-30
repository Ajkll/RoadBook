// Prisma client singleton pour environnement serverless
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// Declare global variable
declare global {
  var prisma: PrismaClient | undefined;
}

// PrismaClient est attaché au global pour éviter les connexions multiples en dev
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;