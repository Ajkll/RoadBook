"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProfilePicture = exports.profilePictureSchema = exports.awardBadgeSchema = exports.badgeSchema = exports.validateRequest = exports.validateCompetencyValidation = exports.validateCompetencyStatus = exports.validateRoadbookStatus = exports.validateRoadbook = exports.validateComment = exports.validateSessionValidation = exports.validateUpdateSession = exports.validateCreateSession = exports.validateChangePassword = exports.validateResetPassword = exports.validateForgotPassword = exports.validateLogin = exports.validateRegister = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
// ---- VALIDATIONS COMMUNES ----
// Validation de mot de passe réutilisable
const passwordValidator = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");
// Validation pour les identifiants belges (numéro national)
const belgianNationalIdValidator = zod_1.z
    .string()
    .regex(/^\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}$/, "National register number must be in format XX.XX.XX-XXX.XX")
    .optional();
// Validation d'email avec transformation
const emailValidator = zod_1.z
    .string()
    .email("Email is invalid")
    .transform(val => val.toLowerCase().trim());
// ---- SCHEMAS DE VALIDATION ----
// Validation pour les statuts de compétence
const competencyStatusEnum = ["NOT_STARTED", "IN_PROGRESS", "MASTERED"];
// Schéma de validation pour l'enregistrement (register)
const registerSchema = zod_1.z.object({
    email: emailValidator,
    password: passwordValidator,
    displayName: zod_1.z
        .string()
        .min(2, "Display name must be at least 2 characters")
        .max(50, "Display name cannot exceed 50 characters")
        .trim(),
    firstName: zod_1.z.string().min(1, "First name is required").max(50).trim().optional(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50).trim().optional(),
    role: zod_1.z.enum(["APPRENTICE", "GUIDE", "INSTRUCTOR", "ADMIN"]).optional(),
    nationalRegisterNumber: belgianNationalIdValidator,
    phoneNumber: zod_1.z
        .string()
        .regex(/^\+?[0-9]{10,15}$/, "Phone number must be valid")
        .optional(),
    birthDate: zod_1.z.string().refine(val => !val || !isNaN(Date.parse(val)), "Birth date must be a valid date").optional().nullable(),
    address: zod_1.z.string().max(200).optional(),
    bio: zod_1.z.string().max(500).optional(),
});
// Schéma de validation pour le login
const loginSchema = zod_1.z.object({
    email: emailValidator,
    password: zod_1.z.string().min(1, "Password is required"),
});
// Schéma de validation pour la demande de réinitialisation
const forgotPasswordSchema = zod_1.z.object({
    email: emailValidator,
});
// Schéma de validation pour la réinitialisation du mot de passe
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(10, "Token is required"),
    newPassword: passwordValidator,
    confirmPassword: zod_1.z.string().min(1, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});
