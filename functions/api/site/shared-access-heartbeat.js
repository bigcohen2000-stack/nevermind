import { fetchClubWorkerJson, json } from "../../_lib/club-admin.js";
import {
  buildSharedIdentityKey,
  normalizePhone,
  normalizeSharedIdentityName,
  readClientIp,
} from "../../_lib/shared-access.js";
import { resolveUnlockAccess } from "../../_lib/unlock-access.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload = null;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const code = String(payload?.code ?? "").trim();
  const fullName = normalizeSharedIdentityName(payload?.fullName ?? "");
  const phone = normalizePhone(payload?.phone ?? "");
  const path = String(payload?.path ?? "/").trim().slice(0, 500) || "/";

  if (!code) {
    return json({ ok: false, error: "missing_code" }, 400);
  }

  const access = resolveUnlockAccess(code, env);
  if (!access.authorized) {
    return json({ ok: false, error: "invalid_code" }, 401);
  }

  if (fullName.length < 2 || !phone) {
    return json({ ok: false, error: "missing_identity" }, 400);
  }

  const identityKey = buildSharedIdentityKey(fullName, phone);
  const forwardedHeaders = {
    "content-type": "application/json",
    "x-nm-client-ip": readClientIp(request),
    "x-nm-client-ua": String(request.headers.get("user-agent") ?? "").slice(0, 240),
  };

  const workerResponse = await fetchClubWorkerJson(env, "/admin/shared-access-log", {
    method: "POST",
    headers: forwardedHeaders,
    body: JSON.stringify({
      fullName,
      phone,
      path,
      identityKey,
      eventType: "heartbeat",
    }),
  });

  if (!workerResponse.ok || workerResponse.payload?.ok !== true) {
    return json(
      {
        ok: false,
        error: workerResponse.error || "shared_access_heartbeat_failed",
      },
      workerResponse.status || 502,
    );
  }

  return json({
    ok: true,
    phone,
    memberName: String(workerResponse.payload?.memberName ?? fullName).trim() || fullName,
    identityKey,
    source: "SHARED",
    seenAt: String(workerResponse.payload?.lastLoginAt ?? new Date().toISOString()),
  });
}
