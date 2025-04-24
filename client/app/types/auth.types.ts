// client/app/types/auth.types.ts

// Énumérations (correspondant à Prisma)
export enum UserRole {
  APPRENTICE = 'APPRENTICE',
  GUIDE = 'GUIDE',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

// Interface utilisateur (correspondant au modèle User de Prisma)
export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  nationalRegisterNumber?: string;
  birthDate?: string; // Pour API, on utilisera des strings pour les dates
  phoneNumber?: string;
  profilePicture?: string;
  address?: string;
  role: UserRole;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

// Requêtes et Réponses API

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  nationalRegisterNumber?: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: string;
  role?: UserRole; // Généralement APPRENTICE par défaut
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  // Nous ajouterons ici refreshToken pour contourner le problème des cookies
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
}
