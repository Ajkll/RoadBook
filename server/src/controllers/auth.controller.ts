/**
 * AUTH CONTROLLER
 * 
 * Ce contrôleur gère les routes d'authentification:
 * - Inscription (register): création d'un compte et génération de tokens
 * - Connexion (login): authentification et génération de tokens
 * - Déconnexion (logout): révocation des tokens
 * - Rafraîchissement (refresh-token): obtention d'un nouveau access token
 * - Vérification (verify): validation d'un token existant
 * 
 * Les contrôleurs sont responsables de:
 * - Traiter les requêtes HTTP
 * - Valider les entrées
 * - Appeler les services appropriés
 * - Formater et renvoyer les réponses
 */

import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import * as userService from "../services/user.service";

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Extract user data from request body
    const userData = {
      email: req.body.email.trim().toLowerCase(),
      password: req.body.password,
      displayName: req.body.displayName.trim(),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      nationalRegisterNumber: req.body.nationalRegisterNumber,
      role: req.body.role || "APPRENTICE"
    };

    // Create the user
    const newUser = await userService.createUser(userData);

    // Login the user to generate tokens
    const { user, accessToken, refreshToken } = await authService.login(
      userData.email, 
      userData.password
    );

    // Return success response
    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      user,
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    // Return error response
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        status: "error",
        message: error.message
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Registration failed",
      error: error.message
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Authenticate user
    const result = await authService.login(email, password);

    // Set HTTP-only cookie with refresh token
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Set authorization header
    res.header("Authorization", `Bearer ${result.accessToken}`);

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Login successful",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error: any) {
    // Return error response
    return res.status(401).json({
      status: "error",
      message: "Invalid email or password"
    });
  }
};

/**
 * Logout user
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    // Revoke refresh token if provided
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax'
    });

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Logout successful"
    });
  } catch (error) {
    // Return success response even if there's an error
    // This ensures the user is logged out client-side
    res.clearCookie("refreshToken");
    
    return res.status(200).json({
      status: "success",
      message: "Logout successful"
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token is required"
      });
    }

    // Get new access token
    const result = await authService.refreshToken(refreshToken);

    // Set authorization header
    res.header("Authorization", `Bearer ${result.accessToken}`);

    // Return success response
    return res.status(200).json({
      status: "success",
      accessToken: result.accessToken
    });
  } catch (error: any) {
    // Return error response
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired refresh token"
    });
  }
};

/**
 * Verify access token
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        valid: false,
        message: "Token is missing"
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Return success response
    return res.status(200).json({
      status: "success",
      valid: true,
      user: decoded
    });
  } catch (error) {
    // Return error response
    return res.status(200).json({
      status: "error",
      valid: false,
      message: "Invalid or expired token"
    });
  }
};