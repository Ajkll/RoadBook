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
 *
 * Les contrôleurs sont responsables de:
 * - Traiter les requêtes HTTP
 * - Valider les permissions et autorisations
 * - Appeler les services appropriés
 * - Formater et renvoyer les réponses
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.changePassword = exports.updateCurrentUser = exports.updateUser = exports.getUserById = exports.getCurrentUser = void 0;
const userService = __importStar(require("../services/user.service"));
/**
 * Get current user information
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
        const user = await userService.getUserById(req.user.userId);
        return res.status(200).json({
            status: "success",
            user
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);
        return res.status(200).json({
            status: "success",
            user
        });
    }
    catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};
exports.getUserById = getUserById;
/**
 * Update user
 */
const updateUser = async (req, res) => {
    var _a, _b, _c;
    try {
        // Ensure user can only update their own profile unless they're admin
        const userId = req.params.id;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "ADMIN") {
            return res.status(403).json({
                status: "error",
                message: "You can only update your own profile"
            });
        }
        const userData = {
            displayName: req.body.displayName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            bio: req.body.bio,
            profilePicture: req.body.profilePicture,
            // Only admin can update these fields
            ...(((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === "ADMIN" && {
                email: req.body.email,
                nationalRegisterNumber: req.body.nationalRegisterNumber,
                role: req.body.role
            })
        };
        const updatedUser = await userService.updateUser(userId, userData);
        return res.status(200).json({
            status: "success",
            message: "User updated successfully",
            user: updatedUser
        });
    }
    catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};
exports.updateUser = updateUser;
/**
 * Update current user
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
            user: updatedUser
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};
exports.updateCurrentUser = updateCurrentUser;
/**
 * Change password
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
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: "error",
                message: "Current password and new password are required"
            });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({
                status: "error",
                message: "Password must be at least 8 characters"
            });
        }
        // Get user with password hash for verification
        const user = await userService.getUserByEmail(req.user.email);
        // Verify current password
        const bcrypt = require('bcrypt');
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({
                status: "error",
                message: "Current password is incorrect"
            });
        }
        // Update password
        await userService.updateUser(req.user.userId, { password: newPassword });
        return res.status(200).json({
            status: "success",
            message: "Password changed successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};
exports.changePassword = changePassword;
/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const result = await userService.getAllUsers(role, limit, offset);
        return res.status(200).json({
            status: "success",
            ...result
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};
exports.getAllUsers = getAllUsers;
