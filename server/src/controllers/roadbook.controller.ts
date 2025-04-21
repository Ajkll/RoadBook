/**
 * RoadBook Controller
 * Handles all roadbook-related operations
 */
import { Request, Response, NextFunction } from "express";
import * as roadbookService from "../services/roadbook.service";

// Define the JwtRequest interface locally since it's not exported from auth.middleware
interface JwtRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email?: string;
    displayName?: string;
  };
}

/**
 * Get all roadbooks belonging to the logged-in user
 * 
 * @route GET /api/roadbooks
 * @access Private - Requires authentication
 * @returns {Array} - List of roadbooks owned by the user
 */
export const getUserRoadbooks = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    // Extract user ID from the authenticated JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        status: "error", 
        message: "User ID not found in token" 
      });
    }

    // Get the optional status filter from query params
    const status = req.query.status as string;

    // Get user's roadbooks with optional filters
    const roadbooks = await roadbookService.getRoadbooksByUserId(userId, status);
    
    res.status(200).json({
      status: "success",
      data: roadbooks
    });
  } catch (error: any) {
    console.error("Error fetching user roadbooks:", error);
    next(error);
  }
};

/**
 * Create a new roadbook
 * 
 * @route POST /api/roadbooks
 * @access Private - Requires authentication
 * @returns {Object} - Newly created roadbook
 */
export const createRoadbook = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    // Extract user ID from the authenticated JWT token
    const userId = req.user?.userId;
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
  } catch (error: any) {
    console.error("Error creating roadbook:", error);
    next(error);
  }
};

/**
 * Get a specific roadbook by ID
 * 
 * @route GET /api/roadbooks/:id
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Object} - Roadbook details with sessions
 */
export const getRoadbookById = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
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
  } catch (error: any) {
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

/**
 * Update a roadbook
 * 
 * @route PUT /api/roadbooks/:id
 * @access Private - Requires authentication and ownership
 * @returns {Object} - Updated roadbook
 */
export const updateRoadbook = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
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
  } catch (error: any) {
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

/**
 * Delete a roadbook
 * 
 * @route DELETE /api/roadbooks/:id
 * @access Private - Requires authentication and ownership
 * @returns {Object} - Success message
 */
export const deleteRoadbook = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
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
  } catch (error: any) {
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

/**
 * Assign a guide to a roadbook
 * 
 * @route POST /api/roadbooks/:id/guide
 * @access Private - Requires authentication and ownership
 * @returns {Object} - Updated roadbook with guide information
 */
export const assignGuide = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { guideId } = req.body;
    const userId = req.user?.userId;
    
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
  } catch (error: any) {
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

/**
 * Get guided roadbooks (for guides only)
 * 
 * @route GET /api/roadbooks/guided
 * @access Private - Requires authentication and GUIDE role
 * @returns {Array} - List of roadbooks where user is a guide
 */
export const getGuidedRoadbooks = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
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
    const status = req.query.status as string;

    // Get list of roadbooks where user is a guide
    const guidedRoadbooks = await roadbookService.getGuidedRoadbooks(userId, status);
    
    res.status(200).json({
      status: "success",
      data: guidedRoadbooks
    });
  } catch (error: any) {
    console.error("Error fetching guided roadbooks:", error);
    next(error);
  }
};

/**
 * Create a new session in a roadbook
 * 
 * @route POST /api/roadbooks/:id/sessions
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Object} - Newly created session
 */
export const createSession = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
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
  } catch (error: any) {
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

/**
 * Update roadbook status (active, completed, archived)
 * 
 * @route PATCH /api/roadbooks/:id/status
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Object} - Updated roadbook
 */
export const updateRoadbookStatus = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    
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
  } catch (error: any) {
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

/**
 * Get all sessions for a roadbook
 * 
 * @route GET /api/roadbooks/:id/sessions
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Array} - List of sessions in the roadbook
 */
export const getRoadbookSessions = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
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
  } catch (error: any) {
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

/**
 * Get competency progress for a roadbook
 * 
 * @route GET /api/roadbooks/:id/competencies
 * @access Private - Requires authentication and ownership or guide role
 * @returns {Array} - List of competency progress records
 */
export const getCompetencyProgress = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
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
  } catch (error: any) {
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

/**
 * Update competency progress status
 * 
 * @route PATCH /api/roadbooks/:id/competencies/:competencyId
 * @access Private - Requires authentication and guide role
 * @returns {Object} - Updated competency progress
 */
export const updateCompetencyStatus = async (req: JwtRequest, res: Response, next: NextFunction) => {
  try {
    const { id, competencyId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
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
    const updatedProgress = await roadbookService.updateCompetencyStatus(
      id, 
      competencyId, 
      status, 
      notes || null, 
      userId
    );
    
    res.status(200).json({
      status: "success",
      data: updatedProgress
    });
  } catch (error: any) {
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