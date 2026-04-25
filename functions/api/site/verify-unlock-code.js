import { resolveUnlockAccess } from "../../_lib/unlock-access.js";
import { checkRateLimit, rateLimitResponse } from "../../_lib/rate-limit.js";

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const rl = checkRateLimit(request, "verify_unlock", { max: 10, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.retryAfter);

  let payload = null;
  try {
    payload = await context.request.json();
  } catch {
    return json({ ok: false, authorized: false, error: "invalid_request" }, 400);
  }

  const code = String(payload?.code ?? "").trim();
  if (!code) {
    return json({ ok: true, authorized: false, reason: "empty_code" });
  }

  const access = resolveUnlockAccess(code, env);
  return json({
    ok: true,
    authorized: access.authorized,
    mode: access.mode,
  });
}
