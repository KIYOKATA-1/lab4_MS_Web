import type {
  AirQualityData,
  EnvironmentResponse,
  HourlyPoint,
  SourceResult,
  WeatherData,
} from "@/services/environment/environment.types";

export function joinHourly(
  weather: WeatherData | null,
  air: AirQualityData | null,
): HourlyPoint[] {
  const points = new Map<number, HourlyPoint>();
  function point(timestamp: number) {
    let value = points.get(timestamp);
    if (!value) {
      value = { timestamp, temperature: null, usAqi: null, pm25: null };
      points.set(timestamp, value);
    }
    return value;
  }
  weather?.hourly.forEach((entry) => {
    point(entry.timestamp).temperature = entry.temperature;
  });
  air?.hourly.forEach((entry) => {
    const target = point(entry.timestamp);
    target.usAqi = entry.usAqi;
    target.pm25 = entry.pm25;
  });
  return [...points.values()].sort(
    (left, right) => left.timestamp - right.timestamp,
  );
}

function retainSource<T>(
  previous: SourceResult<T>,
  next: SourceResult<T>,
): SourceResult<T> {
  return next.status !== "success" && previous.data
    ? { ...next, data: previous.data, fetchedAt: previous.fetchedAt }
    : next;
}

export function mergeEnvironment(
  previous: EnvironmentResponse | null,
  next: EnvironmentResponse,
): EnvironmentResponse {
  if (
    !previous ||
    previous.city.id !== next.city.id ||
    previous.city.latitude !== next.city.latitude ||
    previous.city.longitude !== next.city.longitude
  )
    return next;
  const weather = retainSource(previous.weather, next.weather);
  const airQuality = retainSource(previous.airQuality, next.airQuality);
  return {
    ...next,
    weather,
    airQuality,
    hourly: joinHourly(weather.data, airQuality.data),
  };
}

export const AQI_BANDS = [
  {
    max: 50,
    range: "0–50",
    label: "Good",
    tone: "good",
    description:
      "Air quality is satisfactory; air pollution poses little or no risk.",
  },
  {
    max: 100,
    range: "51–100",
    label: "Moderate",
    tone: "moderate",
    description:
      "Air quality is acceptable, but unusually sensitive people may be affected.",
  },
  {
    max: 150,
    range: "101–150",
    label: "Unhealthy for sensitive groups",
    tone: "sensitive",
    description:
      "Sensitive groups may experience health effects; the general public is less likely to be affected.",
  },
  {
    max: 200,
    range: "151–200",
    label: "Unhealthy",
    tone: "unhealthy",
    description:
      "Some people may experience health effects; sensitive groups may experience more serious effects.",
  },
  {
    max: 300,
    range: "201–300",
    label: "Very unhealthy",
    tone: "veryUnhealthy",
    description: "Health risks are increased for everyone.",
  },
  {
    max: 500,
    range: "301–500",
    label: "Hazardous",
    tone: "hazardous",
    description:
      "Emergency conditions: everyone is more likely to be affected.",
  },
] as const;

export function getUsAqiCategory(value: number | null) {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  return (
    AQI_BANDS.find((band) => value <= band.max) ??
    AQI_BANDS[AQI_BANDS.length - 1]
  );
}

export function getUsAqiPosition(value: number | null): number | null {
  if (!getUsAqiCategory(value) || value === null) return null;
  const capped = Math.min(value, 500);
  const index = AQI_BANDS.findIndex((band) => capped <= band.max);
  const start = index === 0 ? 0 : AQI_BANDS[index - 1].max;
  return (
    ((index + (capped - start) / (AQI_BANDS[index].max - start)) /
      AQI_BANDS.length) *
    100
  );
}

export function formatTimestamp(
  timestamp: number | null,
  zone: string | null,
): string {
  if (timestamp === null || !Number.isFinite(timestamp)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone ?? "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
  })
    .format(new Date(timestamp * 1000))
    .replace("GMT", "UTC");
}

export function windDirection(degrees: number | null): string {
  if (degrees === null || !Number.isFinite(degrees)) return "—";
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
    Math.round(degrees / 45) % 8
  ];
}
