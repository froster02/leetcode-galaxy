# 🌌 LeetCode Galaxy — Deployment Guide

## Stack

- **Frontend**: Vercel (React/Vite static site)
- **Backend**: Cloudflare Workers (LeetCode GraphQL proxy with edge cache)

---

## Step 1 — Deploy the Cloudflare Worker

The worker is your API proxy. Deploy it first so you have the URL for the frontend.

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

## Step 3 — Set Environment Variable in Vercel

After deploying, go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

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
`Browser → Vercel CDN → Cloudflare Worker → (1hr edge cache) → LeetCode API`

---

## At 1K hits/day — You Are Fully on Free Tier

| Service | Free Limit | Your Usage |
|---------|-----------|------------|
| Vercel | Unlimited static | ✅ |
| CF Workers | 100K req/day | ~1K/day ✅ |
| CF Edge Cache | Unlimited | ✅ |

**Total monthly cost: $0** 🎉
