"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompetencyStatus = exports.getCompetencyProgress = exports.getRoadbookSessions = exports.updateRoadbookStatus = exports.createSession = exports.getGuidedRoadbooks = exports.assignGuide = exports.deleteRoadbook = exports.updateRoadbook = exports.getRoadbookById = exports.createRoadbook = exports.getRoadbooksByUserId = void 0;
/**
 * RoadBook Service
 * Implements business logic for roadbook-related operations
 */
const prisma_1 = __importDefault(require("../config/prisma"));
/**
 * Get all roadbooks for a specific user
 *
 * @param userId - ID of the user
 * @param status - Optional filter by roadbook status
 * @returns Array of roadbooks
 */
const getRoadbooksByUserId = async (userId, status) => {
    try {
        // Build where clause with user ID and optional status filter
        const where = {
            apprenticeId: userId
        };
        if (status) {
            where.status = status;
        }
        // Query roadbooks with filtering
        const roadbooks = await prisma_1.default.roadBook.findMany({
            where,
            include: {
                // Include relations needed for the UI
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                // Count sessions
                _count: {
                    select: {
                        sessions: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return roadbooks;
    }
    catch (error) {
        console.error(`Error fetching roadbooks for user ${userId}:`, error);
        throw error;
    }
};
exports.getRoadbooksByUserId = getRoadbooksByUserId;
/**
 * Create a new roadbook
 *
 * @param data - Roadbook data including apprenticeId
 * @returns Newly created roadbook
 */
const createRoadbook = async (data) => {
    try {
        // Create roadbook record
        const roadbook = await prisma_1.default.roadBook.create({
            data: {
                title: data.title,
                description: data.description,
                status: data.status || 'ACTIVE',
                targetHours: data.targetHours || 30,
                apprenticeId: data.apprenticeId,
                guideId: data.guideId // Optional guide ID
            },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                }
            }
        });
        // Note: Competency initialization code removed as it's not in the current schema
        // This will be re-added when competency models are defined in the Prisma schema
        return roadbook;
    }
    catch (error) {
        console.error("Error creating roadbook:", error);
        throw error;
    }
};
exports.createRoadbook = createRoadbook;
/**
 * Get a specific roadbook by ID with access control check
 *
 * @param id - Roadbook ID
 * @param userId - User ID of the requestor
 * @returns Roadbook details if user has access
 */
const getRoadbookById = async (id, userId) => {
    try {
        // First, fetch the roadbook with all relevant data
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                sessions: {
                    orderBy: { date: 'desc' },
                    include: {
                        apprentice: {
                            select: {
                                id: true,
                                displayName: true
                            }
                        },
                        validator: {
                            select: {
                                id: true,
                                displayName: true
                            }
                        }
                    }
                }
                // Note: competencyProgress relation removed as it's not in the current schema
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Check if the user has permission to view this roadbook
        // Allow access if user is the apprentice (owner) or the guide
        if (roadbook.apprenticeId !== userId && roadbook.guideId !== userId) {
            // Check if the user is an admin - admins can access all roadbooks
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Unauthorized access");
            }
        }
        return roadbook;
    }
    catch (error) {
        console.error(`Error fetching roadbook ${id}:`, error);
        throw error;
    }
};
exports.getRoadbookById = getRoadbookById;
/**
 * Update a roadbook with access control check
 *
 * @param id - Roadbook ID to update
 * @param data - Updated roadbook data
 * @param userId - User ID of the requestor
 * @returns Updated roadbook
 */
const updateRoadbook = async (id, data, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            select: {
                apprenticeId: true,
                guideId: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Only the roadbook owner (apprentice) or an admin can update the roadbook
        if (roadbook.apprenticeId !== userId) {
            // Check if user is admin
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Unauthorized access");
            }
        }
        // Update the roadbook
        const updatedRoadbook = await prisma_1.default.roadBook.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                targetHours: data.targetHours,
                // Don't allow changing ownership through update
                // Don't update status here (use dedicated status update function)
            },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                }
            }
        });
        return updatedRoadbook;
    }
    catch (error) {
        console.error(`Error updating roadbook ${id}:`, error);
        throw error;
    }
};
exports.updateRoadbook = updateRoadbook;
/**
 * Delete a roadbook with access control check
 *
 * @param id - Roadbook ID to delete
 * @param userId - User ID of the requestor
 */
