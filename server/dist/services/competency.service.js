"use strict";
/**
 * COMPETENCY SERVICE
 *
 * Ce service gère toutes les opérations liées aux compétences de conduite:
 * - Récupération des compétences (par phase, catégorie, etc.)
 * - Gestion des progressions d'apprentissage
 * - Validation des compétences par les guides/instructeurs
 * - Calcul des statistiques de progression
 *
 * La taxonomie des compétences est hiérarchisée par phase (1-5) et par catégories
 * (contrôle du véhicule, règles de circulation, etc.). Le système de progression
 * permet de suivre l'évolution de l'apprenti à travers différents états:
 * NOT_STARTED → IN_PROGRESS → MASTERED
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApprenticeCompetencyStats = exports.getCompetencyProgressDetail = exports.getLearningPhase = exports.getCompetencyValidationsForSession = exports.validateCompetencies = exports.updateCompetencyStatus = exports.getCompetencyProgressForRoadbook = exports.getCompetencyById = exports.getAllCompetencies = exports.CompetencyCategory = exports.LearningPhase = exports.CompetencyStatus = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Types d'états de progression pour les compétences
 */
var CompetencyStatus;
(function (CompetencyStatus) {
    CompetencyStatus["NOT_STARTED"] = "NOT_STARTED";
    CompetencyStatus["IN_PROGRESS"] = "IN_PROGRESS";
    CompetencyStatus["MASTERED"] = "MASTERED";
})(CompetencyStatus || (exports.CompetencyStatus = CompetencyStatus = {}));
/**
 * Types de phases d'apprentissage
 */
var LearningPhase;
(function (LearningPhase) {
    LearningPhase["PHASE1"] = "PHASE1";
    LearningPhase["PHASE2"] = "PHASE2";
    LearningPhase["PHASE3"] = "PHASE3";
    LearningPhase["PHASE4"] = "PHASE4";
    LearningPhase["PHASE5"] = "PHASE5"; // Autonomie
})(LearningPhase || (exports.LearningPhase = LearningPhase = {}));
/**
 * Types de catégories de compétences
 */
var CompetencyCategory;
(function (CompetencyCategory) {
    CompetencyCategory["CONTROL"] = "CONTROL";
    CompetencyCategory["MANEUVERING"] = "MANEUVERING";
    CompetencyCategory["TRAFFIC_RULES"] = "TRAFFIC_RULES";
    CompetencyCategory["RISK_PERCEPTION"] = "RISK_PERCEPTION";
    CompetencyCategory["ECOFRIENDLY_DRIVING"] = "ECOFRIENDLY_DRIVING";
    CompetencyCategory["SPECIAL_CONDITIONS"] = "SPECIAL_CONDITIONS";
    CompetencyCategory["SAFETY"] = "SAFETY"; // Sécurité
})(CompetencyCategory || (exports.CompetencyCategory = CompetencyCategory = {}));
/**
 * Récupérer toutes les compétences disponibles
 * Peut être filtré par phase et/ou catégorie
 *
 * @param phase - Filtre optionnel par phase
 * @param category - Filtre optionnel par catégorie
 * @returns Liste des compétences triées par phase et ordre
 */
const getAllCompetencies = async (phase, category) => {
    try {
        logger_1.default.debug(`Retrieving competencies with filters: phase=${phase}, category=${category}`);
        // Construire le filtre pour la requête
        const filter = {};
        if (phase) {
            filter.phase = phase;
        }
        if (category) {
            filter.category = category;
        }
        // Récupérer les compétences avec filtrage et tri
        const competencies = await prisma_1.default.competency.findMany({
            where: filter,
            orderBy: [
                { phase: 'asc' },
                { order: 'asc' }
            ]
        });
        logger_1.default.info(`Retrieved ${competencies.length} competencies`);
        return competencies;
    }
    catch (error) {
        logger_1.default.error(`Error retrieving competencies: ${error}`);
        throw error;
    }
};
exports.getAllCompetencies = getAllCompetencies;
/**
 * Récupérer une compétence spécifique par ID
 *
 * @param id - ID de la compétence
 * @returns Détails de la compétence
 */
