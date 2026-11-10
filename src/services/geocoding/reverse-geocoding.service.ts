import "server-only";

import type { Coordinates, LocatedCity } from "./geocoding.types";
import { InvalidResponseError, record, text } from "@/lib/validation";
import { fetchJson } from "@/services/http/fetch-json";

export async function findCityByCoordinates(coordinates: Coordinates, signal?: AbortSignal): Promise<LocatedCity | null> {
  const url = new URL("https://photon.komoot.io/reverse");
  url.search = new URLSearchParams({
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
    lang: "en",
    layer: "city",
    limit: "1",
    radius: "50",
  }).toString();

  const data = record(await fetchJson(url, "Location lookup", signal));
  if (!Array.isArray(data.features)) throw new InvalidResponseError();
  if (!data.features.length) return null;
  const city = record(record(data.features[0]).properties);
  const name = text(city.name);
  if (!name) return null;

  return {
    ...coordinates,
    name,
    country: text(city.country) ?? undefined,
    country_code: text(city.countrycode)?.toUpperCase(),
  };
}
