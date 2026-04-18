# Service Caller

Netlify site that keeps Render services warm by pinging them every 12 minutes via a scheduled function.

## What it pings

Services are defined in [netlify/functions/keep-alive.js](netlify/functions/keep-alive.js) in the `SERVICES_TO_PING` array. Add or remove URLs directly in the code.

## How to add more services

Edit [netlify/functions/keep-alive.js](netlify/functions/keep-alive.js) and add URLs to the `SERVICES_TO_PING` array:

```javascript
const SERVICES_TO_PING = [
  "https://sheild-backend-0q37.onrender.com",
  "https://sheild-ai-service.onrender.com",
  "https://your-other-service.onrender.com",
];
```

## Required Netlify settings

- Build command: none
- Publish directory: `.`
- Functions directory: `netlify/functions` (already in `netlify.toml`)

No environment variables needed. All service URLs are configured in the project.

## Schedule

The function runs every 12 minutes using the cron schedule `*/12 * * * *`

Important: this function keeps services warm by calling each service root/origin URL. Even if a service returns `404` on `/`, that still means it was reached and warmed successfully.
