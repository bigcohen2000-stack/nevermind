import { resolveUnlockAccess } from "../../_lib/unlock-access.js";

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
  let payload = null;
  try {
    payload = await context.request.json();
  } catch {
    return json({ ok: false, authorized: false, error: "invalid_json" }, 400);
  }

  const code = String(payload?.code ?? "").trim();
  if (!code) {
    return json({ ok: true, authorized: false, reason: "empty_code" });
  }

  const access = resolveUnlockAccess(code, context.env);
  return json({
    ok: true,
    authorized: access.authorized,
    mode: access.mode,
  });
}
