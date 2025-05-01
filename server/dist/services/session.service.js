"use strict";
/**
 * SESSION SERVICE
 *
 * Ce service gère toutes les opérations liées aux sessions de conduite:
 * - Création de sessions (départ, arrivée, durée, météo, etc.)
 * - Récupération des sessions (par ID, roadbook, apprenti)
 * - Mise à jour des informations de session
 * - Validation des sessions par les guides/instructeurs
 * - Suppression des sessions
 * - Calcul de statistiques (distance totale, durée, vitesse moyenne, etc.)
 *
 * Les sessions sont au cœur du suivi de l'apprentissage de la conduite.
 * Elles enregistrent chaque trajet effectué avec les conditions rencontrées.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSessionStatistics = exports.addSessionComment = exports.getSessionsByRoadbook = exports.getSessionsByApprentice = exports.deleteSession = exports.validateSession = exports.updateSession = exports.checkSessionAccess = exports.getSessionById = exports.createSession = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Créer une nouvelle session
 *
 * @param data - Données de la session
 * @returns Session créée
 */
const createSession = async (data) => {
    try {
        logger_1.default.info(`Création d'une nouvelle session pour le roadbook: ${data.roadbookId}`);
        // Vérifier si le roadbook existe
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: data.roadbookId }
        });
        if (!roadbook) {
            throw new Error('Roadbook not found');
        }
        // Vérifier si l'apprenti existe
        const apprentice = await prisma_1.default.user.findUnique({
            where: { id: data.apprenticeId }
        });
        if (!apprentice) {
            throw new Error('Apprentice not found');
        }
        // Vérifier si le validateur existe (si fourni)
        if (data.validatorId) {
            const validator = await prisma_1.default.user.findUnique({
                where: { id: data.validatorId }
            });
            if (!validator) {
                throw new Error('Validator not found');
            }
            // Si le validateur est fourni, mais pas la date de validation, l'ajouter
            if (!data.validationDate) {
                data.validationDate = new Date();
            }
        }
        // Créer la session dans la base de données
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
                        displayName: true,
                        profilePicture: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                }
            }
        });
        logger_1.default.info(`Session créée avec succès: ${session.id}`);
        return session;
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de la création de la session: ${error}`);
        throw error;
    }
};
exports.createSession = createSession;
/**
 * Obtenir une session par son ID
 *
 * @param id - ID de la session
 * @returns Session avec ses relations
 */
const getSessionById = async (id) => {
    try {
        const session = await prisma_1.default.session.findUnique({
            where: { id },
            include: {
                roadbook: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        apprenticeId: true,
                        guideId: true
                    }
                },
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                },
                competencyValidations: {
                    include: {
                        competency: true,
                        validator: {
                            select: {
                                id: true,
                                displayName: true
                            }
                        }
                    }
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: {
                            select: {
                                id: true,
                                displayName: true,
                                profilePicture: true
                            }
                        }
                    }
                }
            }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        return session;
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de la récupération de la session ${id}: ${error}`);
        throw error;
    }
};
exports.getSessionById = getSessionById;
/**
 * Vérifier si un utilisateur a accès à une session
 *
 * @param sessionId - ID de la session
 * @param userId - ID de l'utilisateur
 * @returns Boolean indiquant si l'utilisateur a accès
 */
