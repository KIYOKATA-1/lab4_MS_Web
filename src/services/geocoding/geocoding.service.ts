import "server-only";

import type { GeocodingResponse } from "./geocoding.types";

const searchEndpoint = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchCities(name: string, countryCode?: string): Promise<GeocodingResponse> {
  const url = new URL(searchEndpoint);
  url.search = new URLSearchParams({
    name: name.trim(),
    count: "1",
    language: "en",
    format: "json",
  }).toString();

  if (countryCode) {
    url.searchParams.set("countryCode", countryCode.toUpperCase());
  }

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo geocoding failed with status ${response.status}.`);
  }

  return response.json();
}
