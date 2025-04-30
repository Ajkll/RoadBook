/**
 * DASHBOARD ROUTES
 * 
 * Ce fichier définit les routes liées au tableau de bord:
 * - GET /me: Récupération du tableau de bord de l'utilisateur courant
 * - GET /activity: Récupération de l'activité récente
 * - GET /apprentice/:id: Récupération des statistiques d'un apprenti
 * - GET /roadbook/:id: Récupération des statistiques d'un roadbook
 * 
 * Le tableau de bord permet aux utilisateurs de visualiser leur progression,
 * leurs activités récentes et des statistiques sur leur apprentissage.
 */

import express from "express";
import * as dashboardController from "../../controllers/dashboard.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validation.middleware";

const router = express.Router();

/**
 * @route   GET /api/dashboard/me
 * @desc    Get current user dashboard
 * @access  Private - Requires authentication
 */
router.get(
  "/me",
  authenticate,
  (req, res) => res.status(200).json({ message: "Dashboard endpoint not yet implemented" })
);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity for current user
 * @access  Private - Requires authentication
 */
router.get(
  "/activity",
  authenticate,
  (req, res) => res.status(200).json({ message: "Activity endpoint not yet implemented" })
);

/**
 * @route   GET /api/dashboard/apprentice/:id
 * @desc    Get detailed statistics for an apprentice
 * @access  Private - Self, guide, instructor, or admin
 */
router.get(
  "/apprentice/:id",
  authenticate,
  (req, res) => res.status(200).json({ message: "Apprentice statistics endpoint not yet implemented" })
);

/**
 * @route   GET /api/dashboard/roadbook/:id
 * @desc    Get detailed statistics for a roadbook
 * @access  Private - Apprentice, guide, instructor, or admin
 */
router.get(
  "/roadbook/:id",
  authenticate,
  (req, res) => res.status(200).json({ message: "Roadbook statistics endpoint not yet implemented" })
);

export default router;