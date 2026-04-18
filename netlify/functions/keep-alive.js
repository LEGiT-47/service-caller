// Define all services to keep alive here
// Add or remove URLs as needed
const SERVICES_TO_PING = [
  // "https://sheild-backend-0q37.onrender.com",
  // "https://sheild-ai-service.onrender.com",
  "https://civicresource-ai.onrender.com",
  "https://civicresource-ai-service.onrender.com",
  "https://sequeira-foods-api.onrender.com"
];

exports.config = {
  schedule: "*/12 * * * *",
};

function buildTargets() {
  const normalized = SERVICES_TO_PING
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .map((url) => {
      if (/^https?:\/\//i.test(url)) {
        return url;
      }
      return `https://${url}`;
    })
    .map((url) => {
      // Keep-alive should hit the service root only.
      const parsed = new URL(url);
      return parsed.origin;
    });

  return [...new Set(normalized)];
}

async function ping(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "service-caller-keepalive/1.0",
        Accept: "application/json,text/plain,*/*",
      },
    });

    return {
      url,
      ok: true,
      reachable: true,
      status: response.status,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      reachable: false,
      status: null,
      durationMs: Date.now() - startedAt,
      error: error.name === "AbortError" ? "timeout" : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

exports.handler = async () => {
  const runId = `run_${Date.now()}`;
  const runStartedAt = new Date().toISOString();
  const targets = buildTargets();

  console.log(
    `[keep-alive] ${runId} started at ${runStartedAt}; target count=${targets.length}`
  );
  console.log(`[keep-alive] ${runId} targets: ${targets.join(", ")}`);

  if (targets.length === 0) {
    console.warn(`[keep-alive] ${runId} no targets configured`);
    return {
      statusCode: 400,
      body: JSON.stringify({
        ok: false,
        message:
          "No targets configured. Set BACKEND_KEEPALIVE_URL and AI_KEEPALIVE_URL in Netlify env.",
      }),
    };
  }

  const results = await Promise.all(targets.map((url) => ping(url)));
  results.forEach((result) => {
    if (result.ok) {
      console.log(
        `[keep-alive] ${runId} called ${result.url} -> status=${result.status} duration=${result.durationMs}ms`
      );
      return;
    }

    console.error(
      `[keep-alive] ${runId} called ${result.url} -> FAILED status=${result.status ?? "n/a"} duration=${result.durationMs}ms error=${result.error || "unknown"}`
    );
  });

  const failed = results.filter((result) => !result.ok);
  console.log(
    `[keep-alive] ${runId} completed; success=${results.length - failed.length} failed=${failed.length}`
  );

  return {
    statusCode: failed.length ? 207 : 200,
    body: JSON.stringify({
      ok: failed.length === 0,
      runId,
      schedule: "*/12 * * * *",
      timestamp: new Date().toISOString(),
      results,
    }),
  };
};
