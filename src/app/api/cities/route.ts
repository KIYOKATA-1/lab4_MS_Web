import { searchCities } from "@/services/geocoding";
import { getEnvironment } from "@/services/environment/environment.service";
import { parseSelectedCity } from "@/services/environment/environment.parsers";
import type { SelectedCity } from "@/services/environment/environment.types";

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";

  if (name.length < 2) {
    return Response.json(
      { error: "Enter at least two characters to search for a city." },
      { status: 400 },
    );
  }

  try {
    const data = await searchCities(name, undefined, request.signal);
    const city = data.results?.[0];
    if (!city) return Response.json({ error: "City not found" }, { status: 404 });
    return Response.json(await getEnvironment(parseSelectedCity(city), request.signal));
  } catch (error) {
    console.error("City search failed:", error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to search for cities. Please try again." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  let city: SelectedCity;
  try {
    const body: unknown = await request.json();
    city = parseSelectedCity(body);
  } catch {
    return Response.json({ error: "A valid city and coordinates are required." }, { status: 400 });
  }
  return Response.json(await getEnvironment(city, request.signal));
}
