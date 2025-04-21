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

import prisma from '../config/prisma';
import bcrypt from 'bcrypt';

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

// Service de création d'utilisateur
export const createUser = async (data: CreateUserData) => {
  // Vérifier les données requises
  if (!data.email || !data.password || !data.displayName) {
    throw new Error('Email, password and displayName are required');
  }

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Vérifier si le numéro de registre national existe déjà (s'il est fourni)
  if (data.nationalRegisterNumber) {
    const existingNationalRegister = await prisma.user.findUnique({
      where: { nationalRegisterNumber: data.nationalRegisterNumber }
    });

    if (existingNationalRegister) {
      throw new Error('User with this national register number already exists');
    }
  }

  // Hasher le mot de passe
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  // Créer l'utilisateur
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

  // Retourner l'utilisateur sans le mot de passe hashé
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Récupérer un utilisateur par ID
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Retourner l'utilisateur sans le mot de passe hashé
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Récupérer un utilisateur par email
export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user; // Retourne l'utilisateur complet avec passwordHash pour la vérification d'authentification
};

// Mettre à jour un utilisateur
export const updateUser = async (id: string, data: Partial<CreateUserData>) => {
  // Vérifier si l'utilisateur existe
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  // Préparer les données à mettre à jour
  const updateData: any = { ...data };

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

  // Retourner l'utilisateur sans le mot de passe hashé
  const { passwordHash, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

// Supprimer un utilisateur
export const deleteUser = async (id: string) => {
  // Vérifier si l'utilisateur existe
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  // Supprimer l'utilisateur
  await prisma.user.delete({
    where: { id }
  });

  return { success: true };
};

// Récupérer tous les utilisateurs
export const getAllUsers = async (role?: string, limit: number = 20, offset: number = 0) => {
  // Construire la requête avec filtres optionnels
  const where = role ? { role: role as any } : {};

  // Exécuter la requête
  const users = await prisma.user.findMany({
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
  const count = await prisma.user.count({ where });

  return {
    users,
    pagination: {
      total: count,
      limit,
      offset
    }
  };
};