import "server-only";

import { fetchJson } from "@/services/http/fetch-json";
import { parseAirQuality } from "./environment.parsers";
import { sourceResult } from "./source-result";
import type { SelectedCity } from "./environment.types";

export function getAirQuality(city: SelectedCity, signal?: AbortSignal) {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.search = new URLSearchParams({
    latitude: String(city.latitude), longitude: String(city.longitude),
    current: "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone", hourly: "us_aqi,pm2_5",
    timezone: "auto", timeformat: "unixtime", forecast_hours: "24",
  }).toString();
  return sourceResult("Air quality", async () => parseAirQuality(await fetchJson(url, "Air quality", signal)), (data) =>
    [data.usAqi, data.pm25, data.pm10, data.nitrogenDioxide, data.ozone].some((value) => value !== null) ||
    data.hourly.some((point) => point.usAqi !== null || point.pm25 !== null));
}
