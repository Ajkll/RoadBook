import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getUserByEmail } from "./user.service";
import prisma from "../config/prisma";

// Interface pour le payload JWT
interface JwtPayload {
  userId: string;
  role: string;
}

// Interface pour le résultat de login
interface LoginResult {
  user: any;
  accessToken: string;
  refreshToken: string;
}

// Durée de validité des tokens
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// Fonction de login
// At the beginning of your auth.service.ts or similar
export const login = async (email: string, password: string) => {
  console.log(`Attempting login for email: ${email}`);
  
  // Find the user
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(`Login failed: User with email ${email} not found`);
    throw new Error("Invalid credentials");
  }
  
  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isPasswordValid) {
    console.log(`Login failed: Invalid password for user ${email}`);
    throw new Error("Invalid credentials");
  }
  
  console.log(`Login successful for user ${email}`);
  // Rest of function...
}

// Fonction pour rafraîchir le token
export const refreshToken = async (token: string) => {
  try {
    // Vérifier le refresh token
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || "refresh-secret"
    ) as JwtPayload;

    // Vérifier si le token est dans la base de données
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token,
        userId: decoded.userId,
        revoked: false,
      },
    });

    if (!storedToken) {
      throw new Error("Token invalide ou révoqué");
    }

    // Générer un nouveau access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return { accessToken };
  } catch (error) {
    throw new Error("Token invalide ou expiré");
  }
};

// Fonction pour générer les tokens
const generateTokens = (user: any) => {
  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || "refresh-secret",
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// Fonction pour stocker le refresh token
const storeRefreshToken = async (userId: string, token: string) => {
  // D'abord, invalider tous les tokens existants (facultatif)
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true },
  });

  // Créer un nouveau token
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    },
  });
};
