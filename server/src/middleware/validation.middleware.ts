/**
 * VALIDATION MIDDLEWARE
 * 
 * Ce middleware utilise la bibliothèque Zod pour valider les données des requêtes:
 * - validateRegister: Valide les données d'inscription
 * - validateLogin: Valide les données de connexion
 * - validatePasswordReset: Valide les données de réinitialisation
 * - validatePasswordChange: Valide les données de changement de mot de passe
 * 
 * La validation permet de s'assurer que les données reçues sont complètes, correctement
 * formatées, et sécurisées avant d'être traitées, améliorant ainsi la qualité et
 * la fiabilité du système.
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import logger from "../utils/logger";

// ---- VALIDATIONS COMMUNES ----

// Validation de mot de passe réutilisable
const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

// Validation pour les identifiants belges (numéro national)
const belgianNationalIdValidator = z
  .string()
  .regex(/^\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}$/, "National register number must be in format XX.XX.XX-XXX.XX")
  .optional();

// Validation d'email avec transformation
const emailValidator = z
  .string()
  .email("Email is invalid")
  .transform(val => val.toLowerCase().trim());

// ---- SCHEMAS DE VALIDATION ----

// Schéma de validation pour l'enregistrement (register)
const registerSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name cannot exceed 50 characters")
    .trim(),
  firstName: z.string().min(1, "First name is required").max(50).trim().optional(),
  lastName: z.string().min(1, "Last name is required").max(50).trim().optional(),
  role: z.enum(["APPRENTICE", "GUIDE", "INSTRUCTOR", "ADMIN"]).optional(),
  nationalRegisterNumber: belgianNationalIdValidator,
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Phone number must be valid")
    .optional(),
  birthDate: z.string().refine(
    val => !val || !isNaN(Date.parse(val)),
    "Birth date must be a valid date"
  ).optional().nullable(),
  address: z.string().max(200).optional(),
  bio: z.string().max(500).optional(),
});

// Schéma de validation pour le login
const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, "Password is required"),
});

// Schéma de validation pour la demande de réinitialisation
const forgotPasswordSchema = z.object({
  email: emailValidator,
});

// Schéma de validation pour la réinitialisation du mot de passe
const resetPasswordSchema = z.object({
  token: z.string().min(10, "Token is required"),
  newPassword: passwordValidator,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Schéma de validation pour le changement de mot de passe
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordValidator,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"]
});

// ---- MIDDLEWARES DE VALIDATION ----

/**
 * Middleware pour valider l'enregistrement d'un utilisateur
 */
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    logger.warn(`Registration validation failed: ${JSON.stringify(error.errors)}`);
    
    return res.status(400).json({
      status: "error",
      message: "Invalid registration data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider les identifiants de connexion
 */
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    logger.warn(`Login validation failed: ${JSON.stringify(error.errors)}`);
    
    return res.status(400).json({
      status: "error",
      message: "Invalid login data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider une demande de réinitialisation de mot de passe
 */
export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: "Invalid email format",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider une réinitialisation de mot de passe
 */
export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: "Invalid password reset data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider un changement de mot de passe
 */
export const validateChangePassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: "Invalid password change data",
      errors: error.errors
    });
  }
};