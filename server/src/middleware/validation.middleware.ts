/**
 * VALIDATION MIDDLEWARE
 * 
 * Ce middleware utilise la bibliothèque Zod pour valider les données des requêtes:
 * - validateRegister: Valide les données d'inscription
 * - validateLogin: Valide les données de connexion
 * - validatePasswordReset: Valide les données de réinitialisation
 * - validatePasswordChange: Valide les données de changement de mot de passe
 * - validateSession: Valide les données de session
 * - validateRoadbook: Valide les données de roadbook
 * - validateComment: Valide les commentaires
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

// Validation pour les statuts de compétence
const competencyStatusEnum = ["NOT_STARTED", "IN_PROGRESS", "MASTERED"];

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

// Schéma de validation pour les sessions
const sessionSchema = z.object({
  roadbookId: z.string().uuid("Invalid roadbook ID format"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), "Date must be a valid date"),
  startTime: z.string().refine(val => !isNaN(Date.parse(val)), "Start time must be a valid date"),
  endTime: z.string().refine(val => !isNaN(Date.parse(val)), "End time must be a valid date").optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(1440, "Duration must be less than 24 hours").optional(),
  startLocation: z.string().max(255, "Start location must be less than 255 characters").optional(),
  endLocation: z.string().max(255, "End location must be less than 255 characters").optional(),
  distance: z.number().min(0, "Distance must be a positive number").max(10000, "Distance must be less than 10000 km").optional(),
  weather: z.enum(["CLEAR", "CLOUDY", "RAINY", "SNOWY", "FOGGY", "WINDY", "OTHER"]).optional(),
  daylight: z.enum(["DAY", "NIGHT", "DAWN_DUSK"]).optional(),
  roadTypes: z.array(z.string()).optional(),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
  apprenticeId: z.string().uuid("Invalid apprentice ID format").optional(),
});

// Schéma de validation pour la mise à jour de session
const sessionUpdateSchema = z.object({
  date: z.string().refine(val => !isNaN(Date.parse(val)), "Date must be a valid date").optional(),
  startTime: z.string().refine(val => !isNaN(Date.parse(val)), "Start time must be a valid date").optional(),
  endTime: z.string().refine(val => !isNaN(Date.parse(val)), "End time must be a valid date").optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(1440, "Duration must be less than 24 hours").optional(),
  startLocation: z.string().max(255, "Start location must be less than 255 characters").optional(),
  endLocation: z.string().max(255, "End location must be less than 255 characters").optional(),
  distance: z.number().min(0, "Distance must be a positive number").max(10000, "Distance must be less than 10000 km").optional(),
  weather: z.enum(["CLEAR", "CLOUDY", "RAINY", "SNOWY", "FOGGY", "WINDY", "OTHER"]).optional(),
  daylight: z.enum(["DAY", "NIGHT", "DAWN_DUSK"]).optional(),
  roadTypes: z.array(z.string()).optional(),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
});

// Schéma de validation pour les validations de session
const sessionValidationSchema = z.object({
  notes: z.string().max(1000, "Validation notes must be less than 1000 characters").optional()
});

// Schéma de validation pour les commentaires
const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment must be less than 1000 characters")
});

// Schéma de validation pour le roadbook
const roadbookSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  targetHours: z.number().min(1, "Target hours must be at least 1").max(1000, "Target hours must be less than 1000").optional(),
  guideId: z.string().uuid("Invalid guide ID format").optional()
});

// Schéma de validation pour le statut du roadbook
const roadbookStatusSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"], {
    errorMap: () => ({ message: "Status must be one of: ACTIVE, COMPLETED, ARCHIVED" })
  })
});

// Schéma de validation pour le statut d'une compétence
const competencyStatusSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "MASTERED"], {
    errorMap: () => ({ message: "Status must be one of: NOT_STARTED, IN_PROGRESS, MASTERED" })
  }),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").nullable().optional()
});

// Schéma de validation pour la validation de compétences
const competencyValidationSchema = z.object({
  validations: z.array(
    z.object({
      competencyId: z.string().uuid("Invalid competency ID format"),
      validated: z.boolean(),
      notes: z.string().max(500, "Notes must be less than 500 characters").optional()
    })
  ).min(1, "At least one competency validation is required")
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

/**
 * Middleware pour valider la création d'une session
 */
export const validateCreateSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = sessionSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    logger.warn(`Session validation failed: ${JSON.stringify(error.errors)}`);
    
    return res.status(400).json({
      status: "error",
      message: "Invalid session data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider la mise à jour d'une session
 */
export const validateUpdateSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = sessionUpdateSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    logger.warn(`Session update validation failed: ${JSON.stringify(error.errors)}`);
    
    return res.status(400).json({
      status: "error",
      message: "Invalid session update data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider la validation d'une session
 */
export const validateSessionValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = sessionValidationSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: "Invalid session validation data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider un commentaire
 */
export const validateComment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = commentSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: "Invalid comment data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider la création/mise à jour d'un roadbook
 */
export const validateRoadbook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = roadbookSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    logger.warn(`Roadbook validation failed: ${JSON.stringify(error.errors)}`);
    
    return res.status(400).json({
      status: "error",
      message: "Invalid roadbook data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider le changement de statut d'un roadbook
 */
export const validateRoadbookStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = roadbookStatusSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: "Invalid roadbook status",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider le changement de statut d'une compétence
 */
export const validateCompetencyStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = competencyStatusSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    logger.warn(`Competency status validation failed: ${JSON.stringify(error.errors)}`);
    
    return res.status(400).json({
      status: "error",
      message: "Invalid competency status data",
      errors: error.errors
    });
  }
};

/**
 * Middleware pour valider les validations de compétences
 */
export const validateCompetencyValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = competencyValidationSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées et transformées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    logger.warn(`Competency validation failed: ${JSON.stringify(error.errors)}`);
    
    return res.status(400).json({
      status: "error",
      message: "Invalid competency validation data",
      errors: error.errors
    });
  }
};

// ---- VALIDATION GÉNÉRIQUE ----

/**
 * Fonction générique de validation pour les requêtes
 * Utilise un schéma Zod pour valider les données
 */
export const validateRequest = 
  (schema: z.AnyZodObject) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({ message: 'Internal server error during validation' });
    }
  };

// ---- VALIDATION DES BADGES ----

// Schéma de validation pour créer ou mettre à jour un badge
export const badgeSchema = z.object({
  name: z.string().min(3, 'Badge name must be at least 3 characters long'),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  imageUrl: z.string().url('Image URL must be a valid URL'),
  category: z.string().min(1, 'Category is required'),
  criteria: z.string().min(1, 'Criteria is required'),
});

// Schéma de validation pour attribuer un badge
export const awardBadgeSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  badgeId: z.string().uuid('Invalid badge ID format'),
});

// ---- VALIDATION DES PHOTOS DE PROFIL ----

// Schéma de validation pour les photos de profil
export const profilePictureSchema = z.object({
  profilePicture: z.string().url('Profile picture must be a valid URL'),
  profilePictureType: z.enum(['url', 'base64'], {
    errorMap: () => ({ message: "Picture type must be one of: url, base64" })
  })
});

// Middleware pour valider le téléchargement d'une photo de profil
export const validateProfilePicture = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = profilePictureSchema.parse(req.body);
    
    // Remplacer les données originales par les données validées
    req.body = validatedData;
    
    next();
  } catch (error: any) {
    logger.warn(`Profile picture validation failed: ${JSON.stringify(error.errors)}`);
    
    return res.status(400).json({
      status: "error",
      message: "Invalid profile picture data",
      errors: error.errors
    });
  }
};