# Test Plan

Run `scripts/run-tests.sh` after every code change. Automated checks run first; manual checks follow.

---

## Automated (run via script)

| # | Check | Command |
|---|-------|---------|
| A1 | Build succeeds | `npm run build` |
| A2 | No ESLint errors | `npm run lint` |
| A3 | Unit tests pass (pure utils: normalization, dataMapper, calendar, activity, profile, handle, workerFallback) | `npm test` |

---

## Manual — Landing

| # | Steps | Expected |
|---|-------|----------|
| M1 | Load `/` | Headline, search field, sample profile preview visible; correct in both light and dark system theme |
| M2 | Type `@cpcs` or `https://leetcode.com/u/cpcs/` and submit | Treated as handle `cpcs` |
| M3 | Press `/` key | Search input focuses |
| M4 | Mobile viewports 320×568, 375×812, 390×844, 812×375 (landscape), 768×1024 | Single column on phones, no horizontal scroll, no overlapping text, touch targets ≥ 44px, text ≥ 11px, input ≥ 16px (no iOS zoom) |
| M5 | Click a **Try a legend** chip (e.g. `cpcs`, `votrubac`) | Profile page loads OR "LeetCode is busy right now" toast if the Alfa API is throttling — **never** "Couldn’t load that profile" on a 429 |

---

## Manual — Search & Error Handling

| # | Steps | Expected |
|---|-------|----------|
| M6 | Search valid user (e.g. `votrubac`) | Spinner "Loading @votrubac…" → profile page at `/u/votrubac` |
| M7 | Search nonexistent user (e.g. `zzz_no_such_user_zzz`) | "No user found…" toast on landing, no Retry button |
| M8 | After M7, press browser **Back** | Returns to landing URL — no dead `/u/zzz_no_such_user_zzz` entry in history |
| M9 | Alfa API rate-limited (HTTP 429 on `/userProfile/<user>`) | "LeetCode is busy right now" toast with Retry |
| M10 | Search same user twice within 30 min | Second fetch is instant (localStorage cache hit — no network request) |

---

## Manual — Profile page

| # | Steps | Expected |
|---|-------|----------|
| M41 | Load any user | Header (name or handle, `@handle · country · company · school`, links), headline numbers, then Solved, Activity, Contests, Skills, Languages, Badges, Recent accepted rows; tab title `<name> · LeetCode profile` |
| M42 | User with no contests / no calendar / no badges | Those rows and the matching headline numbers are not rendered at all (no empty rows) |
| M43 | Contest-active user (e.g. `votrubac`) | Rating line renders with ≥ 2 contests; table shows newest 5 with ▲/▼; **Show all N** expands; peak rating is never below the current rating |
| M44 | Skills with many tags | 8 per tier, **Show N more** expands all three tiers |
| M45 | Profile links (LeetCode, GitHub, LinkedIn, website) and recent problem titles | Open the right page in a new tab; only http(s) links are shown |
| M46 | Activity heatmap at 320px / 390px | Grid scrolls sideways inside its row, starting on the most recent weeks; page itself has no horizontal scroll |
| M47 | **Copy link** | Button reads "Link copied"; clipboard holds `/u/<user>` URL |
| M48 | **Look up another user** | Returns to landing (URL `/`) |
| M49 | Open an old `/u/<user>?view=card` link | Same profile page renders |
| M50 | Browser Back/Forward between landing and a profile | Switches views; returning to the same user does not refetch |
| M51 | Light and dark system theme | Both readable; heatmap levels distinguishable in both |
| M52 | OS reduced motion on | Page appears without the fade-in |

---

## Manual — Sharing

| # | Steps | Expected |
|---|-------|----------|
| M53 | **Post to LinkedIn** | Dialog opens with "Preparing image…", then the 1200×627 preview; Esc, × and clicking the backdrop close it; focus returns to the button |
| M54 | **1 · Download image** | `leetcode-<user>.png` downloads at 2400×1254 |
| M55 | **2 · Copy caption** | Button reads "Caption copied"; clipboard holds the (edited) caption; default caption has real numbers only and no em dashes |
| M56 | **3 · Open LinkedIn** | New tab opens the LinkedIn composer (prefilled text where LinkedIn honours it); caption is also on the clipboard |
| M57 | Mobile Safari / Chrome | **Share image and caption…** appears and opens the native share sheet with the image |

---

## Manual — Easter Eggs

| # | Steps | Expected |
|---|-------|----------|
| M26 | Search `tars` | TARS quote dialog; tap to dismiss |
| M27 | Search `rocky` | Rocky quote dialog |
| M28 | Search `murph` or `cooper` | Interstellar quote dialog |
| M29 | Search `hail mary` | Hail Mary quote dialog |

---

## Manual — Console & Network

| # | Steps | Expected |
|---|-------|----------|
| M30 | Open DevTools → Console during full flow | Zero errors (warnings OK) |
| M31 | Open DevTools → Network during cached search | No API calls fired (`lc_<username>` cache hit) |

---

## Regression Checklist (run after structural changes)

- [ ] All deleted files have zero imports remaining (`npm run lint` catches this)
- [ ] `npm run build` has no three.js / WebGL chunk and total JS does not grow unexpectedly
- [ ] `public/404.html` SPA redirect still works on GitHub Pages (open `/u/<user>` and `/u/<user>?view=card` directly)
- [ ] No horizontal scroll at 320px and 375px (portrait) and 812×375 (landscape) on landing, profile page and share dialog
- [ ] Light and dark system themes both readable on landing, profile page, share dialog and toast
