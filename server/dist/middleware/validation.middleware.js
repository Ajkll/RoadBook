"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChangePassword = exports.validateResetPassword = exports.validateForgotPassword = exports.validateLogin = exports.validateRegister = void 0;
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
