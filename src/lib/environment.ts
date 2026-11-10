import type { AirQualityData, EnvironmentResponse, HourlyPoint, SourceResult, WeatherData } from "@/services/environment/environment.types";

export function joinHourly(weather: WeatherData | null, air: AirQualityData | null): HourlyPoint[] {
  const points = new Map<number, HourlyPoint>();
  function point(timestamp: number) {
    let value = points.get(timestamp);
    if (!value) {
      value = { timestamp, temperature: null, usAqi: null, pm25: null };
      points.set(timestamp, value);
    }
    return value;
  }
  weather?.hourly.forEach((entry) => { point(entry.timestamp).temperature = entry.temperature; });
  air?.hourly.forEach((entry) => {
    const target = point(entry.timestamp);
    target.usAqi = entry.usAqi;
    target.pm25 = entry.pm25;
  });
  return [...points.values()].sort((left, right) => left.timestamp - right.timestamp);
}

function retainSource<T>(previous: SourceResult<T>, next: SourceResult<T>): SourceResult<T> {
  return next.status !== "success" && previous.data
    ? { ...next, data: previous.data, fetchedAt: previous.fetchedAt }
    : next;
}

export function mergeEnvironment(previous: EnvironmentResponse | null, next: EnvironmentResponse): EnvironmentResponse {
  if (!previous || previous.city.id !== next.city.id || previous.city.latitude !== next.city.latitude || previous.city.longitude !== next.city.longitude) return next;
  const weather = retainSource(previous.weather, next.weather);
  const airQuality = retainSource(previous.airQuality, next.airQuality);
  return { ...next, weather, airQuality, hourly: joinHourly(weather.data, airQuality.data) };
}

export function getUsAqiCategory(value: number | null) {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  if (value <= 50) return { label: "Good", tone: "good" };
  if (value <= 100) return { label: "Moderate", tone: "moderate" };
  if (value <= 150) return { label: "Unhealthy for sensitive groups", tone: "sensitive" };
  if (value <= 200) return { label: "Unhealthy", tone: "unhealthy" };
  if (value <= 300) return { label: "Very unhealthy", tone: "veryUnhealthy" };
  return { label: "Hazardous", tone: "hazardous" };
}

export function formatTimestamp(timestamp: number | null, zone: string | null): string {
  if (timestamp === null || !Number.isFinite(timestamp)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone ?? "UTC", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short",
  }).format(new Date(timestamp * 1000));
}

export function windDirection(degrees: number | null): string {
  if (degrees === null || !Number.isFinite(degrees)) return "—";
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8];
}
