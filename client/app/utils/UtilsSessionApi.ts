// utils/UtilsSessionApi.ts
import { SessionData, WeatherType, DaylightType, SessionType, RoadType, SessionStatus } from '../types/session.types';

// Define validation constraints
export const SESSION_CONSTRAINTS = {
  WEATHER_TYPES: ['CLEAR', 'CLOUDY', 'RAINY', 'SNOWY', 'FOGGY', 'WINDY', 'OTHER'] as WeatherType[],
  DAYLIGHT_TYPES: ['DAY', 'NIGHT', 'DAWN_DUSK'] as DaylightType[],
  SESSION_TYPES: ['PRACTICE', 'EXAM', 'LESSON'] as SessionType[],
  SESSION_STATUS: ['PENDING', 'VALIDATED', 'REJECTED'] as SessionStatus[],
  ROAD_TYPES: ['URBAN', 'HIGHWAY', 'RURAL', 'MOUNTAIN', 'RESIDENTIAL', 'OTHER'] as RoadType[],
  MIN_DURATION: 1, // minutes
  MAX_DURATION: 720, // 12 hours
  MIN_DISTANCE: 0.1, // km
  MAX_DISTANCE: 10000, // km
};

// Validate the session data before sending to API
export const validateSessionData = (sessionData: SessionData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!sessionData.date) {
    errors.push('Date is required');
  }

  if (!sessionData.startTime) {
    errors.push('Start time is required');
  }

  if (!sessionData.roadbookId) {
    errors.push('Roadbook ID is required');
  }

  // Type validations
  if (sessionData.weather && !SESSION_CONSTRAINTS.WEATHER_TYPES.includes(sessionData.weather as WeatherType)) {
    errors.push(`Weather type is invalid. Valid types: ${SESSION_CONSTRAINTS.WEATHER_TYPES.join(', ')}`);
  }

  if (sessionData.daylight && !SESSION_CONSTRAINTS.DAYLIGHT_TYPES.includes(sessionData.daylight as DaylightType)) {
    errors.push(`Daylight type is invalid. Valid types: ${SESSION_CONSTRAINTS.DAYLIGHT_TYPES.join(', ')}`);
  }

  if (sessionData.sessionType && !SESSION_CONSTRAINTS.SESSION_TYPES.includes(sessionData.sessionType as SessionType)) {
    errors.push(`Session type is invalid. Valid types: ${SESSION_CONSTRAINTS.SESSION_TYPES.join(', ')}`);
  }

  if (sessionData.status && !SESSION_CONSTRAINTS.SESSION_STATUS.includes(sessionData.status as SessionStatus)) {
    errors.push(`Session status is invalid. Valid types: ${SESSION_CONSTRAINTS.SESSION_STATUS.join(', ')}`);
  }

  // Array validations
  if (sessionData.roadTypes && Array.isArray(sessionData.roadTypes)) {
    for (const roadType of sessionData.roadTypes) {
      if (!SESSION_CONSTRAINTS.ROAD_TYPES.includes(roadType as RoadType)) {
        errors.push(`Road type '${roadType}' is invalid. Valid types: ${SESSION_CONSTRAINTS.ROAD_TYPES.join(', ')}`);
      }
    }
  }

  // Numeric validations
  if (sessionData.duration !== undefined) {
    if (typeof sessionData.duration !== 'number') {
      errors.push('Duration must be a number');
    } else if (sessionData.duration < SESSION_CONSTRAINTS.MIN_DURATION || sessionData.duration > SESSION_CONSTRAINTS.MAX_DURATION) {
      errors.push(`Duration must be between ${SESSION_CONSTRAINTS.MIN_DURATION} and ${SESSION_CONSTRAINTS.MAX_DURATION} minutes`);
    }
  }

  if (sessionData.distance !== undefined) {
    if (typeof sessionData.distance !== 'number') {
      errors.push('Distance must be a number');
    } else if (sessionData.distance < SESSION_CONSTRAINTS.MIN_DISTANCE || sessionData.distance > SESSION_CONSTRAINTS.MAX_DISTANCE) {
      errors.push(`Distance must be between ${SESSION_CONSTRAINTS.MIN_DISTANCE} and ${SESSION_CONSTRAINTS.MAX_DISTANCE} km`);
    }
  }

  // Waypoints validation
  if (sessionData.routeData?.waypoints) {
    for (const waypoint of sessionData.routeData.waypoints) {
      if (waypoint.lat === undefined || waypoint.lng === undefined) {
        errors.push('All waypoints must have latitude and longitude coordinates');
        break;
      }
      if (typeof waypoint.lat !== 'number' || typeof waypoint.lng !== 'number') {
        errors.push('Waypoint coordinates must be numbers');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Format session data for API request
export const formatSessionData = (sessionData: SessionData): SessionData => {
  const formattedData = { ...sessionData };

  // Ensure proper date formatting (YYYY-MM-DD)
  if (sessionData.date && sessionData.date instanceof Date) {
    formattedData.date = sessionData.date.toISOString().split('T')[0];
  }

  // Ensure proper time formatting (ISO string)
  if (sessionData.startTime && sessionData.startTime instanceof Date) {
    formattedData.startTime = sessionData.startTime.toISOString();
  }

  if (sessionData.endTime && sessionData.endTime instanceof Date) {
    formattedData.endTime = sessionData.endTime.toISOString();
  }

  // Calculate duration if not provided but start and end times are available
  if (!sessionData.duration && sessionData.startTime && sessionData.endTime) {
    const start = new Date(sessionData.startTime);
    const end = new Date(sessionData.endTime);
    formattedData.duration = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
  }

  // Make sure IDs are strings
  if (sessionData.roadbookId) {
    formattedData.roadbookId = String(sessionData.roadbookId);
  }

  if (sessionData.apprenticeId) {
    formattedData.apprenticeId = String(sessionData.apprenticeId);
  }

  if (sessionData.validatorId) {
    formattedData.validatorId = String(sessionData.validatorId);
  }

  return formattedData;
};

// Generate empty session data template with required fields
export const createEmptySessionData = (roadbookId: string): SessionData => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  return {
    date: tomorrow.toISOString().split('T')[0],
    startTime: now.toISOString(),
    roadbookId: roadbookId
  };
};