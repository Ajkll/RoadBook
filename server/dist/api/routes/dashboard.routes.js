"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * @route   GET /api/dashboard/me
 * @desc    Get current user dashboard
 * @access  Private - Requires authentication
 */
router.get("/me", auth_middleware_1.authenticate, (req, res) => res.status(200).json({ message: "Dashboard endpoint not yet implemented" }));
/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity for current user
 * @access  Private - Requires authentication
 */
router.get("/activity", auth_middleware_1.authenticate, (req, res) => res.status(200).json({ message: "Activity endpoint not yet implemented" }));
/**
 * @route   GET /api/dashboard/apprentice/:id
 * @desc    Get detailed statistics for an apprentice
 * @access  Private - Self, guide, instructor, or admin
 */
router.get("/apprentice/:id", auth_middleware_1.authenticate, (req, res) => res.status(200).json({ message: "Apprentice statistics endpoint not yet implemented" }));
/**
 * @route   GET /api/dashboard/roadbook/:id
 * @desc    Get detailed statistics for a roadbook
 * @access  Private - Apprentice, guide, instructor, or admin
 */
router.get("/roadbook/:id", auth_middleware_1.authenticate, (req, res) => res.status(200).json({ message: "Roadbook statistics endpoint not yet implemented" }));
exports.default = router;
