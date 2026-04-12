function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

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

  const configured = readCodesFromEnv(context.env).length > 0;
  const authorized = isAuthorizedCode(code, context.env);
  return json({
    ok: true,
    authorized,
    mode: configured ? "strict" : "open",
  });
}

