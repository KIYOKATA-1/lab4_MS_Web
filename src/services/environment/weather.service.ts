import "server-only";

import { fetchJson } from "@/services/http/fetch-json";
import { parseWeather } from "./environment.parsers";
import { sourceResult } from "./source-result";
import type { SelectedCity } from "./environment.types";

export function getWeather(city: SelectedCity, signal?: AbortSignal) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(city.latitude), longitude: String(city.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m", models: "best_match", temperature_unit: "celsius", wind_speed_unit: "kmh",
    timezone: "auto", timeformat: "unixtime", forecast_hours: "24",
  }).toString();
  return sourceResult("Weather", async () => parseWeather(await fetchJson(url, "Weather", signal)), (data) =>
    [data.temperature, data.feelsLike, data.humidity, data.windSpeed, data.weatherCode].some((value) => value !== null) ||
    data.hourly.some((point) => point.temperature !== null));
}