const getCompetencyById = async (id) => {
    try {
        const competency = await prisma_1.default.competency.findUnique({
            where: { id }
        });
        if (!competency) {
            throw new Error('Competency not found');
        }
        return competency;
    }
    catch (error) {
        logger_1.default.error(`Error retrieving competency ${id}: ${error}`);
        throw error;
    }
};
exports.getCompetencyById = getCompetencyById;
/**
 * Récupérer les progrès de toutes les compétences pour un roadbook
 *
 * @param roadbookId - ID du roadbook
 * @returns Progression des compétences avec leurs détails
 */
const getCompetencyProgressForRoadbook = async (roadbookId) => {
    try {
        // Vérifier si le roadbook existe
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: roadbookId },
            select: { id: true, apprenticeId: true }
        });
        if (!roadbook) {
            throw new Error('Roadbook not found');
        }
        // Récupérer toutes les compétences disponibles
        const allCompetencies = await prisma_1.default.competency.findMany({
            orderBy: [
                { phase: 'asc' },
                { order: 'asc' }
            ]
        });
        // Récupérer les progrès existants pour ce roadbook
        const existingProgress = await prisma_1.default.competencyProgress.findMany({
            where: { roadbookId },
            include: {
                competency: true
            }
        });
        // Créer un dictionnaire pour un accès rapide aux progrès existants
        const progressMap = new Map(existingProgress.map(progress => [progress.competencyId, progress]));
        // Fusionner les compétences avec leur progression
        const progress = allCompetencies.map(competency => {
            const existingEntry = progressMap.get(competency.id);
            // Si une progression existe, la retourner, sinon créer une entrée par défaut
            if (existingEntry) {
                return existingEntry;
            }
            else {
                return {
                    id: null, // Pas encore créé en base de données
                    competencyId: competency.id,
                    competency: competency,
                    roadbookId: roadbookId,
                    apprenticeId: roadbook.apprenticeId,
                    status: CompetencyStatus.NOT_STARTED,
                    lastPracticed: null,
                    notes: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }
        });
        // Organiser les compétences par phase et catégorie pour faciliter l'affichage
        const organizedProgress = {
            phases: Object.values(LearningPhase).map(phase => {
                // Filtrer les compétences de cette phase
                const phaseCompetencies = progress.filter(p => p.competency.phase === phase);
                // Organiser par catégorie
                const categories = Object.values(CompetencyCategory).map(category => {
                    const categoryCompetencies = phaseCompetencies.filter(p => p.competency.category === category);
                    return {
                        name: category,
                        competencies: categoryCompetencies,
                        progress: calculateCategoryProgress(categoryCompetencies)
                    };
                }).filter(cat => cat.competencies.length > 0); // Ne garder que les catégories ayant des compétences
                return {
                    name: phase,
                    categories,
                    progress: calculatePhaseProgress(phaseCompetencies)
                };
            }).filter(phase => phase.categories.length > 0), // Ne garder que les phases ayant des catégories
            // Statistiques globales
            stats: calculateOverallProgress(progress)
        };
        return organizedProgress;
    }
    catch (error) {
        logger_1.default.error(`Error retrieving competency progress for roadbook ${roadbookId}: ${error}`);
        throw error;
    }
};
exports.getCompetencyProgressForRoadbook = getCompetencyProgressForRoadbook;
/**
 * Mettre à jour le statut d'une compétence pour un roadbook
 *
 * @param roadbookId - ID du roadbook
 * @param competencyId - ID de la compétence
 * @param status - Nouveau statut (NOT_STARTED, IN_PROGRESS, MASTERED)
 * @param notes - Notes optionnelles sur la progression
 * @param userId - ID de l'utilisateur effectuant la mise à jour
 * @returns Progression mise à jour
 */
