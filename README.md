# 🌌 LeetCode Galaxy

LeetCode Galaxy is an interactive sci-fi visualization app that turns LeetCode profile data into a cinematic experience:
- galaxy-style landing + search flow
- hyperspace transition
- explorable 3D coding city
- detailed Fighter Card with stats, power tiers, and mini-games

---

## ✨ Current Features

- **3-phase experience** in `App.jsx`:
  - `phase 1`: landing UI + galaxy background
  - `phase 2`: transition overlay
  - `phase 3`: city view and fighter-card flow
- **Interactive City Scene** (pan/zoom/rotate + user selection)
- **Fighter Card view** with:
  - solved counts by difficulty
  - contest metrics (rating, rank, attended, top %)
  - badges count
  - power-level/tier presentation
- **Mini-games** via modal UI
- **Recently explored users** persisted in `localStorage`
- **Shareable profile route** support through `/u/:username` via `window.history.pushState`
- **Graceful fallback behavior**:
  - network/API failures can fall back to generated mock data
  - client caching with TTL avoids repeated fetches

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + hooks |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Motion | Framer Motion |
| Styling | Tailwind utilities + inline style objects + global CSS |
| Build | Vite 7 |
| Lint | ESLint 9 (flat config) |
| Data Source (frontend) | Alfa LeetCode API endpoints |
| Optional Proxy Service | Cloudflare Worker in `worker/` |

---

## 🗂 Project Structure

```bash
leetcode-galaxy/
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── LandingUI.jsx
│   │   ├── GalaxyScene.jsx
│   │   ├── TransitionOverlay.jsx
│   │   ├── CityScene.jsx
│   │   ├── UserPanel.jsx
│   │   ├── FighterCard.jsx
│   │   ├── GamesModal.jsx
│   │   ├── Arena.jsx
│   │   └── ...
│   ├── hooks/
│   │   └── useLeetCode.js
│   └── utils/
│       └── dataMapper.js
├── worker/
│   ├── index.js
│   └── wrangler.toml
├── DEPLOY.md
├── .env.example
└── package.json
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Install
```bash
npm install
```

### Run
```bash
npm run dev
```

Open `http://localhost:5173`.

---

## 🔧 Environment Variables

Frontend supports:

- `VITE_WORKER_URL` (see `.env.example`)

If not set, the app uses its default URL setting from `useLeetCode.js`.

---

## 🏗 Data Flow (Current Frontend Path)

For each username search, the frontend gathers data from multiple endpoints in parallel, maps the result into the app model (`mapLeetCodeDataToCity`), and renders city/fighter views.

High-level response model used by the app:
- profile + solved stats
- tag/topic counts
- recent submissions
- contest info
- badges info

Caching:
- localStorage cache in `useLeetCode.js`
- TTL-based invalidation

---

## 📦 Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview built app |
| `npm run lint` | Run ESLint |

---

## 🌐 Deployment

- Frontend + worker deployment steps are documented in **[DEPLOY.md](./DEPLOY.md)**.
- Worker deployment lives under `worker/` and uses Wrangler.

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch
3. Commit your changes
4. Open a pull request
