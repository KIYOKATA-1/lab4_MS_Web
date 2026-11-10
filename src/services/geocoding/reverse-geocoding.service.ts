import "server-only";

import type { Coordinates, LocatedCity } from "./geocoding.types";

interface PhotonResponse {
  features?: {
    properties?: {
      name?: string;
      country?: string;
      countrycode?: string;
    };
  }[];
}

export async function findCityByCoordinates(coordinates: Coordinates): Promise<LocatedCity | null> {
  const url = new URL("https://photon.komoot.io/reverse");
  url.search = new URLSearchParams({
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
    lang: "en",
    layer: "city",
    limit: "1",
    radius: "50",
  }).toString();

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Photon reverse geocoding failed with status ${response.status}.`);
  }

  const data: PhotonResponse = await response.json();
  const city = data.features?.[0]?.properties;
  if (!city?.name) return null;

  return {
    ...coordinates,
    name: city.name,
    country: city.country,
    country_code: city.countrycode?.toUpperCase(),
  };
}
