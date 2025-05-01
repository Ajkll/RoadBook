"use strict";
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
const express_1 = __importDefault(require("express"));
const competencyController = __importStar(require("../../controllers/competency.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/competencies
 * @desc    Get all competencies, optionally filtered by phase or category
 * @access  Private - All authenticated users
 */
router.get("/", competencyController.getAllCompetencies);
/**
 * @route   GET /api/competencies/:id
 * @desc    Get a specific competency by ID
 * @access  Private - All authenticated users
 */
router.get("/:id", competencyController.getCompetencyById);
/**
 * @route   GET /api/competencies/phases/:phase
 * @desc    Get details of a specific learning phase
 * @access  Private - All authenticated users
 */
router.get("/phases/:phase", competencyController.getLearningPhase);
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
exports.default = router;
