import { parseSelectedCity } from "@/services/environment/environment.parsers";
import type { SelectedCity } from "@/services/environment/environment.types";

export const FAVORITES_STORAGE_KEY = "eco-monitor:favorites";

export function cityKey(city: SelectedCity): string {
  return `${city.id}:${city.latitude}:${city.longitude}`;
}

export function parseFavorites(stored: string): SelectedCity[] {
  try {
    const values: unknown = JSON.parse(stored);
    if (!Array.isArray(values)) return [];
    const cities = new Map<string, SelectedCity>();
    for (const value of values) {
      try {
        const city = parseSelectedCity(value);
        cities.set(cityKey(city), city);
      } catch {
        // A damaged entry should not hide the remaining saved cities.
      }
    }
    return [...cities.values()];
  } catch {
    return [];
  }
}
