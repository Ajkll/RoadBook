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
import { authenticateJWT } from "../../middleware/auth.middleware";
import * as roadbookController from "../../controllers/roadbook.controller";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);

// Routes de gestion des roadbooks
router.get("/", roadbookController.getUserRoadbooks);
router.post("/", roadbookController.createRoadbook);
router.get("/guided", roadbookController.getGuidedRoadbooks);

// Routes pour roadbooks spécifiques
router.get("/:id", roadbookController.getRoadbookById);
router.put("/:id", roadbookController.updateRoadbook);
router.delete("/:id", roadbookController.deleteRoadbook);
router.patch("/:id/status", roadbookController.updateRoadbookStatus);
router.post("/:id/guide", roadbookController.assignGuide);

// Routes pour les statistiques et l'exportation
router.get("/:id/statistics", roadbookController.getRoadbookStatistics);
router.get("/:id/export", roadbookController.exportRoadbook);

// Routes de gestion des sessions
router.get("/:id/sessions", roadbookController.getRoadbookSessions);
router.post("/:id/sessions", roadbookController.createSession);

// Routes de progression des compétences
router.get("/:id/competencies", roadbookController.getCompetencyProgress);
router.patch("/:id/competencies/:competencyId", roadbookController.updateCompetencyStatus);

export default router;