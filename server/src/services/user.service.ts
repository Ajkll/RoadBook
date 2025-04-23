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

import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import * as authService from './auth.service';
import logger from '../utils/logger';

// Interface pour les données d'utilisateur
export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  nationalRegisterNumber?: string;
  birthDate?: Date;
  phoneNumber?: string;
  profilePicture?: string;
  address?: string;
  role?: string;
  bio?: string;
}

// Interface pour le changement de mot de passe
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Créer un nouvel utilisateur
 * 
 * @param data - Données de l'utilisateur
 * @returns Utilisateur créé (sans le mot de passe hashé)
 */
export const createUser = async (data: CreateUserData) => {
  logger.info(`Creating new user with email: ${data.email}`);
  
  // Vérifier les données requises
  if (!data.email || !data.password || !data.displayName) {
    throw new Error('Email, password and displayName are required');
  }

  // Normaliser l'email (minuscules, sans espaces)
  data.email = data.email.toLowerCase().trim();

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    logger.warn(`Attempted to create user with existing email: ${data.email}`);
    throw new Error('User with this email already exists');
  }

  // Vérifier si le numéro de registre national existe déjà (s'il est fourni)
  if (data.nationalRegisterNumber) {
    const existingNationalRegister = await prisma.user.findUnique({
      where: { nationalRegisterNumber: data.nationalRegisterNumber }
    });

    if (existingNationalRegister) {
      logger.warn(`Attempted to create user with existing national register number`);
      throw new Error('User with this national register number already exists');
    }
  }

  // Hasher le mot de passe avec bcrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  try {
    // Créer l'utilisateur dans la base de données
    const user = await prisma.user.create({
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
        role: data.role as any || 'APPRENTICE',
        bio: data.bio
      }
    });

    // Journaliser la création réussie
    logger.info(`User created successfully: ${user.id}`);

    // Retourner l'utilisateur sans le mot de passe hashé
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    logger.error(`Error creating user: ${error}`);
    throw error;
  }
};

/**
 * Récupérer un utilisateur par son ID
 * 
 * @param id - ID de l'utilisateur
 * @param includeRelations - Inclure les relations (roadbooks, badges, etc.)
 * @returns Utilisateur (sans le mot de passe hashé)
 */
export const getUserById = async (id: string, includeRelations = false) => {
  try {
    // Construire la requête avec ou sans relations
    const query: any = {
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
    const user = await prisma.user.findUnique(query);

    if (!user) {
      throw new Error('User not found');
    }

    // Retourner l'utilisateur sans le mot de passe hashé
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    logger.error(`Error retrieving user by ID ${id}: ${error}`);
    throw error;
  }
};

/**
 * Récupérer un utilisateur par email
 * 
 * @param email - Email de l'utilisateur
 * @param includePassword - Inclure le mot de passe hashé (pour l'authentification)
 * @returns Utilisateur avec ou sans mot de passe hashé
 */
export const getUserByEmail = async (email: string, includePassword = true) => {
  try {
    // Normaliser l'email
    email = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Retourner l'utilisateur complet ou filtré selon le paramètre
    if (includePassword) {
      return user; // Avec passwordHash pour l'authentification
    } else {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
  } catch (error) {
    logger.error(`Error retrieving user by email ${email}: ${error}`);
    throw error;
  }
};

/**
 * Mettre à jour un utilisateur
 * 
 * @param id - ID de l'utilisateur
 * @param data - Nouvelles données
 * @param currentUserId - ID de l'utilisateur qui fait la demande (pour vérifier les permissions)
 * @returns Utilisateur mis à jour (sans le mot de passe hashé)
 */
export const updateUser = async (id: string, data: Partial<CreateUserData>, currentUserId?: string) => {
  try {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Vérifier les permissions si un utilisateur courant est spécifié
    if (currentUserId && currentUserId !== id) {
      const currentUser = await prisma.user.findUnique({
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
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() }
      });

      if (emailExists) {
        throw new Error('Email is already in use');
      }
    }

    // Vérifier si le numéro national est déjà utilisé
    if (data.nationalRegisterNumber && 
        data.nationalRegisterNumber !== existingUser.nationalRegisterNumber) {
      const numberExists = await prisma.user.findUnique({
        where: { nationalRegisterNumber: data.nationalRegisterNumber }
      });

      if (numberExists) {
        throw new Error('National register number is already in use');
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = { ...data };

    // Normaliser l'email s'il est fourni
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }

    // Si un nouveau mot de passe est fourni, le hasher
    if (data.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
      delete updateData.password;
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    logger.info(`User ${id} updated successfully`);

    // Retourner l'utilisateur sans le mot de passe hashé
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    logger.error(`Error updating user ${id}: ${error}`);
    throw error;
  }
};

/**
 * Changer le mot de passe d'un utilisateur
 * 
 * @param id - ID de l'utilisateur
 * @param passwordData - Ancien et nouveau mot de passe
 * @returns Succès de l'opération
 */
export const changePassword = async (id: string, passwordData: ChangePasswordData) => {
  try {
    const { currentPassword, newPassword } = passwordData;

    // Vérifier si les mots de passe sont fournis
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    // Récupérer l'utilisateur avec son mot de passe hashé
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Vérifier que l'ancien mot de passe est correct
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe dans la base de données
    await prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash }
    });

    // Révoquer tous les tokens de rafraîchissement pour forcer une reconnexion
    await authService.revokeRefreshTokens({ userId: id });

    logger.info(`Password changed successfully for user ${id}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error changing password for user ${id}: ${error}`);
    throw error;
  }
};

/**
 * Supprimer un utilisateur
 * 
 * @param id - ID de l'utilisateur à supprimer
 * @param currentUserId - ID de l'utilisateur qui fait la demande
 * @returns Succès de l'opération
 */
export const deleteUser = async (id: string, currentUserId?: string) => {
  try {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Vérifier les permissions si un utilisateur courant est spécifié
    if (currentUserId && currentUserId !== id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true }
      });

      // Seul un admin peut supprimer d'autres utilisateurs
      if (!currentUser || currentUser.role !== 'ADMIN') {
        throw new Error('Unauthorized to delete this user');
      }
    }

    // Supprimer d'abord les tokens de rafraîchissement
    await prisma.refreshToken.deleteMany({
      where: { userId: id }
    });

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id }
    });

    logger.info(`User ${id} deleted successfully`);
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting user ${id}: ${error}`);
    throw error;
  }
};

/**
 * Récupérer tous les utilisateurs avec filtrage, pagination et tri
 * 
 * @param options - Options de recherche et pagination
 * @returns Liste paginée d'utilisateurs et métadonnées
 */
export const getAllUsers = async (options: {
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  includeInactive?: boolean;
}) => {
  try {
    const {
      role,
      search,
      limit = 20,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'desc',
      includeInactive = false
    } = options;

    // Construire la clause WHERE pour la recherche et le filtrage
    const where: any = {};

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
    const users = await prisma.user.findMany({
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
    const total = await prisma.user.count({ where });

    logger.info(`Retrieved ${users.length} users (total: ${total})`);
    
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
  } catch (error) {
    logger.error(`Error retrieving users: ${error}`);
    throw error;
  }
};