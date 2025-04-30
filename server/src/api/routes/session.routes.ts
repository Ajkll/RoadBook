/**
 * SESSION ROUTES
 * 
 * Ce fichier définit les routes liées aux sessions de conduite:
 * - GET /:id: Récupération des détails d'une session
 * - PUT /:id: Mise à jour d'une session
 * - DELETE /:id: Suppression d'une session
 * - POST /:id/validate: Validation d'une session par un guide/instructeur
 * - POST /:id/comments: Ajout d'un commentaire à une session
 * 
 * Les routes de création de session sont définies dans roadbook.routes.ts
 * Les routes de récupération des sessions par apprenti sont dans user.routes.ts
 * 
 * Toutes ces routes sont protégées et nécessitent une authentification
 */

import express from "express";
import * as sessionController from "../../controllers/session.controller";
import * as competencyController from "../../controllers/competency.controller";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";
import { validateComment, validateSessionValidation, validateUpdateSession, validateCompetencyValidation } from "../../middleware/validation.middleware";

const router = express.Router();

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session details by ID
 * @access  Private - Participant, validator, admin
 */
router.get(
  "/:id",
  authenticate,
  sessionController.getSessionById
);

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session details
 * @access  Private - Creator or admin
 */
router.put(
  "/:id",
  authenticate,
  validateUpdateSession,
  sessionController.updateSession
);

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Delete a session
 * @access  Private - Creator, guide, or admin
 */
router.delete(
  "/:id",
  authenticate,
  sessionController.deleteSession
);

/**
 * @route   POST /api/sessions/:id/validate
 * @desc    Validate a session (guide/instructor approval)
 * @access  Private - Guide, instructor, or admin
 */
router.post(
  "/:id/validate",
  authenticate,
  authorizeRoles("GUIDE", "INSTRUCTOR", "ADMIN"),
  validateSessionValidation,
  sessionController.validateSession
);

/**
 * @route   POST /api/sessions/:id/comments
 * @desc    Add a comment to a session
 * @access  Private - Participant, guide, instructor, or admin
 */
router.post(
  "/:id/comments",
  authenticate,
  validateComment,
  sessionController.addSessionComment
);

/**
 * @route   GET /api/sessions/:id/competencies
 * @desc    Get competency validations for a session
 * @access  Private - Participant, guide, instructor, or admin
 */
router.get(
  "/:id/competencies",
  authenticate,
  competencyController.getCompetencyValidationsForSession
);

/**
 * @route   POST /api/sessions/:id/competencies/validate
 * @desc    Validate competencies in a session
 * @access  Private - Guide, instructor, or admin
 */
router.post(
  "/:id/competencies/validate",
  authenticate,
  authorizeRoles("GUIDE", "INSTRUCTOR", "ADMIN"),
  validateCompetencyValidation,
  competencyController.validateCompetencies
);

export default router;