// Schéma de validation pour le changement de mot de passe
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: passwordValidator,
    confirmPassword: zod_1.z.string().min(1, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
}).refine(data => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"]
});
// Schéma de validation pour les sessions
const sessionSchema = zod_1.z.object({
    roadbookId: zod_1.z.string().uuid("Invalid roadbook ID format"),
    date: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), "Date must be a valid date"),
    startTime: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), "Start time must be a valid date"),
    endTime: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), "End time must be a valid date").optional(),
    duration: zod_1.z.number().min(1, "Duration must be at least 1 minute").max(1440, "Duration must be less than 24 hours").optional(),
    startLocation: zod_1.z.string().max(255, "Start location must be less than 255 characters").optional(),
    endLocation: zod_1.z.string().max(255, "End location must be less than 255 characters").optional(),
    distance: zod_1.z.number().min(0, "Distance must be a positive number").max(10000, "Distance must be less than 10000 km").optional(),
    weather: zod_1.z.enum(["CLEAR", "CLOUDY", "RAINY", "SNOWY", "FOGGY", "WINDY", "OTHER"]).optional(),
    daylight: zod_1.z.enum(["DAY", "NIGHT", "DAWN_DUSK"]).optional(),
    roadTypes: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().max(2000, "Notes must be less than 2000 characters").optional(),
    apprenticeId: zod_1.z.string().uuid("Invalid apprentice ID format").optional(),
});
// Schéma de validation pour la mise à jour de session
const sessionUpdateSchema = zod_1.z.object({
    date: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), "Date must be a valid date").optional(),
    startTime: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), "Start time must be a valid date").optional(),
    endTime: zod_1.z.string().refine(val => !isNaN(Date.parse(val)), "End time must be a valid date").optional(),
    duration: zod_1.z.number().min(1, "Duration must be at least 1 minute").max(1440, "Duration must be less than 24 hours").optional(),
    startLocation: zod_1.z.string().max(255, "Start location must be less than 255 characters").optional(),
    endLocation: zod_1.z.string().max(255, "End location must be less than 255 characters").optional(),
    distance: zod_1.z.number().min(0, "Distance must be a positive number").max(10000, "Distance must be less than 10000 km").optional(),
    weather: zod_1.z.enum(["CLEAR", "CLOUDY", "RAINY", "SNOWY", "FOGGY", "WINDY", "OTHER"]).optional(),
    daylight: zod_1.z.enum(["DAY", "NIGHT", "DAWN_DUSK"]).optional(),
    roadTypes: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().max(2000, "Notes must be less than 2000 characters").optional(),
});
// Schéma de validation pour les validations de session
const sessionValidationSchema = zod_1.z.object({
    notes: zod_1.z.string().max(1000, "Validation notes must be less than 1000 characters").optional()
});
// Schéma de validation pour les commentaires
const commentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Comment cannot be empty").max(1000, "Comment must be less than 1000 characters")
});
// Schéma de validation pour le roadbook
const roadbookSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
    description: zod_1.z.string().max(1000, "Description must be less than 1000 characters").optional(),
    targetHours: zod_1.z.number().min(1, "Target hours must be at least 1").max(1000, "Target hours must be less than 1000").optional(),
    guideId: zod_1.z.string().uuid("Invalid guide ID format").optional()
});
// Schéma de validation pour le statut du roadbook
const roadbookStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"], {
        errorMap: () => ({ message: "Status must be one of: ACTIVE, COMPLETED, ARCHIVED" })
    })
});
// Schéma de validation pour le statut d'une compétence
const competencyStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["NOT_STARTED", "IN_PROGRESS", "MASTERED"], {
        errorMap: () => ({ message: "Status must be one of: NOT_STARTED, IN_PROGRESS, MASTERED" })
    }),
    notes: zod_1.z.string().max(1000, "Notes must be less than 1000 characters").nullable().optional()
});
// Schéma de validation pour la validation de compétences
const competencyValidationSchema = zod_1.z.object({
    validations: zod_1.z.array(zod_1.z.object({
        competencyId: zod_1.z.string().uuid("Invalid competency ID format"),
        validated: zod_1.z.boolean(),
        notes: zod_1.z.string().max(500, "Notes must be less than 500 characters").optional()
    })).min(1, "At least one competency validation is required")
});
// ---- MIDDLEWARES DE VALIDATION ----
/**
 * Middleware pour valider l'enregistrement d'un utilisateur
 */
const validateRegister = (req, res, next) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        logger_1.default.warn(`Registration validation failed: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: "error",
            message: "Invalid registration data",
            errors: error.errors
        });
    }
};
exports.validateRegister = validateRegister;
/**
 * Middleware pour valider les identifiants de connexion
 */
const validateLogin = (req, res, next) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        logger_1.default.warn(`Login validation failed: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: "error",
            message: "Invalid login data",
            errors: error.errors
        });
    }
};
exports.validateLogin = validateLogin;
/**
 * Middleware pour valider une demande de réinitialisation de mot de passe
 */
const validateForgotPassword = (req, res, next) => {
    try {
        const validatedData = forgotPasswordSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Invalid email format",
            errors: error.errors
        });
    }
};
exports.validateForgotPassword = validateForgotPassword;
/**
 * Middleware pour valider une réinitialisation de mot de passe
 */
const validateResetPassword = (req, res, next) => {
    try {
        const validatedData = resetPasswordSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Invalid password reset data",
            errors: error.errors
        });
    }
};
exports.validateResetPassword = validateResetPassword;
/**
 * Middleware pour valider un changement de mot de passe
 */
const validateChangePassword = (req, res, next) => {
    try {
        const validatedData = changePasswordSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Invalid password change data",
            errors: error.errors
        });
    }
};
exports.validateChangePassword = validateChangePassword;
/**
 * Middleware pour valider la création d'une session
 */
