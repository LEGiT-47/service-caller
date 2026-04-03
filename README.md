# Service Caller

Netlify site that keeps Render services warm by pinging them every 12 minutes via a scheduled function.

## What it pings

- `BACKEND_KEEPALIVE_URL` (set in Netlify environment variables)
- `AI_KEEPALIVE_URL` (set in Netlify environment variables)
- `EXTRA_KEEPALIVE_URL` (optional third API URL)

## Required Netlify settings

- Build command: none
- Publish directory: `.`
- Functions directory: `netlify/functions` (already in `netlify.toml`)

## Netlify environment variables

Set these in Site settings -> Environment variables:

- `BACKEND_KEEPALIVE_URL=https://your-backend-name.onrender.com`
- `AI_KEEPALIVE_URL=https://your-ai-service-name.onrender.com`
- `EXTRA_KEEPALIVE_URL=https://your-third-api.onrender.com/health` (optional)

Important: this function keeps services warm by calling each service root/origin URL. Even if a service returns `404` on `/`, that still means it was reached and warmed successfully.

## Schedule

The function in `netlify/functions/keep-alive.js` uses:

- `*/12 * * * *` (every 12 minutes)
