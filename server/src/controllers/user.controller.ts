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

import { Request, Response } from "express";
import * as userService from "../services/user.service";

/**
 * Get current user information
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
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
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    return res.status(200).json({
      status: "success",
      user
    });
  } catch (error: any) {
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

/**
 * Update user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    // Ensure user can only update their own profile unless they're admin
    const userId = req.params.id;
    
    if (req.user?.userId !== userId && req.user?.role !== "ADMIN") {
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
      ...(req.user?.role === "ADMIN" && {
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
  } catch (error: any) {
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

/**
 * Update current user
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
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
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
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
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await userService.getAllUsers(
      role as string,
      limit,
      offset
    );

    return res.status(200).json({
      status: "success",
      ...result
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};