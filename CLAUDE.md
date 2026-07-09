# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview the built site
npm run lint      # ESLint (flat config)
npm test          # Unit tests (Vitest) — pure utils only, test files in tests/
```

No component/E2E tests — UI verification is manual via `docs/TEST_PLAN.md`.

Docker alternative: `docker-compose up` runs the frontend (Vite, :5173) and the Cloudflare Worker via wrangler dev (:8787).

## Architecture

Client-side-only React 19 + Vite SPA, plain `.jsx` (no TypeScript). Renders a LeetCode profile as a 3D neon "mushroom biome" using Three.js. No backend, no database — all data comes from public LeetCode APIs at runtime.

### App structure

- **No router.** `src/App.jsx` is a phase state machine (landing → transition → biome/city) driven by `useState` and Framer Motion `AnimatePresence`. The react-three-fiber `<Canvas>` is set up there. GitHub Pages SPA routing is handled by `public/404.html` plus a `?p=` restore shim in `index.html`.
- **No state library.** Plain hooks with prop drilling from `App.jsx`.
- **3D stack:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (Bloom). Main scene is `src/components/CityScene.jsx` (exports `CityCanvas`); `GalaxyScene.jsx` renders the star field.
- **Styling:** Tailwind (custom theme colors `background`/`accent`/`easy`/`medium`/`hard`, fonts `orbitron`/`mono` in `tailwind.config.js`) plus heavy inline styles for neon/3D effects.

### Key directories

- `src/components/` — large monolithic files: `FighterCard.jsx` (~1100 lines, profile card + VS battle), `CityScene.jsx` (~850), `LandingUI.jsx` and `UserPanel.jsx` (~800 each), plus `ShareCard.jsx` (PNG export via html-to-image/html2canvas)
- `src/hooks/` — `useLeetCode.js` (all data fetching), `useSpaceSound.js` (audio)
- `src/utils/` — `dataMapper.js` (maps API data to the 3D scene), `normalization.js` (stat validation/fixing), `gameData.js` (power tiers, fighter classes, easter-egg usernames like `tars`/`murph`/`cooper` and special-cased legendary coders), `colors.js`

### Data flow — important gotcha

The runtime fetches from a **hardcoded third-party API** in `src/hooks/useLeetCode.js`: `https://alfa-leetcode-api.onrender.com` (Render free tier — the hook fires a `prewarmApi()` ping to wake it, uses a 12s per-request timeout, and caches in localStorage under `lc_<username>` with a 30-min TTL and a `CACHE_VERSION` constant that invalidates old caches when bumped).

The Cloudflare Worker in `worker/index.js` (CORS proxy to `leetcode.com/graphql`, 1hr edge cache) is an **optional fallback**: when `VITE_WORKER_URL` is set at build time, the hook retries via the worker whenever the Alfa API throws `Rate limited` or `Network error` (never on `No user found`). Unset (the default) = Alfa-only. The worker's flat payload is mapped to the canonical shape by the exported pure `mapWorkerResponse` in `useLeetCode.js`.

## Deployment

- **Active CI:** `.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages on push to `main`. `vite.config.js` takes its `base` path from the `GITHUB_PAGES_BASE_PATH` env var set by the workflow.
- `vercel.json` exists as an alternative target (SPA rewrite, security headers).

## After Every Code Change

Run `scripts/run-tests.sh` (build + lint + unit tests), then verify the relevant manual cases in [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md).

Key manual cases to always hit:
- **M5** — Legendary Explorers load (or show rate-limit message, never "Unable to load profile")
- **M7/M8** — Bad username shows "No user found" and Back button is clean
- **M11** — Biome renders after any data/3D change
- **M30** — Zero console errors

## Conventions

- ESLint allows unused vars matching `^[A-Z_]` (constants/components) — relevant when adding uppercase-named constants.
