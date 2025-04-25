"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompetencyStatus = exports.prepareRoadbookExportData = exports.getCompetencyProgress = exports.getRoadbookSessions = exports.updateRoadbookStatus = exports.createSession = exports.getGuidedRoadbooks = exports.assignGuide = exports.deleteRoadbook = exports.updateRoadbook = exports.getRoadbookById = exports.calculateRoadbookStatistics = exports.createRoadbook = exports.getRoadbooksByUserId = void 0;
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
 * Calcul des statistiques détaillées du roadbook
 *
 * @param roadbookId - ID du roadbook
 * @returns Statistiques du roadbook
 */
const calculateRoadbookStatistics = async (roadbookId) => {
    try {
        // Récupérer le roadbook pour les informations de base
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: roadbookId },
            select: {
                targetHours: true,
                status: true,
                createdAt: true
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Récupérer toutes les sessions pour calculer les métriques
        const sessions = await prisma_1.default.session.findMany({
            where: { roadbookId },
            select: {
                id: true,
                duration: true,
                distance: true,
                weather: true,
                daylight: true,
                roadTypes: true,
                date: true
            }
        });
        // Calculer les statistiques de base
        const totalSessions = sessions.length;
        const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const totalDistance = sessions.reduce((sum, session) => sum + (session.distance || 0), 0);
        // Calculer le pourcentage d'achèvement des heures
        const targetMinutes = (roadbook.targetHours || 30) * 60;
        const completionPercentage = Math.min(100, Math.round((totalDuration / targetMinutes) * 100));
        // Calcul des distributions
        const weatherDistribution = sessions.reduce((dist, session) => {
            const weather = session.weather || 'UNKNOWN';
            dist[weather] = (dist[weather] || 0) + 1;
            return dist;
        }, {});
        const daylightDistribution = sessions.reduce((dist, session) => {
            const daylight = session.daylight || 'UNKNOWN';
            dist[daylight] = (dist[daylight] || 0) + 1;
            return dist;
        }, {});
        // Calcul des types de routes parcourues
        const roadTypesSet = new Set();
        const roadTypesCounts = {};
        sessions.forEach(session => {
            (session.roadTypes || []).forEach(type => {
                roadTypesSet.add(type);
                roadTypesCounts[type] = (roadTypesCounts[type] || 0) + 1;
            });
        });
        // Durée moyenne des sessions (en minutes)
        const averageSessionDuration = totalSessions > 0
            ? Math.round(totalDuration / totalSessions)
            : 0;
        // Distance moyenne par session (en km)
        const averageSessionDistance = totalSessions > 0
            ? Math.round((totalDistance / totalSessions) * 10) / 10
            : 0;
        // Identifier les périodes d'inactivité (plus de 14 jours sans session)
        let inactivityPeriods = 0;
        let lastSessionDate = null;
        // Trier les sessions par date
        const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Calculer les périodes d'inactivité
        for (const session of sortedSessions) {
            if (lastSessionDate) {
                const daysDiff = Math.floor((new Date(session.date).getTime() - new Date(lastSessionDate).getTime()) /
                    (1000 * 60 * 60 * 24));
                if (daysDiff > 14) {
                    inactivityPeriods++;
                }
            }
            lastSessionDate = new Date(session.date);
        }
        // Calculer la durée totale (en jours) depuis la création du roadbook
        const daysSinceCreation = Math.floor((new Date().getTime() - new Date(roadbook.createdAt).getTime()) /
            (1000 * 60 * 60 * 24));
        // Assembler toutes les statistiques
        return {
            summary: {
                totalSessions,
                totalDurationMinutes: totalDuration,
                totalDurationHours: Math.round(totalDuration / 60 * 10) / 10,
                totalDistanceKm: Math.round(totalDistance * 10) / 10,
                completionPercentage,
                targetHours: roadbook.targetHours || 30,
                hoursRemaining: Math.max(0, roadbook.targetHours - (totalDuration / 60)),
                status: roadbook.status
            },
            averages: {
                sessionDurationMinutes: averageSessionDuration,
                sessionDistanceKm: averageSessionDistance
            },
            distributions: {
                weather: weatherDistribution,
                daylight: daylightDistribution,
                roadTypes: roadTypesCounts
            },
            timeline: {
                daysSinceCreation,
                inactivityPeriods,
                lastSessionDate: (lastSessionDate === null || lastSessionDate === void 0 ? void 0 : lastSessionDate.toISOString()) || null
            }
        };
    }
    catch (error) {
        console.error(`Error calculating roadbook statistics for ${roadbookId}:`, error);
        throw error;
    }
};
exports.calculateRoadbookStatistics = calculateRoadbookStatistics;
/**
 * Get a specific roadbook by ID with access control check and enriched statistics
 *
 * @param id - Roadbook ID
 * @param userId - User ID of the requestor
 * @param includeStats - Whether to include detailed statistics
 * @returns Roadbook details if user has access, with optional statistics
 */
