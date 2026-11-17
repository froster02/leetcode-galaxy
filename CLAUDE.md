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

Client-side-only React 19 + Vite SPA, plain `.jsx` (no TypeScript). Turns a LeetCode profile into a **single minimal page** (the "Ledger" layout: one column, section label on the left, hairline dividers) showing every public stat, plus a **Post to LinkedIn** flow. No backend, no database, no WebGL — all data comes from public LeetCode APIs at runtime.

### App structure

- **No router.** `src/App.jsx` holds `view: 'landing' | 'loading' | 'profile'`. URLs: `/` landing, `/u/<user>` profile (old `?view=card` links land on the same page); `pushState`/`popstate` keep them in sync. GitHub Pages deep links work via `public/404.html` plus a `?p=` restore shim in `index.html`. `searchSeqRef` drops stale responses when a newer search starts.
- **No state library.** Plain hooks with prop drilling from `App.jsx`. `ProfilePage` is lazy-loaded.
- **Styling:** semantic CSS tokens in `src/index.css` (`--bg`, `--surface`, `--label`, `--secondary-label`, `--separator`, `--fill`, `--tint`, `--easy/--medium/--hard`, `--heat-0..4` for the heatmap), light by default and dark via `prefers-color-scheme`. System font stack (`--font`, `--font-mono` for numbers), no web fonts. Utility classes: `.t-display/.t-title/.t-headline/.t-body/.t-footnote/.t-caption`, `.btn`(`-primary/-secondary/-plain/-ink/-outline`), `.field`, `.surface`, `.material` (translucent chrome only — solid under `prefers-reduced-transparency`/`prefers-contrast`), `.press` (pointer-down scale feedback); the profile page uses the `LEDGER` block (`.ledger`, `.ledger-row`, `.ledger-label`, `.ledger-body`, `.num`, `.bar`, `.heat-grid`, `.ledger-table`, `.pill`, `.link-btn`, `.share-*`). Tailwind is configured but not imported; inline styles + these classes do the work.
- **Motion:** minimal. Framer Motion fades/springs on the landing page and a fade-in on the profile page; `useReducedMotion` (own hook) turns them off.

### Key directories

- `src/components/` — `LandingUI.jsx` (search, legend chips, static ledger preview, easter eggs), `ProfilePage.jsx` (page shell: builds the summary, owns share/copy state), `ErrorToast.jsx`
- `src/components/profile/` — `sections.jsx` (one component per ledger row: `Header`, `Headline`, `Solved`, `Activity` + `YearHeatmap`, `Contests`, `Skills`, `Languages`, `Badges`, `Recent`; each returns null without data), `ShareDialog.jsx` (download image → copy caption → open LinkedIn composer, native share where supported), `ShareImage.jsx` (1200×627 card rasterized at 2× by html2canvas — explicit hex colors, no CSS vars, no remote images)
- `src/hooks/` — `useLeetCode.js` (all data fetching + caching), `useShareCapture.js` (html2canvas pipeline + download/copy/native share; actions accept a pre-rendered dataUrl/blob because Safari drops user activation across a slow render), `useIsMobile.js`, `useReducedMotion.js`
- `src/utils/` — `dataMapper.js` (`mapProfile`: API payload → view model: stats, identity with http(s)-only links, all skill tiers, languages, acceptance, beats, contest rows, recent accepted), `profile.js` (pure: `buildSummary`, `buildShareCaption`, `linkedInShareUrl`, formatters), `activity.js` (pure: monthly/weekday totals, busiest month/weekday, current streak), `calendar.js` (`parseCalendar`, `calendarStats`, `buildYearGrid`), `normalization.js`, `handle.js` (accepts `@name` / profile URLs)

**Note:** `.github/copilot-instructions.md` documents an older solar-system architecture that no longer exists — it's stale, ignore it.

### Data flow — important gotcha

The runtime fetches from a **hardcoded third-party API** in `src/hooks/useLeetCode.js`: `https://alfa-leetcode-api.onrender.com` (Render free tier — the hook fires a `prewarmApi()` ping to wake it, uses a 12s per-request timeout, and caches in localStorage under `lc_<username>` with a 30-min TTL and a `CACHE_VERSION` constant that invalidates old caches when bumped). One search makes 8 requests: `/userProfile` (strict, decides "No user found") plus `/contest`, `/badges`, `/calendar`, `/:user` (identity), `/languageStats`, `/acSubmission` and `/skillStats`, all optional. "Beats %" per difficulty only exists in LeetCode GraphQL, so it shows only when the worker served the data.

The Cloudflare Worker in `worker/index.js` (CORS proxy to `leetcode.com/graphql`, 30-min edge cache — matches the client TTL so the two caches expire in lockstep) is an **optional fallback**: when `VITE_WORKER_URL` is set at build time, the hook retries via the worker whenever the Alfa API throws `Rate limited` or `Network error` (never on `No user found`). Unset (the default) = Alfa-only. The worker's flat payload is mapped to the canonical shape by the exported pure `mapWorkerResponse` in `useLeetCode.js`. Both the Alfa path and the worker-fallback path only write to the localStorage cache when the payload is *complete* — a partial/timed-out response is never pinned for 30 minutes. The worker fills missing sections with empty defaults, so it sends its own `complete` flag (and skips its edge cache when false); the client trusts only `complete === true`.

## Deployment

- **Active CI:** `.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages on push to `main`. `vite.config.js` takes its `base` path from the `GITHUB_PAGES_BASE_PATH` env var set by the workflow.
- `vercel.json` exists as an alternative target (SPA rewrite, security headers).

## After Every Code Change

Run `scripts/run-tests.sh` (build + lint + unit tests), then verify the relevant manual cases in [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md).

Key manual cases to always hit:
- **M5** — Legend chips load (or show rate-limit toast, never "Couldn’t load that profile")
- **M7/M8** — Bad username shows "No user found" and Back button is clean
- **M41–M46** — Profile page renders every row with data, hides empty ones, and has no horizontal scroll at 320px after any data/UI change
- **M53–M56** — Share dialog: image renders, download, copy caption, open LinkedIn
- **M30** — Zero console errors

## Conventions

- ESLint allows unused vars matching `^[A-Z_]` (constants/components) — relevant when adding uppercase-named constants.
