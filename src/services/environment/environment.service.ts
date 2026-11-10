import "server-only";

import { joinHourly } from "@/lib/environment";
import { getWeather } from "./weather.service";
import { getAirQuality } from "./air-quality.service";
import type { EnvironmentResponse, SelectedCity } from "./environment.types";

export async function getEnvironment(city: SelectedCity, signal?: AbortSignal): Promise<EnvironmentResponse> {
  const [weather, airQuality] = await Promise.all([getWeather(city, signal), getAirQuality(city, signal)]);
  const selected = { ...city, timeZone: city.timeZone ?? weather.data?.timeZone ?? airQuality.data?.timeZone ?? null };
  return { city: selected, weather, airQuality, hourly: joinHourly(weather.data, airQuality.data) };
}
