import { isRecord } from "@/lib/validation";
import { parseSelectedCity } from "./environment.parsers";
import type { AirQualityData, EnvironmentResponse, SourceResult, WeatherData } from "./environment.types";

const numberOrNull = (value: unknown) => value === null || (typeof value === "number" && Number.isFinite(value));
const stringOrNull = (value: unknown) => value === null || typeof value === "string";

function isWeather(value: unknown): value is WeatherData {
  if (!isRecord(value) || typeof value.timeZone !== "string" || !isRecord(value.units) || !Array.isArray(value.hourly)) return false;
  return ["observedAt", "temperature", "feelsLike", "humidity", "windSpeed", "windDirection", "weatherCode"].every((key) => numberOrNull(value[key])) &&
    (value.isDay === null || typeof value.isDay === "boolean") &&
    ["temperature", "humidity", "windSpeed"].every((key) => isRecord(value.units) && stringOrNull(value.units[key])) &&
    value.hourly.every((point: unknown) => isRecord(point) && typeof point.timestamp === "number" && Number.isFinite(point.timestamp) && numberOrNull(point.temperature));
}

function isAir(value: unknown): value is AirQualityData {
  if (!isRecord(value) || typeof value.timeZone !== "string" || !isRecord(value.units) || !Array.isArray(value.hourly)) return false;
  return ["observedAt", "usAqi", "pm25", "pm10", "nitrogenDioxide", "ozone"].every((key) => numberOrNull(value[key])) &&
    ["pm25", "pm10", "nitrogenDioxide", "ozone"].every((key) => isRecord(value.units) && stringOrNull(value.units[key])) &&
    value.hourly.every((point: unknown) => isRecord(point) && typeof point.timestamp === "number" && Number.isFinite(point.timestamp) && numberOrNull(point.usAqi) && numberOrNull(point.pm25));
}

function isSource<T>(value: unknown, guard: (data: unknown) => data is T): value is SourceResult<T> {
  return isRecord(value) && ["success", "empty", "error"].includes(String(value.status)) &&
    (value.data === null || guard(value.data)) && numberOrNull(value.fetchedAt) && stringOrNull(value.error);
}

export function isEnvironmentResponse(value: unknown): value is EnvironmentResponse {
  if (!isRecord(value) || !isSource(value.weather, isWeather) || !isSource(value.airQuality, isAir) || !Array.isArray(value.hourly)) return false;
  try { parseSelectedCity(value.city); } catch { return false; }
  return value.hourly.every((point: unknown) => isRecord(point) && typeof point.timestamp === "number" && Number.isFinite(point.timestamp) &&
    ["temperature", "usAqi", "pm25"].every((key) => numberOrNull(point[key])));
}