const updateCompetencyStatus = async (roadbookId, competencyId, status, notes, userId) => {
    try {
        // Vérifier si le roadbook existe et si l'utilisateur a les droits
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: roadbookId },
            select: { apprenticeId: true, guideId: true }
        });
        if (!roadbook) {
            throw new Error('Roadbook not found');
        }
        // Vérifier si la compétence existe
        const competency = await prisma_1.default.competency.findUnique({
            where: { id: competencyId }
        });
        if (!competency) {
            throw new Error('Competency not found');
        }
        // Vérifier les permissions
        if (userId !== roadbook.apprenticeId && userId !== roadbook.guideId) {
            // Vérifier si l'utilisateur est un admin ou un instructeur
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
                throw new Error('Unauthorized to update competency status');
            }
        }
        // Les règles de transition d'état
        const isValidTransition = validateStatusTransition(status);
        if (!isValidTransition) {
            throw new Error(`Invalid status transition to ${status}`);
        }
        // Rechercher une progression existante
        const existingProgress = await prisma_1.default.competencyProgress.findFirst({
            where: {
                roadbookId,
                competencyId
            }
        });
        let updatedProgress;
        if (existingProgress) {
            // Mettre à jour une progression existante
            updatedProgress = await prisma_1.default.competencyProgress.update({
                where: { id: existingProgress.id },
                data: {
                    status: status,
                    notes: notes !== undefined ? notes : existingProgress.notes,
                    lastPracticed: new Date(),
                    updatedAt: new Date()
                },
                include: {
                    competency: true
                }
            });
        }
        else {
            // Créer une nouvelle progression
            updatedProgress = await prisma_1.default.competencyProgress.create({
                data: {
                    roadbookId,
                    competencyId,
                    apprenticeId: roadbook.apprenticeId,
                    status: status,
                    notes,
                    lastPracticed: new Date()
                },
                include: {
                    competency: true
                }
            });
        }
        logger_1.default.info(`Updated competency ${competencyId} status to ${status} for roadbook ${roadbookId}`);
        return updatedProgress;
    }
    catch (error) {
        logger_1.default.error(`Error updating competency status: ${error}`);
        throw error;
    }
};
exports.updateCompetencyStatus = updateCompetencyStatus;
/**
 * Valider des compétences dans le cadre d'une session
 * Permet aux guides/instructeurs de valider formellement les compétences démontrées
 *
 * @param sessionId - ID de la session
 * @param validations - Liste des compétences à valider
 * @param validatorId - ID du validateur (guide ou instructeur)
 * @returns Résultats des validations créées
 */
