# 🌌 LeetCode Galaxy

> **Explore your LeetCode journey as an interactive 3D city.**

LeetCode Galaxy transforms any LeetCode user's competitive stats into a living, breathing neon city. Your profile becomes a glowing tower at the center, surrounded by 100 rival buildings — each representing a real competitive programmer or procedurally generated coder. Click any building to instantly inspect their Fighter Card.

🔗 **Live:** [froster02.github.io/leetcode-galaxy](https://froster02.github.io/leetcode-galaxy/)

---

## ✨ Features

- **Interactive 3D City** — powered by Three.js / React Three Fiber; pan, zoom, and rotate a procedural 10×10 city grid.
- **100-Building Grid** — your profile sits at the center block, surrounded by 28 real legend coders (tourist, neal_wu, lee215…) and procedurally generated rivals filling all 100 plots.
- **Fighter Card** — click any building or search any username to reveal a high-fidelity profile card with:
  - Contest Rating, Global Ranking, Top %, Attended Contests
  - Total Badges earned
  - Difficulty breakdown bars (Easy / Medium / Hard)
  - Power Level score and Fighter Class tier
  - Battle simulator vs. random opponents
- **Fighter Class Tiers** — `NOVICE → RECRUIT → WARRIOR → ELITE → CHAMPION → LEGEND` based on Hard problem count.
- **Day / Night Mode** — toggle the city lighting between a sun-lit daytime and a neon-glowing nightscape.
- **Hyperspace Transition** — cinematic warp-speed animation when entering the city.
- **Recently Explored** — animated marquee of previously searched profiles, persisted in `localStorage`.
- **Featured Users** — quick-launch cards for well-known competitive programmers on the landing page.
- **Shareable URLs** — profiles are accessible at `/u/{username}` with browser history support.
- **Mini-Games** — Higher or Lower, Tournament bracket, and Leaderboard games built into the Fighter Card.
- **Graceful API Fallback** — if the LeetCode proxy API is slow or partially down, the app still renders with available data.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 (functional components + hooks) |
| 3D Engine | Three.js · React Three Fiber · `@react-three/drei` |
| Post-processing | `@react-three/postprocessing` (Bloom) |
| Animation | Framer Motion · `useFrame` (R3F) |
| Styling | Vanilla CSS + inline style objects |
| Icons | `lucide-react` |
| Screenshots | `html2canvas` |
| Bundler | Vite 7 |
| API Proxy | [Alfa LeetCode API](https://github.com/alfaarghya/alfa-leetcode-api) (public) |
| Deployment | GitHub Pages |
| Fonts | Orbitron · Share Tech Mono · JetBrains Mono (Google Fonts) |

---

## 🗂 Project Structure

```
leetcode-galaxy/
├── src/
│   ├── App.jsx                # Root — phase state machine, canvas + UI overlays
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global keyframe animations & base styles
│   ├── components/
│   │   ├── CityScene.jsx      # 3D city grid — 100 blocks, buildings, labels
│   │   ├── FighterCard.jsx    # Full profile card with stats, battles, games
│   │   ├── GalaxyScene.jsx    # Background starfield & nebula effects
│   │   ├── LandingUI.jsx      # Search overlay, featured users, recent marquee
│   │   ├── UserPanel.jsx      # Side panel — city controls & stats
│   │   ├── TransitionOverlay.jsx  # Hyperspace warp transition
│   │   ├── FighterPanel.jsx   # Fighter comparison panel
│   │   ├── GamesModal.jsx     # Mini-games (Higher/Lower, Tournament, Leaderboard)
│   │   ├── Arena.jsx          # Battle arena component
│   │   └── Navbar.jsx         # Top navigation bar
│   ├── hooks/
│   │   └── useLeetCode.js     # Fetches profile data via Alfa LeetCode API
│   └── utils/
│       ├── gameData.js        # Shared constants — CODERS dataset, calcPower, getFighterClass
│       ├── dataMapper.js      # Transforms API data → city model
│       └── colors.js          # Color constants and palettes
├── public/
├── DEPLOY.md                  # Deployment guide
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

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and search for any LeetCode username.

> No environment variables are required — the app uses the public [Alfa LeetCode API](https://alfa-leetcode-api.onrender.com) proxy out of the box.

---

## 🏗 Architecture

```
Browser
  └─► GitHub Pages (static React/Vite app)
        └─► Alfa LeetCode API (public proxy, Render)
              └─► LeetCode GraphQL API
```

The app fires **4 parallel API requests** per username:

1. **Profile** — submission counts by difficulty, ranking, reputation.
2. **Skill Stats** — per-tag problem counts (advanced / intermediate / fundamental).
3. **Contest** — contest rating, global ranking, attended contests, top percentage.
4. **Badges** — earned achievement badges.

Each request is wrapped in a `safeFetch` utility with automatic retry (exponential backoff) — if any secondary endpoint drops, the card still renders with whatever data succeeded.

Results are cached in `localStorage` for 30 minutes to avoid redundant requests.

---

## 📦 Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## 🌐 Deployment

The app is deployed on **GitHub Pages**. See **[DEPLOY.md](./DEPLOY.md)** for the full guide.

To deploy manually:

```bash
npm run build
# Push the dist/ folder to the gh-pages branch
```

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
