# Sourcify UI

The website at [sourcify.dev](https://sourcify.dev). It is a React app that [Vite](https://vite.dev) builds.

## Requirements

Use the Node.js version in `.nvmrc`. The tools need Node.js 22.13 or newer.

## Environment variables

The app reads its settings from environment variables that start with `VITE_`. In the code, they are in `import.meta.env`.

Vite puts the values into the JavaScript bundle at build time. Do not put secrets in them: every visitor can read them.

- `npm run dev` reads `.env.development`. This file points to the staging backend.
- `npm run build` reads `.env` and `.env.production`. The deploy workflow copies `.env.build.staging` or `.env.build.main` to `.env` before the build.

## Run the development server

```
npm install
npm run dev
```

The server runs at http://localhost:3000.

## Build

```
npm run build
```

The build first checks the TypeScript types. Then it writes the static files to `build/`. Any static web server can serve this directory. The server must answer unknown paths with `index.html`, because the app handles the routes in the browser.

To serve the build on your computer, run `npm run preview`.

## Other commands

- `npm run lint` checks the code with ESLint.
- `npm test` runs the unit tests with Vitest.
- `npm run test:e2e` runs the smoke tests with Playwright against the build in `build/`. Run `npm run build` first. The first time, install the browser with `npx playwright install chromium`.

The CI workflow runs all of these on every pull request.
