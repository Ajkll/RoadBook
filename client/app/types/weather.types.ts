export interface WeatherInfo {
  temperature?: number;
  conditions?: string;
  windSpeed?: number;
  visibility?: number;
  humidity?: number;
  pressure?: number;
}

export interface WeatherCardProps {
  weather?: WeatherInfo;
  loading?: boolean;
}