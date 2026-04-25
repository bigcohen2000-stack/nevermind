function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function readAllowedAdminEmails(env) {
  const configured = String(env.NM_ADMIN_ACCESS_EMAILS ?? env.ADMIN_ACCESS_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured;
}

function readAccessEmail(request) {
  const directEmail = String(request.headers.get("Cf-Access-Authenticated-User-Email") ?? "")
    .trim()
    .toLowerCase();
  if (directEmail) return directEmail;

  const identity = String(request.headers.get("Cf-Access-Authenticated-User-Identity") ?? "")
    .trim()
    .toLowerCase();
  return identity;
}

function isAuthorizedAccessEmail(request, env) {
  const email = readAccessEmail(request);
  const allowedEmails = readAllowedAdminEmails(env);
  if (allowedEmails.length === 0) {
    return email.length > 0;
  }
  return email.length > 0 && allowedEmails.includes(email);
}

function isDashboardAuthorized(request, env) {
  const url = new URL(request.url);
  const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const skipAuth = env.CLUB_ADMIN_PROXY_SKIP_AUTH === "1";
  if (isLocal || skipAuth) {
    return true;
  }

  if (!request.headers.get("Cf-Access-Jwt-Assertion")) {
    return false;
  }

  return isAuthorizedAccessEmail(request, env);
}

function readClubWorkerConfig(env) {
  const base = String(env.NM_CLUB_AUTH_BASE_URL ?? "").trim().replace(/\/$/, "");
  const serviceKey = String(env.NM_CLUB_ADMIN_SERVICE_KEY ?? "").trim();
  return { base, serviceKey };
}

async function fetchClubWorkerJson(env, path, init = {}) {
  const { base, serviceKey } = readClubWorkerConfig(env);
  if (!base || !serviceKey) {
    return {
      ok: false,
      status: 503,
      error: "חסרים פרטי החיבור לשרת המועדון.",
      payload: null,
    };
  }

  const headers = new Headers(init.headers || {});
  headers.set("accept", headers.get("accept") || "application/json");
  headers.set("X-NM-Admin-Service", serviceKey);

  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      return {
        ok: false,
        status: response.status,
        error:
          typeof payload?.error === "string" && payload.error.trim()
            ? payload.error.trim()
            : "שרת המועדון לא החזיר תשובה תקינה.",
        payload,
      };
    }
    return {
      ok: true,
      status: response.status,
      error: "",
      payload,
    };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "לא הצלחנו להגיע לשרת המועדון.",
      payload: null,
    };
  }
}

async function fetchClubAdminOverview(env) {
  return fetchClubWorkerJson(env, "/admin/overview", { method: "GET" });
}

export {
  json,
  isDashboardAuthorized,
  fetchClubWorkerJson,
  fetchClubAdminOverview,
  readAllowedAdminEmails,
  readAccessEmail,
};
