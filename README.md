# Eco Monitor

A responsive dashboard for weather and air quality in a selected city. Built with Next.js App Router, React, TypeScript, and SCSS Modules.

The page contains the Eco Monitor header and city search controls. It initially looks up Astana, Kazakhstan using [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api), then loads weather and air quality in parallel. Submit another city name with Enter or the search icon. Environmental overview displays two responsive cards: Air quality with the current US AQI, category, explanation and six-band scale, and Weather with temperature, conditions, feels-like temperature, humidity and wind. Each card shows its own observation time in the source timezone. Missing values appear as an em dash; failed refreshes preserve available readings and offer retry. AQI category definitions follow [AirNow](https://www.airnow.gov/aqi/aqi-basics/); scale band widths are not linear.

Below the overview, four pollutant cards display PM2.5, PM10, nitrogen dioxide (NO₂), and ozone (O₃) from the same air-quality response. Values use one decimal place and source-provided units; missing readings show an em dash. The cards include short explanations and adapt from four columns to two or one.

The Recharts “Next 24 hours” card uses the existing hourly weather and air-quality data without additional requests. US AQI, PM2.5 and temperature share a true time axis with separate value scales; missing hours remain gaps. The forecast interval starts at the current hour in the city timezone, and the expandable table uses the same points and formatting. Loading, refresh, source failure, partial availability and empty forecasts have explicit states; unavailable metrics are disabled and selection falls back to an available metric.

Click the star to add or remove the selected city from Favorites. Saved cities persist in this browser using localStorage and stay in sync across tabs. Click a favorite to load fresh weather and air quality from its saved coordinates, or its × button to remove it. Invalid saved entries are ignored; storage failures show a message without claiming the city was saved.

`Use my location` requests browser geolocation, resolves a nearby city through [Photon](https://github.com/komoot/photon/blob/master/docs/api-v1.md), searches Open-Meteo within that country, and loads weather and air quality for the matched city's coordinates. The city name fills the search field. The browser must run on HTTPS or localhost. Editing or clearing the query cancels the operation, including ignoring late geolocation callbacks.

`Refresh` and source-level `Try again` use `POST /api/cities` with the selected city and coordinates. They fetch both sources without repeating geocoding or browser permission prompts. Previous readings remain visible during refresh; failure in one source preserves that source's previous successful values and receipt timestamp, alongside its error. Successful sources update independently. Source timestamps are Unix seconds formatted with the city's timezone, independently from the browser's timezone.

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
pnpm test
pnpm build
pnpm start
```

`pnpm start` serves the production build after `pnpm build`.

## Structure

- `src/app/page.tsx`: server-rendered page composing the header and city search.
- `src/app/api/cities/route.ts`: `GET` geocodes a city and loads its environment; `POST` refreshes selected coordinates. Empty geocoding returns `City not found` without downstream requests.
- `src/app/api/cities/location/route.ts`: validates coordinates and resolves the city before searching Open-Meteo.
- `src/app/layout.tsx`: root layout and project metadata.
- `src/app/globals.scss`: reset, base styles, and design tokens.
- `src/components/Header/`: responsive header and its SCSS Module.
- `src/components/CitySearch/`: search UI, SCSS Module, and client state in `useCitySearch.ts`.
- `src/components/EnvironmentData/`: responsive environmental overview cards with AQI categories and scale, weather readings, source timestamps, attribution, and retry buttons.
- `src/components/HourlyChart/`: client Recharts forecast, metric controls, tooltip, and expandable data table.
- `src/components/Icons/`: shared SVG components.
- `src/services/geocoding/`: server-only Open-Meteo and Photon integrations and response types. Client code imports only the types; external API requests run through the route handlers.
- `src/services/environment/`: small server-only weather and air-quality services, runtime parsers, shared types, and parallel orchestration.
- `src/services/http/`: uncached JSON requests, a ten-second timeout, HTTP checks, and readable network/timeout/invalid-response errors.
- `src/lib/`: validation, WMO descriptions, US AQI categories, timezone formatting, and hourly alignment by timestamp.
- `tests/`: Node test runner with isolated HTTP mocks, using the installed TypeScript compiler to execute the actual service modules. No test switches are exposed in the application.

No API keys or environment variables are needed. The server requires network access to `geocoding-api.open-meteo.com`, `api.open-meteo.com`, `air-quality-api.open-meteo.com`, and `photon.komoot.io`. Requests use server-side `fetch` and JSON, as specified by the task; the existing SDK dependency is preserved. There is no server caching or application state manager. Recharts renders the hourly forecast; `react-is` is pinned to the installed React version. Null readings stay null; zero remains a valid measurement. Hourly temperature, US AQI, and PM2.5 are aligned by Unix timestamp for the forecast chart and table. All readings are model-based estimates from Open-Meteo/CAMS, not local sensor measurements.
