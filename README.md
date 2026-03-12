# 🌌 LeetCode Galaxy

> **Explore your LeetCode journey as an interactive 3D solar system.**

LeetCode Galaxy transforms a LeetCode user's coding statistics into a navigable space scene. Your profile becomes a glowing sun, your top problem-solving topics orbit as planets, and each problem you've solved appears as a moon. Search any username and fly through their data.

---

## ✨ Features

- **Interactive 3D Solar System** — powered by Three.js / React Three Fiber; pan, zoom, and rotate freely.
- **Profile Sun** — the central star whose size and glow reflect the user's overall activity.
- **Topic Planets** — up to 8 of the user's most-practiced LeetCode tags rendered as orbiting planets, sized by problems solved.
- **Problem Moons** — individual problems orbit each planet, color-coded by difficulty (🟢 Easy · 🟡 Medium · 🔴 Hard).
- **Power Level & Tiers** — a calculated score (EXPLORER → COSMIC LEGEND) based on solve counts and topic diversity.
- **Radar Chart & Progress Rings** — visual breakdowns of topic coverage and difficulty distribution in the side panel.
- **Achievement Badges** — unlockable milestones displayed on the user panel.
- **Recently Explored** — animated marquee of previously searched profiles, persisted in `localStorage`.
- **Featured Users** — quick-launch cards for well-known competitive programmers.
- **Shareable URLs** — profiles are accessible at `/u/{username}` with browser history support.
- **Screenshot / Share** — capture the solar system view via `html2canvas`.
- **Edge-Cached API Proxy** — Cloudflare Worker fetches LeetCode data with a 1-hour cache, keeping costs at $0.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 (functional components + hooks) |
| 3D Engine | Three.js · React Three Fiber · `@react-three/drei` |
| Post-processing | `@react-three/postprocessing` (Bloom) |
| Animation | Framer Motion · `useFrame` (R3F) |
| Styling | Tailwind CSS 3 · inline style objects |
| Icons | `lucide-react` |
| Screenshots | `html2canvas` |
| Bundler | Vite 7 |
| API Proxy | Cloudflare Workers (Wrangler) |
| Deployment | Vercel (frontend) · Cloudflare Workers (API) |
| Fonts | Orbitron · Share Tech Mono (Google Fonts) |

---

## 🗂 Project Structure

```
leetcode-galaxy/
├── src/
│   ├── App.jsx              # Root component — phase state, canvas + UI overlays
│   ├── main.jsx             # Entry point
│   ├── index.css            # Global keyframe animations & base styles
│   ├── components/
│   │   ├── GalaxyScene.jsx  # Phase 1 & 2: starfield, shooting stars, nebula
│   │   ├── SolarSystem.jsx  # Phase 3: sun + orbiting planets composition
│   │   ├── Sun.jsx          # Central star with distorted mesh & corona halos
│   │   ├── Planet.jsx       # Topic sphere with glow shell and moons
│   │   ├── Moon.jsx         # Small sphere colored by difficulty
│   │   ├── LandingUI.jsx    # Search overlay, featured users, recent marquee
│   │   ├── UserPanel.jsx    # Side panel — stats, power level, radar chart
│   │   ├── TransitionOverlay.jsx  # Warp-speed zoom between phases
│   │   ├── FloatingBeacon.jsx     # Clickable featured-user orbs
│   │   └── Navbar.jsx       # Top navigation bar
│   ├── hooks/
│   │   └── useLeetCode.js   # Fetches profile data from Cloudflare Worker
│   └── utils/
│       ├── dataMapper.js    # Transforms API data → 3D solar system model
│       └── colors.js        # Color constants and palettes
├── worker/
│   ├── index.js             # Cloudflare Worker — GraphQL proxy with caching
│   └── wrangler.toml        # Wrangler config
├── public/
├── Dockerfile.frontend
├── Dockerfile.worker
├── docker-compose.yml
├── DEPLOY.md                # Full deployment guide
├── .env.example
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### 1. Clone & install

```bash
git clone https://github.com/froster02/leetcode-galaxy.git
cd leetcode-galaxy
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and set your Cloudflare Worker URL (see [Deployment](#-deployment) for how to get one):

```env
VITE_WORKER_URL=https://leetcode-galaxy-proxy.YOUR_ACCOUNT.workers.dev
```

Replace `YOUR_ACCOUNT` with your Cloudflare account subdomain (visible after running `wrangler deploy`).

> **Local development shortcut:** Start the worker locally alongside the frontend (see Docker section below) — Wrangler defaults to `http://127.0.0.1:8787`.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and search for any LeetCode username.

---

## 🐳 Docker (Full-Stack Local Dev)

Run the frontend and Cloudflare Worker together with a single command:

```bash
docker compose up
```

| Service | URL |
|---|---|
| Frontend (Vite HMR) | http://localhost:5173 |
| Worker (Wrangler dev) | http://localhost:8787 |

Hot-reloading is enabled for both services via volume mounts.

---

## 🏗 Architecture

```
Browser
  └─► Vercel CDN (static React/Vite app)
        └─► Cloudflare Worker (API proxy, 1-hr edge cache)
              └─► LeetCode GraphQL API
```

The Worker fires **3 parallel GraphQL queries** per unique username:

1. **Profile** — submission counts by difficulty, ranking, reputation.
2. **Tags** — per-tag problem counts (advanced / intermediate / fundamental).
3. **Recent** — last 10 submissions with title, status, and language.

Responses are cached at the edge for one hour, so repeat searches are free and near-instant.

`dataMapper.js` converts the raw JSON into a solar system object consumed by the Three.js scene:

- Top 8 tags → planets (orbit radius 18–70, size normalized 1.2–2.8).
- Problems solved per tag → moons (3–13 per planet), difficulty colored.

---

## 📦 Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |
| `cd worker && npx wrangler dev` | Run the API proxy locally |
| `cd worker && npx wrangler deploy` | Deploy the worker to Cloudflare |

---

## 🌐 Deployment

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step guide covering:

- Deploying the Cloudflare Worker
- Deploying the frontend to Vercel
- Setting environment variables
- Configuring a custom domain
- Cost breakdown (spoiler: **$0/month** on the free tier)

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source. See the repository for license details.
