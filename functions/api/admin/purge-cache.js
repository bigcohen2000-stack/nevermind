function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const accessJwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!accessJwt) {
    return json({ ok: false, error: "נדרש אימות Cloudflare Access." }, 401);
  }

  const zoneId = String(env.CF_ZONE_ID ?? "").trim();
  const token = String(env.CF_API_TOKEN ?? "").trim();
  if (!zoneId || !token) {
    return json({ ok: false, error: "חסרים CF_ZONE_ID או CF_API_TOKEN." }, 503);
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purge_everything: true }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success !== true) {
      return json({ ok: false, error: payload?.errors?.[0]?.message || "Cloudflare דחה את הבקשה." }, 502);
    }

    return json({ ok: true, purgedAt: new Date().toISOString() });
  } catch {
    return json({ ok: false, error: "קריאה ל-Cloudflare נכשלה." }, 502);
  }
}

