# LC Galaxy

> Transform any LeetCode profile into a bioluminescent neon mushroom biome — a living, breathing sci-fi visualization of your coding journey.

**[Live Demo](https://froster02.github.io/leetcode-galaxy/)** · Built with React + Three.js · No login required

---

## What It Does

Enter any LeetCode username. Watch your profile materialize as a glowing cyberpunk biome — mushroom field, stats panel, shareable card, and all.

---

## Features

### Galaxy Landing
- Animated star field with orbit rings and glitch title
- Live stats: Total Questions · Last Contest Participants · Max Daily Streak
- Featured legendary coders (cpcs, votrubac, lee215…)
- Press `/` to focus search from anywhere

### Bioluminescent Mushroom Biome
- 10×10 procedural grid — each patch represents a LeetCode user
- **Cyan mushrooms** = Easy solves · **Amber** = Medium · **Magenta/Purple** = Hard
- Giant animated centerpiece mushroom at your beacon spawn point
- 90 ambient spore particles drifting upward across the biome
- Orbiting mini-spores around the centerpiece
- Cyan grid floor · Aurora overhead · Floating neon wisps
- Bloom post-processing for full bioluminescent glow

### Side Panel
- Power Level with animated counter + tier badge (Explorer → Hail Mary Hero)
- Circular progress ring, difficulty breakdown bars, SVG radar chart
- Tabbed view: Stats / Topics / Activity
- Achievement badges (First Solve, 100 Club, Hard 10, Polyglot, Top 10K, Legend)
- Quick search · View mode toggle (City / Card) · Share Card

### Activity Overlay
- **Submission Heatmap** — 12-week GitHub-style calendar from real API data
- **Streak Tracker** — current + longest streak + 7-day bar chart

### Fighter Card
- Full-screen profile card: contest rating, global rank, badges, power tier
- Power DNA breakdown (Easy ×1 · Medium ×3 · Hard ×10)
- Battle Momentum, Recent Submissions, Specialties
- Challenge any LeetCode user — live VS battle result modal
- Direct link to LeetCode profile

### Share Card
- Premium glass card with hex rank badge, heatmap, contest stats, badges
- Download as high-res PNG (2×)
- Copy image to clipboard
- Share directly to LinkedIn — auto-downloads PNG + opens post composer

### Responsive
- Full mobile support — bottom-sheet side panel, compressed HUD, scaled share modal
- Adaptive layouts across all screen sizes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + hooks |
| 3D | Three.js · `@react-three/fiber` · `@react-three/drei` |
| Post-processing | `@react-three/postprocessing` (Bloom) |
| Motion | Framer Motion |
| Image Export | `html2canvas` |
| Build | Vite 7 |
| Data | Alfa LeetCode API + LeetCode GraphQL |

---

## Project Structure

```
src/
├── App.jsx                  # Phase manager, routing, transitions
├── components/
│   ├── LandingUI.jsx        # Galaxy landing, search, live stats
│   ├── GalaxyScene.jsx      # Animated star field
│   ├── TransitionOverlay.jsx
│   ├── CityScene.jsx        # Mushroom biome, spores, aurora, heatmap
│   ├── UserPanel.jsx        # Side stats panel + share trigger
│   ├── FighterCard.jsx      # Full-screen profile card + VS modal
│   ├── ShareCard.jsx        # Exportable PNG card + LinkedIn share
│   └── Navbar.jsx
├── hooks/
│   └── useLeetCode.js       # API fetch + localStorage cache (30min TTL)
└── utils/
    ├── dataMapper.js        # Raw API → app model
    ├── normalization.js     # Stats normalization + validation
    └── gameData.js          # Power tiers, fighter classes, coders roster
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
      → parallel: profile · skillStats · contest · badges · calendar
  → mapLeetCodeDataToCity()     # normalize into app model
  → CityCanvas(data)            # build 10×10 roster, render biome
  → UserPanel(data)             # stats, heatmap, streak
  → FighterCard(data)           # full card view on demand
```

**Cache:** `localStorage` per username, 30-minute TTL. Stale or malformed entries are auto-purged.

**Landing stats (live):**
- Total Questions → LeetCode GraphQL `allQuestionsCount`
- Last Contest Participants → `leetcode.com/contest/api/info/weekly-contest-N/` (slug computed from known anchor)
- Max Daily Streak → computed from Daily Challenge launch date (2020-04-01), always accurate

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |

---

## Easter Eggs

Try searching: `rocky` · `tars` · `murph` · `cooper` · `hail mary`

---

*Made by [Arush Naudiyal](https://github.com/froster02)*