const getRoadbookById = async (id, userId, includeStats = false) => {
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
        // Si statistiques demandées, les calculer et les ajouter au résultat
        if (includeStats) {
            const statistics = await (0, exports.calculateRoadbookStatistics)(id);
            // Calculer les métriques de validation des sessions
            const validatedSessionsCount = roadbook.sessions.filter(session => session.validatorId !== null && session.validationDate !== null).length;
            const validationRate = roadbook.sessions.length > 0
                ? Math.round((validatedSessionsCount / roadbook.sessions.length) * 100)
                : 0;
            // Ajouter les statistiques au roadbook
            return {
                ...roadbook,
                _stats: {
                    ...statistics,
                    validation: {
                        validatedSessions: validatedSessionsCount,
                        totalSessions: roadbook.sessions.length,
                        validationRate
                    }
                }
            };
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
 * Machine à états pour les transitions de statut du roadbook
 *
 * Cette machine définit les transitions valides entre les différents états:
 * - ACTIVE: État initial, le roadbook est en cours d'utilisation
 * - COMPLETED: Le roadbook est terminé mais pas encore archivé
 * - ARCHIVED: Le roadbook est archivé et ne peut plus être modifié
 *
 * Les transitions valides sont:
 * - ACTIVE → COMPLETED
 * - COMPLETED → ARCHIVED
 * - COMPLETED → ACTIVE (réactivation)
 * - ARCHIVED → ACTIVE (dans certains cas administratifs seulement)
 */
const roadbookStateMachine = {
    ACTIVE: ['COMPLETED'],
    COMPLETED: ['ARCHIVED', 'ACTIVE'],
    ARCHIVED: ['ACTIVE'] // Généralement réservé aux admins
};
/**
 * Vérifie si une transition d'état est valide selon la machine à états
 *
 * @param currentStatus - Statut actuel du roadbook
 * @param newStatus - Nouveau statut demandé
 * @param userRole - Rôle de l'utilisateur qui fait la demande
 * @returns Booléen indiquant si la transition est valide
 */
const isValidStatusTransition = (currentStatus, newStatus, userRole) => {
    // Si c'est déjà le même statut, c'est valide
    if (currentStatus === newStatus)
        return true;
    // Vérifier si la transition est autorisée selon la machine à états
    const allowedTransitions = roadbookStateMachine[currentStatus] || [];
    // La transition est permise par la machine à états
    if (allowedTransitions.includes(newStatus)) {
        return true;
    }
    // Cas spécial: les admins peuvent faire des transitions exceptionnelles
    if (userRole === 'ADMIN') {
        return true;
    }
    return false;
};
/**
 * Vérifie les conditions métier pour permettre une transition d'état
 *
 * @param id - ID du roadbook
 * @param currentStatus - Statut actuel
 * @param newStatus - Nouveau statut demandé
 * @returns Booléen indiquant si les conditions métier sont remplies
 */
const validateStatusTransitionConditions = async (id, currentStatus, newStatus) => {
    // Transition vers COMPLETED: Vérifier si les conditions sont remplies
    if (newStatus === 'COMPLETED' && currentStatus === 'ACTIVE') {
        // 1. Vérifier que le roadbook a des sessions (pas de roadbook vide)
        const sessionsCount = await prisma_1.default.session.count({
            where: { roadbookId: id }
        });
        if (sessionsCount === 0) {
            return {
                valid: false,
                message: "Cannot complete a roadbook with no sessions"
            };
        }
        // 2. Vérifier que le roadbook a un guide assigné
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            select: { guideId: true, targetHours: true }
        });
        if (!(roadbook === null || roadbook === void 0 ? void 0 : roadbook.guideId)) {
            return {
                valid: false,
                message: "Cannot complete a roadbook without an assigned guide"
            };
        }
        // 3. Vérification optionnelle: calculer si l'objectif d'heures est atteint
        const totalDuration = await calculateTotalDuration(id);
        const targetHours = roadbook.targetHours || 30;
        const targetMinutes = targetHours * 60;
        if (totalDuration < targetMinutes) {
            return {
                valid: false,
                message: `Target hours not reached (${Math.floor(totalDuration / 60)}h/${targetHours}h)`
            };
        }
    }
    // Transition vers ARCHIVED: d'autres vérifications pourraient être ajoutées ici
    if (newStatus === 'ARCHIVED' && currentStatus === 'COMPLETED') {
        // Ici on pourrait vérifier si toutes les compétences sont validées, par exemple
    }
    return { valid: true };
};
/**
 * Calcule la durée totale des sessions d'un roadbook en minutes
 *
 * @param roadbookId - ID du roadbook
 * @returns Durée totale en minutes
 */
const calculateTotalDuration = async (roadbookId) => {
    const sessions = await prisma_1.default.session.findMany({
        where: { roadbookId },
        select: { duration: true }
    });
    return sessions.reduce((total, session) => {
        return total + (session.duration || 0);
    }, 0);
};
/**
 * Update roadbook status with access control check and state machine validation
 *
 * @param id - Roadbook ID
 * @param status - New status (ACTIVE, COMPLETED, ARCHIVED)
 * @param userId - User ID of the requestor
 * @returns Updated roadbook with metadata about the transition
 */