const validateCompetencies = async (sessionId, validations, validatorId) => {
    try {
        // Vérifier si la session existe et récupérer le roadbook associé
        const session = await prisma_1.default.session.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                roadbookId: true,
                apprenticeId: true,
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
        // Vérifier les permissions
        if (validatorId !== session.roadbook.guideId) {
            // Vérifier si l'utilisateur est un admin ou un instructeur
            const user = await prisma_1.default.user.findUnique({
                where: { id: validatorId },
                select: { role: true }
            });
            if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
                throw new Error('Unauthorized to validate competencies');
            }
        }
        // Valider les compétences une par une
        const validationResults = await Promise.all(validations.map(async (validation) => {
            try {
                // Vérifier si la compétence existe
                const competency = await prisma_1.default.competency.findUnique({
                    where: { id: validation.competencyId }
                });
                if (!competency) {
                    return {
                        competencyId: validation.competencyId,
                        success: false,
                        error: 'Competency not found'
                    };
                }
                // Vérifier si une validation existe déjà pour cette session et compétence
                const existingValidation = await prisma_1.default.competencyValidation.findFirst({
                    where: {
                        sessionId,
                        competencyId: validation.competencyId
                    }
                });
                let result;
                if (existingValidation) {
                    // Mettre à jour la validation existante
                    result = await prisma_1.default.competencyValidation.update({
                        where: { id: existingValidation.id },
                        data: {
                            validated: validation.validated,
                            notes: validation.notes,
                            validationDate: new Date()
                        },
                        include: {
                            competency: true,
                            validator: {
                                select: {
                                    id: true,
                                    displayName: true
                                }
                            }
                        }
                    });
                }
                else {
                    // Créer une nouvelle validation
                    result = await prisma_1.default.competencyValidation.create({
                        data: {
                            sessionId,
                            competencyId: validation.competencyId,
                            validated: validation.validated,
                            validatorId,
                            notes: validation.notes
                        },
                        include: {
                            competency: true,
                            validator: {
                                select: {
                                    id: true,
                                    displayName: true
                                }
                            }
                        }
                    });
                }
                // Si la validation est positive, mettre à jour le statut de la compétence
                if (validation.validated) {
                    await (0, exports.updateCompetencyStatus)(session.roadbookId, validation.competencyId, CompetencyStatus.MASTERED, `Validated during session on ${new Date().toLocaleDateString()}.${validation.notes ? ` Notes: ${validation.notes}` : ''}`, validatorId);
                }
                return {
                    competencyId: validation.competencyId,
                    success: true,
                    result
                };
            }
            catch (error) {
                logger_1.default.error(`Error validating competency ${validation.competencyId}: ${error}`);
                return {
                    competencyId: validation.competencyId,
                    success: false,
                    error: error.message || 'Unknown error'
                };
            }
        }));
        logger_1.default.info(`Validated ${validationResults.filter(r => r.success).length} competencies for session ${sessionId}`);
        return validationResults;
    }
    catch (error) {
        logger_1.default.error(`Error validating competencies for session ${sessionId}: ${error}`);
        throw error;
    }
};
exports.validateCompetencies = validateCompetencies;
/**
 * Récupérer les validations de compétences pour une session spécifique
 *
 * @param sessionId - ID de la session
 * @returns Liste des validations de compétences pour cette session
 */
const getCompetencyValidationsForSession = async (sessionId) => {
    try {
        const validations = await prisma_1.default.competencyValidation.findMany({
            where: { sessionId },
            include: {
                competency: true,
                validator: {
                    select: {
                        id: true,
                        displayName: true
                    }
                }
            },
            orderBy: {
                validationDate: 'desc'
            }
        });
        return validations;
    }
    catch (error) {
        logger_1.default.error(`Error retrieving competency validations for session ${sessionId}: ${error}`);
        throw error;
    }
};
exports.getCompetencyValidationsForSession = getCompetencyValidationsForSession;
/**
 * Récupérer une phase d'apprentissage spécifique avec toutes ses compétences
 *
 * @param phase - Phase d'apprentissage à récupérer
 * @returns Détails de la phase avec ses compétences organisées par catégorie
 */
const getLearningPhase = async (phase) => {
    try {
        // Récupérer toutes les compétences de cette phase
        const competencies = await prisma_1.default.competency.findMany({
            where: { phase },
            orderBy: { order: 'asc' }
        });
        // Organiser par catégorie
        const categorizedCompetencies = Object.values(CompetencyCategory).map(category => {
            const categoryCompetencies = competencies.filter(comp => comp.category === category);
            return {
                name: category,
                competencies: categoryCompetencies,
                count: categoryCompetencies.length
            };
        }).filter(cat => cat.count > 0); // Ne garder que les catégories ayant des compétences
        return {
            name: phase,
            categories: categorizedCompetencies,
            totalCompetencies: competencies.length
        };
    }
    catch (error) {
        logger_1.default.error(`Error retrieving learning phase ${phase}: ${error}`);
        throw error;
    }
};
exports.getLearningPhase = getLearningPhase;
/**
 * Récupérer la progression d'une compétence spécifique pour un roadbook
 *
 * @param roadbookId - ID du roadbook
 * @param competencyId - ID de la compétence
 * @returns Détails de la progression avec l'historique des validations
 */