const checkSessionAccess = async (sessionId, userId) => {
    try {
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            include: {
                roadbook: {
                    select: {
                        apprenticeId: true,
                        guideId: true
                    }
                }
            }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        // Vérifier si l'utilisateur est l'apprenti ou le guide du roadbook
        if (session.roadbook.apprenticeId === userId || session.roadbook.guideId === userId) {
            return true;
        }
        // Vérifier si l'utilisateur est admin
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        return (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de la vérification d'accès à la session ${sessionId}: ${error}`);
        throw error;
    }
};
exports.checkSessionAccess = checkSessionAccess;
/**
 * Mettre à jour une session existante
 *
 * @param id - ID de la session
 * @param data - Données à mettre à jour
 * @param userId - ID de l'utilisateur effectuant la mise à jour
 * @returns Session mise à jour
 */
const updateSession = async (id, data, userId) => {
    try {
        logger_1.default.info(`Mise à jour de la session ${id} par l'utilisateur ${userId}`);
        // Vérifier si la session existe
        const session = await prisma_1.default.session.findUnique({
            where: { id },
            include: {
                roadbook: {
                    select: {
                        apprenticeId: true,
                        guideId: true
                    }
                }
            }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        // Vérifier les permissions
        const canUpdate = await (0, exports.checkSessionAccess)(id, userId);
        if (!canUpdate) {
            throw new Error('Unauthorized to update this session');
        }
        // Vérifier si la session n'est pas déjà validée (sauf pour les admins)
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (session.validatorId && session.validationDate && (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            throw new Error('Cannot update a validated session');
        }
        // Préparer les données à mettre à jour
        const updateData = { ...data };
        // Convertir les dates si elles sont fournies
        if (data.date)
            updateData.date = new Date(data.date);
        if (data.startTime)
            updateData.startTime = new Date(data.startTime);
        if (data.endTime)
            updateData.endTime = new Date(data.endTime);
        if (data.validationDate)
            updateData.validationDate = new Date(data.validationDate);
        // Mettre à jour la session
        const updatedSession = await prisma_1.default.session.update({
            where: { id },
            data: updateData,
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                }
            }
        });
        logger_1.default.info(`Session ${id} mise à jour avec succès`);
        return updatedSession;
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de la mise à jour de la session ${id}: ${error}`);
        throw error;
    }
};
exports.updateSession = updateSession;
/**
 * Valider une session (par un guide ou instructeur)
 *
 * @param id - ID de la session
 * @param validatorId - ID du validateur
 * @param notes - Notes optionnelles sur la validation
 * @returns Session validée
 */
const validateSession = async (id, validatorId, notes) => {
    try {
        logger_1.default.info(`Validation de la session ${id} par l'utilisateur ${validatorId}`);
        // Vérifier si la session existe
        const session = await prisma_1.default.session.findUnique({
            where: { id },
            include: {
                roadbook: {
                    select: {
                        guideId: true
                    }
                }
            }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        // Vérifier si le validateur est le guide assigné au roadbook ou un admin/instructeur
        const user = await prisma_1.default.user.findUnique({
            where: { id: validatorId },
            select: { role: true }
        });
        if (!user) {
            throw new Error('Validator not found');
        }
        const isGuide = session.roadbook.guideId === validatorId;
        const isAdminOrInstructor = user.role === 'ADMIN' || user.role === 'INSTRUCTOR';
        if (!isGuide && !isAdminOrInstructor) {
            throw new Error('Unauthorized to validate this session');
        }
        // Vérifier si la session n'est pas déjà validée (sauf pour les admins)
        if (session.validatorId && session.validationDate && user.role !== 'ADMIN') {
            throw new Error('Session is already validated');
        }
        // Mettre à jour la session avec les informations de validation
        const validatedSession = await prisma_1.default.session.update({
            where: { id },
            data: {
                validatorId,
                validationDate: new Date(),
                notes: notes ? (session.notes ? `${session.notes}\n\nValidation: ${notes}` : `Validation: ${notes}`) : session.notes
            },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                }
            }
        });
        logger_1.default.info(`Session ${id} validée avec succès`);
        return validatedSession;
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de la validation de la session ${id}: ${error}`);
        throw error;
    }
};
exports.validateSession = validateSession;
/**
 * Supprimer une session
 *
 * @param id - ID de la session
 * @param userId - ID de l'utilisateur effectuant la suppression
 * @returns Résultat de la suppression
 */
const deleteSession = async (id, userId) => {
    try {
        logger_1.default.info(`Suppression de la session ${id} par l'utilisateur ${userId}`);
        // Vérifier si la session existe
        const session = await prisma_1.default.session.findUnique({
            where: { id },
            include: {
                roadbook: {
                    select: {
                        apprenticeId: true,
                        guideId: true
                    }
                }
            }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        // Vérifier les permissions
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        const isOwner = session.roadbook.apprenticeId === userId;
        const isGuide = session.roadbook.guideId === userId;
        const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
        if (!isOwner && !isGuide && !isAdmin) {
            throw new Error('Unauthorized to delete this session');
        }
        // Vérifier si la session est validée (seuls les guides et admins peuvent supprimer une session validée)
        if (session.validatorId && session.validationDate && !isGuide && !isAdmin) {
            throw new Error('Cannot delete a validated session');
        }
        // Supprimer d'abord les entités liées à la session
        // 1. Supprimer les validations de compétences liées
        await prisma_1.default.competencyValidation.deleteMany({
            where: { sessionId: id }
        });
        // 2. Supprimer les commentaires liés
        await prisma_1.default.comment.deleteMany({
            where: { sessionId: id }
        });
        // 3. Supprimer la session
        await prisma_1.default.session.delete({
            where: { id }
        });
        logger_1.default.info(`Session ${id} supprimée avec succès`);
        return { success: true };
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de la suppression de la session ${id}: ${error}`);
        throw error;
    }
};
exports.deleteSession = deleteSession;
/**
 * Récupérer les sessions par apprenti
 *
 * @param apprenticeId - ID de l'apprenti
 * @param limit - Nombre maximum de sessions à récupérer
 * @param offset - Décalage pour la pagination
 * @returns Liste paginée des sessions
 */
const getSessionsByApprentice = async (apprenticeId, limit = 20, offset = 0) => {
    try {
        // Calculer le nombre total de sessions
        const total = await prisma_1.default.session.count({
            where: { apprenticeId }
        });
        // Récupérer les sessions avec pagination
        const sessions = await prisma_1.default.session.findMany({
            where: { apprenticeId },
            include: {
                roadbook: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });
        return {
            sessions,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
                pages: Math.ceil(total / Number(limit)),
                currentPage: Math.floor(Number(offset) / Number(limit)) + 1
            }
        };
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de la récupération des sessions pour l'apprenti ${apprenticeId}: ${error}`);
        throw error;
    }
};
exports.getSessionsByApprentice = getSessionsByApprentice;
/**
 * Récupérer les sessions par roadbook
 *
 * @param roadbookId - ID du roadbook
 * @param limit - Nombre maximum de sessions à récupérer
 * @param offset - Décalage pour la pagination
 * @returns Liste paginée des sessions
 */
const getSessionsByRoadbook = async (roadbookId, limit = 20, offset = 0) => {
    try {
        // Calculer le nombre total de sessions
        const total = await prisma_1.default.session.count({
            where: { roadbookId }
        });
        // Récupérer les sessions avec pagination
        const sessions = await prisma_1.default.session.findMany({
            where: { roadbookId },
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });
        return {
            sessions,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
                pages: Math.ceil(total / Number(limit)),
                currentPage: Math.floor(Number(offset) / Number(limit)) + 1
            }
        };
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de la récupération des sessions pour le roadbook ${roadbookId}: ${error}`);
        throw error;
    }
};
exports.getSessionsByRoadbook = getSessionsByRoadbook;
/**
 * Ajouter un commentaire à une session
 *
 * @param sessionId - ID de la session
 * @param authorId - ID de l'auteur du commentaire
 * @param content - Contenu du commentaire
 * @returns Commentaire créé
 */
const addSessionComment = async (sessionId, authorId, content) => {
    try {
        logger_1.default.info(`Ajout d'un commentaire à la session ${sessionId} par l'utilisateur ${authorId}`);
        // Vérifier si la session existe
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        // Vérifier les permissions (doit avoir accès à la session)
        const hasAccess = await (0, exports.checkSessionAccess)(sessionId, authorId);
        if (!hasAccess) {
            throw new Error('Unauthorized to comment on this session');
        }
        // Créer le commentaire
        const comment = await prisma_1.default.comment.create({
            data: {
                content,
                authorId,
                sessionId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                }
            }
        });
        logger_1.default.info(`Commentaire ${comment.id} ajouté avec succès à la session ${sessionId}`);
        return comment;
    }
    catch (error) {
        logger_1.default.error(`Erreur lors de l'ajout d'un commentaire à la session ${sessionId}: ${error}`);
        throw error;
    }
};
exports.addSessionComment = addSessionComment;
/**
 * Calculer les statistiques pour une session
 *
 * @param id - ID de la session
 * @returns Statistiques calculées
 */
const calculateSessionStatistics = async (id) => {
    try {
        const session = await prisma_1.default.session.findUnique({
            where: { id }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        // Calculer la durée si elle n'est pas déjà définie
        let duration = session.duration;
        if (!duration && session.startTime && session.endTime) {
            const start = new Date(session.startTime);
            const end = new Date(session.endTime);
            duration = Math.round((end.getTime() - start.getTime()) / 60000); // en minutes
        }
        // Calculer la vitesse moyenne si la distance et la durée sont disponibles
        let averageSpeed = null;
        if (session.distance && duration) {
            averageSpeed = Math.round((session.distance / (duration / 60)) * 10) / 10; // km/h arrondi à 1 décimale
        }
        return {
            duration,
            distance: session.distance,
            averageSpeed,
            startTime: session.startTime,
            endTime: session.endTime,
            weather: session.weather,
            daylight: session.daylight,
            roadTypes: session.roadTypes,
            isValidated: !!session.validatorId && !!session.validationDate
        };
    }
    catch (error) {
        logger_1.default.error(`Erreur lors du calcul des statistiques pour la session ${id}: ${error}`);
        throw error;
    }
};
exports.calculateSessionStatistics = calculateSessionStatistics;
