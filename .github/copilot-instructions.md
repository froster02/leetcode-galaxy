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
├── App.jsx              # Root component — manages phase state, renders Canvas + UI overlays
├── main.jsx             # Entry point — renders App
├── index.css            # Global CSS — keyframe animations, scrollbar, base styles
├── App.css              # Minimal app-level CSS
├── components/          # All React components (flat, no nesting)
│   ├── GalaxyScene.jsx  # Phase 1 & 2: landing starfield, shooting stars, nebula, featured user beacons
│   ├── SolarSystem.jsx  # Phase 3: sun + orbiting planets composition
│   ├── Sun.jsx          # Central star with distorted mesh, corona halos
│   ├── Planet.jsx       # Orbiting topic sphere with glow shell and moons
│   ├── Moon.jsx         # Small sphere orbiting a planet, colored by difficulty
│   ├── FloatingBeacon.jsx # Clickable featured-user orbs in galaxy view
│   ├── LandingUI.jsx    # Search overlay, featured users, recent explorers marquee
│   ├── TransitionOverlay.jsx # Warp-speed zoom animation between phases
│   ├── UserPanel.jsx    # Side panel with profile stats, tabs, topics, recent submissions
│   ├── Navbar.jsx       # Top navigation bar
│   ├── Dashboard.jsx    # (Dashboard view)
│   ├── Arena.jsx        # (Arena view)
│   ├── FighterCard.jsx  # (Fighter display card)
│   ├── FighterPanel.jsx # (Fighter panel)
│   ├── GamesModal.jsx   # (Games modal)
│   └── CityScene.jsx    # (City scene)
├── hooks/
│   └── useLeetCode.js   # Custom hook — fetches profile data from Cloudflare Worker
├── utils/
│   ├── dataMapper.js    # mapLeetCodeDataToSolarSystem() — transforms API data into 3D-ready structure
│   └── colors.js        # Color constants and palettes
├── assets/              # Static assets
worker/
├── index.js             # Cloudflare Worker — GraphQL proxy with caching
└── wrangler.toml        # Wrangler config for Cloudflare deployment
```

## Architecture & Data Flow

```
User Input → useLeetCode hook → Cloudflare Worker → LeetCode GraphQL API
                                    (1-hour edge cache)
Response → dataMapper.js → Structured solar system object → React Three Fiber scene
```

- **App.jsx** is the single source of truth for global state: `phase` (1=landing, 2=transition, 3=solar system), `mappedData`, and `recentlyExplored` (persisted in localStorage).
- No external state management library — state flows via props from `App.jsx` to children.
- The Cloudflare Worker fires 3 parallel GraphQL queries (profile, tags, recent submissions), caches responses for 1 hour, and returns a single JSON payload.

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

### Data Mapping (dataMapper.js)

`mapLeetCodeDataToSolarSystem()` transforms raw API data:
- Top 8 topics become planets (sorted by `problemsSolved` descending).
- Planet `radius` (orbit distance) scales from 18 to ~70.
- Planet `size` normalizes from 1.2 to 2.8 based on relative `problemsSolved`.
- Moons per planet ≈ `problemsSolved / 5` (solved) + 3 (unsolved), capped at ~13.
- Moon difficulty distribution follows the user's easy/medium/hard ratio.

### Cloudflare Worker (worker/index.js)

- Handles CORS preflight (`OPTIONS`) and `GET` requests with `?username=` query param.
- Three parallel `fetch` calls to LeetCode's GraphQL endpoint.
- Response cached via Cloudflare Cache API (1-hour TTL).
- Returns mock/fallback data on upstream failure.

### Error Handling

- `useLeetCode` hook catches fetch errors and sets `error` state.
- `App.jsx` falls back to `generateMockData(username)` if the worker fetch fails.
- Worker returns HTTP 500 with error message on GraphQL failure.

### Animations

- **CSS keyframes** in `index.css`: `pulse-glow`, `shoot`, `float`, `warp`.
- **Framer Motion**: `motion.*` wrappers with `initial`/`animate`/`exit` + `AnimatePresence` for enter/exit transitions.
- **Three.js `useFrame`**: continuous orbital rotation, scale pulsing, glow oscillation.

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
