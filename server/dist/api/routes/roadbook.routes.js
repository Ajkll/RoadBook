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
 * These routes handle all roadbook operations including:
 * - Listing, creating, updating, and deleting roadbooks
 * - Managing sessions within roadbooks
 * - Tracking competency progress
 * - Assigning guides to roadbooks
 */
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const roadbookController = __importStar(require("../../controllers/roadbook.controller"));
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.authenticateJWT);
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
exports.default = router;
