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

Client-side-only React 19 + Vite SPA, plain `.jsx` (no TypeScript). Turns a LeetCode profile into **"LeetCode Wrapped"** — a swipeable, Apple-style story ending in a shareable 9:16 card — plus a "Full stats" dashboard. No backend, no database, no WebGL — all data comes from public LeetCode APIs at runtime.

### App structure

- **No router.** `src/App.jsx` holds `view: 'landing' | 'loading' | 'wrapped' | 'card'`. URLs: `/` landing, `/u/<user>` story, `/u/<user>?view=card` stats; `pushState`/`popstate` keep them in sync. GitHub Pages deep links work via `public/404.html` plus a `?p=` restore shim in `index.html`. `searchSeqRef` drops stale responses when a newer search starts.
- **No state library.** Plain hooks with prop drilling from `App.jsx`. `WrappedStory` and `FighterCard` are lazy-loaded.
- **Styling:** semantic CSS tokens in `src/index.css` (`--bg`, `--surface`, `--label`, `--secondary-label`, `--separator`, `--tint`, `--easy/--medium/--hard`), light by default and dark via `prefers-color-scheme`; a `data-theme="dark"` attribute forces the dark palette on a subtree (the story, the stats page and their portaled modals are dark-only art). System font stack (`--font`), no web fonts. Utility classes: `.t-display/.t-title/.t-headline/.t-body/.t-footnote/.t-caption`, `.btn`(`-primary/-secondary/-plain`), `.field`, `.surface`, `.material` (translucent chrome only — solid under `prefers-reduced-transparency`/`prefers-contrast`), `.press` (pointer-down scale feedback). Tailwind is configured but not imported; inline styles + these classes do the work. Older components still read legacy aliases (`--bg-surface`, `--accent`, `--border`…) defined on top of the new tokens.
- **Motion:** Framer Motion springs (`{ type: 'spring', bounce: 0, duration: ~0.4 }` by default; bounce only after a flick). `useReducedMotion` (own hook) gates drag/auto-advance/count-ups into plain cross-fades.

### Key directories

- `src/components/wrapped/` — `WrappedStory.jsx` (story shell: progress bars, tap/hold/keys, auto-advance, drag with momentum projection, share actions), `slides.jsx` (one component per slide + `buildSlides(w)` which skips slides lacking data), `WrappedCard.jsx` (540×960 share card, rasterized at 2× by html2canvas — explicit hex colors, no backdrop-filter)
- `src/components/` — `LandingUI.jsx`, `FighterCard.jsx` (Full stats page shell + derived stats), `fighter/` (its pieces: `widgets.jsx` gauges/rings/sparkline/`CollapsibleGroup`, `ActivitySection.jsx`, `DeepStatsSection.jsx`, `VSModal.jsx`, `theme.js` fonts/colors/helpers), `ShareCard.jsx` (legacy share modal from Full stats) + `ShareCardView.jsx` (the card it renders), `ErrorToast.jsx`, `Heatmap.jsx` (UTC day buckets, like `utils/wrapped.js`)
- `src/hooks/` — `useLeetCode.js` (all data fetching + caching), `useShareCapture.js` (html2canvas pipeline + download/copy/native share; actions accept a pre-rendered dataUrl because Safari drops user activation across a slow render), `useIsMobile.js`, `useReducedMotion.js`
- `src/utils/` — `dataMapper.js` (`mapProfile`: API payload → view model; `districts` = top 8 topics), `wrapped.js` (pure: monthly/weekday totals, current streak, `personality()` 4-letter archetype, `buildWrapped()` slide model), `calendar.js`, `normalization.js`, `gameData.js` (power formula, tiers, fighter classes), `roast.js`, `handle.js` (accepts `@name` / profile URLs)

**Note:** `.github/copilot-instructions.md` documents an older solar-system architecture that no longer exists — it's stale, ignore it.

### Data flow — important gotcha

The runtime fetches from a **hardcoded third-party API** in `src/hooks/useLeetCode.js`: `https://alfa-leetcode-api.onrender.com` (Render free tier — the hook fires a `prewarmApi()` ping to wake it, uses a 12s per-request timeout, and caches in localStorage under `lc_<username>` with a 30-min TTL and a `CACHE_VERSION` constant that invalidates old caches when bumped).

The Cloudflare Worker in `worker/index.js` (CORS proxy to `leetcode.com/graphql`, 30-min edge cache — matches the client TTL so the two caches expire in lockstep) is an **optional fallback**: when `VITE_WORKER_URL` is set at build time, the hook retries via the worker whenever the Alfa API throws `Rate limited` or `Network error` (never on `No user found`). Unset (the default) = Alfa-only. The worker's flat payload is mapped to the canonical shape by the exported pure `mapWorkerResponse` in `useLeetCode.js`. Both the Alfa path and the worker-fallback path only write to the localStorage cache when the payload is *complete* — a partial/timed-out response is never pinned for 30 minutes. The worker fills missing sections with empty defaults, so it sends its own `complete` flag (and skips its edge cache when false); the client trusts only `complete === true`.

## Deployment

- **Active CI:** `.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages on push to `main`. `vite.config.js` takes its `base` path from the `GITHUB_PAGES_BASE_PATH` env var set by the workflow.
- `vercel.json` exists as an alternative target (SPA rewrite, security headers).

## After Every Code Change

Run `scripts/run-tests.sh` (build + lint + unit tests), then verify the relevant manual cases in [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md).

Key manual cases to always hit:
- **M5** — Legend chips load (or show rate-limit toast, never "Couldn’t load that profile")
- **M7/M8** — Bad username shows "No user found" and Back button is clean
- **M11–M15** — Wrapped story renders and navigates (tap, keys, swipe, hold, auto-advance) after any data/UI change
- **M30** — Zero console errors

## Conventions

- ESLint allows unused vars matching `^[A-Z_]` (constants/components) — relevant when adding uppercase-named constants.
