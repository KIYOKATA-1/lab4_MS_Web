import { joinHourly } from "./environment";
import type {
  AirQualityData,
  HourlyPoint,
  WeatherData,
} from "@/services/environment/environment.types";

export const HOUR_MS = 60 * 60 * 1000;
export const HOURLY_METRICS = [
  { key: "usAqi", label: "US AQI", unit: "index" },
  { key: "pm25", label: "PM2.5", unit: "µg/m³" },
  { key: "temperature", label: "Temperature", unit: "°C" },
] as const;
export type HourlyMetric = (typeof HOURLY_METRICS)[number]["key"];
// Unlike the API DTO, chart timestamps are milliseconds.
export type HourlyChartPoint = HourlyPoint;

export function prepareHourlyData(
  weather: WeatherData | null,
  air: AirQualityData | null,
  nowMs: number,
  timeZone = "UTC",
) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(nowMs);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );
  const second = Number(
    parts.find((part) => part.type === "second")?.value ?? 0,
  );
  // Truncate the local clock to its current hour, including zones with fractional-hour offsets.
  // Epoch times themselves never receive a timezone offset.
  const start = nowMs - minute * 60000 - second * 1000 - (nowMs % 1000);
  const end = start + 24 * HOUR_MS;
  const points = new Map<number, HourlyChartPoint>();
  for (let timestamp = start; timestamp < end; timestamp += HOUR_MS) {
    points.set(timestamp, {
      timestamp,
      temperature: null,
      usAqi: null,
      pm25: null,
    });
  }
  const finite = (value: number | null, nonnegative = false) =>
    value !== null && Number.isFinite(value) && (!nonnegative || value >= 0)
      ? value
      : null;
  for (const point of joinHourly(weather, air)) {
    const timestamp = point.timestamp * 1000;
    if (!Number.isFinite(timestamp) || timestamp < start || timestamp >= end)
      continue;
    points.set(timestamp, {
      timestamp,
      temperature: finite(point.temperature),
      usAqi: finite(point.usAqi, true),
      pm25: finite(point.pm25, true),
    });
  }
  return {
    start,
    end,
    points: [...points.values()].sort(
      (left, right) => left.timestamp - right.timestamp,
    ),
  };
}

export function getHourlyDomain(
  points: readonly HourlyChartPoint[],
  metric: HourlyMetric,
): [number, number] {
  const values = points
    .map((point) => point[metric])
    .filter(
      (value): value is number => value !== null && Number.isFinite(value),
    );
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (metric !== "temperature") return [0, Math.max(1, Math.ceil(max * 1.1))];
  const padding = Math.max(1, (max - min) * 0.1);
  return [Math.floor(min - padding), Math.ceil(max + padding)];
}

export function formatHourlyTime(
  timestamp: number,
  timeZone: string,
  compact = false,
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "short",
    ...(compact ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
    ...(compact ? {} : { timeZoneName: "shortOffset" }),
  })
    .format(new Date(timestamp))
    .replace("GMT", "UTC");
}

export function formatHourlyValue(value: number | null): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(
        value,
      );
}
