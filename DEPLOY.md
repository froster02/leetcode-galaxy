# 🌌 LeetCode Galaxy — Deployment Guide

> **⚠️ How the app fetches data:** the frontend calls the public
> [Alfa LeetCode API](https://alfa-leetcode-api.onrender.com) directly
> (`src/hooks/useLeetCode.js`). The Cloudflare Worker below is an **optional
> fallback** proxy to `leetcode.com/graphql`: when `VITE_WORKER_URL` is set at
> build time, the app retries via the worker whenever Alfa rate-limits (429) or
> is unreachable. Unset, the app behaves as Alfa-only. You can deploy the
> frontend alone (Step 2) and skip the worker entirely.

## Stack

- **Frontend**: Vercel (React/Vite static site) — GitHub Pages is also set up via `.github/workflows/deploy.yml`
- **Backend**: none required (public Alfa LeetCode API). Optional: Cloudflare Worker (LeetCode GraphQL proxy with 1hr edge cache, used as automatic fallback when `VITE_WORKER_URL` is set)

---

## Step 1 — (Optional) Deploy the Cloudflare Worker

Not required — without it the app is Alfa-only. Deploy it to enable the automatic 429/network-error fallback (recommended: the Alfa API runs on Render's free tier and rate-limits under load).

```bash
# Install Wrangler CLI (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy the worker
cd worker
wrangler deploy
```

After deploy, you'll get a URL like:

```
https://leetcode-galaxy-proxy.YOUR_SUBDOMAIN.workers.dev
```

**Copy this URL — you'll need it in Step 2.**

---

## Step 2 — Deploy the Frontend to Vercel

### Option A — Vercel CLI (fastest)

```bash
# From the project root
cd ..

# Install Vercel CLI
npm i -g vercel

# Deploy (first time will ask to link to Vercel account)
vercel --prod
```

When prompted:

- **Framework**: `Other` (Vite is auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Option B — Vercel Dashboard (no CLI)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Vercel auto-detects Vite — just click **Deploy**

---

## Step 3 — (Optional) Set Environment Variable in Vercel

Enables the worker fallback (skip if you skipped Step 1):

| Name | Value |
|------|-------|
| `VITE_WORKER_URL` | `https://leetcode-galaxy-proxy.YOUR_SUBDOMAIN.workers.dev` |

Then **re-deploy** (Vercel Dashboard → Deployments → Redeploy) to pick up the env var.

---

## Step 4 — (Optional) Add a Custom Domain

### Frontend domain (e.g. `leetcode-galaxy.dev`)

- Vercel Dashboard → Your Project → Settings → Domains → Add Domain

### Worker subdomain (e.g. `api.leetcode-galaxy.dev`)

1. Uncomment the `routes` block in `worker/wrangler.toml`
2. Replace `leetcode-galaxy.dev` with your actual domain
3. Run `wrangler deploy` again

---

## Verify It's Working

After all steps, open your Vercel URL and search for a LeetCode username (e.g. `neal_wu`).

The chain:  
`Browser → Vercel CDN (static site) → Alfa LeetCode API (onrender.com)`

(With `VITE_WORKER_URL` set, Alfa 429s/network errors automatically fall back to:
`Browser → Cloudflare Worker → (1hr edge cache) → leetcode.com/graphql`)

---

## At 1K hits/day — You Are Fully on Free Tier

| Service | Free Limit | Your Usage |
|---------|-----------|------------|
| Vercel | Unlimited static | ✅ |
| CF Workers | 100K req/day | ~1K/day ✅ |
| CF Edge Cache | Unlimited | ✅ |

**Total monthly cost: $0** 🎉