const deleteRoadbook = async (id, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            select: {
                apprenticeId: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Only the roadbook owner (apprentice) or an admin can delete the roadbook
        if (roadbook.apprenticeId !== userId) {
            // Check if user is admin
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Unauthorized access");
            }
        }
        // First delete related records to avoid foreign key constraints
        // Get sessions for this roadbook
        const sessions = await prisma_1.default.session.findMany({
            where: { roadbookId: id },
            select: { id: true }
        });
        if (sessions.length > 0) {
            // Delete sessions
            await prisma_1.default.session.deleteMany({
                where: { roadbookId: id }
            });
        }
        // Note: Competency and comment relations removed as they're not in the current schema
        // Finally, delete the roadbook
        await prisma_1.default.roadBook.delete({
            where: { id }
        });
        return true;
    }
    catch (error) {
        console.error(`Error deleting roadbook ${id}:`, error);
        throw error;
    }
};
exports.deleteRoadbook = deleteRoadbook;
/**
 * Assign a guide to a roadbook with access control check
 *
 * @param id - Roadbook ID
 * @param guideId - ID of the guide to assign
 * @param userId - User ID of the requestor
 * @returns Updated roadbook with guide information
 */
const assignGuide = async (id, guideId, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            select: {
                apprenticeId: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Only the roadbook owner (apprentice) or an admin can assign a guide
        if (roadbook.apprenticeId !== userId) {
            // Check if user is admin
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Unauthorized access");
            }
        }
        // Verify that the guide exists and has the correct role
        const guide = await prisma_1.default.user.findUnique({
            where: { id: guideId },
            select: { id: true, role: true }
        });
        if (!guide) {
            throw new Error("Guide not found");
        }
        if (!['GUIDE', 'INSTRUCTOR', 'ADMIN'].includes(guide.role)) {
            throw new Error("Invalid guide role");
        }
        // Update the roadbook with the new guide
        const updatedRoadbook = await prisma_1.default.roadBook.update({
            where: { id },
            data: {
                guideId
            },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                }
            }
        });
        return updatedRoadbook;
    }
    catch (error) {
        console.error(`Error assigning guide to roadbook ${id}:`, error);
        throw error;
    }
};
exports.assignGuide = assignGuide;
/**
 * Get roadbooks where user is assigned as a guide
 *
 * @param userId - Guide user ID
 * @param status - Optional filter by roadbook status
 * @returns Array of roadbooks where user is a guide
 */
const getGuidedRoadbooks = async (userId, status) => {
    try {
        // Build where clause with guide ID and optional status filter
        const where = {
            guideId: userId
        };
        if (status) {
            where.status = status;
        }
        // Query roadbooks where user is assigned as guide
        const roadbooks = await prisma_1.default.roadBook.findMany({
            where,
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                // Count sessions
                _count: {
                    select: {
                        sessions: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return roadbooks;
    }
    catch (error) {
        console.error(`Error fetching guided roadbooks for user ${userId}:`, error);
        throw error;
    }
};
exports.getGuidedRoadbooks = getGuidedRoadbooks;
/**
 * Create a new session in a roadbook with access control check
 *
 * @param data - Session data
 * @param userId - User ID of the requestor
 * @returns Newly created session
 */
const createSession = async (data, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: data.roadbookId },
            select: {
                apprenticeId: true,
                guideId: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Only the roadbook owner (apprentice) or the assigned guide can create sessions
        if (roadbook.apprenticeId !== userId && roadbook.guideId !== userId) {
            // Check if user is admin
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Unauthorized access");
            }
        }
        // Create the session
        const session = await prisma_1.default.session.create({
            data: {
                roadbookId: data.roadbookId,
                date: new Date(data.date),
                startTime: new Date(data.startTime),
                endTime: data.endTime ? new Date(data.endTime) : undefined,
                duration: data.duration,
                startLocation: data.startLocation,
                endLocation: data.endLocation,
                distance: data.distance,
                routeData: data.routeData,
                weather: data.weather,
                daylight: data.daylight,
                roadTypes: data.roadTypes || [],
                notes: data.notes,
                apprenticeId: data.apprenticeId,
                validatorId: data.validatorId,
                validationDate: data.validationDate ? new Date(data.validationDate) : undefined
            },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true
                    }
                }
            }
        });
        return session;
    }
    catch (error) {
        console.error(`Error creating session for roadbook ${data.roadbookId}:`, error);
        throw error;
    }
};
exports.createSession = createSession;
/**
 * Update roadbook status with access control check
 *
 * @param id - Roadbook ID
 * @param status - New status (ACTIVE, COMPLETED, ARCHIVED)
 * @param userId - User ID of the requestor
 * @returns Updated roadbook
 */
