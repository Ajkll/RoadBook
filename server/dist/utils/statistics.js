"use strict";
/**
 * STATISTICS UTILITIES
 *
 * Ce module fournit des fonctions utilitaires pour calculer diverses statistiques
 * sur les données des roadbooks, sessions, et apprentissages.
 *
 * Il est utilisé par plusieurs services pour générer des tableaux de bord, des rapports,
 * et pour suivre la progression des apprentis.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePeriodMetrics = exports.calculateApprenticeStatistics = exports.calculateRoadbookStatistics = exports.calculateSessionStatistics = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("./logger"));
/**
 * Calculer les statistiques d'une session
 *
 * @param sessionId - ID de la session
 * @returns Statistiques de la session
 */
const calculateSessionStatistics = async (sessionId) => {
    try {
        const session = await prisma_1.prisma.session.findUnique({
            where: { id: sessionId }
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
            roadTypes: session.roadTypes || [],
            isValidated: !!session.validatorId && !!session.validationDate
        };
    }
    catch (error) {
        logger_1.default.error(`Error calculating session statistics: ${error}`);
        throw error;
    }
};
exports.calculateSessionStatistics = calculateSessionStatistics;
/**
 * Calculer les statistiques complètes d'un roadbook
 *
 * @param roadbookId - ID du roadbook
 * @returns Statistiques détaillées du roadbook
 */
const calculateRoadbookStatistics = async (roadbookId) => {
    try {
        // Récupérer le roadbook pour les informations de base
        const roadbook = await prisma_1.prisma.roadBook.findUnique({
            where: { id: roadbookId },
            select: {
                targetHours: true,
                status: true,
                createdAt: true,
                apprenticeId: true,
                guideId: true
            }
        });
        if (!roadbook) {
            throw new Error('Roadbook not found');
        }
        // Récupérer toutes les sessions associées
        const sessions = await prisma_1.prisma.session.findMany({
            where: { roadbookId },
            select: {
                id: true,
                duration: true,
                distance: true,
                weather: true,
                daylight: true,
                roadTypes: true,
                date: true,
                validatorId: true,
                validationDate: true,
                startLocation: true,
                endLocation: true,
                startTime: true,
                endTime: true
            },
            orderBy: { date: 'asc' }
        });
        // Calculer les statistiques de base
        const totalSessions = sessions.length;
        const validatedSessions = sessions.filter(s => s.validatorId && s.validationDate).length;
        const validationRate = totalSessions ? Math.round((validatedSessions / totalSessions) * 100) : 0;
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
        const roadTypesCount = {};
        sessions.forEach(session => {
            if (session.roadTypes && session.roadTypes.length > 0) {
                session.roadTypes.forEach(type => {
                    roadTypesCount[type] = (roadTypesCount[type] || 0) + 1;
                });
            }
        });
        // Durée moyenne des sessions (en minutes)
        const averageSessionDuration = totalSessions ? Math.round(totalDuration / totalSessions) : 0;
        // Distance moyenne par session (en km)
        const averageSessionDistance = totalSessions ? Math.round((totalDistance / totalSessions) * 10) / 10 : 0;
        // Identifier les périodes d'inactivité (plus de 14 jours sans session)
        let inactivityPeriods = 0;
        let lastSessionDate = null;
        let inactivityDetails = [];
        // Les sessions sont déjà triées par date
        for (let i = 0; i < sessions.length; i++) {
            const sessionDate = new Date(sessions[i].date);
            if (lastSessionDate) {
                const daysDiff = Math.floor((sessionDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff > 14) {
                    inactivityPeriods++;
                    inactivityDetails.push({
                        startDate: lastSessionDate,
                        endDate: sessionDate,
                        duration: daysDiff
                    });
                }
            }
            lastSessionDate = sessionDate;
        }
        // Calculer la durée totale (en jours) depuis la création du roadbook
        const daysSinceCreation = Math.floor((new Date().getTime() - new Date(roadbook.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        // Analyse des localisations pour cartographie
        const locations = sessions.flatMap(session => {
            const locs = [];
            if (session.startLocation)
                locs.push(session.startLocation);
            if (session.endLocation)
                locs.push(session.endLocation);
            return locs;
        });
        // Identifier les heures de conduite (répartition jour/nuit/crépuscule)
        const timeDistribution = sessions.reduce((dist, session) => {
            if (session.duration && session.daylight) {
                dist[session.daylight] = (dist[session.daylight] || 0) + session.duration;
            }
            return dist;
        }, {});
        // Formater les statistiques pour le tableau de bord
        return {
            summary: {
                totalSessions,
                validatedSessions,
                totalDurationMinutes: totalDuration,
                totalDurationHours: Math.round(totalDuration / 60 * 10) / 10,
                totalDistanceKm: Math.round(totalDistance * 10) / 10,
                completionPercentage,
                targetHours: roadbook.targetHours || 30,
                hoursRemaining: Math.max(0, roadbook.targetHours - (totalDuration / 60)),
                validationRate,
                status: roadbook.status
            },
            averages: {
                sessionDurationMinutes: averageSessionDuration,
                sessionDistanceKm: averageSessionDistance
            },
            distributions: {
                weather: weatherDistribution,
                daylight: daylightDistribution,
                roadTypes: roadTypesCount,
                time: timeDistribution
            },
            timeline: {
                daysSinceCreation,
                inactivityPeriods,
                inactivityDetails,
                lastSessionDate: (lastSessionDate === null || lastSessionDate === void 0 ? void 0 : lastSessionDate.toISOString()) || null,
                sessionsFrequency: totalSessions / (daysSinceCreation || 1) // Sessions par jour
            },
            geographicData: {
                uniqueLocations: [...new Set(locations)].length,
                // Données simplifiées pour le POC - une implémentation complète nécessiterait 
                // un service de géocodage pour obtenir les coordonnées réelles
                locations: [...new Set(locations)].slice(0, 10) // Limiter à 10 pour éviter la surcharge
            }
        };
    }
    catch (error) {
        logger_1.default.error(`Error calculating roadbook statistics: ${error}`);
        throw error;
    }
};
exports.calculateRoadbookStatistics = calculateRoadbookStatistics;
/**
 * Calculer les statistiques d'un apprenti
 *
 * @param apprenticeId - ID de l'apprenti
 * @returns Statistiques globales de l'apprenti
 */
const calculateApprenticeStatistics = async (apprenticeId) => {
    var _a;
    try {
        // Vérifier si l'apprenti existe
        const apprentice = await prisma_1.prisma.user.findUnique({
            where: { id: apprenticeId },
            select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                createdAt: true
            }
        });
        if (!apprentice) {
            throw new Error('Apprentice not found');
        }
        // Récupérer les roadbooks de l'apprenti
        const roadbooks = await prisma_1.prisma.roadBook.findMany({
            where: { apprenticeId },
            select: {
                id: true,
                status: true,
                targetHours: true,
                createdAt: true,
                _count: {
                    select: {
                        sessions: true
                    }
                }
            }
        });
        // Récupérer toutes les sessions de l'apprenti
        const sessions = await prisma_1.prisma.session.findMany({
            where: { apprenticeId },
            select: {
                id: true,
                duration: true,
                distance: true,
                date: true,
                roadbookId: true,
                validatorId: true,
                validationDate: true,
                weather: true,
                daylight: true
            }
        });
        // Calculer les statistiques globales
        const totalRoadbooks = roadbooks.length;
        const activeRoadbooks = roadbooks.filter(rb => rb.status === 'ACTIVE').length;
        const completedRoadbooks = roadbooks.filter(rb => rb.status === 'COMPLETED').length;
        const archivedRoadbooks = roadbooks.filter(rb => rb.status === 'ARCHIVED').length;
        const totalSessions = sessions.length;
        const validatedSessions = sessions.filter(s => s.validatorId && s.validationDate).length;
        const validationRate = totalSessions ? Math.round((validatedSessions / totalSessions) * 100) : 0;
        const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const totalDistance = sessions.reduce((sum, session) => sum + (session.distance || 0), 0);
        // Récupérer les dernières sessions (5 plus récentes)
        const recentSessions = [...sessions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(s => ({
            id: s.id,
            date: s.date,
            duration: s.duration,
            distance: s.distance,
            isValidated: !!s.validatorId && !!s.validationDate,
            roadbookId: s.roadbookId
        }));
        // Calculer la progression globale
        const targetHoursSum = roadbooks.reduce((sum, rb) => sum + (rb.targetHours || 30), 0);
        const totalHoursCompleted = totalDuration / 60;
        const overallProgressPercent = targetHoursSum ? Math.min(100, Math.round((totalHoursCompleted / targetHoursSum) * 100)) : 0;
        // Analyse des tendances
        // Trier les sessions par date pour analyser la progression
        const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Comparer la première et la dernière semaine pour voir l'évolution
        let firstWeekDuration = 0;
        let lastWeekDuration = 0;
        if (sortedSessions.length >= 2) {
            const firstWeekSessions = sortedSessions.slice(0, Math.min(5, Math.ceil(sortedSessions.length / 4)));
            const lastWeekSessions = sortedSessions.slice(Math.max(0, sortedSessions.length - 5));
            firstWeekDuration = firstWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            lastWeekDuration = lastWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        }
        const progressTrend = firstWeekDuration && lastWeekDuration
            ? Math.round(((lastWeekDuration - firstWeekDuration) / firstWeekDuration) * 100)
            : 0;
        // Distribution des types de météo et de luminosité
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
        // Jours depuis la première session
        const firstSessionDate = sortedSessions.length > 0 ? new Date(sortedSessions[0].date) : null;
        const daysSinceFirstSession = firstSessionDate
            ? Math.floor((new Date().getTime() - firstSessionDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        // Retourner les statistiques
        return {
            apprentice: {
                id: apprentice.id,
                name: apprentice.displayName,
                fullName: `${apprentice.firstName || ''} ${apprentice.lastName || ''}`.trim() || apprentice.displayName
            },
            overview: {
                totalRoadbooks,
                activeRoadbooks,
                completedRoadbooks,
                archivedRoadbooks,
                totalSessions,
                validatedSessions,
                validationRate,
                totalDurationMinutes: totalDuration,
                totalDurationHours: Math.round(totalDuration / 60 * 10) / 10,
                totalDistanceKm: Math.round(totalDistance * 10) / 10,
                overallProgressPercent
            },
            recent: {
                recentSessions,
                lastSessionDate: ((_a = recentSessions[0]) === null || _a === void 0 ? void 0 : _a.date) || null
            },
            trends: {
                progressTrend,
                sessionsPerWeek: daysSinceFirstSession ? Math.round((totalSessions / (daysSinceFirstSession / 7)) * 10) / 10 : 0,
                hoursPerWeek: daysSinceFirstSession ? Math.round(((totalDuration / 60) / (daysSinceFirstSession / 7)) * 10) / 10 : 0,
                daysSinceFirstSession
            },
            distributions: {
                weather: weatherDistribution,
                daylight: daylightDistribution
            }
        };
    }
    catch (error) {
        logger_1.default.error(`Error calculating apprentice statistics: ${error}`);
        throw error;
    }
};
exports.calculateApprenticeStatistics = calculateApprenticeStatistics;
/**
 * Extraire les métriques pour une période spécifique de sessions
 *
 * @param sessions - Tableau de sessions à analyser
 * @param periodDescription - Description de la période (pour la journalisation)
 * @returns Métriques de la période
 */
const calculatePeriodMetrics = (sessions, periodDescription) => {
    try {
        const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalDistance = sessions.reduce((sum, s) => sum + (s.distance || 0), 0);
        const averageDuration = sessions.length ? Math.round(totalDuration / sessions.length) : 0;
        const averageDistance = sessions.length ? Math.round((totalDistance / sessions.length) * 10) / 10 : 0;
        return {
            count: sessions.length,
            totalDuration,
            totalDistance,
            averageDuration,
            averageDistance
        };
    }
    catch (error) {
        logger_1.default.error(`Error calculating ${periodDescription} metrics: ${error}`);
        throw error;
    }
};
exports.calculatePeriodMetrics = calculatePeriodMetrics;
