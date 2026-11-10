export type WeatherIconKind =
  | "sun"
  | "moon"
  | "partlyDay"
  | "partlyNight"
  | "cloud"
  | "fog"
  | "rain"
  | "snow"
  | "storm"
  | "unknown";

const descriptions: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function describeWeather(
  code: number | null,
  isDay: boolean | null,
): { description: string; icon: WeatherIconKind } {
  if (code === null || !Number.isFinite(code) || !descriptions[code])
    return { description: "Conditions unavailable", icon: "unknown" };
  let icon: WeatherIconKind = "cloud";
  if (code <= 1) icon = isDay === null ? "unknown" : isDay ? "sun" : "moon";
  else if (code === 2)
    icon = isDay === null ? "cloud" : isDay ? "partlyDay" : "partlyNight";
  else if (code === 45 || code === 48) icon = "fog";
  else if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    icon = "snow";
  else if (code >= 95) icon = "storm";
  else if (code >= 51) icon = "rain";
  return { description: descriptions[code], icon };
}
