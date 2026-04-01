function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function isAuthorized(request, env) {
  const url = new URL(request.url);
  const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const skipAuth = env.CLUB_ADMIN_PROXY_SKIP_AUTH === "1";
  return isLocal || skipAuth || Boolean(request.headers.get("Cf-Access-Jwt-Assertion"));
}

function seedNumber(seed, offset) {
  return Math.abs(Math.sin(seed + offset) * 10000);
}

function makeIp(seed, index) {
  const octetA = 20 + Math.floor(seedNumber(seed, index) % 180);
  const octetB = 10 + Math.floor(seedNumber(seed, index + 11) % 220);
  return `172.${octetA}.${octetB}.${30 + index}`;
}

const COUNTRIES = ["Israel", "United Kingdom", "Germany", "France", "United States"];
const DEVICES = ["Desktop Safari", "iPhone", "Android Chrome", "MacBook Chrome", "Windows Edge"];
const STATUSES = ["access ok", "session ok", "challenge", "admin verified"];

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: "נדרש אימות Cloudflare Access" }, 401);
  }

  const bucket = Math.floor(Date.now() / 15000);
  const items = Array.from({ length: 5 }, (_, index) => ({
    ip: makeIp(bucket, index),
    country: COUNTRIES[(bucket + index) % COUNTRIES.length],
    device: DEVICES[(bucket + index) % DEVICES.length],
    authStatus: STATUSES[(bucket + index) % STATUSES.length],
    activeSeconds: 8 + ((bucket + index * 3) % 64),
  }));

  return json({
    ok: true,
    source: "mock:cf-analytics-free-tier",
    generatedAt: new Date().toISOString(),
    totalActive: items.length,
    items,
  });
}
