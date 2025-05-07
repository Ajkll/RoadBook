"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const roadbookController = __importStar(require("../../controllers/roadbook.controller"));
const competencyController = __importStar(require("../../controllers/competency.controller"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes de gestion des roadbooks
router.get("/", roadbookController.getUserRoadbooks);
router.post("/", validation_middleware_1.validateRoadbook, roadbookController.createRoadbook);
router.get("/guided", roadbookController.getGuidedRoadbooks);
// Routes pour roadbooks spécifiques
router.get("/:id", roadbookController.getRoadbookById);
router.put("/:id", validation_middleware_1.validateRoadbook, roadbookController.updateRoadbook);
router.delete("/:id", roadbookController.deleteRoadbook);
router.patch("/:id/status", validation_middleware_1.validateRoadbookStatus, roadbookController.updateRoadbookStatus);
router.post("/:id/guide", roadbookController.assignGuide);
// Routes pour les statistiques et l'exportation
router.get("/:id/statistics", roadbookController.getRoadbookStatistics);
router.get("/:id/export", roadbookController.exportRoadbook);
// Routes de gestion des sessions
router.get("/:id/sessions", roadbookController.getRoadbookSessions);
router.post("/:id/sessions", validation_middleware_1.validateCreateSession, roadbookController.createSession);
// Routes de progression des compétences
router.get("/:id/competencies", competencyController.getCompetencyProgressForRoadbook);
router.put("/:id/competencies/:competencyId", validation_middleware_1.validateCompetencyStatus, competencyController.updateCompetencyStatus);
router.get("/:id/competencies/:competencyId/detail", competencyController.getCompetencyProgressDetail);
exports.default = router;
