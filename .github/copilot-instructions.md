# Copilot Instructions — LeetCode Galaxy

## Project Overview

LeetCode Galaxy is an interactive 3D visualization platform that transforms LeetCode user statistics into an explorable solar system. Users search for a LeetCode profile and see their problem-solving data rendered as a sun (profile), planets (top coding topics), and moons (individual problems). The app uses a space/sci-fi theme throughout.

## Tech Stack

- **Runtime**: React 19 with functional components and hooks (no class components)
- **3D Engine**: Three.js via React Three Fiber (`@react-three/fiber`) and `@react-three/drei` helpers
- **Post-processing**: `@react-three/postprocessing` (Bloom effects)
- **Animation**: Framer Motion for UI transitions; `useFrame` from R3F for 3D animation loops
- **Styling**: Tailwind CSS 3 (utility classes) + inline style objects for dynamic/component-scoped styles
- **Icons**: `lucide-react`
- **Screenshots**: `html2canvas`
- **Bundler**: Vite 7 with `@vitejs/plugin-react`
- **Linting**: ESLint 9 flat config with `react-hooks` and `react-refresh` plugins
- **Backend**: Cloudflare Workers (Wrangler) — a lightweight GraphQL proxy to LeetCode's API
- **Deployment**: Vercel (frontend), Cloudflare Workers (API proxy), Docker support available
- **Fonts**: Orbitron (headings), Share Tech Mono (monospace body text) via Google Fonts

## Project Structure

```
src/
├── App.jsx              # Root — phase state, viewMode state, Canvas + UI overlays
├── main.jsx             # Entry point — renders App into #root
├── index.css            # Global CSS — 15+ keyframe animations, overlays, utility classes
├── App.css              # Minimal app-level CSS (186 bytes)
├── components/          # All React components (flat, no subdirectories)
│   ├── GalaxyScene.jsx  # Phase 1 & 2: starfield, shooting stars, nebula
│   ├── SolarSystem.jsx  # Phase 3: sun + orbiting planets + AsteroidBelt + CosmicDust
│   ├── Sun.jsx          # Central star — MeshDistortMaterial, corona halos, Html label
│   ├── Planet.jsx       # Orbiting topic sphere with glow shell and child moons
│   ├── Moon.jsx         # Small sphere orbiting a planet, colored by difficulty
│   ├── FloatingBeacon.jsx # Clickable featured-user orbs (currently 144 bytes stub)
│   ├── LandingUI.jsx    # Search overlay, featured users, recent explorers marquee (27KB)
│   ├── TransitionOverlay.jsx # Warp-speed zoom animation between phases
│   ├── UserPanel.jsx    # Side panel — profile stats, tabs, topics, submissions (42KB, largest component)
│   ├── Navbar.jsx       # Top nav bar for Arena view
│   ├── Dashboard.jsx    # Dashboard view component
│   ├── Arena.jsx        # Arena view component
│   ├── FighterCard.jsx  # Fighter display card (18KB)
│   ├── FighterPanel.jsx # Fighter panel
│   ├── GamesModal.jsx   # Games modal (24KB)
│   └── CityScene.jsx    # City scene — alternative 3D view (23KB)
├── hooks/
│   └── useLeetCode.js   # Custom hook — fetch + localStorage cache (30-min TTL)
├── utils/
│   ├── dataMapper.js    # mapLeetCodeDataToSolarSystem() — API → 3D structure
│   └── colors.js        # COLORS object: { background, accent, easy, medium, hard }
├── assets/              # Static assets
worker/
├── index.js             # Cloudflare Worker — GraphQL proxy (3 parallel queries, 1-hour edge cache)
└── wrangler.toml        # Wrangler config: name="leetcode-galaxy-proxy"
```

## Architecture & Data Flow

```
User Input → useLeetCode hook → Cloudflare Worker → LeetCode GraphQL API
                                    (1-hour edge cache)
Response → dataMapper.js → Structured solar system object → React Three Fiber scene
```

### State in App.jsx (single source of truth)

| State variable | Type | Values | Purpose |
|---|---|---|---|
| `phase` | number | `1` (landing), `2` (transition), `3` (solar system) | Controls which scene renders |
| `viewMode` | string | `'galaxy'`, `'city'`, `'card'` | Sub-view within Phase 3 |
| `isNight` | boolean | `true` / `false` | Day/night toggle for CityScene |
| `mappedData` | object/null | Output of `mapLeetCodeDataToSolarSystem()` | Structured data for 3D scene |
| `recentlyExplored` | string[] | Usernames | Persisted in localStorage (`recentExplorers` key) |
| `transitionStage` | number | `0`, `1`, `2` | Transition animation progress |
| `transitionMsg` | string | Status text | Message shown during transition |

### URL Routing
- Uses `window.history.pushState` (no router library)
- Pattern: `/u/:username` → loads profile; `/` → landing
- `popstate` listener handles browser back/forward

