import { InvalidResponseError, numeric, record, requiredNumber, text, timeZone } from "@/lib/validation";
import type { GeocodingResponse } from "./geocoding.types";

export function parseGeocoding(value: unknown): GeocodingResponse {
  const body = record(value);
  if (body.results !== undefined && !Array.isArray(body.results)) throw new InvalidResponseError();
  return {
    generationtime_ms: numeric(body.generationtime_ms, 0) ?? undefined,
    results: (body.results ?? []).map((entry: unknown) => {
      const city = record(entry);
      const name = text(city.name);
      if (!name) throw new InvalidResponseError();
      return {
        id: requiredNumber(city.id, 0), name,
        latitude: requiredNumber(city.latitude, -90, 90),
        longitude: requiredNumber(city.longitude, -180, 180),
        country: text(city.country) ?? undefined,
        country_code: text(city.country_code) ?? undefined,
        timezone: timeZone(city.timezone) ?? undefined,
      };
    }),
  };
}
