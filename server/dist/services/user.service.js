"use strict";
/**
 * USER SERVICE
 *
 * Ce service gère toutes les opérations liées aux utilisateurs:
 * - Création de compte (inscription)
 * - Récupération des données utilisateur (par ID, email, liste)
 * - Mise à jour des profils utilisateur
 * - Changement de mot de passe
 * - Suppression de compte
 * - Gestion des rôles et permissions
 *
 * Les mots de passe sont hashés avec bcrypt avant d'être stockés en base de données.
 * Les données sensibles (comme les mots de passe hashés) sont filtrées avant d'être
 * renvoyées au client.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfilePicture = exports.updateProfilePicture = exports.getAllUsers = exports.deleteUser = exports.changePassword = exports.updateUser = exports.getUserByEmail = exports.getUserById = exports.createUser = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const authService = __importStar(require("./auth.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Créer un nouvel utilisateur
 *
 * @param data - Données de l'utilisateur
 * @returns Utilisateur créé (sans le mot de passe hashé)
 */
const createUser = async (data) => {
    logger_1.default.info(`Creating new user with email: ${data.email}`);
    // Vérifier les données requises
    if (!data.email || !data.password || !data.displayName) {
        throw new Error('Email, password and displayName are required');
    }
    // Normaliser l'email (minuscules, sans espaces)
    data.email = data.email.toLowerCase().trim();
    // Vérifier si l'email existe déjà
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) {
        logger_1.default.warn(`Attempted to create user with existing email: ${data.email}`);
        throw new Error('User with this email already exists');
    }
    // Vérifier si le numéro de registre national existe déjà (s'il est fourni)
    if (data.nationalRegisterNumber) {
        const existingNationalRegister = await prisma_1.default.user.findUnique({
            where: { nationalRegisterNumber: data.nationalRegisterNumber }
        });
        if (existingNationalRegister) {
            logger_1.default.warn(`Attempted to create user with existing national register number`);
            throw new Error('User with this national register number already exists');
        }
    }
    // Hasher le mot de passe avec bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt_1.default.hash(data.password, saltRounds);
    try {
        // Créer l'utilisateur dans la base de données
        const user = await prisma_1.default.user.create({
            data: {
                email: data.email,
                passwordHash,
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                nationalRegisterNumber: data.nationalRegisterNumber,
                birthDate: data.birthDate,
                phoneNumber: data.phoneNumber,
                profilePicture: data.profilePicture,
                profilePictureType: data.profilePictureType,
                profilePictureLastUpdated: data.profilePicture ? new Date() : undefined,
                address: data.address,
                role: data.role || 'APPRENTICE',
                bio: data.bio
            }
        });
        // Journaliser la création réussie
        logger_1.default.info(`User created successfully: ${user.id}`);
        // Retourner l'utilisateur sans le mot de passe hashé
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    catch (error) {
        logger_1.default.error(`Error creating user: ${error}`);
        throw error;
    }
};
exports.createUser = createUser;
/**
 * Récupérer un utilisateur par son ID
 *
 * @param id - ID de l'utilisateur
 * @param includeRelations - Inclure les relations (roadbooks, badges, etc.)
 * @returns Utilisateur (sans le mot de passe hashé)
 */
const getUserById = async (id, includeRelations = false) => {
    try {
        // Construire la requête avec ou sans relations
        const query = {
            where: { id }
        };
        // Inclure les relations si demandé
        if (includeRelations) {
            query.include = {
                ownedRoadbooks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true,
                        targetHours: true
                    }
                },
                guidedRoadbooks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        apprentice: {
                            select: {
                                id: true,
                                displayName: true,
                                profilePicture: true
                            }
                        }
                    }
                },
                receivedBadges: {
                    include: {
                        badge: true
                    }
                }
            };
        }
        // Exécuter la requête
        const user = await prisma_1.default.user.findUnique(query);
        if (!user) {
            throw new Error('User not found');
        }
        // Retourner l'utilisateur sans le mot de passe hashé
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    catch (error) {
        logger_1.default.error(`Error retrieving user by ID ${id}: ${error}`);
        throw error;
    }
};
exports.getUserById = getUserById;
/**
 * Récupérer un utilisateur par email
 *
 * @param email - Email de l'utilisateur
 * @param includePassword - Inclure le mot de passe hashé (pour l'authentification)
 * @returns Utilisateur avec ou sans mot de passe hashé
 */
