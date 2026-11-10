import { findCityByCoordinates, searchCities } from "@/services/geocoding";

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
    const location = await findCityByCoordinates({ latitude, longitude });
    if (!location) {
      return Response.json(
        { error: "No city was found near your location. Please search by name." },
        { status: 404 },
      );
    }

    const data = await searchCities(location.name, location.country_code);
    return Response.json({ ...data, location });
  } catch (error) {
    console.error("Location search failed:", error);
    return Response.json(
      { error: "Unable to find your city. Please try again or search by name." },
      { status: 502 },
    );
  }
}
