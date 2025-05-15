"use strict";
/**
 * Exemple d'utilisation du gestionnaire de connexion Prisma amélioré
 * ==================================================================
 *
 * Ce fichier présente comment utiliser le nouveau gestionnaire de connexion Prisma
 * dans les services de l'application. Il montre les différentes approches pour
 * interagir avec la base de données de manière robuste.
 *
 * @module services/example-prisma-usage
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServiceExample = void 0;
const prisma_1 = require("../config/prisma");
const prisma_manager_1 = __importDefault(require("../config/prisma-manager"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Service d'exemple pour démontrer les différentes approches d'utilisation
 * du gestionnaire de connexion Prisma amélioré.
 */
class UserServiceExample {
    /**
     * Approche 1: Utilisation directe de executeDbOperation
     * Recommandée pour la plupart des opérations simples
     */
    async getUserById(id) {
        try {
            return await (0, prisma_1.executeDbOperation)(async (prisma) => {
                return prisma.user.findUnique({
                    where: { id }
                });
            });
        }
        catch (error) {
            logger_1.default.error(`Error getting user by ID ${id}:`, error);
            throw new Error(`Failed to fetch user: ${error.message}`);
        }
    }
    /**
     * Approche 2: Utilisation de getPrismaClient
     * Utile lorsque vous avez besoin de faire plusieurs opérations
     * avec le même client Prisma
     */
    async updateUserProfile(id, data) {
        try {
            const prisma = await (0, prisma_1.getPrismaClient)();
            // Vérifier si l'utilisateur existe
            const existingUser = await prisma.user.findUnique({
                where: { id }
            });
            if (!existingUser) {
                throw new Error(`User with ID ${id} not found`);
            }
            // Mettre à jour le profil utilisateur
            return await prisma.user.update({
                where: { id },
                data
            });
        }
        catch (error) {
            logger_1.default.error(`Error updating user profile for ${id}:`, error);
            throw new Error(`Failed to update user profile: ${error.message}`);
        }
    }
    /**
     * Approche 3: Utilisation de prismaManager.executeWithRetry
     * Recommandée pour les opérations complexes avec contrôle précis
     * sur le nombre de tentatives
     */
    async createUserWithTransaction(userData) {
        try {
            return await prisma_manager_1.default.executeWithRetry(async (prisma) => {
                // Utiliser une transaction pour garantir l'atomicité
                return await prisma.$transaction(async (tx) => {
                    // Créer un nouvel utilisateur
                    const user = await tx.user.create({
                        data: userData
                    });
                    // Créer un roadbook par défaut pour le nouvel utilisateur
                    await tx.roadBook.create({
                        data: {
                            title: 'Mon premier carnet de route',
                            description: 'Carnet de route créé automatiquement',
                            apprenticeId: user.id
                        }
                    });
                    return user;
                });
            }, 3); // 3 tentatives maximum
        }
        catch (error) {
            logger_1.default.error('Error creating user with transaction:', error);
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }
    /**
     * Exemple de gestion d'erreur spécifique pour les problèmes de connexion
     */
    async getAllUsers() {
        var _a, _b, _c;
        try {
            return await (0, prisma_1.executeDbOperation)(async (prisma) => {
                return prisma.user.findMany();
            });
        }
        catch (error) {
            // Analyse de l'erreur pour déterminer si c'est un problème de connexion
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('prepared statement')) ||
                ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('Connection')) ||
                ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('connection'))) {
                logger_1.default.error('Database connection error in getAllUsers:', error);
                throw new Error('Service temporairement indisponible. Veuillez réessayer plus tard.');
            }
            // Autres types d'erreurs
            logger_1.default.error('Error fetching all users:', error);
            throw new Error(`Failed to fetch users: ${error.message}`);
        }
    }
}
exports.UserServiceExample = UserServiceExample;
exports.default = new UserServiceExample();
