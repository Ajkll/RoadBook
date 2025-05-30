"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaManager = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const dotenv_1 = __importDefault(require("dotenv"));
// Charger les variables d'environnement depuis .env
dotenv_1.default.config();
/**
 * Classe de gestion des connexions Prisma
 * Implémente le pattern Singleton avec gestion des reconnexions
 */
class PrismaManager {
    /**
     * Constructeur privé qui initialise le client Prisma
     */
    constructor() {
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryTimeout = 2000; // ms
        this.pingInterval = null;
        // Configuration du client Prisma avec des options spécifiques
        this.prisma = new client_1.PrismaClient({
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
    static getInstance() {
        if (!PrismaManager.instance) {
            PrismaManager.instance = new PrismaManager();
        }
        return PrismaManager.instance;
    }
    /**
     * Obtenir le client Prisma après vérification de la connexion
     */
    async getClient() {
        // S'assurer que la connexion est établie avant de retourner le client
        if (!this.isConnected) {
            await this.connect();
        }
        return this.prisma;
    }
    /**
     * Établir la connexion à la base de données
     */
    async connect() {
        try {
            if (!this.isConnected) {
                // Tentative de connexion avec $connect
                logger_1.default.info('Connecting to database...');
                await this.prisma.$connect();
                // Vérifier la connexion en exécutant une requête simple
                await this.prisma.$queryRaw `SELECT 1 as connected`;
                this.isConnected = true;
                this.retryCount = 0;
                logger_1.default.info('Successfully connected to database');
            }
        }
        catch (error) {
            this.isConnected = false;
            logger_1.default.error('Database connection error:', error);
            // Tentative de reconnexion
            await this.reconnect();
        }
    }
    /**
     * Déconnecter proprement de la base de données
     */
    async disconnect() {
        try {
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }
            if (this.isConnected) {
                logger_1.default.info('Disconnecting from database...');
                await this.prisma.$disconnect();
                this.isConnected = false;
                logger_1.default.info('Successfully disconnected from database');
            }
        }
        catch (error) {
            logger_1.default.error('Error during database disconnection:', error);
        }
    }
    /**
     * Tenter une reconnexion en cas d'échec
     */
    async reconnect() {
        if (this.retryCount >= this.maxRetries) {
            logger_1.default.error(`Maximum database connection retry attempts (${this.maxRetries}) reached`);
            throw new Error('Database connection failed after maximum retry attempts');
        }
        this.retryCount++;
        const delay = this.retryTimeout * Math.pow(1.5, this.retryCount - 1); // Exponential backoff
        logger_1.default.info(`Reconnecting to database in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        try {
            // Recréer une nouvelle instance de PrismaClient
            this.prisma = new client_1.PrismaClient({
                log: process.env.NODE_ENV === "development"
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
                errorFormat: 'pretty',
            });
            await this.connect();
        }
        catch (error) {
            logger_1.default.error(`Reconnection attempt ${this.retryCount} failed:`, error);
            await this.reconnect(); // Recursive retry
        }
    }
    /**
     * Vérifier périodiquement l'état de la connexion
     */
    startConnectionMonitoring() {
        // Ping la base de données toutes les 5 minutes pour maintenir la connexion active
        const pingInterval = 5 * 60 * 1000; // 5 minutes
        this.pingInterval = setInterval(async () => {
            try {
                // Vérifier si la connexion est toujours active avec une requête simple
                await this.prisma.$queryRaw `SELECT 1 as heartbeat`;
                logger_1.default.debug('Database connection heartbeat: OK');
            }
            catch (error) {
                logger_1.default.error('Database connection heartbeat failed:', error);
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
    async executeWithRetry(operation, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // S'assurer que nous avons une connexion active
                const prisma = await this.getClient();
                // Exécuter l'opération
                return await operation(prisma);
            }
            catch (error) {
                // Vérifier les erreurs spécifiques à Prisma
                const errorMessage = (error === null || error === void 0 ? void 0 : error.message) || '';
                // Gérer l'erreur "prepared statement does not exist"
                if (errorMessage.includes('prepared statement') && errorMessage.includes('does not exist')) {
                    logger_1.default.warn(`Prepared statement error detected (attempt ${attempt}/${retries})`);
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
                logger_1.default.error(`Database operation failed after ${attempt} attempts:`, error);
                throw error;
            }
        }
        throw new Error('Failed to execute database operation after multiple attempts');
    }
}
// Exporter l'instance unique du gestionnaire
const prismaManager = global.prismaManager || PrismaManager.getInstance();
exports.prismaManager = prismaManager;
// Stocker dans la variable globale en développement pour éviter la réinitialisation lors des hot-reloads
if (process.env.NODE_ENV !== 'production') {
    global.prismaManager = prismaManager;
}
exports.default = prismaManager;
