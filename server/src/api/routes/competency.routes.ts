/**
 * COMPETENCY ROUTES
 * 
 * Ce fichier définit les routes liées aux compétences de conduite:
 * - GET /: Récupération de toutes les compétences
 * - GET /:id: Récupération d'une compétence spécifique
 * - GET /phases/:phase: Récupération des compétences d'une phase
 * - Routes pour la progression des compétences dans un roadbook
 * - Routes pour la validation des compétences dans une session
 * 
 * La taxonomie des compétences est organisée en phases hiérarchiques, permettant
 * de suivre la progression de l'apprenti dans son parcours de formation.
 */

import express from "express";
import * as competencyController from "../../controllers/competency.controller";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";
import { validateCompetencyStatus, validateCompetencyValidation } from "../../middleware/validation.middleware";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @route   GET /api/competencies
 * @desc    Get all competencies, optionally filtered by phase or category
 * @access  Private - All authenticated users
 */
router.get(
  "/",
  competencyController.getAllCompetencies
);

/**
 * @route   GET /api/competencies/:id
 * @desc    Get a specific competency by ID
 * @access  Private - All authenticated users
 */
router.get(
  "/:id",
  competencyController.getCompetencyById
);

/**
 * @route   GET /api/competencies/phases/:phase
 * @desc    Get details of a specific learning phase
 * @access  Private - All authenticated users
 */
router.get(
  "/phases/:phase",
  competencyController.getLearningPhase
);

/**
 * Endpoints externes au router compétences mais faisant partie du module
 * 
 * GET /api/roadbooks/:roadbookId/competencies
 * - Récupération de la progression des compétences pour un roadbook
 * 
 * PUT /api/roadbooks/:roadbookId/competencies/:competencyId
 * - Mise à jour du statut d'une compétence pour un roadbook
 * 
 * GET /api/roadbooks/:roadbookId/competencies/:competencyId/detail
 * - Récupération des détails de progression d'une compétence
 * 
 * GET /api/sessions/:sessionId/competencies
 * - Récupération des validations de compétences pour une session
 * 
 * POST /api/sessions/:sessionId/competencies/validate
 * - Validation des compétences dans une session
 * 
 * GET /api/apprentices/:apprenticeId/competencies/stats
 * - Récupération des statistiques de compétences d'un apprenti
 */

export default router;