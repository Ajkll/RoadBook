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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompetencyStatus = exports.getCompetencyProgress = exports.getRoadbookSessions = exports.updateRoadbookStatus = exports.createSession = exports.getGuidedRoadbooks = exports.assignGuide = exports.deleteRoadbook = exports.updateRoadbook = exports.getRoadbookById = exports.createRoadbook = exports.getUserRoadbooks = void 0;
const roadbookService = __importStar(require("../services/roadbook.service"));
/**
 * Get all roadbooks belonging to the logged-in user
 *
 * @route GET /api/roadbooks
 * @access Private - Requires authentication
 * @returns {Array} - List of roadbooks owned by the user
 */
const getUserRoadbooks = async (req, res, next) => {
    var _a;
    try {
        // Extract user ID from the authenticated JWT token
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Get the optional status filter from query params
        const status = req.query.status;
        // Get user's roadbooks with optional filters
        const roadbooks = await roadbookService.getRoadbooksByUserId(userId, status);
        res.status(200).json({
            status: "success",
            data: roadbooks
        });
    }
    catch (error) {
        console.error("Error fetching user roadbooks:", error);
        next(error);
    }
};
exports.getUserRoadbooks = getUserRoadbooks;
/**
 * Create a new roadbook
 *
 * @route POST /api/roadbooks
 * @access Private - Requires authentication
 * @returns {Object} - Newly created roadbook
 */
const createRoadbook = async (req, res, next) => {
    var _a;
    try {
        // Extract user ID from the authenticated JWT token
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Extract roadbook data from request body
        const roadbookData = {
            ...req.body,
            apprenticeId: userId // Set the current user as the apprentice/owner
        };
        // Create the roadbook
        const newRoadbook = await roadbookService.createRoadbook(roadbookData);
        res.status(201).json({
            status: "success",
            data: newRoadbook
        });
    }
    catch (error) {
        console.error("Error creating roadbook:", error);
        next(error);
    }
};
exports.createRoadbook = createRoadbook;
/**
 * Get a specific roadbook by ID
 *
 * @route GET /api/roadbooks/:id
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Object} - Roadbook details with sessions
 */
const getRoadbookById = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Get roadbook with access check
        const roadbook = await roadbookService.getRoadbookById(id, userId);
        res.status(200).json({
            status: "success",
            data: roadbook
        });
    }
    catch (error) {
        console.error(`Error fetching roadbook ${req.params.id}:`, error);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to access this roadbook"
            });
        }
        next(error);
    }
};
exports.getRoadbookById = getRoadbookById;
/**
 * Update a roadbook
 *
 * @route PUT /api/roadbooks/:id
 * @access Private - Requires authentication and ownership
 * @returns {Object} - Updated roadbook
 */
const updateRoadbook = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Update the roadbook with access check
        const updatedRoadbook = await roadbookService.updateRoadbook(id, req.body, userId);
        res.status(200).json({
            status: "success",
            data: updatedRoadbook
        });
    }
    catch (error) {
        console.error(`Error updating roadbook ${req.params.id}:`, error);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to update this roadbook"
            });
        }
        next(error);
    }
};
exports.updateRoadbook = updateRoadbook;
/**
 * Delete a roadbook
 *
 * @route DELETE /api/roadbooks/:id
 * @access Private - Requires authentication and ownership
 * @returns {Object} - Success message
 */
const deleteRoadbook = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Delete the roadbook with access check
        await roadbookService.deleteRoadbook(id, userId);
        res.status(200).json({
            status: "success",
            message: "Roadbook deleted successfully"
        });
    }
    catch (error) {
        console.error(`Error deleting roadbook ${req.params.id}:`, error);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to delete this roadbook"
            });
        }
        next(error);
    }
};
exports.deleteRoadbook = deleteRoadbook;
/**
 * Assign a guide to a roadbook
 *
 * @route POST /api/roadbooks/:id/guide
 * @access Private - Requires authentication and ownership
 * @returns {Object} - Updated roadbook with guide information
 */
const assignGuide = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const { guideId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        if (!guideId) {
            return res.status(400).json({
                status: "error",
                message: "Guide ID is required"
            });
        }
        // Assign guide to roadbook with access check
        const updatedRoadbook = await roadbookService.assignGuide(id, guideId, userId);
        res.status(200).json({
            status: "success",
            data: updatedRoadbook
        });
    }
    catch (error) {
        console.error(`Error assigning guide to roadbook ${req.params.id}:`, error);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to update this roadbook"
            });
        }
        if (error.message === "Guide not found") {
            return res.status(404).json({
                status: "error",
                message: "Guide user not found"
            });
        }
        if (error.message === "Invalid guide role") {
            return res.status(400).json({
                status: "error",
                message: "Selected user does not have the GUIDE role"
            });
        }
        next(error);
    }
};
exports.assignGuide = assignGuide;
/**
 * Get guided roadbooks (for guides only)
 *
 * @route GET /api/roadbooks/guided
 * @access Private - Requires authentication and GUIDE role
 * @returns {Array} - List of roadbooks where user is a guide
 */