### Environment Variables
- `VITE_WORKER_URL` — Cloudflare Worker URL (default: `https://leetcode-galaxy-proxy.workers.dev`)

- No external state management library — state flows via props from `App.jsx` to children.
- The Cloudflare Worker fires 3 parallel GraphQL queries (profile, tags, recent submissions), caches responses for 1 hour, and returns a single JSON payload.
- `useLeetCode` hook adds a **client-side localStorage cache** with a 30-minute TTL on top of the Worker's edge cache.

## Code Conventions

### General

- Use **ES Modules** (`import`/`export`) — the project is `"type": "module"`.
- Use **`export default function ComponentName`** for components.
- Named exports for hooks (`export function useLeetCode`) and utilities.
- Use **`const`** by default; use `let` only when reassignment is needed.
- Prefer **arrow functions** for callbacks and inline handlers.
- Use **template literals** for string interpolation, especially for dynamic CSS values like `boxShadow` and `background`.
- **No TypeScript** — the project is plain JavaScript/JSX.

### React Patterns

- **Functional components only** — no class components.
- Use `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo` from React.
- Group hook calls at the top of the component body.
- Inline event handlers are acceptable for short handlers; extract functions for complex logic.
- Use `useEffect` cleanup for intervals, timeouts, and event listeners.
- Destructure props in the function signature: `function Component({ prop1, prop2 })`.

### Three.js / React Three Fiber Patterns

- Use `useFrame((state, delta) => { ... })` for per-frame animation (orbit rotation, pulsing, glow).
- Use `useRef()` to store mesh/group references for imperative updates in `useFrame`.
- Use `<group>` for hierarchical transforms (planet + moons, sun + corona).
- Orbit mechanics: update an angle ref, then set `position.x = cos(angle) * radius`, `position.z = sin(angle) * radius`.
- Use `@react-three/drei` components: `OrbitControls`, `Stars`, `Html`, `Sphere`, `Line`, `MeshDistortMaterial`.
- Project HTML into 3D with `<Html position={...} center distanceFactor={...}>`.
- Materials: `MeshStandardMaterial` for PBR surfaces, `MeshBasicMaterial` for unlit glow layers, `MeshDistortMaterial` for the sun's distortion effect.

### Styling

- **Inline style objects** are the primary styling method for components — define a `styles` object or inline `style={{ ... }}`.
- Use **Tailwind CSS classes** for utility styling in overlay/UI components (layout, spacing, typography).
- Dynamic styles (colors from data, hover states, glow effects) use inline styles with template literals.
- Color convention: use hex with alpha shorthand (`#00f5d460`) for glows and shadows.
- Follow the project's color palette:
  - Background: `#030508`
  - Accent/primary: `#00f5d4` (cyan/teal)
  - Easy: `#23d18b` (green)
  - Medium: `#f5a623` (orange)
  - Hard: `#ff3860` (red)

### File & Naming Conventions

- **Components**: PascalCase filenames matching the component name (`UserPanel.jsx` → `export default function UserPanel`).
- **Hooks**: camelCase with `use` prefix (`useLeetCode.js`).
- **Utilities**: camelCase filenames (`dataMapper.js`, `colors.js`).
- All components live in `src/components/` (flat structure, no subdirectories).
- Import order: React → third-party libraries → local components → local utils/hooks → CSS.

## Key Implementation Details

### Phase System (App.jsx)

The app has 3 phases controlled by the `phase` state variable:
1. **Phase 1 (Landing)**: Galaxy starfield background + LandingUI overlay with search.
2. **Phase 2 (Transition)**: Warp-speed animation via TransitionOverlay while data loads.
3. **Phase 3 (Solar System)**: Interactive 3D solar system + UserPanel sidebar.

Phase 3 has 3 sub-views controlled by `viewMode`:
- `'galaxy'` — Default 3D solar system in the R3F Canvas
- `'city'` — CityScene renders its own separate Canvas (replaces the main one)
- `'card'` — FighterCard overlay with Framer Motion reveal animation

### Data Mapping (dataMapper.js)

`mapLeetCodeDataToSolarSystem()` transforms raw API data into this exact shape:

```js
{
  username: string,
  profile: { ranking, reputation, starRating },
  stats: [ { difficulty: 'All'|'Easy'|'Medium'|'Hard', count: number } ],
  recent: [ { title, titleSlug, timestamp, statusDisplay, lang } ],
  planets: [
    {
      name: string,           // tag name e.g. "Dynamic Programming"
      problemsSolved: number,
      radius: number,          // orbit distance: 18 + index * 7
      speed: number,           // orbit speed: 0.4 / (index + 1)
      size: number,            // visual size: 1.2 to 2.8
      angle: number,           // initial angle
      moons: [
        { id, difficulty, isSolved, orbitRadius, orbitSpeed, orbitAngle }
      ]
    }
  ]
}
```

- Top 8 topics become planets (sorted by `problemsSolved` descending).
- Moons per planet: `min(ceil(problemsSolved / 5), 10)` solved + 3 unsolved.
- Moon difficulty distribution follows the user's easy/medium/hard ratio.