const getCompetencyProgressDetail = async (roadbookId, competencyId) => {
    try {
        // Vérifier si le roadbook existe
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: roadbookId },
            select: { id: true }
        });
        if (!roadbook) {
            throw new Error('Roadbook not found');
        }
        // Vérifier si la compétence existe
        const competency = await prisma_1.default.competency.findUnique({
            where: { id: competencyId }
        });
        if (!competency) {
            throw new Error('Competency not found');
        }
        // Récupérer la progression
        const progress = await prisma_1.default.competencyProgress.findFirst({
            where: {
                roadbookId,
                competencyId
            }
        });
        // Récupérer l'historique des validations pour cette compétence
        const validations = await prisma_1.default.competencyValidation.findMany({
            where: {
                competencyId,
                session: {
                    roadbookId
                }
            },
            include: {
                session: {
                    select: {
                        id: true,
                        date: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true
                    }
                }
            },
            orderBy: {
                validationDate: 'desc'
            }
        });
        // Construire la réponse
        return {
            competency,
            progress: progress || {
                status: CompetencyStatus.NOT_STARTED,
                lastPracticed: null,
                notes: null
            },
            validations,
            validationsCount: validations.length,
            latestValidation: validations.length > 0 ? validations[0] : null
        };
    }
    catch (error) {
        logger_1.default.error(`Error retrieving competency progress detail for roadbook ${roadbookId}, competency ${competencyId}: ${error}`);
        throw error;
    }
};
exports.getCompetencyProgressDetail = getCompetencyProgressDetail;
/**
 * Calculer les statistiques de progression pour un apprenti à travers tous ses roadbooks
 *
 * @param apprenticeId - ID de l'apprenti
 * @returns Statistiques de progression globale
 */
