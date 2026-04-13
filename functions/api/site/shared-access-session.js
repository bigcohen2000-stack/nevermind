import { fetchClubWorkerJson, json } from "../../_lib/club-admin.js";

const SHARED_SESSION_HOURS = 168;

function readCodesFromEnv(env) {
  const raw = String(env.PUBLIC_DASHBOARD_CODES ?? env.NEXT_PUBLIC_DASHBOARD_CODES ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAuthorizedCode(code, env) {
  const clean = String(code ?? "").trim();
  if (!clean) return false;
  const codes = readCodesFromEnv(env);
  if (codes.length > 0) {
    return codes.includes(clean);
  }
  return true;
}

function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("972") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

function readClientIp(request) {
  const headerValue =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "";
  return String(headerValue).split(",")[0]?.trim() || "";
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload = null;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const code = String(payload?.code ?? "").trim();
  const fullName = String(payload?.fullName ?? "").trim().slice(0, 80);
  const phone = normalizePhone(payload?.phone ?? "");
  const path = String(payload?.path ?? "/me/unlock/").trim().slice(0, 500) || "/me/unlock/";

  if (!code) {
    return json({ ok: false, error: "missing_code" }, 400);
  }

  if (!isAuthorizedCode(code, env)) {
    return json({ ok: false, error: "invalid_code" }, 401);
  }

  if (fullName.length < 2 || !phone) {
    return json({ ok: false, error: "missing_identity" }, 400);
  }

  const forwardedHeaders = {
    "content-type": "application/json",
    "x-nm-client-ip": readClientIp(request),
    "x-nm-client-ua": String(request.headers.get("user-agent") ?? "").slice(0, 240),
  };

  const workerResponse = await fetchClubWorkerJson(env, "/admin/shared-access-log", {
    method: "POST",
    headers: forwardedHeaders,
    body: JSON.stringify({ fullName, phone, path }),
  });

  if (!workerResponse.ok || workerResponse.payload?.ok !== true) {
    return json(
      {
        ok: false,
        error: workerResponse.error || "shared_access_log_failed",
      },
      workerResponse.status || 502,
    );
  }

  const nowIso = String(workerResponse.payload?.lastLoginAt ?? new Date().toISOString());
  const expiresAt = new Date(Date.parse(nowIso) + SHARED_SESSION_HOURS * 60 * 60 * 1000).toISOString();

  return json({
    ok: true,
    memberName: String(workerResponse.payload?.memberName ?? fullName).trim() || fullName,
    phone,
    lastLoginAt: nowIso,
    expiresAt,
    liveStatus: "SHARED",
    mode: "shared_code",
  });
}

