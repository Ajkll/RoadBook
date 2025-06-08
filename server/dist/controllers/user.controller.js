"use strict";
/**
 * USER CONTROLLER
 *
 * Ce contrôleur gère les routes liées aux utilisateurs:
 * - Récupération du profil courant (getCurrentUser)
 * - Récupération d'un profil spécifique (getUserById)
 * - Mise à jour de profil (updateUser, updateCurrentUser)
 * - Changement de mot de passe (changePassword)
 * - Liste des utilisateurs (getAllUsers - admin uniquement)
 * - Suppression d'un utilisateur (deleteUser - admin ou soi-même)
 * - Gestion des photos de profil (uploadProfilePicture, deleteProfilePicture)
 *
 * Les contrôleurs sont responsables de:
 * - Traiter les requêtes HTTP
 * - Valider les permissions et autorisations
 * - Appeler les services appropriés
 * - Formater et renvoyer les réponses de manière cohérente
 * - Gestion des erreurs
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfilePicture = exports.uploadProfilePicture = exports.getAllUsers = exports.deleteUser = exports.changePassword = exports.updateCurrentUser = exports.updateUser = exports.getUserById = exports.getCurrentUser = void 0;
const userService = __importStar(require("../services/user.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Get current user information - Récupère les informations de l'utilisateur connecté
 *
 * @route GET /api/users/me
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getCurrentUser = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        logger_1.default.debug(`Getting current user profile: ${req.user.userId}`);
        // Récupérer le profil de l'utilisateur avec ses relations
        const user = await userService.getUserById(req.user.userId, true);
        return res.status(200).json({
            status: "success",
            data: user
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting current user: ${error.message}`);
        return res.status(500).json({
            status: "error",
            message: "Failed to get user profile",
            details: error.message
        });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Get user by ID - Récupère les informations d'un utilisateur spécifique
 *
 * @route GET /api/users/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getUserById = async (req, res) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const currentUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        // Vérifier les autorisations:
        // Les utilisateurs ne peuvent voir que leur propre profil détaillé
        // Les instructeurs et admins peuvent voir tous les profils
        const isCurrentUser = currentUserId === id;
        const hasPermission = isCurrentUser ||
            ["ADMIN", "INSTRUCTOR"].includes(currentUserRole || "");
        if (!hasPermission) {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to view this user's detailed profile"
            });
        }
        // Récupérer l'utilisateur (avec relations si c'est l'utilisateur courant ou un admin)
        const user = await userService.getUserById(id, isCurrentUser || currentUserRole === "ADMIN");
        return res.status(200).json({
            status: "success",
            data: user
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting user ${req.params.id}: ${error.message}`);
        if (error.message === "User not found") {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to get user",
            details: error.message
        });
    }
};
exports.getUserById = getUserById;
/**
 * Update user - Met à jour le profil d'un utilisateur spécifique
 *
 * @route PUT /api/users/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const updateUser = async (req, res) => {
    var _a, _b;
    try {
        const userId = req.params.id;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const currentUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!currentUserId) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        // Vérifier les autorisations
        const isCurrentUser = currentUserId === userId;
        const isAdmin = currentUserRole === "ADMIN";
        if (!isCurrentUser && !isAdmin) {
            return res.status(403).json({
                status: "error",
                message: "You can only update your own profile"
            });
        }
        logger_1.default.info(`User update initiated for ${userId} by ${currentUserId}`);
        // Différents champs à mettre à jour selon le rôle de l'utilisateur
        const baseUserData = {
            displayName: req.body.displayName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            bio: req.body.bio,
            profilePicture: req.body.profilePicture
        };
        // Les admins peuvent mettre à jour des champs supplémentaires
        const userData = isAdmin ? {
            ...baseUserData,
            email: req.body.email,
            nationalRegisterNumber: req.body.nationalRegisterNumber,
            role: req.body.role,
            // Note: mot de passe n'est pas mis à jour ici (utiliser changePassword à la place)
        } : baseUserData;
        // Mettre à jour l'utilisateur
        const updatedUser = await userService.updateUser(userId, userData, currentUserId);
        return res.status(200).json({
            status: "success",
            message: "User updated successfully",
            data: updatedUser
        });
    }
    catch (error) {
        logger_1.default.error(`Error updating user ${req.params.id}: ${error.message}`);
        if (error.message === "User not found") {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
                status: "error",
                message: error.message
            });
        }
        if (error.message.includes("already in use")) {
            return res.status(409).json({
                status: "error",
                message: error.message
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to update user",
            details: error.message
        });
    }
};
exports.updateUser = updateUser;
/**
 * Update current user - Met à jour le profil de l'utilisateur connecté
 *
 * @route PUT /api/users/me
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const updateCurrentUser = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        logger_1.default.info(`Current user update initiated for ${req.user.userId}`);
        // Champs que l'utilisateur peut mettre à jour sur son propre profil
        const userData = {
            displayName: req.body.displayName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            bio: req.body.bio,
            profilePicture: req.body.profilePicture
        };
        const updatedUser = await userService.updateUser(req.user.userId, userData);
        return res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            data: updatedUser
        });
    }
    catch (error) {
        logger_1.default.error(`Error updating current user: ${error.message}`);
        return res.status(500).json({
            status: "error",
            message: "Failed to update profile",
            details: error.message
        });
    }
};
exports.updateCurrentUser = updateCurrentUser;
/**
 * Change password - Change le mot de passe de l'utilisateur
 *
 * @route PUT /api/users/me/password
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const changePassword = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        logger_1.default.info(`Password change initiated for user ${req.user.userId}`);
        // Changer le mot de passe en utilisant la fonction dédiée du service
        const passwordData = {
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword
        };
        await userService.changePassword(req.user.userId, passwordData);
        return res.status(200).json({
            status: "success",
            message: "Password changed successfully"
        });
    }
    catch (error) {
        logger_1.default.error(`Error changing password: ${error.message}`);
        // Messages d'erreur spécifiques
        if (error.message.includes("Current password is incorrect")) {
            return res.status(400).json({
                status: "error",
                message: "Current password is incorrect"
            });
        }
        if (error.message.includes("required")) {
            return res.status(400).json({
                status: "error",
                message: error.message
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to change password",
            details: error.message
        });
    }
};
exports.changePassword = changePassword;
/**
 * Delete user - Supprime un utilisateur
 *
 * @route DELETE /api/users/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const deleteUser = async (req, res) => {
    var _a;
    try {
        const userId = req.params.id;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!currentUserId) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        logger_1.default.warn(`User deletion initiated for ${userId} by ${currentUserId}`);
        // Supprimer l'utilisateur (la vérification des permissions est faite dans le service)
        await userService.deleteUser(userId, currentUserId);
        return res.status(200).json({
            status: "success",
            message: "User deleted successfully"
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting user ${req.params.id}: ${error.message}`);
        if (error.message === "User not found") {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
                status: "error",
                message: error.message
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to delete user",
            details: error.message
        });
    }
};
exports.deleteUser = deleteUser;
/**
 * Get all users - Récupère la liste des utilisateurs (admin uniquement)
 *
 * @route GET /api/users
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getAllUsers = async (req, res) => {
    try {
        // Extraire les paramètres de requête
        const role = req.query.role;
        const search = req.query.search;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const orderBy = req.query.orderBy || 'createdAt';
        const orderDirection = req.query.orderDirection || 'desc';
        logger_1.default.info(`Admin requesting user list with filters: role=${role}, search=${search}, limit=${limit}, offset=${offset}`);
        // Récupérer les utilisateurs avec les options de filtrage et pagination
        const result = await userService.getAllUsers({
            role,
            search,
            limit,
            offset,
            orderBy,
            orderDirection
        });
        return res.status(200).json({
            status: "success",
            data: result.users,
            pagination: result.pagination
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting all users: ${error.message}`);
        return res.status(500).json({
            status: "error",
            message: "Failed to get users",
            details: error.message
        });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Upload or update profile picture for current user
 *
 * @route POST /api/users/me/profile-picture
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const uploadProfilePicture = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        logger_1.default.info(`Profile picture upload initiated for user ${req.user.userId}`);
        // Update profile picture with the validated data
        const updatedUser = await userService.updateProfilePicture(req.user.userId, {
            profilePicture: req.body.profilePicture,
            profilePictureType: req.body.profilePictureType
        });
        return res.status(200).json({
            status: "success",
            message: "Profile picture updated successfully",
            data: updatedUser
        });
    }
    catch (error) {
        logger_1.default.error(`Error uploading profile picture: ${error.message}`);
        if (error.message === "User not found") {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to update profile picture",
            details: error.message
        });
    }
};
exports.uploadProfilePicture = uploadProfilePicture;
/**
 * Delete profile picture for current user
 *
 * @route DELETE /api/users/me/profile-picture
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const deleteProfilePicture = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        logger_1.default.info(`Profile picture deletion initiated for user ${req.user.userId}`);
        // Remove profile picture
        const updatedUser = await userService.deleteProfilePicture(req.user.userId);
        return res.status(200).json({
            status: "success",
            message: "Profile picture deleted successfully",
            data: updatedUser
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting profile picture: ${error.message}`);
        if (error.message === "User not found") {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to delete profile picture",
            details: error.message
        });
    }
};
exports.deleteProfilePicture = deleteProfilePicture;
