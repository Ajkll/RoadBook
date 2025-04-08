"use strict";
/**
 * USER SERVICE
 *
 * Ce service gère toutes les opérations liées aux utilisateurs:
 * - Création de compte (inscription)
 * - Récupération des données utilisateur (par ID, email, liste)
 * - Mise à jour des profils utilisateur
 * - Suppression de compte
 *
 * Les mots de passe sont hashés avec bcrypt avant d'être stockés en base de données.
 * Les données sensibles (comme les mots de passe hashés) sont filtrées avant d'être
 * renvoyées au client.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.deleteUser = exports.updateUser = exports.getUserByEmail = exports.getUserById = exports.createUser = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// Service de création d'utilisateur
const createUser = async (data) => {
    // Vérifier les données requises
    if (!data.email || !data.password || !data.displayName) {
        throw new Error('Email, password and displayName are required');
    }
    // Vérifier si l'email existe déjà
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }
    // Vérifier si le numéro de registre national existe déjà (s'il est fourni)
    if (data.nationalRegisterNumber) {
        const existingNationalRegister = await prisma_1.default.user.findUnique({
            where: { nationalRegisterNumber: data.nationalRegisterNumber }
        });
        if (existingNationalRegister) {
            throw new Error('User with this national register number already exists');
        }
    }
    // Hasher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt_1.default.hash(data.password, saltRounds);
    // Créer l'utilisateur
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
            address: data.address,
            role: data.role || 'APPRENTICE',
            bio: data.bio
        }
    });
    // Retourner l'utilisateur sans le mot de passe hashé
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.createUser = createUser;
// Récupérer un utilisateur par ID
const getUserById = async (id) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id }
    });
    if (!user) {
        throw new Error('User not found');
    }
    // Retourner l'utilisateur sans le mot de passe hashé
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.getUserById = getUserById;
// Récupérer un utilisateur par email
const getUserByEmail = async (email) => {
    const user = await prisma_1.default.user.findUnique({
        where: { email }
    });
    if (!user) {
        throw new Error('User not found');
    }
    return user; // Retourne l'utilisateur complet avec passwordHash pour la vérification d'authentification
};
exports.getUserByEmail = getUserByEmail;
// Mettre à jour un utilisateur
const updateUser = async (id, data) => {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma_1.default.user.findUnique({
        where: { id }
    });
    if (!existingUser) {
        throw new Error('User not found');
    }
    // Préparer les données à mettre à jour
    const updateData = { ...data };
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
    // Retourner l'utilisateur sans le mot de passe hashé
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};
exports.updateUser = updateUser;
// Supprimer un utilisateur
const deleteUser = async (id) => {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma_1.default.user.findUnique({
        where: { id }
    });
    if (!existingUser) {
        throw new Error('User not found');
    }
    // Supprimer l'utilisateur
    await prisma_1.default.user.delete({
        where: { id }
    });
    return { success: true };
};
exports.deleteUser = deleteUser;
// Récupérer tous les utilisateurs
const getAllUsers = async (role, limit = 20, offset = 0) => {
    // Construire la requête avec filtres optionnels
    const where = role ? { role: role } : {};
    // Exécuter la requête
    const users = await prisma_1.default.user.findMany({
        where,
        take: limit,
        skip: offset,
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
            updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
    });
    // Compter le nombre total
    const count = await prisma_1.default.user.count({ where });
    return {
        users,
        pagination: {
            total: count,
            limit,
            offset
        }
    };
};
exports.getAllUsers = getAllUsers;
