"use strict";
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
const sessionController = __importStar(require("../../controllers/session.controller"));
const competencyController = __importStar(require("../../controllers/competency.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const router = express_1.default.Router();
/**
 * @route   GET /api/sessions/:id
 * @desc    Get session details by ID
 * @access  Private - Participant, validator, admin
 */
router.get("/:id", auth_middleware_1.authenticate, sessionController.getSessionById);
/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session details
 * @access  Private - Creator or admin
 */
router.put("/:id", auth_middleware_1.authenticate, validation_middleware_1.validateUpdateSession, sessionController.updateSession);
/**
 * @route   DELETE /api/sessions/:id
 * @desc    Delete a session
 * @access  Private - Creator, guide, or admin
 */
router.delete("/:id", auth_middleware_1.authenticate, sessionController.deleteSession);
/**
 * @route   POST /api/sessions/:id/validate
 * @desc    Validate a session (guide/instructor approval)
 * @access  Private - Guide, instructor, or admin
 */
router.post("/:id/validate", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("GUIDE", "INSTRUCTOR", "ADMIN"), validation_middleware_1.validateSessionValidation, sessionController.validateSession);
/**
 * @route   POST /api/sessions/:id/comments
 * @desc    Add a comment to a session
 * @access  Private - Participant, guide, instructor, or admin
 */
router.post("/:id/comments", auth_middleware_1.authenticate, validation_middleware_1.validateComment, sessionController.addSessionComment);
/**
 * @route   GET /api/sessions/:id/competencies
 * @desc    Get competency validations for a session
 * @access  Private - Participant, guide, instructor, or admin
 */
router.get("/:id/competencies", auth_middleware_1.authenticate, competencyController.getCompetencyValidationsForSession);
/**
 * @route   POST /api/sessions/:id/competencies/validate
 * @desc    Validate competencies in a session
 * @access  Private - Guide, instructor, or admin
 */
router.post("/:id/competencies/validate", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)("GUIDE", "INSTRUCTOR", "ADMIN"), validation_middleware_1.validateCompetencyValidation, competencyController.validateCompetencies);
exports.default = router;
