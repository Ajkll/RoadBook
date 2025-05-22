// types/session.types.ts
export type WeatherType = 'CLEAR' | 'CLOUDY' | 'RAINY' | 'SNOWY' | 'FOGGY' | 'WINDY' | 'OTHER';
export type DaylightType = 'DAY' | 'NIGHT' | 'DAWN_DUSK';
export type SessionType = 'PRACTICE' | 'EXAM' | 'LESSON';
export type SessionStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';
export type RoadType = 'URBAN' | 'HIGHWAY' | 'RURAL' | 'MOUNTAIN' | 'RESIDENTIAL' | 'OTHER';

export interface Waypoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteData {
  waypoints: Waypoint[];
}

export interface SessionData {
  id?: string;
  title?: string;
  description?: string;
  date: string;  // Format YYYY-MM-DD
  startTime: string;  // ISO string
  endTime?: string;   // ISO string
  duration?: number;  // en minutes
  startLocation?: string;
  endLocation?: string;
  distance?: number;  // en km
  weather?: WeatherType;
  daylight?: DaylightType;
  sessionType?: SessionType;
  roadTypes?: RoadType[];
  routeData?: RouteData;
  apprenticeId?: string;
  roadbookId: string;
  validatorId?: string;
  notes?: string;
  status?: SessionStatus;
}

// données réellement affichées 
export type RoadTypes = {
  id: string;
  date: Date;
  distance: number;
  duration: number;
};

export interface Session extends SessionData {
  id: string;
  roadbookId: string;
  apprenticeId: string;
  createdAt?: string;
  updatedAt?: string;
  validationDate?: string;
  apprentice?: {
    id: string;
    displayName: string;
  };
  validator?: {
    id: string;
    displayName: string;
  } | null;
}

export interface SessionsFilterOptions {
  status?: SessionStatus;
  startDate?: string;
  endDate?: string;
  sessionType?: SessionType;
}