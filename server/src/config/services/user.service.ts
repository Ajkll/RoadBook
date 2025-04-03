// server/src/services/user.service.ts
import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

// Interface pour les données de création d'utilisateur
interface CreateUserData {
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
  // Valide les données d'entrée
  if (!data.email || !data.password || !data.displayName) {
    throw new Error('Email, mot de passe et nom d\'affichage sont requis');
  }
  
  // Vérifie si l'email est déjà utilisé
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  
  if (existingUser) {
    throw new Error('Un utilisateur avec cet email existe déjà');
  }
  
  // Vérifie si le numéro de registre national est déjà utilisé (s'il est fourni)
  if (data.nationalRegisterNumber) {
    const existingNationalRegister = await prisma.user.findUnique({
      where: { nationalRegisterNumber: data.nationalRegisterNumber }
    });
    
    if (existingNationalRegister) {
      throw new Error('Un utilisateur avec ce numéro de registre national existe déjà');
    }
  }
  
  // Hashe le mot de passe
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);
  
  // Crée l'utilisateur dans la base de données
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
      role: data.role as UserRole || 'APPRENTICE',
      bio: data.bio
    }
  });
  
  // Retourne l'utilisateur sans le hash du mot de passe
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Récupérer un utilisateur par ID
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      ownedRoadbooks: true,
      guidedRoadbooks: true,
      receivedBadges: {
        include: {
          badge: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Ne pas retourner le hash du mot de passe
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Récupérer un utilisateur par email
export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user; // Inclut le passwordHash pour la vérification d'authentification
};

// Mettre à jour un utilisateur
export const updateUser = async (id: string, data: Partial<CreateUserData>) => {
  // Vérifier si l'utilisateur existe
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new Error('Utilisateur non trouvé');
  }

  // Préparer les données à mettre à jour
  const updateData: any = { ...data };
  
  // Hasher le nouveau mot de passe si fourni
  if (data.password) {
    const saltRounds = 10;
    updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
    delete updateData.password; // Ne pas inclure le champ password dans l'update
  }

  // Mettre à jour l'utilisateur
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData
  });

  // Retourner l'utilisateur sans le hash du mot de passe
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
    throw new Error('Utilisateur non trouvé');
  }

  // Supprimer l'utilisateur
  return await prisma.user.delete({
    where: { id }
  });
};