const getGuidedRoadbooks = async (req, res, next) => {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Check if user has guide role
        if (userRole !== "GUIDE" && userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
            return res.status(403).json({
                status: "error",
                message: "Only guides, instructors and admins can access this endpoint"
            });
        }
        // Get optional status filter from query params
        const status = req.query.status;
        // Get list of roadbooks where user is a guide
        const guidedRoadbooks = await roadbookService.getGuidedRoadbooks(userId, status);
        res.status(200).json({
            status: "success",
            data: guidedRoadbooks
        });
    }
    catch (error) {
        console.error("Error fetching guided roadbooks:", error);
        next(error);
    }
};
exports.getGuidedRoadbooks = getGuidedRoadbooks;
/**
 * Create a new session in a roadbook
 *
 * @route POST /api/roadbooks/:id/sessions
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Object} - Newly created session
 */
const createSession = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Create session data with the current user as apprentice
        const sessionData = {
            ...req.body,
            roadbookId: id,
            apprenticeId: userId
        };
        // Create the session with access check
        const newSession = await roadbookService.createSession(sessionData, userId);
        res.status(201).json({
            status: "success",
            data: newSession
        });
    }
    catch (error) {
        console.error(`Error creating session for roadbook ${req.params.id}:`, error);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to add sessions to this roadbook"
            });
        }
        next(error);
    }
};
exports.createSession = createSession;
/**
 * Update roadbook status (active, completed, archived)
 *
 * @route PATCH /api/roadbooks/:id/status
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Object} - Updated roadbook
 */
const updateRoadbookStatus = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        if (!status || !["ACTIVE", "COMPLETED", "ARCHIVED"].includes(status)) {
            return res.status(400).json({
                status: "error",
                message: "Valid status is required (ACTIVE, COMPLETED, or ARCHIVED)"
            });
        }
        // Update roadbook status with access check
        const updatedRoadbook = await roadbookService.updateRoadbookStatus(id, status, userId);
        res.status(200).json({
            status: "success",
            data: updatedRoadbook
        });
    }
    catch (error) {
        console.error(`Error updating roadbook status ${req.params.id}:`, error);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to update this roadbook"
            });
        }
        next(error);
    }
};
exports.updateRoadbookStatus = updateRoadbookStatus;
/**
 * Get all sessions for a roadbook
 *
 * @route GET /api/roadbooks/:id/sessions
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Array} - List of sessions in the roadbook
 */
const getRoadbookSessions = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Get sessions with access check
        const sessions = await roadbookService.getRoadbookSessions(id, userId);
        res.status(200).json({
            status: "success",
            data: sessions
        });
    }
    catch (error) {
        console.error(`Error fetching sessions for roadbook ${req.params.id}:`, error);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to view this roadbook's sessions"
            });
        }
        next(error);
    }
};
exports.getRoadbookSessions = getRoadbookSessions;
/**
 * Get competency progress for a roadbook
 *
 * @route GET /api/roadbooks/:id/competencies
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Array} - List of competency progress records
 */
const getCompetencyProgress = async (req, res, next) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Get competency progress with access check
        const progress = await roadbookService.getCompetencyProgress(id, userId);
        res.status(200).json({
            status: "success",
            data: progress
        });
    }
    catch (error) {
        console.error(`Error fetching competency progress for roadbook ${req.params.id}:`, error);
        if (error.message === "Roadbook not found") {
            return res.status(404).json({
                status: "error",
                message: "Roadbook not found"
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to view this roadbook's competency progress"
            });
        }
        next(error);
    }
};
exports.getCompetencyProgress = getCompetencyProgress;
/**
 * Update competency progress status
 *
 * @route PATCH /api/roadbooks/:id/competencies/:competencyId
 * @access Private - Requires authentication and guide role
 * @returns {Object} - Updated competency progress
 */
const updateCompetencyStatus = async (req, res, next) => {
    var _a, _b;
    try {
        const { id, competencyId } = req.params;
        const { status, notes } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID not found in token"
            });
        }
        // Only guides, instructors and admins can update competency status
        if (userRole !== "GUIDE" && userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
            return res.status(403).json({
                status: "error",
                message: "Only guides, instructors and admins can update competency status"
            });
        }
        if (!status || !["NOT_STARTED", "IN_PROGRESS", "MASTERED"].includes(status)) {
            return res.status(400).json({
                status: "error",
                message: "Valid status is required (NOT_STARTED, IN_PROGRESS, or MASTERED)"
            });
        }
        // Update competency status with access check
        const updatedProgress = await roadbookService.updateCompetencyStatus(id, competencyId, status, notes || null, userId);
        res.status(200).json({
            status: "success",
            data: updatedProgress
        });
    }
    catch (error) {
        console.error(`Error updating competency status for roadbook ${req.params.id}:`, error);
        if (error.message === "Roadbook not found" || error.message === "Competency not found") {
            return res.status(404).json({
                status: "error",
                message: error.message
            });
        }
        if (error.message === "Unauthorized access") {
            return res.status(403).json({
                status: "error",
                message: "You don't have permission to update competencies in this roadbook"
            });
        }
        next(error);
    }
};
exports.updateCompetencyStatus = updateCompetencyStatus;