const getUserByEmail = async (email, includePassword = true) => {
    try {
        // Normaliser l'email
        email = email.toLowerCase().trim();
        const user = await prisma_1.default.user.findUnique({
            where: { email }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Retourner l'utilisateur complet ou filtré selon le paramètre
        if (includePassword) {
            return user; // Avec passwordHash pour l'authentification
        }
        else {
            const { passwordHash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
    }
    catch (error) {
        logger_1.default.error(`Error retrieving user by email ${email}: ${error}`);
        throw error;
    }
};
exports.getUserByEmail = getUserByEmail;
/**
 * Mettre à jour un utilisateur
 *
 * @param id - ID de l'utilisateur
 * @param data - Nouvelles données
 * @param currentUserId - ID de l'utilisateur qui fait la demande (pour vérifier les permissions)
 * @returns Utilisateur mis à jour (sans le mot de passe hashé)
 */
const updateUser = async (id, data, currentUserId) => {
    try {
        // Vérifier si l'utilisateur existe
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Vérifier les permissions si un utilisateur courant est spécifié
        if (currentUserId && currentUserId !== id) {
            const currentUser = await prisma_1.default.user.findUnique({
                where: { id: currentUserId },
                select: { role: true }
            });
            // Seul un admin peut modifier d'autres utilisateurs
            if (!currentUser || currentUser.role !== 'ADMIN') {
                throw new Error('Unauthorized to update this user');
            }
        }
        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (data.email && data.email !== existingUser.email) {
            const emailExists = await prisma_1.default.user.findUnique({
                where: { email: data.email.toLowerCase().trim() }
            });
            if (emailExists) {
                throw new Error('Email is already in use');
            }
        }
        // Vérifier si le numéro national est déjà utilisé
        if (data.nationalRegisterNumber &&
            data.nationalRegisterNumber !== existingUser.nationalRegisterNumber) {
            const numberExists = await prisma_1.default.user.findUnique({
                where: { nationalRegisterNumber: data.nationalRegisterNumber }
            });
            if (numberExists) {
                throw new Error('National register number is already in use');
            }
        }
        // Préparer les données à mettre à jour
        const updateData = { ...data };
        // Normaliser l'email s'il est fourni
        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase().trim();
        }
        // Si une photo de profil est fournie, mettre à jour la date de modification
        if (updateData.profilePicture !== undefined) {
            updateData.profilePictureLastUpdated = new Date();
        }
        // Si un nouveau mot de passe est fourni, le hasher
        if (data.password) {
            const saltRounds = 10;
            updateData.passwordHash = await bcrypt_1.default.hash(data.password, saltRounds);
            delete updateData.password;
        }
        // Mettre à jour l'utilisateur
        const updatedUser = await prisma_1.default.user.update({
            where: { id },
            data: updateData
        });
        logger_1.default.info(`User ${id} updated successfully`);
        // Retourner l'utilisateur sans le mot de passe hashé
        const { passwordHash, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    catch (error) {
        logger_1.default.error(`Error updating user ${id}: ${error}`);
        throw error;
    }
};
exports.updateUser = updateUser;
/**
 * Changer le mot de passe d'un utilisateur
 *
 * @param id - ID de l'utilisateur
 * @param passwordData - Ancien et nouveau mot de passe
 * @returns Succès de l'opération
 */
const changePassword = async (id, passwordData) => {
    try {
        const { currentPassword, newPassword } = passwordData;
        // Vérifier si les mots de passe sont fournis
        if (!currentPassword || !newPassword) {
            throw new Error('Current password and new password are required');
        }
        // Récupérer l'utilisateur avec son mot de passe hashé
        const user = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Vérifier que l'ancien mot de passe est correct
        const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        // Vérifier que le nouveau mot de passe est différent de l'ancien
        if (currentPassword === newPassword) {
            throw new Error('New password must be different from current password');
        }
        // Hasher le nouveau mot de passe
        const saltRounds = 10;
        const newPasswordHash = await bcrypt_1.default.hash(newPassword, saltRounds);
        // Mettre à jour le mot de passe dans la base de données
        await prisma_1.default.user.update({
            where: { id },
            data: { passwordHash: newPasswordHash }
        });
        // Révoquer tous les tokens de rafraîchissement pour forcer une reconnexion
        await authService.revokeRefreshTokens({ userId: id });
        logger_1.default.info(`Password changed successfully for user ${id}`);
        return { success: true };
    }
    catch (error) {
        logger_1.default.error(`Error changing password for user ${id}: ${error}`);
        throw error;
    }
};
exports.changePassword = changePassword;
/**
 * Supprimer un utilisateur
 *
 * @param id - ID de l'utilisateur à supprimer
 * @param currentUserId - ID de l'utilisateur qui fait la demande
 * @returns Succès de l'opération
 */
const deleteUser = async (id, currentUserId) => {
    try {
        // Vérifier si l'utilisateur existe
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Vérifier les permissions si un utilisateur courant est spécifié
        if (currentUserId && currentUserId !== id) {
            const currentUser = await prisma_1.default.user.findUnique({
                where: { id: currentUserId },
                select: { role: true }
            });
            // Seul un admin peut supprimer d'autres utilisateurs
            if (!currentUser || currentUser.role !== 'ADMIN') {
                throw new Error('Unauthorized to delete this user');
            }
        }
        // Supprimer d'abord les tokens de rafraîchissement
        await prisma_1.default.refreshToken.deleteMany({
            where: { userId: id }
        });
        // Supprimer l'utilisateur
        await prisma_1.default.user.delete({
            where: { id }
        });
        logger_1.default.info(`User ${id} deleted successfully`);
        return { success: true };
    }
    catch (error) {
        logger_1.default.error(`Error deleting user ${id}: ${error}`);
        throw error;
    }
};
exports.deleteUser = deleteUser;
/**
 * Récupérer tous les utilisateurs avec filtrage, pagination et tri
 *
 * @param options - Options de recherche et pagination
 * @returns Liste paginée d'utilisateurs et métadonnées
 */
const getAllUsers = async (options) => {
    try {
        const { role, search, limit = 20, offset = 0, orderBy = 'createdAt', orderDirection = 'desc', includeInactive = false } = options;
        // Construire la clause WHERE pour la recherche et le filtrage
        const where = {};
        // Filtrer par rôle si spécifié
        if (role) {
            where.role = role;
        }
        // Recherche textuelle sur plusieurs champs si spécifiée
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Vérifier si le champ de tri existe
        const allowedOrderByFields = [
            'createdAt', 'updatedAt', 'email', 'displayName', 'role'
        ];
        const finalOrderBy = allowedOrderByFields.includes(orderBy)
            ? orderBy
            : 'createdAt';
        // Exécuter la requête avec les paramètres de pagination
        const users = await prisma_1.default.user.findMany({
            where,
            take: Number(limit),
            skip: Number(offset),
            select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
                nationalRegisterNumber: true,
                birthDate: true,
                phoneNumber: true,
                profilePicture: true,
                address: true,
                role: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
                // Relations basiques
                _count: {
                    select: {
                        ownedRoadbooks: true,
                        guidedRoadbooks: true,
                        receivedBadges: true
                    }
                }
            },
            orderBy: { [finalOrderBy]: orderDirection }
        });
        // Compter le nombre total pour la pagination
        const total = await prisma_1.default.user.count({ where });
        logger_1.default.info(`Retrieved ${users.length} users (total: ${total})`);
        return {
            users,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
                pages: Math.ceil(total / Number(limit)),
                currentPage: Math.floor(Number(offset) / Number(limit)) + 1
            }
        };
    }
    catch (error) {
        logger_1.default.error(`Error retrieving users: ${error}`);
        throw error;
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Update user's profile picture
 *
 * @param userId - ID of the user
 * @param pictureData - Profile picture data (URL or base64)
 * @returns Updated user without password
 */
const updateProfilePicture = async (userId, pictureData) => {
    try {
        logger_1.default.info(`Updating profile picture for user ${userId}`);
        // Verify user exists
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Update profile picture
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                profilePicture: pictureData.profilePicture,
                profilePictureType: pictureData.profilePictureType,
                profilePictureLastUpdated: new Date()
            }
        });
        logger_1.default.info(`Profile picture updated for user ${userId}`);
        // Return user without password
        const { passwordHash, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    catch (error) {
        logger_1.default.error(`Error updating profile picture for user ${userId}: ${error}`);
        throw error;
    }
};
exports.updateProfilePicture = updateProfilePicture;
/**
 * Delete user's profile picture
 *
 * @param userId - ID of the user
 * @returns Updated user without password
 */
const deleteProfilePicture = async (userId) => {
    try {
        logger_1.default.info(`Deleting profile picture for user ${userId}`);
        // Verify user exists
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Remove profile picture
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                profilePicture: null,
                profilePictureType: null,
                profilePictureLastUpdated: new Date()
            }
        });
        logger_1.default.info(`Profile picture deleted for user ${userId}`);
        // Return user without password
        const { passwordHash, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    catch (error) {
        logger_1.default.error(`Error deleting profile picture for user ${userId}: ${error}`);
        throw error;
    }
};
exports.deleteProfilePicture = deleteProfilePicture;