const updateRoadbookStatus = async (id, status, userId) => {
    try {
        // First, check if the roadbook exists and if the user has permission
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
                }
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Get user role for permission checking and state machine validation
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (!user) {
            throw new Error("User not found");
        }
        // Both the apprentice and guide can update the status
        if (roadbook.apprenticeId !== userId && roadbook.guideId !== userId && user.role !== 'ADMIN') {
            throw new Error("Unauthorized access");
        }
        // Vérifier si la transition d'état est valide selon la machine à états
        if (!isValidStatusTransition(roadbook.status, status, user.role)) {
            throw new Error(`Invalid status transition from ${roadbook.status} to ${status}`);
        }
        // Vérifier les conditions métier pour cette transition
        const conditionCheck = await validateStatusTransitionConditions(id, roadbook.status, status);
        if (!conditionCheck.valid) {
            throw new Error(conditionCheck.message || "Cannot update status - business rules not met");
        }
        // Tout est OK, on peut mettre à jour le statut du roadbook
        const updatedRoadbook = await prisma_1.default.roadBook.update({
            where: { id },
            data: {
                status: status,
                // Si on passe à COMPLETED, on enregistre la date de complétion
                ...(status === 'COMPLETED' && { lastSignatureDate: new Date() })
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
        // Calculer les statistiques pour les ajouter à la réponse
        const stats = {
            totalSessions: await prisma_1.default.session.count({ where: { roadbookId: id } }),
            totalDuration: await calculateTotalDuration(id),
            lastUpdateTimestamp: new Date().toISOString()
        };
        return {
            ...updatedRoadbook,
            _stats: stats
        };
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
 * Prépare les données complètes pour l'exportation PDF du roadbook
 *
 * @param id - ID du roadbook
 * @param userId - ID de l'utilisateur faisant la demande
 * @returns Données complètes du roadbook pour l'exportation
 */
const prepareRoadbookExportData = async (id, userId) => {
    try {
        // Récupérer le roadbook avec ses données complètes
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        nationalRegisterNumber: true,
                        birthDate: true,
                        phoneNumber: true,
                        address: true
                    }
                },
                guide: {
                    select: {
                        id: true,
                        displayName: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true
                    }
                },
                sessions: {
                    orderBy: { date: 'asc' }, // Ordre chronologique pour l'exportation
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
                                displayName: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });
        if (!roadbook) {
            throw new Error("Roadbook not found");
        }
        // Vérification des permissions
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
        // Calcul des statistiques globales
        const statistics = await (0, exports.calculateRoadbookStatistics)(id);
        // Formatage des sessions pour une meilleure lisibilité dans le PDF
        const formattedSessions = roadbook.sessions.map(session => {
            // Calculer la date au format local
            const sessionDate = new Date(session.date).toLocaleDateString('fr-BE');
            // Calculer la durée en format heures:minutes
            const durationHours = Math.floor((session.duration || 0) / 60);
            const durationMinutes = (session.duration || 0) % 60;
            const formattedDuration = `${durationHours}h${durationMinutes.toString().padStart(2, '0')}`;
            // Déterminer si la session est validée
            const isValidated = session.validatorId !== null && session.validationDate !== null;
            return {
                ...session,
                formattedDate: sessionDate,
                formattedDuration,
                formattedStartTime: new Date(session.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }),
                formattedEndTime: session.endTime ? new Date(session.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }) : null,
                isValidated,
                validatorName: session.validator ? `${session.validator.firstName || ''} ${session.validator.lastName || ''}`.trim() || session.validator.displayName : null,
                validationDate: session.validationDate ? new Date(session.validationDate).toLocaleDateString('fr-BE') : null
            };
        });
        // Marquer l'exportation
        const now = new Date();
        await prisma_1.default.roadBook.update({
            where: { id },
            data: {
                lastExportDate: now
            }
        });
        // Résumé des compétences (sera remplacé quand les compétences seront implémentées)
        const competencySummary = {
            totalCompetencies: 0,
            masteredCompetencies: 0,
            inProgressCompetencies: 0,
            notStartedCompetencies: 0,
            masteryPercentage: 0
        };
        // Rassembler toutes les données pour l'exportation
        return {
            exportInfo: {
                generatedAt: now.toISOString(),
                exportVersion: "1.0",
            },
            roadbook: {
                ...roadbook,
                createdAtFormatted: new Date(roadbook.createdAt).toLocaleDateString('fr-BE'),
                updatedAtFormatted: new Date(roadbook.updatedAt).toLocaleDateString('fr-BE'),
                lastExportDateFormatted: now.toLocaleDateString('fr-BE')
            },
            sessions: formattedSessions,
            statistics,
            competencySummary,
            // Ajouter d'autres sections selon les besoins
        };
    }
    catch (error) {
        console.error(`Error preparing roadbook export data for ${id}:`, error);
        throw error;
    }
};
exports.prepareRoadbookExportData = prepareRoadbookExportData;
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
