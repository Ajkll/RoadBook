/**
 * Roadbook API Routes
 * 
 * Ces routes gèrent toutes les opérations liées aux roadbooks:
 * - Listage, création, mise à jour et suppression de roadbooks
 * - Gestion des sessions de conduite
 * - Suivi des compétences et des validations
 * - Attribution de guides aux roadbooks
 * - Calcul de statistiques et analyses
 * - Exportation PDF pour les documents officiels
 */
import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as roadbookController from "../../controllers/roadbook.controller";
import * as competencyController from "../../controllers/competency.controller";
import { validateCreateSession, validateRoadbook, validateRoadbookStatus, validateCompetencyStatus } from "../../middleware/validation.middleware";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes de gestion des roadbooks
router.get("/", roadbookController.getUserRoadbooks);
router.post("/", validateRoadbook, roadbookController.createRoadbook);
router.get("/guided", roadbookController.getGuidedRoadbooks);

// Routes pour roadbooks spécifiques
router.get("/:id", roadbookController.getRoadbookById);
router.put("/:id", validateRoadbook, roadbookController.updateRoadbook);
router.delete("/:id", roadbookController.deleteRoadbook);
router.patch("/:id/status", validateRoadbookStatus, roadbookController.updateRoadbookStatus);
router.post("/:id/guide", roadbookController.assignGuide);

// Routes pour les statistiques et l'exportation
router.get("/:id/statistics", roadbookController.getRoadbookStatistics);
router.get("/:id/export", roadbookController.exportRoadbook);

// Routes de gestion des sessions
router.get("/:id/sessions", roadbookController.getRoadbookSessions);
router.post("/:id/sessions", validateCreateSession, roadbookController.createSession);

// Routes de progression des compétences
router.get("/:id/competencies", competencyController.getCompetencyProgressForRoadbook);
router.put("/:id/competencies/:competencyId", validateCompetencyStatus, competencyController.updateCompetencyStatus);
router.get("/:id/competencies/:competencyId/detail", competencyController.getCompetencyProgressDetail);

export default router;