"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBadgeCriteria = checkBadgeCriteria;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
/**
 * Check if a user meets the criteria for a specific badge
 */
async function checkBadgeCriteria(userId, criteria) {
    switch (criteria) {
        case 'FIRST_SESSION':
            return checkFirstSession(userId);
        case 'COMPLETE_10_SESSIONS':
            return checkCompleteSessions(userId, 10);
        case 'NIGHT_DRIVING':
            return checkNightDriving(userId);
        case 'HIGHWAY_DRIVING':
            return checkHighwayDriving(userId);
        case 'MASTER_PARKING':
            return checkMasterParking(userId);
        case 'MASTER_ECO_DRIVING':
            return checkMasterEcoDriving(userId);
        case 'VALIDATE_10_SESSIONS':
            return checkValidateSessions(userId, 10);
        case 'COMPLETE_ROADBOOK':
            return checkCompleteRoadbook(userId);
        default:
            // Unknown criteria
            return false;
    }
}
// Individual criteria checks
async function checkFirstSession(userId) {
    const sessionsCount = await prisma_1.prisma.session.count({
        where: {
            apprenticeId: userId
        }
    });
    return sessionsCount > 0;
}
async function checkCompleteSessions(userId, count) {
    const sessionsCount = await prisma_1.prisma.session.count({
        where: {
            apprenticeId: userId,
            endTime: { not: null }
        }
    });
    return sessionsCount >= count;
}
async function checkNightDriving(userId) {
    const nightSessionsCount = await prisma_1.prisma.session.count({
        where: {
            apprenticeId: userId,
            daylight: client_1.DaylightCondition.NIGHT
        }
    });
    return nightSessionsCount > 0;
}
async function checkHighwayDriving(userId) {
    // Check if the user has sessions with highway in roadTypes
    const highwaySessionsCount = await prisma_1.prisma.session.count({
        where: {
            apprenticeId: userId,
            roadTypes: { has: 'HIGHWAY' }
        }
    });
    return highwaySessionsCount > 0;
}
async function checkMasterParking(userId) {
    // Check for mastery of parking competencies
    const parkingCompetencies = await prisma_1.prisma.competencyProgress.count({
        where: {
            apprenticeId: userId,
            status: client_1.CompetencyStatus.MASTERED,
            competency: {
                category: client_1.CompetencyCategory.MANEUVERING,
                name: { contains: 'park', mode: 'insensitive' }
            }
        }
    });
    return parkingCompetencies > 0;
}
async function checkMasterEcoDriving(userId) {
    // Count eco-driving competencies
    const ecoCompetencies = await prisma_1.prisma.competency.count({
        where: {
            category: client_1.CompetencyCategory.ECOFRIENDLY_DRIVING
        }
    });
    // Count mastered eco-driving competencies for the user
    const masteredEcoCompetencies = await prisma_1.prisma.competencyProgress.count({
        where: {
            apprenticeId: userId,
            status: client_1.CompetencyStatus.MASTERED,
            competency: {
                category: client_1.CompetencyCategory.ECOFRIENDLY_DRIVING
            }
        }
    });
    // User must master all eco-driving competencies
    return ecoCompetencies > 0 && masteredEcoCompetencies >= ecoCompetencies;
}
async function checkValidateSessions(userId, count) {
    // Check if user has validated at least 'count' sessions as a guide/instructor
    const validatedSessionsCount = await prisma_1.prisma.session.count({
        where: {
            validatorId: userId,
            validationDate: { not: null }
        }
    });
    return validatedSessionsCount >= count;
}
async function checkCompleteRoadbook(userId) {
    // Check if user has completed any roadbooks
    const completedRoadbooksCount = await prisma_1.prisma.roadBook.count({
        where: {
            apprenticeId: userId,
            status: 'COMPLETED'
        }
    });
    return completedRoadbooksCount > 0;
}
