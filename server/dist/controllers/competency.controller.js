"use strict";
/**
 * COMPETENCY CONTROLLER
 *
 * Ce contrôleur gère les routes liées aux compétences de conduite:
 * - Récupération des compétences disponibles
 * - Gestion de la progression des apprentis
 * - Validation des compétences par les guides/instructeurs
 * - Récupération de statistiques de progression
 *
 * Le système de compétences est au cœur de l'apprentissage,
 * permettant de suivre précisément les acquis et l'évolution
 * de chaque apprenti dans son parcours de formation.
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
exports.getApprenticeCompetencyStats = exports.getCompetencyProgressDetail = exports.getLearningPhase = exports.getCompetencyValidationsForSession = exports.validateCompetencies = exports.updateCompetencyStatus = exports.getCompetencyProgressForRoadbook = exports.getCompetencyById = exports.getAllCompetencies = void 0;
const competencyService = __importStar(require("../services/competency.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Get all competencies - Récupérer toutes les compétences disponibles
 *
 * @route GET /api/competencies
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getAllCompetencies = async (req, res) => {
    var _a;
    try {
        // Vérifier si l'utilisateur est authentifié
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        // Extraire les filtres optionnels
        const { phase, category } = req.query;
        logger_1.default.info(`Retrieving competencies with filters: phase=${phase}, category=${category}`);
        // Récupérer les compétences avec filtrage éventuel
        const competencies = await competencyService.getAllCompetencies(phase, category);
        return res.status(200).json({
            status: "success",
            count: competencies.length,
            data: competencies
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting competencies: ${error.message}`);
        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve competencies",
            details: error.message
        });
    }
};
exports.getAllCompetencies = getAllCompetencies;
/**
 * Get competency by ID - Récupérer une compétence spécifique
 *
 * @route GET /api/competencies/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getCompetencyById = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        const { id } = req.params;
        // Récupérer la compétence
        const competency = await competencyService.getCompetencyById(id);
        return res.status(200).json({
            status: "success",
            data: competency
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting competency ${req.params.id}: ${error.message}`);
        if (error.message === "Competency not found") {
            return res.status(404).json({
                status: "error",
                message: "Competency not found"
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve competency",
            details: error.message
        });
    }
};
exports.getCompetencyById = getCompetencyById;
/**
 * Get competency progress for roadbook - Récupérer la progression des compétences d'un roadbook
 *
 * @route GET /api/roadbooks/:roadbookId/competencies
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getCompetencyProgressForRoadbook = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        const { roadbookId } = req.params;
        // Récupérer la progression des compétences
        const progress = await competencyService.getCompetencyProgressForRoadbook(roadbookId);
        return res.status(200).json({
            status: "success",
            data: progress
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting competency progress for roadbook ${req.params.roadbookId}: ${error.message}`);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve competency progress",
            details: error.message
        });
    }
};
exports.getCompetencyProgressForRoadbook = getCompetencyProgressForRoadbook;
/**
 * Update competency status - Mettre à jour le statut d'une compétence
 *
 * @route PUT /api/roadbooks/:roadbookId/competencies/:competencyId
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const updateCompetencyStatus = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        const { roadbookId, competencyId } = req.params;
        const { status, notes } = req.body;
        logger_1.default.info(`Updating competency ${competencyId} status to ${status} for roadbook ${roadbookId}`);
        // Mettre à jour le statut de la compétence
        const updatedProgress = await competencyService.updateCompetencyStatus(roadbookId, competencyId, status, notes, req.user.userId);
        return res.status(200).json({
            status: "success",
            message: "Competency status updated successfully",
            data: updatedProgress
        });
    }
    catch (error) {
        logger_1.default.error(`Error updating competency status: ${error.message}`);
        if (error.message === "Roadbook not found" || error.message === "Competency not found") {
            return res.status(404).json({
                status: "error",
                message: error.message
            });
        }
        if (error.message === "Unauthorized to update competency status") {
            return res.status(403).json({
                status: "error",
                message: error.message
            });
        }
        if (error.message.includes("Invalid status")) {
            return res.status(400).json({
                status: "error",
                message: error.message
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to update competency status",
            details: error.message
        });
    }
};
exports.updateCompetencyStatus = updateCompetencyStatus;
/**
 * Validate competencies - Valider des compétences dans une session
 *
 * @route POST /api/sessions/:sessionId/competencies/validate
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const validateCompetencies = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        const { sessionId } = req.params;
        const validations = req.body.validations;
        if (!validations || !Array.isArray(validations) || validations.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Validations array is required"
            });
        }
        logger_1.default.info(`Validating ${validations.length} competencies for session ${sessionId}`);
        // Valider les compétences
        const results = await competencyService.validateCompetencies(sessionId, validations, req.user.userId);
        // Compter les succès et échecs
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        return res.status(200).json({
            status: "success",
            message: `Validated ${successCount} competencies successfully, ${failureCount} failed`,
            data: results
        });
    }
    catch (error) {
        logger_1.default.error(`Error validating competencies: ${error.message}`);
        if (error.message === "Session not found") {
            return res.status(404).json({
                status: "error",
                message: "Session not found"
            });
        }
        if (error.message === "Unauthorized to validate competencies") {
            return res.status(403).json({
                status: "error",
                message: error.message
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to validate competencies",
            details: error.message
        });
    }
};
exports.validateCompetencies = validateCompetencies;
/**
 * Get competency validations for session - Récupérer les validations de compétences d'une session
 *
 * @route GET /api/sessions/:sessionId/competencies
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getCompetencyValidationsForSession = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        const { sessionId } = req.params;
        // Récupérer les validations
        const validations = await competencyService.getCompetencyValidationsForSession(sessionId);
        return res.status(200).json({
            status: "success",
            count: validations.length,
            data: validations
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting competency validations for session ${req.params.sessionId}: ${error.message}`);
        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve competency validations",
            details: error.message
        });
    }
};
exports.getCompetencyValidationsForSession = getCompetencyValidationsForSession;
/**
 * Get learning phase - Récupérer les détails d'une phase d'apprentissage
 *
 * @route GET /api/competencies/phases/:phase
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getLearningPhase = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        const { phase } = req.params;
        // Vérifier si la phase est valide
        if (!Object.values(competencyService.LearningPhase).includes(phase)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid learning phase",
                validPhases: Object.values(competencyService.LearningPhase)
            });
        }
        // Récupérer les détails de la phase
        const phaseDetails = await competencyService.getLearningPhase(phase);
        return res.status(200).json({
            status: "success",
            data: phaseDetails
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting learning phase ${req.params.phase}: ${error.message}`);
        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve learning phase",
            details: error.message
        });
    }
};
exports.getLearningPhase = getLearningPhase;
/**
 * Get competency progress detail - Récupérer les détails de progression d'une compétence
 *
 * @route GET /api/roadbooks/:roadbookId/competencies/:competencyId/detail
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getCompetencyProgressDetail = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        const { roadbookId, competencyId } = req.params;
        // Récupérer les détails de progression
        const progressDetail = await competencyService.getCompetencyProgressDetail(roadbookId, competencyId);
        return res.status(200).json({
            status: "success",
            data: progressDetail
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting competency progress detail: ${error.message}`);
        if (error.message === "Roadbook not found" || error.message === "Competency not found") {
            return res.status(404).json({
                status: "error",
                message: error.message
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve competency progress detail",
            details: error.message
        });
    }
};
exports.getCompetencyProgressDetail = getCompetencyProgressDetail;
/**
 * Get apprentice competency stats - Récupérer les statistiques de compétences d'un apprenti
 *
 * @route GET /api/apprentices/:apprenticeId/competencies/stats
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const getApprenticeCompetencyStats = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated"
            });
        }
        const { apprenticeId } = req.params;
        // Vérifier les permissions (s'il ne s'agit pas de l'apprenti lui-même)
        if (apprenticeId !== req.user.userId && req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR') {
            return res.status(403).json({
                status: "error",
                message: "Unauthorized to access these statistics"
            });
        }
        // Récupérer les statistiques
        const stats = await competencyService.getApprenticeCompetencyStats(apprenticeId);
        return res.status(200).json({
            status: "success",
            data: stats
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting apprentice competency stats: ${error.message}`);
        if (error.message === "Apprentice not found") {
            return res.status(404).json({
                status: "error",
                message: "Apprentice not found"
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve apprentice competency statistics",
            details: error.message
        });
    }
};
exports.getApprenticeCompetencyStats = getApprenticeCompetencyStats;
