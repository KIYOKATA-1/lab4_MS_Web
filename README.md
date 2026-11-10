# Eco Monitor

A responsive dashboard for weather and air quality in a selected city. Built with Next.js App Router, React, TypeScript, and SCSS Modules.

The page contains the Eco Monitor header and city search controls. Submit a city name with Enter or the search icon to retrieve a location from [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api). The response is currently displayed as plain JSON. Favorites are reserved for a future localStorage feature.

`Use my location` requests browser geolocation, resolves a nearby city through [Photon](https://github.com/komoot/photon/blob/master/docs/api-v1.md), and automatically searches Open-Meteo within that country. The city name fills the search field and the JSON includes the original coordinates in `location`. The browser must run on HTTPS or localhost. Editing or clearing the query cancels the operation, including ignoring late geolocation callbacks.

## Development

Use Node.js 20.19+ and pnpm 10.28.0 (see `packageManager` in `package.json`).

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Checks and production

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm start
```

`pnpm start` serves the production build after `pnpm build`.

## Structure

- `src/app/page.tsx`: server-rendered page composing the header and city search.
- `src/app/api/cities/route.ts`: validates search requests and exposes `GET /api/cities?name=Berlin`.
- `src/app/api/cities/location/route.ts`: validates coordinates and resolves the city before searching Open-Meteo.
- `src/app/layout.tsx`: root layout and project metadata.
- `src/app/globals.scss`: reset, base styles, and design tokens.
- `src/components/Header/`: responsive header and its SCSS Module.
- `src/components/CitySearch/`: search UI, SCSS Module, and client state in `useCitySearch.ts`.
- `src/components/Icons/`: shared SVG components.
- `src/services/geocoding/`: server-only Open-Meteo and Photon integrations and response types. Client code imports only the types; external API requests run through the route handlers.

No API keys or environment variables are needed. The server must have network access to `geocoding-api.open-meteo.com` and `photon.komoot.io`. Search uses at least two characters and requests English JSON results, with a ten-second timeout per upstream request. Photon resolves the nearest city within 50 km; no match produces an error with manual search available. Loading, no matches, permission denial, unavailable geolocation, timeouts, and request failures are handled in the UI. Photon/OpenStreetMap attribution is displayed with location results.
