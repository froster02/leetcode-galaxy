# LeetCode Galaxy

An interactive sci-fi visualization that transforms any LeetCode profile into a living, breathing cyberpunk city — complete with tiered neon buildings, car traffic, an aurora, and an Interstellar-inspired ambient soundtrack.

---

## Features

### 3-Phase Experience
- **Phase 1 — Galaxy Landing**: animated star field, search bar, recently explored users
- **Phase 2 — Hyperspace Transition**: cinematic overlay with synthesized warp sounds
- **Phase 3 — City + Card**: full interactive 3D city or Fighter Card view

### 3D City
- 10×10 procedural grid — each block represents a LeetCode user
- Building height/color driven by Easy/Medium/Hard solve ratios
- Tiered pyramid buildings — 1–3 stacked tiers based on height
- Facade neon stripes — horizontal emissive bands
- Rooftop spires with blinking beacon on tall buildings
- 24 deterministic car lights moving through the street grid
- Aurora — 3 additive overlay planes breathing above the city
- User beacon — teal beam + crystal + pulsing ring marks the searched user
- Night/Day toggle with smooth lighting lerp

### Side Panel
- Power Level with animated counter + tier badge (Explorer → Hail Mary Hero)
- Circular progress ring, difficulty breakdown bars, SVG radar chart
- Tabbed view: Stats / Topics / Activity
- Achievement badges (First Solve, 100 Club, Hard 10, Polyglot, Top 10K, Legend)
- Quick search, view mode toggle, night toggle, share screenshot

### Activity Overlay
- **Submission Heatmap** — 12-week GitHub-style calendar from real `/calendar` API; intensity-colored cells
- **Streak Tracker** — current + longest streak from API; 7-day bar chart

### Fighter Card
- Full-screen card with contest rating, rank, badges, power tier
- Mini-games modal

### Sound Design
- **Stage 1**: deep D-organ drone (6-pipe Web Audio synthesis)
- **Stage 2**: rising sawtooth sweep + crystalline arpeggio
- **City reveal**: Dmaj7 swell with shimmer overtone
- **City ambient**: continuous Interstellar pipe organ — bellows LFO on filter cutoff, comb-delay cathedral echo, fades in/out with city enter/exit. No external audio files.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + hooks |
| 3D | Three.js · `@react-three/fiber` · `@react-three/drei` |
| Post-processing | `@react-three/postprocessing` (Bloom) |
| Motion | Framer Motion |
| Sound | Web Audio API (fully synthesized) |
| Build | Vite 7 |
| Lint | ESLint 9 (flat config) |
| Data | Alfa LeetCode API |

---

## Project Structure

```
leetcode-galaxy/
├── src/
│   ├── App.jsx                  # Phase manager, search, transitions, sound wiring
│   ├── components/
│   │   ├── LandingUI.jsx        # Galaxy landing + search
│   │   ├── GalaxyScene.jsx      # Animated star background
│   │   ├── TransitionOverlay.jsx
│   │   ├── CityScene.jsx        # 3D city, buildings, cars, aurora, heatmap, streak
│   │   ├── UserPanel.jsx        # Side stats panel
│   │   ├── FighterCard.jsx      # Full-screen profile card
│   │   └── GamesModal.jsx       # Mini-games
│   ├── hooks/
│   │   ├── useLeetCode.js       # API fetch + localStorage cache
│   │   └── useSpaceSound.js     # Web Audio synthesized sounds
│   └── utils/
│       ├── dataMapper.js        # Raw API → app model
│       └── gameData.js          # Power tiers, fighter classes
└── package.json
```

---

## Local Development

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## Data Flow

```
Search username
  → useLeetCode.fetchProfile()
      → parallel: /userProfile  /skillStats  /contest  /badges  /calendar
  → mapLeetCodeDataToCity()       # normalise into app model
  → CityCanvas(data)              # build 10×10 roster, render city
  → UserPanel(data)               # stats, heatmap, streak
```

Cache: `localStorage` per username, 30-minute TTL. Entries missing `calendar` are auto-invalidated.

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |

---

## Contributing

1. Fork the repo
2. Create a branch
3. Commit changes
4. Open a pull request