const updateRoadbookStatus = async (id, status, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            select: {
                apprenticeId: true,
                guideId: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Both the apprentice and guide can update the status
        if (roadbook.apprenticeId !== userId && roadbook.guideId !== userId) {
            // Check if user is admin
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Unauthorized access");
            }
        }
        // Update the roadbook status
        const updatedRoadbook = await prisma_1.default.roadBook.update({
            where: { id },
            data: {
                status: status
            },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        profilePicture: true
                    }
                }
            }
        });
        return updatedRoadbook;
    }
    catch (error) {
        console.error(`Error updating roadbook status ${id}:`, error);
        throw error;
    }
};
exports.updateRoadbookStatus = updateRoadbookStatus;
/**
 * Get all sessions for a roadbook with access control check
 *
 * @param id - Roadbook ID
 * @param userId - User ID of the requestor
 * @returns Array of sessions
 */
const getRoadbookSessions = async (id, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            select: {
                apprenticeId: true,
                guideId: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Both the apprentice and guide can view sessions
        if (roadbook.apprenticeId !== userId && roadbook.guideId !== userId) {
            // Check if user is admin
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Unauthorized access");
            }
        }
        // Get sessions
        const sessions = await prisma_1.default.session.findMany({
            where: { roadbookId: id },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true
                    }
                },
                // competencyValidations relation removed as it's not in the current schema
            },
            orderBy: { date: 'desc' }
        });
        return sessions;
    }
    catch (error) {
        console.error(`Error fetching sessions for roadbook ${id}:`, error);
        throw error;
    }
};
exports.getRoadbookSessions = getRoadbookSessions;
/**
 * Get competency progress for a roadbook with access control check
 *
 * @param id - Roadbook ID
 * @param userId - User ID of the requestor
 * @returns Object with competency progress information
 */
const getCompetencyProgress = async (id, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            select: {
                apprenticeId: true,
                guideId: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Both the apprentice and guide can view competency progress
        if (roadbook.apprenticeId !== userId && roadbook.guideId !== userId) {
            // Check if user is admin
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || user.role !== 'ADMIN') {
                throw new Error("Unauthorized access");
            }
        }
        // Note: Actual competency progress fetching code removed as it's not in the current schema
        // For now, return an empty array to make the frontend happy
        return [];
    }
    catch (error) {
        console.error(`Error fetching competency progress for roadbook ${id}:`, error);
        throw error;
    }
};
exports.getCompetencyProgress = getCompetencyProgress;
/**
 * Update competency status with access control check
 *
 * @param roadbookId - Roadbook ID
 * @param competencyId - Competency ID
 * @param status - New status
 * @param notes - Optional notes about the progress
 * @param userId - User ID of the requestor
 * @returns Mock competency progress object
 */
const updateCompetencyStatus = async (roadbookId, competencyId, status, notes, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: roadbookId },
            select: {
                apprenticeId: true,
                guideId: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Only guides/admins can update competency progress
        if (roadbook.guideId !== userId) {
            // Check if user is admin
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
                throw new Error("Unauthorized access");
            }
        }
        // Note: Actual competency update code removed as it's not in the current schema
        // Instead, return a mock response to make the frontend happy
        return {
            id: "mock-id",
            roadbookId: roadbookId,
            competencyId: competencyId,
            status: status,
            notes: notes,
            lastPracticed: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            apprenticeId: roadbook.apprenticeId
        };
    }
    catch (error) {
        console.error(`Error updating competency progress for roadbook ${roadbookId}:`, error);
        throw error;
    }
};
exports.updateCompetencyStatus = updateCompetencyStatus;
