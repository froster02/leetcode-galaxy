# Test Plan

Run `scripts/run-tests.sh` after every code change. Automated checks run first; manual checks follow.

---

## Automated (run via script)

| # | Check | Command |
|---|-------|---------|
| A1 | Build succeeds | `npm run build` |
| A2 | No ESLint errors | `npm run lint` |
| A3 | Unit tests pass (pure utils: normalization, gameData, dataMapper, calendar, wrapped, roast, handle, workerFallback) | `npm test` |

---

## Manual — Landing

| # | Steps | Expected |
|---|-------|----------|
| M1 | Load `/` | Headline, search field, sample Wrapped card visible; correct in both light and dark system theme |
| M2 | Type `@cpcs` or `https://leetcode.com/u/cpcs/` and submit | Treated as handle `cpcs` |
| M3 | Press `/` key | Search input focuses |
| M4 | Mobile viewports 320×568, 375×812, 390×844, 812×375 (landscape), 768×1024 | Single column on phones, no horizontal scroll, no overlapping text, touch targets ≥ 44px, text ≥ 11px, input ≥ 16px (no iOS zoom) |
| M5 | Click a **Try a legend** chip (e.g. `cpcs`, `votrubac`) | Wrapped loads OR "LeetCode is busy right now" toast if the Alfa API is throttling — **never** "Couldn’t load that profile" on a 429 |

---

## Manual — Search & Error Handling

| # | Steps | Expected |
|---|-------|----------|
| M6 | Search valid user (e.g. `votrubac`) | Spinner "Wrapping up @votrubac…" → Wrapped story |
| M7 | Search nonexistent user (e.g. `zzz_no_such_user_zzz`) | "No user found…" toast on landing, no Retry button |
| M8 | After M7, press browser **Back** | Returns to landing URL — no dead `/u/zzz_no_such_user_zzz` entry in history |
| M9 | Alfa API rate-limited (HTTP 429 on `/userProfile/<user>`) | "LeetCode is busy right now" toast with Retry |
| M10 | Search same user twice within 30 min | Second fetch is instant (localStorage cache hit — no network request) |

---

## Manual — Wrapped story

| # | Steps | Expected |
|---|-------|----------|
| M11 | Load any user | Story renders; progress bars at top; first slide shows `@handle` |
| M12 | Tap right / left third, ← / → keys, Space | Advances / goes back; never past first or last slide |
| M13 | Drag horizontally | Slide tracks the finger 1:1; small drag springs back; flick advances one slide; rubber-band resistance at first/last slide; grabbing mid-animation interrupts it without a jump |
| M14 | Press and hold | "Paused" shown, progress bar stops; release resumes from the same point |
| M15 | Wait on a slide | Auto-advances after ~5.5s; stops on the final card slide |
| M16 | User with no contests / no calendar data | Contest / peak-month / streak slides are skipped, not shown empty |
| M17 | Personality slide | 4-letter code + title + blurb; same code as on the final card |
| M18 | Esc or × | Returns to landing (URL `/`) |
| M33 | OS reduced motion on | No drag, no auto-advance, slides cross-fade; numbers appear without count-up |
| M34 | OS reduced transparency / increased contrast | Final action bar becomes solid |
| M38 | Story on a landscape phone (812×375) | Full-bleed; final slide shows the card beside a right-hand action panel (not covered by it) |
| M39 | Rotate / resize mid-story | Current slide stays aligned, no partial neighbour slide visible |
| M40 | Full stats at 320px | Hero ring below the name, stat cards 2-up, Problem Breakdown 2×2, Challenge button full width; VS modal scrolls and power numbers fit |

---

## Manual — Full stats (FighterCard)

| # | Steps | Expected |
|---|-------|----------|
| M19 | Story header → **Full stats** | URL becomes `/u/<user>?view=card`; dark stats page renders, no blank sections, all labels ≥ 11px |
| M20 | Click **Challenge** on another user | VS modal opens (dark); battle result renders |
| M21 | Click **View on LeetCode** link | Opens correct LeetCode profile URL in new tab |
| M32 | Contest section for a contest-active user (e.g. `votrubac`) | Rating sparkline renders when history has ≥ 2 points; hidden otherwise |
| M35 | **← Wrapped** in nav | Returns to the story (URL `/u/<user>`), no refetch |
| M36 | Browser Back/Forward between story and stats | Switches views without refetching |

---

## Manual — Sharing

| # | Steps | Expected |
|---|-------|----------|
| M22 | Reach the final slide | Card preview + action bar; **Share** shows "Preparing…" briefly then enables |
| M23 | **Save** | 1080×1920 PNG `leetcode-wrapped-<user>.png` downloads |
| M24 | **Copy** | Image copied to clipboard (or "Copy not supported here") |
| M25 | **Share** on mobile Safari/Chrome | Native share sheet with the image attached; on desktop without file sharing it falls back to download |
| M37 | Full stats → **Share card** | Legacy share modal: Download / Copy / LinkedIn all work |

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
- [ ] No horizontal scroll at 320px and 375px (portrait) and 812×375 (landscape) on landing, story, stats, Share modal, VS modal
- [ ] Light and dark system themes both readable on landing and toast
