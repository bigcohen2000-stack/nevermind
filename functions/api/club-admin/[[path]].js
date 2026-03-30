/**
 * פרוקסי ל-worker nm-club-auth: מוסיף X-NM-Admin-Service בצד שרת.
 * דורש Cf-Access-Jwt-Assertion (Zero Trust) או CLUB_ADMIN_PROXY_SKIP_AUTH=1 לפיתוח מקומי.
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function normalizePathParam(raw) {
  if (raw == null) return "";
  if (Array.isArray(raw)) return raw.filter(Boolean).join("/");
  return String(raw).trim();
}

export async function onRequest(context) {
  const { request, env } = context;
  const accessJwt = request.headers.get("Cf-Access-Jwt-Assertion");
  const skipAuth = env.CLUB_ADMIN_PROXY_SKIP_AUTH === "1";

  if (!accessJwt && !skipAuth) {
    return json({ ok: false, error: "נדרש אימות Cloudflare Access לנתיב הזה." }, 401);
  }

  const base = String(env.NM_CLUB_AUTH_BASE_URL ?? "").trim().replace(/\/$/, "");
  const serviceKey = String(env.NM_CLUB_ADMIN_SERVICE_KEY ?? "").trim();

  if (!base || !serviceKey) {
    return json({ ok: false, error: "חסרים NM_CLUB_AUTH_BASE_URL או NM_CLUB_ADMIN_SERVICE_KEY בפריסה." }, 503);
  }

  let pathSegment = normalizePathParam(context.params.path);
  if (!pathSegment) {
    const pathname = new URL(request.url).pathname;
    pathSegment = pathname.replace(/^\/api\/club-admin\/?/, "") || "";
  }
  const suffix = pathSegment ? (pathSegment.startsWith("/") ? pathSegment : `/${pathSegment}`) : "";
  const url = new URL(request.url);
  const targetUrl = `${base}${suffix}${url.search}`;

  const forwardHeaders = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) forwardHeaders.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) forwardHeaders.set("accept", accept);
  forwardHeaders.set("X-NM-Admin-Service", serviceKey);

  const init = {
    method: request.method,
    headers: forwardHeaders,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  try {
    return await fetch(targetUrl, init);
  } catch {
    return json({ ok: false, error: "הפרוקסי לא הצליח להגיע ל-worker." }, 502);
  }
}
