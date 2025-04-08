"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = exports.validateRegister = void 0;
const zod_1 = require("zod");
// Schéma de validation pour l'enregistrement (register)
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email is invalid"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    displayName: zod_1.z
        .string()
        .min(2, "Display name must be at least 2 characters"),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    role: zod_1.z.enum(["APPRENTICE", "GUIDE", "INSTRUCTOR", "ADMIN"]).optional(),
    nationalRegisterNumber: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    birthDate: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
});
// Schéma de validation pour le login
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email is invalid"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// Middleware pour valider l'enregistrement
const validateRegister = (req, res, next) => {
    try {
        registerSchema.parse(req.body);
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Invalid registration data",
            errors: error.errors
        });
    }
};
exports.validateRegister = validateRegister;
// Middleware pour valider le login
const validateLogin = (req, res, next) => {
    try {
        loginSchema.parse(req.body);
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Invalid login data",
            errors: error.errors
        });
    }
};
exports.validateLogin = validateLogin;
