# Eco Monitor

A responsive dashboard for weather and air quality in a selected city. Built with Next.js App Router, React, TypeScript, and SCSS Modules.

The initial page currently contains only the Eco Monitor header with an ecological symbol and the “Weather & Air Quality” tagline. Data sources are not connected.

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

- `src/app/page.tsx`: server-rendered page displaying the header.
- `src/app/layout.tsx`: root layout and project metadata.
- `src/app/globals.scss`: reset, base styles, and design tokens.
- `src/components/Header.tsx`: responsive header with its SCSS Module and decorative SVG icon.

No API keys or environment variables are needed for the initial page.
