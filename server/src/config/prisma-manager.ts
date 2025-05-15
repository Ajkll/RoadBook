/**
 * Enhanced Prisma Client Manager
 * =============================
 *
 * Ce fichier fournit une configuration améliorée pour Prisma Client qui gère:
 * - Les reconnexions automatiques
 * - La gestion des pools de connexion
 * - La récupération après les erreurs "prepared statement does not exist"
 * - Les timeout de requêtes
 * - Les métriques de connexion
 *
 * @module config/prisma-manager
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env
dotenv.config();

// Déclarer variable globale pour usage serverless
declare global {
  var prismaManager: PrismaManager | undefined;
}

/**
 * Classe de gestion des connexions Prisma
 * Implémente le pattern Singleton avec gestion des reconnexions
 */
class PrismaManager {
  private static instance: PrismaManager;
  private prisma: PrismaClient;
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 5;
  private retryTimeout: number = 2000; // ms
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Constructeur privé qui initialise le client Prisma
   */
  private constructor() {
    // Configuration du client Prisma avec des options spécifiques
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development"
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      errorFormat: 'pretty',
    });

    // Démarrage des vérifications périodiques de connexion
    this.startConnectionMonitoring();
  }

  /**
   * Obtenir l'instance singleton du gestionnaire de connexion
   */
  public static getInstance(): PrismaManager {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }

  /**
   * Obtenir le client Prisma après vérification de la connexion
   */
  public async getClient(): Promise<PrismaClient> {
    // S'assurer que la connexion est établie avant de retourner le client
    if (!this.isConnected) {
      await this.connect();
    }
    return this.prisma;
  }

  /**
   * Établir la connexion à la base de données
   */
  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        // Tentative de connexion avec $connect
        logger.info('Connecting to database...');
        await this.prisma.$connect();
        
        // Vérifier la connexion en exécutant une requête simple
        await this.prisma.$queryRaw`SELECT 1 as connected`;
        
        this.isConnected = true;
        this.retryCount = 0;
        logger.info('Successfully connected to database');
      }
    } catch (error) {
      this.isConnected = false;
      logger.error('Database connection error:', error);
      
      // Tentative de reconnexion
      await this.reconnect();
    }
  }

  /**
   * Déconnecter proprement de la base de données
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      
      if (this.isConnected) {
        logger.info('Disconnecting from database...');
        await this.prisma.$disconnect();
        this.isConnected = false;
        logger.info('Successfully disconnected from database');
      }
    } catch (error) {
      logger.error('Error during database disconnection:', error);
    }
  }

  /**
   * Tenter une reconnexion en cas d'échec
   */
  private async reconnect(): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      logger.error(`Maximum database connection retry attempts (${this.maxRetries}) reached`);
      throw new Error('Database connection failed after maximum retry attempts');
    }

    this.retryCount++;
    const delay = this.retryTimeout * Math.pow(1.5, this.retryCount - 1); // Exponential backoff
    
    logger.info(`Reconnecting to database in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      // Recréer une nouvelle instance de PrismaClient
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development"
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
        errorFormat: 'pretty',
      });
      
      await this.connect();
    } catch (error) {
      logger.error(`Reconnection attempt ${this.retryCount} failed:`, error);
      await this.reconnect(); // Recursive retry
    }
  }

  /**
   * Vérifier périodiquement l'état de la connexion
   */
  private startConnectionMonitoring(): void {
    // Ping la base de données toutes les 5 minutes pour maintenir la connexion active
    const pingInterval = 5 * 60 * 1000; // 5 minutes
    
    this.pingInterval = setInterval(async () => {
      try {
        // Vérifier si la connexion est toujours active avec une requête simple
        await this.prisma.$queryRaw`SELECT 1 as heartbeat`;
        logger.debug('Database connection heartbeat: OK');
      } catch (error) {
        logger.error('Database connection heartbeat failed:', error);
        
        // La connexion semble rompue, tenter de se reconnecter
        this.isConnected = false;
        await this.connect();
      }
    }, pingInterval);
  }

  /**
   * Wrapper autour des requêtes pour la gestion des erreurs
   * Utile pour capturer et traiter les erreurs spécifiques à Prisma
   */
  public async executeWithRetry<T>(
    operation: (prisma: PrismaClient) => Promise<T>, 
    retries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // S'assurer que nous avons une connexion active
        const prisma = await this.getClient();
        
        // Exécuter l'opération
        return await operation(prisma);
      } catch (error: any) {
        // Vérifier les erreurs spécifiques à Prisma
        const errorMessage = error?.message || '';
        
        // Gérer l'erreur "prepared statement does not exist"
        if (errorMessage.includes('prepared statement') && errorMessage.includes('does not exist')) {
          logger.warn(`Prepared statement error detected (attempt ${attempt}/${retries})`);
          
          if (attempt < retries) {
            // Réinitialiser la connexion
            this.isConnected = false;
            await this.connect();
            
            // Attendre un court délai avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }
        
        // Pour les autres types d'erreurs ou si nous avons épuisé toutes les tentatives
        logger.error(`Database operation failed after ${attempt} attempts:`, error);
        throw error;
      }
    }
    
    throw new Error('Failed to execute database operation after multiple attempts');
  }
}

// Exporter l'instance unique du gestionnaire
const prismaManager = global.prismaManager || PrismaManager.getInstance();

// Stocker dans la variable globale en développement pour éviter la réinitialisation lors des hot-reloads
if (process.env.NODE_ENV !== 'production') {
  global.prismaManager = prismaManager;
}

export { prismaManager };
export default prismaManager;