### Worker API Response Shape (worker/index.js)

The Worker returns this JSON to the frontend:
```js
{
  profile: { matchedUser: { username, submitStats: { acSubmissionNum }, profile: { ranking, reputation, starRating } } },
  tags: { matchedUser: { tagProblemCounts: { advanced: [], intermediate: [], fundamental: [] } } },
  recent: { recentSubmissionList: [ { title, titleSlug, timestamp, statusDisplay, lang } ] }
}
```
- `GET ?username=<username>` — only parameter
- Returns 404 if `matchedUser` is null
- CORS is fully open (`Access-Control-Allow-Origin: *`)

### Error Handling

- `useLeetCode` hook catches fetch errors and sets `error` state.
- `App.jsx` falls back to `generateMockData(username)` if the worker fetch fails.
- Worker returns HTTP 500 with error message on GraphQL failure.

### CSS Classes Available (index.css)

Do NOT invent CSS classes. Only these exist:
- `.noise-overlay` — film grain texture overlay
- `.scanline-overlay` — horizontal scanline effect
- `.glass-card` — glassmorphism card with hover lift
- `.glitch-text` — needs `data-text` attribute for glitch ::before/::after
- `.cyber-btn` — ripple-expand hover effect
- `.gradient-border` — animated gradient border on hover/focus
- `.cursor-particle` — used by CursorTrail (programmatic, don't manually add)
- `.power-bar` — shimmer animated progress bar
- `.animate-float` — 3s float animation
- `.animate-pulse-glow` — 2s glow pulse

Keyframe animations: `pulse-glow`, `shoot`, `float`, `warp`, `blink`, `glitch-1`, `glitch-2`, `scanline`, `gradient-shift`, `orbit-pulse`, `fade-in-up`, `shimmer`, `spin-slow`, `holo-flicker`, `energy-pulse`.

### Animations

- **CSS keyframes** in `index.css`: see list above.
- **Framer Motion**: `motion.*` wrappers with `initial`/`animate`/`exit` + `AnimatePresence` for enter/exit transitions.
- **Three.js `useFrame`**: continuous orbital rotation, scale pulsing, glow oscillation.

### Deployment

- **Frontend**: Vercel — `vercel.json` has SPA rewrite (`/* → /index.html`), security headers, and asset caching.
- **Worker**: `cd worker && npx wrangler deploy` — deployed as `leetcode-galaxy-proxy`.
- **Docker**: `docker-compose.yml` with `frontend` (port 5173) and `worker` (port 8787) services.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |
| Deploy worker | `cd worker && npx wrangler deploy` |

## Guidelines for AI Assistance

- Keep the **space/sci-fi aesthetic** consistent — dark backgrounds, glow effects, neon accent colors.
- Prefer **inline style objects** for new component styles; use Tailwind for layout utilities.
- When adding 3D elements, follow the existing `useRef` + `useFrame` animation pattern.
- Do not introduce TypeScript, class components, or external state management libraries.
- Do not add unnecessary abstractions — keep components self-contained.
- When modifying the data pipeline, update both `worker/index.js` (GraphQL queries) and `utils/dataMapper.js` (transformation) as needed.
- Respect the phase-based rendering system in `App.jsx` — new views should integrate with the existing phase state.
- Test that `OrbitControls` interaction (pan, zoom, rotate) remains functional after 3D scene changes.

## AI Agent Constraints (Token Efficiency & Hallucination Prevention)

### Token Reduction Rules
1. Output **exact code diffs only**. Use `// ...existing code...` to skip unchanged blocks.
2. **Never rewrite entire files.** Only provide the modified functions/lines.
3. No conversational filler, pleasantries, or restatements of the question.
4. When suggesting multiple changes in one file, show each change separately with line context.

### Hallucination Prevention
1. **Do NOT invent CSS classes** — only the ones listed in the "CSS Classes Available" section above exist.
2. **Do NOT assume API fields** — refer strictly to the Worker and dataMapper response shapes documented above.
3. **Do NOT hallucinate component props** — check the actual component signature before passing props.
4. **Do NOT add new npm dependencies** without being explicitly asked. The installed set is fixed.
5. **Do NOT introduce**: TypeScript, class components, Context API, Redux, MobX, react-router, MUI, Chakra, styled-components, or CSS modules.
6. **Do NOT create subdirectories** inside `src/components/` — keep structure flat.
7. **Do NOT modify** `vercel.json`, `wrangler.toml`, or `eslint.config.js` unless explicitly asked.

### Common Traps to Avoid
- `mappedData.planets` is an **array** — do not treat it as an object/map.
- `viewMode` is one of `'galaxy'`, `'city'`, `'card'` — no other values exist.
- `phase` is `1`, `2`, or `3` — never `0` and never a string.
- CityScene renders its **own Canvas** — it replaces the main Canvas, it is not inside it.
- The project uses `window.history.pushState` — there is NO react-router.
