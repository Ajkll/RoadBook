import { prisma } from '../config/prisma';
import { CompetencyCategory, CompetencyStatus, DaylightCondition } from '@prisma/client';

// Define badge criteria types
export type BadgeAwardCriteria =
  | 'FIRST_SESSION' 
  | 'COMPLETE_10_SESSIONS'
  | 'NIGHT_DRIVING'
  | 'HIGHWAY_DRIVING'
  | 'MASTER_PARKING'
  | 'MASTER_ECO_DRIVING'
  | 'VALIDATE_10_SESSIONS'
  | 'COMPLETE_ROADBOOK';

/**
 * Check if a user meets the criteria for a specific badge
 */
export async function checkBadgeCriteria(
  userId: string,
  criteria: BadgeAwardCriteria
): Promise<boolean> {
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

async function checkFirstSession(userId: string): Promise<boolean> {
  const sessionsCount = await prisma.session.count({
    where: {
      apprenticeId: userId
    }
  });
  
  return sessionsCount > 0;
}

async function checkCompleteSessions(userId: string, count: number): Promise<boolean> {
  const sessionsCount = await prisma.session.count({
    where: {
      apprenticeId: userId,
      endTime: { not: null }
    }
  });
  
  return sessionsCount >= count;
}

async function checkNightDriving(userId: string): Promise<boolean> {
  const nightSessionsCount = await prisma.session.count({
    where: {
      apprenticeId: userId,
      daylight: DaylightCondition.NIGHT
    }
  });
  
  return nightSessionsCount > 0;
}

async function checkHighwayDriving(userId: string): Promise<boolean> {
  // Check if the user has sessions with highway in roadTypes
  const highwaySessionsCount = await prisma.session.count({
    where: {
      apprenticeId: userId,
      roadTypes: { has: 'HIGHWAY' }
    }
  });
  
  return highwaySessionsCount > 0;
}

async function checkMasterParking(userId: string): Promise<boolean> {
  // Check for mastery of parking competencies
  const parkingCompetencies = await prisma.competencyProgress.count({
    where: {
      apprenticeId: userId,
      status: CompetencyStatus.MASTERED,
      competency: {
        category: CompetencyCategory.MANEUVERING,
        name: { contains: 'park', mode: 'insensitive' }
      }
    }
  });
  
  return parkingCompetencies > 0;
}

async function checkMasterEcoDriving(userId: string): Promise<boolean> {
  // Count eco-driving competencies
  const ecoCompetencies = await prisma.competency.count({
    where: {
      category: CompetencyCategory.ECOFRIENDLY_DRIVING
    }
  });
  
  // Count mastered eco-driving competencies for the user
  const masteredEcoCompetencies = await prisma.competencyProgress.count({
    where: {
      apprenticeId: userId,
      status: CompetencyStatus.MASTERED,
      competency: {
        category: CompetencyCategory.ECOFRIENDLY_DRIVING
      }
    }
  });
  
  // User must master all eco-driving competencies
  return ecoCompetencies > 0 && masteredEcoCompetencies >= ecoCompetencies;
}

async function checkValidateSessions(userId: string, count: number): Promise<boolean> {
  // Check if user has validated at least 'count' sessions as a guide/instructor
  const validatedSessionsCount = await prisma.session.count({
    where: {
      validatorId: userId,
      validationDate: { not: null }
    }
  });
  
  return validatedSessionsCount >= count;
}

async function checkCompleteRoadbook(userId: string): Promise<boolean> {
  // Check if user has completed any roadbooks
  const completedRoadbooksCount = await prisma.roadBook.count({
    where: {
      apprenticeId: userId,
      status: 'COMPLETED'
    }
  });
  
  return completedRoadbooksCount > 0;
}
