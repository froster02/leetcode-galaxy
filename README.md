# LeetCode Wrapped

> Your LeetCode, wrapped. Your problems, streaks, and coder personality — in one story worth sharing.

**[Live Demo](https://froster02.github.io/leetcode-galaxy/)** · Built with React 19 + Vite · No backend, no WebGL

---

## What It Does

Enter any LeetCode username (or paste a profile URL). You get a short, swipeable story about *you*:

1. **Problems solved** — and what share of LeetCode that is
2. **Easy / Medium / Hard split** — and what it says about you
3. **Home-turf topic** — your most-solved tag
4. **Peak month & favorite weekday** — from your submission calendar
5. **Longest and current streak**
6. **Contest rating** — if you compete
7. **Your coder type** — a 4-letter personality (e.g. `HDWA · The Relentless Climber`)
8. **One roast** — because you earned it
9. **A 9:16 share card** — Share (native share sheet on phones), Save (1080×1920 PNG), or Copy

Want everything? **Full stats** opens the detailed dashboard (contest sparkline, heatmap, power level, Challenge-a-friend battle).

## Design

Minimal and quiet, following Apple's interface guidance:

- System font, size-specific tracking and leading, tabular numbers
- Light and dark themes from the OS
- Spring-based motion; the story tracks your finger 1:1, projects flick momentum, rubber-bands at the ends, and can be interrupted mid-animation
- Feedback on press, not release; translucent material only on floating controls
- Respects reduced motion, reduced transparency, and increased contrast

## Tech Stack

| Layer | Tech |
|---|---|
| UI | React 19, Vite |
| Motion | Framer Motion |
| Share image | html2canvas |
| Data | [alfa-leetcode-api](https://alfa-leetcode-api.onrender.com) (optional Cloudflare Worker fallback) |
| Tests | Vitest |

## Project Structure

```
src/
├── App.jsx                  # view state: landing → loading → wrapped / card, URL sync
├── components/
│   ├── LandingUI.jsx        # search, legends, sample card
│   ├── wrapped/
│   │   ├── WrappedStory.jsx # story shell, gestures, sharing
│   │   ├── slides.jsx       # one component per slide
│   │   └── WrappedCard.jsx  # 9:16 share card
│   ├── FighterCard.jsx      # Full stats + VS battle
│   ├── ShareCard.jsx        # share modal for Full stats
│   ├── Heatmap.jsx
│   └── ErrorToast.jsx
├── hooks/
│   ├── useLeetCode.js       # fetch + localStorage cache
│   ├── useShareCapture.js   # PNG render, download, copy, native share
│   ├── useIsMobile.js
│   └── useReducedMotion.js
└── utils/
    ├── dataMapper.js        # mapProfile(): API → view model
    ├── wrapped.js           # story stats + personality
    ├── calendar.js · roast.js · gameData.js · handle.js · normalization.js
```

## Local Development

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Data Flow

```
Search username
  → useLeetCode.fetchProfile()     # profile · skills · contest · badges · calendar
  → mapProfile()                   # normalize into the app model
  → buildWrapped()                 # derive story stats + personality
  → WrappedStory / FighterCard
```

**Cache:** `localStorage` per username, 30-minute TTL; only complete payloads are cached.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `bash scripts/run-tests.sh` | Build + lint + unit tests (run after every change) |

See [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) for the manual test checklist.

## Easter Eggs

Try searching: `rocky` · `tars` · `murph` · `cooper` · `hail mary`

---

*Made by [Arush Naudiyal](https://github.com/froster02). Uses public LeetCode data; not affiliated with LeetCode.*

## 🤖 AI Contributors

- [Claude](https://claude.ai) (Anthropic) — AI coding assistant
- [Gemini](https://gemini.google.com) (Google) — AI coding assistant
