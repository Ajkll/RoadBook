/**
 * VALIDATION MIDDLEWARE
 * 
 * Ce middleware utilise la bibliothèque Zod pour valider les données des requêtes:
 * - validateRegister: Valide les données d'inscription
 * - validateLogin: Valide les données de connexion
 * 
 * La validation permet de s'assurer que les données reçues sont complètes et correctement
 * formatées avant d'être traitées, améliorant ainsi la sécurité et la fiabilité du système.
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Schéma de validation pour l'enregistrement (register)
const registerSchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["APPRENTICE", "GUIDE", "INSTRUCTOR", "ADMIN"]).optional(),
  nationalRegisterNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

// Schéma de validation pour le login
const loginSchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z.string().min(1, "Password is required"),
});

// Middleware pour valider l'enregistrement
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: "Invalid registration data",
      errors: error.errors
    });
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
    return res.status(400).json({
      status: "error",
      message: "Invalid login data",
      errors: error.errors
    });
  }
};