const getApprenticeCompetencyStats = async (apprenticeId) => {
    try {
        // Vérifier si l'apprenti existe
        const apprentice = await prisma_1.default.user.findUnique({
            where: { id: apprenticeId },
            select: { id: true, displayName: true }
        });
        if (!apprentice) {
            throw new Error('Apprentice not found');
        }
        // Récupérer tous les roadbooks de l'apprenti
        const roadbooks = await prisma_1.default.roadBook.findMany({
            where: { apprenticeId },
            select: { id: true, title: true }
        });
        // Récupérer toutes les compétences
        const allCompetencies = await prisma_1.default.competency.findMany();
        const totalCompetencies = allCompetencies.length;
        // Récupérer toutes les progressions de l'apprenti
        const allProgress = await prisma_1.default.competencyProgress.findMany({
            where: {
                apprenticeId
            },
            include: {
                competency: true,
                roadbook: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        // Calculer les statistiques par statut
        const statusCounts = {
            [CompetencyStatus.NOT_STARTED]: 0,
            [CompetencyStatus.IN_PROGRESS]: 0,
            [CompetencyStatus.MASTERED]: 0
        };
        // Map pour suivre les compétences maîtrisées (pour éviter les doublons entre roadbooks)
        const masteredCompetenciesMap = new Map();
        allProgress.forEach(progress => {
            statusCounts[progress.status]++;
            // Si c'est une compétence maîtrisée, l'ajouter au map
            if (progress.status === CompetencyStatus.MASTERED) {
                masteredCompetenciesMap.set(progress.competencyId, progress);
            }
        });
        // Calculer les statistiques par phase
        const phaseStats = Object.values(LearningPhase).map(phase => {
            const phaseCompetencies = allCompetencies.filter(c => c.phase === phase);
            const phaseMastered = [...masteredCompetenciesMap.values()].filter(p => p.competency.phase === phase);
            return {
                phase,
                totalCompetencies: phaseCompetencies.length,
                masteredCompetencies: phaseMastered.length,
                progressPercentage: phaseCompetencies.length > 0
                    ? Math.round((phaseMastered.length / phaseCompetencies.length) * 100)
                    : 0
            };
        });
        // Calculer les statistiques par catégorie
        const categoryStats = Object.values(CompetencyCategory).map(category => {
            const categoryCompetencies = allCompetencies.filter(c => c.category === category);
            const categoryMastered = [...masteredCompetenciesMap.values()].filter(p => p.competency.category === category);
            return {
                category,
                totalCompetencies: categoryCompetencies.length,
                masteredCompetencies: categoryMastered.length,
                progressPercentage: categoryCompetencies.length > 0
                    ? Math.round((categoryMastered.length / categoryCompetencies.length) * 100)
                    : 0
            };
        });
        // Calculer les statistiques globales
        const uniqueMasteredCompetencies = masteredCompetenciesMap.size;
        const overallProgressPercentage = Math.round((uniqueMasteredCompetencies / totalCompetencies) * 100);
        return {
            apprentice: {
                id: apprentice.id,
                displayName: apprentice.displayName
            },
            totalRoadbooks: roadbooks.length,
            totalCompetencies,
            uniqueMasteredCompetencies,
            overallProgressPercentage,
            statusCounts,
            phaseStats,
            categoryStats
        };
    }
    catch (error) {
        logger_1.default.error(`Error retrieving apprentice competency stats for ${apprenticeId}: ${error}`);
        throw error;
    }
};
exports.getApprenticeCompetencyStats = getApprenticeCompetencyStats;
// ---- FONCTIONS UTILITAIRES INTERNES ----
/**
 * Valider si une transition d'état est permise
 *
 * @param status - Nouvel état
 * @returns Boolean indiquant si l'état est valide
 */
const validateStatusTransition = (status) => {
    // Pour l'instant, nous permettons toutes les transitions, mais nous pourrions
    // ajouter des règles plus complexes ici si nécessaire
    return Object.values(CompetencyStatus).includes(status);
};
/**
 * Calculer la progression pour une catégorie de compétences
 *
 * @param competencies - Liste des compétences avec leur progression
 * @returns Statistiques de progression
 */
const calculateCategoryProgress = (competencies) => {
    if (competencies.length === 0) {
        return { percentage: 0, mastered: 0, inProgress: 0, notStarted: 0, total: 0 };
    }
    const mastered = competencies.filter(c => c.status === CompetencyStatus.MASTERED).length;
    const inProgress = competencies.filter(c => c.status === CompetencyStatus.IN_PROGRESS).length;
    const notStarted = competencies.filter(c => c.status === CompetencyStatus.NOT_STARTED).length;
    return {
        percentage: Math.round((mastered / competencies.length) * 100),
        mastered,
        inProgress,
        notStarted,
        total: competencies.length
    };
};
/**
 * Calculer la progression pour une phase d'apprentissage
 *
 * @param competencies - Liste des compétences avec leur progression
 * @returns Statistiques de progression
 */
const calculatePhaseProgress = (competencies) => {
    return calculateCategoryProgress(competencies);
};
/**
 * Calculer la progression globale pour toutes les compétences
 *
 * @param competencies - Liste des compétences avec leur progression
 * @returns Statistiques de progression globale
 */
const calculateOverallProgress = (competencies) => {
    const progress = calculateCategoryProgress(competencies);
    // Ajouter des statistiques supplémentaires pour l'affichage
    progress['masteredPercentage'] = Math.round((progress.mastered / progress.total) * 100);
    progress['inProgressPercentage'] = Math.round((progress.inProgress / progress.total) * 100);
    progress['notStartedPercentage'] = Math.round((progress.notStarted / progress.total) * 100);
    return progress;
};
