import { findCityByCoordinates, searchCities } from "@/services/geocoding";
import { getEnvironment } from "@/services/environment/environment.service";
import { parseSelectedCity } from "@/services/environment/environment.parsers";

function parseCoordinate(value: string | null, min: number, max: number) {
  if (!value?.trim()) return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max
    ? coordinate
    : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = parseCoordinate(params.get("latitude"), -90, 90);
  const longitude = parseCoordinate(params.get("longitude"), -180, 180);

  if (latitude === null || longitude === null) {
    return Response.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  try {
    const location = await findCityByCoordinates({ latitude, longitude }, request.signal);
    if (!location) {
      return Response.json(
        { error: "No city was found near your location. Please search by name." },
        { status: 404 },
      );
    }

    const data = await searchCities(location.name, location.country_code, request.signal);
    const city = data.results?.[0];
    if (!city) return Response.json({ error: "City not found" }, { status: 404 });
    return Response.json(await getEnvironment(parseSelectedCity(city), request.signal));
  } catch (error) {
    console.error("Location search failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to find your city. Please try again or search by name." },
      { status: 502 },
    );
  }
}
