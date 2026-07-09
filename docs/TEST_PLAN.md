# Test Plan

Run `scripts/run-tests.sh` after every code change. Automated checks run first; manual checks follow.

---

## Automated (run via script)

| # | Check | Command |
|---|-------|---------|
| A1 | Build succeeds | `npm run build` |
| A2 | No ESLint errors | `npm run lint` |

---

## Manual — Landing (Phase 1)

| # | Steps | Expected |
|---|-------|----------|
| M1 | Load `/` | Star field renders, title visible, search bar focused |
| M2 | Wait ~3s on landing | Live stats panel populates (Total Questions, Last Contest Participants, Max Daily Streak) |
| M3 | Press `/` key | Search input focuses |
| M4 | Resize to mobile (≤ 768px) | Mobile warning or bottom sheet layout — no overflow |
| M5 | Click a **Legendary Explorer** (e.g. `cpcs`, `votrubac`) | Profile loads OR "API rate limited — try again in a moment" if Alfa API is throttling — **never** "Unable to load profile" on a 429 |

---

## Manual — Search & Error Handling

| # | Steps | Expected |
|---|-------|----------|
| M6 | Search valid user (e.g. `votrubac`) | Transition overlay → biome / city scene renders |
| M7 | Search nonexistent user (e.g. `zzz_no_such_user_zzz`) | "No user found" error on landing |
| M8 | After M7, press browser **Back** | Returns to landing URL — no dead `/u/zzz_no_such_user_zzz` entry in history |
| M9 | Alfa API rate-limited (HTTP 429 on `/userProfile/<user>`) | Shows "API rate limited — try again in a moment" — not "Unable to load profile" |
| M10 | Search same user twice within 30 min | Second fetch is instant (localStorage cache hit — no network request) |

---

## Manual — City / Biome Scene (Phase 3)

| # | Steps | Expected |
|---|-------|----------|
| M11 | Load any user | 10×10 mushroom biome renders; bloom glow visible |
| M12 | Inspect block labels | Legendary/CODERS blocks show `SIM` tag; current user + real fetched blocks do not |
| M13 | Open side panel → Activity tab | Heatmap calendar renders; LONGEST streak shows calendar-derived streak (not total active days) |
| M14 | Side panel → Streak Tracker | Current streak matches API data; 7-day bar chart present |
| M15 | Click a block in the biome | Quick-inspect card opens for that user |

---

## Manual — Fighter Card

| # | Steps | Expected |
|---|-------|----------|
| M16 | Toggle to Card view | Full-screen fighter card renders, no blank sections |
| M17 | Check "RECENT AC" label (top ring) | Label reads "RECENT AC" not "ACCEPTANCE RATE" |
| M18 | Compare power number on card vs. city side panel | Same value (formula: easy×1 + med×3 + hard×10) |
| M19 | Power tier badge | Matches expected tier for the power number |
| M20 | Click **Challenge** on another user | VS modal opens; battle result renders |
| M21 | Click **↗ LeetCode** link | Opens correct LeetCode profile URL in new tab |

---

## Manual — Share Card

| # | Steps | Expected |
|---|-------|----------|
| M22 | Side panel → Share Card | Modal opens; glass card with heatmap, rank badge, stats renders |
| M23 | Click **Download PNG** | High-res PNG downloaded |
| M24 | Click **Copy** | Image copied to clipboard (no console error) |
| M25 | Click **LinkedIn** | PNG auto-downloads and LinkedIn composer opens in new tab |

---

## Manual — Easter Eggs & Special Users

| # | Steps | Expected |
|---|-------|----------|
| M26 | Search `tars` | TARS easter egg UI / special treatment |
| M27 | Search `rocky` | Rocky easter egg |
| M28 | Search `murph` or `cooper` | Interstellar easter egg |
| M29 | Search `hail mary` | Hail Mary easter egg |

---

## Manual — Console & Network

| # | Steps | Expected |
|---|-------|----------|
| M30 | Open DevTools → Console during full flow | Zero errors (warnings OK) |
| M31 | Open DevTools → Network during cached search | No API calls fired (`lc_<username>` cache hit) |

---

## Regression Checklist (run after structural changes)

- [ ] All deleted files have zero imports remaining (`npm run lint` catches this)
- [ ] `npm run build` output size not unexpectedly larger
- [ ] `public/404.html` SPA redirect still works on GitHub Pages (navigate directly to `/u/<user>`)
- [ ] Mobile layout: no horizontal scroll on any phase
