# Doki Hub — Influencer Command Center

## Features
- **🔍 Discover** — Find similar influencers with engagement, follower, niche & location filters
- **📋 Pipeline** — CRM with stages: Prospect → In Talks → Active → Done
- **💰 Spend** — Track payments per influencer, CPE, and ROI (in ₹)
- **🔒 Password Protected** — Team access via shared password
- **📡 Instagram API** — Live data via @dokimeats Business account

## Quick Deploy to Vercel (5 minutes)

### Step 1: Push to GitHub
```bash
cd doki-hub
git init
git add .
git commit -m "Doki Influencer Hub v1"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/doki-hub.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click "New Project" → Import your `doki-hub` repo
3. Framework Preset: **Vite**
4. Click **Deploy**
5. Done! You'll get a URL like `doki-hub.vercel.app`

### Step 3 (Optional): Custom domain
- In Vercel → Project Settings → Domains → Add `hub.dokimeats.com`

## Configuration

Edit `src/App.jsx` and update the `CONFIG` object:

```javascript
const CONFIG = {
  TEAM_PASSWORD: "doki2026",        // Change to your team password
  IG_ACCESS_TOKEN: "",               // Instagram Graph API token (see below)
  IG_BUSINESS_ID: "17841429694489589", // @dokimeats — already set
};
```

## Setting up Instagram Graph API (for live data)

The app already uses @dokimeats (ID: 17841429694489589). To enable live lookups:

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an app (type: Business)
3. Add "Instagram Graph API" product
4. Go to Graph API Explorer → Select your app
5. Request permissions: `instagram_basic`, `pages_show_list`, `pages_read_engagement`, `business_management`
6. Generate a **User Token**
7. Exchange for a **long-lived token** (lasts 60 days):
   ```
   GET https://graph.facebook.com/v19.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id=YOUR_APP_ID&
     client_secret=YOUR_APP_SECRET&
     fb_exchange_token=SHORT_LIVED_TOKEN
   ```
8. Paste the token into `CONFIG.IG_ACCESS_TOKEN`

With the token, searching any public IG handle will pull real follower counts, engagement rates, and recent post metrics.

## Local Development
```bash
npm install
npm run dev
```

## Team Password
Default: `doki2026` — change this in `CONFIG.TEAM_PASSWORD` before deploying.
