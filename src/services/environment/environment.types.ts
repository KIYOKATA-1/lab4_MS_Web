export interface SelectedCity {
  id: number;
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  timeZone: string | null;
}

export interface SourceResult<T> {
  status: "success" | "empty" | "error";
  data: T | null;
  fetchedAt: number | null;
  error: string | null;
}

export interface WeatherData {
  timeZone: string;
  observedAt: number | null;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
  units: { temperature: string | null; humidity: string | null; windSpeed: string | null };
  hourly: { timestamp: number; temperature: number | null }[];
}

export interface AirQualityData {
  timeZone: string;
  observedAt: number | null;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  nitrogenDioxide: number | null;
  ozone: number | null;
  units: { pm25: string | null; pm10: string | null; nitrogenDioxide: string | null; ozone: string | null };
  hourly: { timestamp: number; usAqi: number | null; pm25: number | null }[];
}

export interface HourlyPoint {
  timestamp: number;
  temperature: number | null;
  usAqi: number | null;
  pm25: number | null;
}

export interface EnvironmentResponse {
  city: SelectedCity;
  weather: SourceResult<WeatherData>;
  airQuality: SourceResult<AirQualityData>;
  hourly: HourlyPoint[];
}
