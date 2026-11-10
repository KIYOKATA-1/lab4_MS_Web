import { searchCities } from "@/services/geocoding";

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";

  if (name.length < 2) {
    return Response.json(
      { error: "Enter at least two characters to search for a city." },
      { status: 400 },
    );
  }

  try {
    const data = await searchCities(name);
    return Response.json(data);
  } catch (error) {
    console.error("City search failed:", error);

    return Response.json(
      { error: "Unable to search for cities. Please try again." },
      { status: 502 },
    );
  }
}