const validateCreateSession = (req, res, next) => {
    try {
        const validatedData = sessionSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        logger_1.default.warn(`Session validation failed: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: "error",
            message: "Invalid session data",
            errors: error.errors
        });
    }
};
exports.validateCreateSession = validateCreateSession;
/**
 * Middleware pour valider la mise à jour d'une session
 */
const validateUpdateSession = (req, res, next) => {
    try {
        const validatedData = sessionUpdateSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        logger_1.default.warn(`Session update validation failed: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: "error",
            message: "Invalid session update data",
            errors: error.errors
        });
    }
};
exports.validateUpdateSession = validateUpdateSession;
/**
 * Middleware pour valider la validation d'une session
 */
const validateSessionValidation = (req, res, next) => {
    try {
        const validatedData = sessionValidationSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Invalid session validation data",
            errors: error.errors
        });
    }
};
exports.validateSessionValidation = validateSessionValidation;
/**
 * Middleware pour valider un commentaire
 */
const validateComment = (req, res, next) => {
    try {
        const validatedData = commentSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Invalid comment data",
            errors: error.errors
        });
    }
};
exports.validateComment = validateComment;
/**
 * Middleware pour valider la création/mise à jour d'un roadbook
 */
const validateRoadbook = (req, res, next) => {
    try {
        const validatedData = roadbookSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        logger_1.default.warn(`Roadbook validation failed: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: "error",
            message: "Invalid roadbook data",
            errors: error.errors
        });
    }
};
exports.validateRoadbook = validateRoadbook;
/**
 * Middleware pour valider le changement de statut d'un roadbook
 */
const validateRoadbookStatus = (req, res, next) => {
    try {
        const validatedData = roadbookStatusSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Invalid roadbook status",
            errors: error.errors
        });
    }
};
exports.validateRoadbookStatus = validateRoadbookStatus;
/**
 * Middleware pour valider le changement de statut d'une compétence
 */
const validateCompetencyStatus = (req, res, next) => {
    try {
        const validatedData = competencyStatusSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        logger_1.default.warn(`Competency status validation failed: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: "error",
            message: "Invalid competency status data",
            errors: error.errors
        });
    }
};
exports.validateCompetencyStatus = validateCompetencyStatus;
/**
 * Middleware pour valider les validations de compétences
 */
const validateCompetencyValidation = (req, res, next) => {
    try {
        const validatedData = competencyValidationSchema.parse(req.body);
        // Remplacer les données originales par les données validées et transformées
        req.body = validatedData;
        next();
    }
    catch (error) {
        logger_1.default.warn(`Competency validation failed: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: "error",
            message: "Invalid competency validation data",
            errors: error.errors
        });
    }
};
exports.validateCompetencyValidation = validateCompetencyValidation;
// ---- VALIDATION GÉNÉRIQUE ----
/**
 * Fonction générique de validation pour les requêtes
 * Utilise un schéma Zod pour valider les données
 */
const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.validateRequest = validateRequest;
// ---- VALIDATION DES BADGES ----
// Schéma de validation pour créer ou mettre à jour un badge
exports.badgeSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Badge name must be at least 3 characters long'),
    description: zod_1.z.string().min(5, 'Description must be at least 5 characters long'),
    imageUrl: zod_1.z.string().url('Image URL must be a valid URL'),
    category: zod_1.z.string().min(1, 'Category is required'),
    criteria: zod_1.z.string().min(1, 'Criteria is required'),
});
// Schéma de validation pour attribuer un badge
exports.awardBadgeSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID format'),
    badgeId: zod_1.z.string().uuid('Invalid badge ID format'),
});
// ---- VALIDATION DES PHOTOS DE PROFIL ----
// Schéma de validation pour les photos de profil
exports.profilePictureSchema = zod_1.z.object({
    profilePicture: zod_1.z.string().url('Profile picture must be a valid URL'),
    profilePictureType: zod_1.z.enum(['url', 'base64'], {
        errorMap: () => ({ message: "Picture type must be one of: url, base64" })
    })
});
// Middleware pour valider le téléchargement d'une photo de profil
const validateProfilePicture = (req, res, next) => {
    try {
        const validatedData = exports.profilePictureSchema.parse(req.body);
        // Remplacer les données originales par les données validées
        req.body = validatedData;
        next();
    }
    catch (error) {
        logger_1.default.warn(`Profile picture validation failed: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: "error",
            message: "Invalid profile picture data",
            errors: error.errors
        });
    }
};
exports.validateProfilePicture = validateProfilePicture;
