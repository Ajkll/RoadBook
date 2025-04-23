/**
 * Configuration Prisma Client
 * 
 * Ce fichier configure et exporte l'instance Prisma Client utilisée dans toute l'application
 * pour interagir avec la base de données PostgreSQL. La configuration des logs varie selon
 * l'environnement d'exécution.
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env
dotenv.config();

// Initialiser le client Prisma avec la configuration appropriée
const prisma = new PrismaClient({
  // En développement, afficher tous les types de logs
  // En production/test, afficher uniquement les erreurs
  log: process.env.NODE_ENV === "development" 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export default prisma;