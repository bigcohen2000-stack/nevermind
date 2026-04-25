// In-memory rate limiter — per-isolate, resets on cold start.
// Provides meaningful burst protection; for distributed attacks use Cloudflare Rate Limiting rules.

const store = new Map();

const PRUNE_INTERVAL_MS = 5 * 60_000;
let lastPruned = Date.now();

function pruneExpired() {
  const now = Date.now();
  if (now - lastPruned < PRUNE_INTERVAL_MS) return;
  lastPruned = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

function readClientIp(request) {
  const v =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "";
  return String(v).split(",")[0].trim();
}

/**
 * @param {Request} request
 * @param {string} endpoint  — short label, e.g. "form_submit"
 * @param {{ max?: number, windowMs?: number }} [opts]
 * @returns {{ ok: boolean, retryAfter?: number }}
 */
export function checkRateLimit(request, endpoint, { max = 10, windowMs = 60_000 } = {}) {
  pruneExpired();
  const ip = readClientIp(request);
  if (!ip) return { ok: true };

  const key = `${endpoint}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  entry.count += 1;
  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfter };
  }

  return { ok: true };
}

export function rateLimitResponse(retryAfter = 60) {
  return new Response(
    JSON.stringify({ ok: false, error: "rate_limited", message: "יותר מדי בקשות. נסה שוב עוד רגע." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": String(retryAfter),
      },
    },
  );
}
