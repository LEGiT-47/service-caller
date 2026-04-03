const DEFAULT_EXTRA_URL = "https://sequeira-foods-api.onrender.com";

exports.config = {
  schedule: "*/12 * * * *",
};

function buildTargets() {
  const backend = process.env.BACKEND_KEEPALIVE_URL || "";
  const ai = process.env.AI_KEEPALIVE_URL || "";
  const extra = process.env.EXTRA_KEEPALIVE_URL || DEFAULT_EXTRA_URL;

  return [backend, ai, extra]
    .map((url) => String(url || "").trim())
    .filter(Boolean);
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
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      durationMs: Date.now() - startedAt,
      error: error.name === "AbortError" ? "timeout" : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

exports.handler = async () => {
  const runStartedAt = new Date().toISOString();
  const targets = buildTargets();

  console.log(
    `[keep-alive] run started at ${runStartedAt}; target count=${targets.length}`
  );

  if (targets.length === 0) {
    console.warn("[keep-alive] no targets configured");
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
        `[keep-alive] called ${result.url} -> status=${result.status} duration=${result.durationMs}ms`
      );
      return;
    }

    console.error(
      `[keep-alive] called ${result.url} -> FAILED status=${result.status ?? "n/a"} duration=${result.durationMs}ms error=${result.error || "unknown"}`
    );
  });

  const failed = results.filter((result) => !result.ok);
  console.log(
    `[keep-alive] run completed; success=${results.length - failed.length} failed=${failed.length}`
  );

  return {
    statusCode: failed.length ? 207 : 200,
    body: JSON.stringify({
      ok: failed.length === 0,
      schedule: "*/12 * * * *",
      timestamp: new Date().toISOString(),
      results,
    }),
  };
};
