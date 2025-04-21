/**
 * Roadbook API Routes
 * 
 * These routes handle all roadbook operations including:
 * - Listing, creating, updating, and deleting roadbooks
 * - Managing sessions within roadbooks
 * - Tracking competency progress
 * - Assigning guides to roadbooks
 */
import express from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import * as roadbookController from "../../controllers/roadbook.controller";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Roadbook management routes
router.get("/", roadbookController.getUserRoadbooks);
router.post("/", roadbookController.createRoadbook);
router.get("/guided", roadbookController.getGuidedRoadbooks);

// Specific roadbook routes
router.get("/:id", roadbookController.getRoadbookById);
router.put("/:id", roadbookController.updateRoadbook);
router.delete("/:id", roadbookController.deleteRoadbook);
router.patch("/:id/status", roadbookController.updateRoadbookStatus);
router.post("/:id/guide", roadbookController.assignGuide);

// Session routes
router.get("/:id/sessions", roadbookController.getRoadbookSessions);
router.post("/:id/sessions", roadbookController.createSession);

// Competency progress routes
router.get("/:id/competencies", roadbookController.getCompetencyProgress);
router.patch("/:id/competencies/:competencyId", roadbookController.updateCompetencyStatus);

export default router;