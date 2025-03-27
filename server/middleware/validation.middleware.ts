import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Schéma de validation pour la création d'utilisateur
const userCreationSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  displayName: z
    .string()
    .min(2, "Le nom d'affichage doit contenir au moins 2 caractères"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["APPRENTICE", "GUIDE", "INSTRUCTOR", "ADMIN"]).optional(),
  nationalRegisterNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
});

// Schéma de validation pour le login
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// Middleware pour valider la création d'utilisateur
export const validateUserCreation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    userCreationSchema.parse(req.body);
    next();
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: "Données invalides", errors: error.errors });
  }
};

// Middleware pour valider le login
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: "Données invalides", errors: error.errors });
  }
};
