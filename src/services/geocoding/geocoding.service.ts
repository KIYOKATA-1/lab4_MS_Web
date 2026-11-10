import "server-only";

import type { GeocodingResponse } from "./geocoding.types";
import { fetchJson } from "@/services/http/fetch-json";
import { parseGeocoding } from "./geocoding.parsers";

const searchEndpoint = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchCities(name: string, countryCode?: string, signal?: AbortSignal): Promise<GeocodingResponse> {
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

  return parseGeocoding(await fetchJson(url, "City search", signal));
}
