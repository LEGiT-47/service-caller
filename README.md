# Service Caller

Netlify site that keeps Render services warm by pinging them every 12 minutes via a scheduled function.

## What it pings

- `BACKEND_KEEPALIVE_URL` (set in Netlify environment variables)
- `AI_KEEPALIVE_URL` (set in Netlify environment variables)
- `EXTRA_KEEPALIVE_URL` (optional, defaults to `https://sequeira-foods-api.onrender.com`)

## Required Netlify settings

- Build command: none
- Publish directory: `.`
- Functions directory: `netlify/functions` (already in `netlify.toml`)

## Netlify environment variables

Set these in Site settings -> Environment variables:

- `BACKEND_KEEPALIVE_URL=https://your-backend-name.onrender.com/admin/login/`
- `AI_KEEPALIVE_URL=https://your-ai-service-name.onrender.com/health`
- `EXTRA_KEEPALIVE_URL=https://sequeira-foods-api.onrender.com` (optional because default is already set)

## Schedule

The function in `netlify/functions/keep-alive.js` uses:

- `*/12 * * * *` (every 12 minutes)
