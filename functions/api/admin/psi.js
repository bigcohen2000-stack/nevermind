function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function pickNumeric(audits, id) {
  const v = audits?.[id]?.numericValue;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * PageSpeed Insights v5 (Lighthouse) — דגימה לפי קריאה, לא סטרים בזמן אמת.
 * דורש מפתח API של Google (Pages env: PSI_API_KEY).
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const skipAuth = env.CLUB_ADMIN_PROXY_SKIP_AUTH === "1";
  const accessJwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!skipAuth && !accessJwt) {
    return json({ ok: false, error: "נדרש אימות Cloudflare Access." }, 401);
  }

  const apiKey = String(env.PSI_API_KEY ?? env.GOOGLE_PAGESPEED_API_KEY ?? "").trim();
  if (!apiKey) {
    return json({ ok: false, error: "חסר PSI_API_KEY (או GOOGLE_PAGESPEED_API_KEY) בפריסה." }, 503);
  }

  const reqUrl = new URL(request.url);
  const paramUrl = reqUrl.searchParams.get("url")?.trim();
  const strategy = (reqUrl.searchParams.get("strategy") || "mobile").toLowerCase();
  const strat = strategy === "desktop" ? "desktop" : "mobile";

  const fallbackSite =
    String(env.PUBLIC_SITE_URL ?? env.SITE_URL ?? "").trim() || "https://www.nevermind.co.il";
  const targetUrl = paramUrl && /^https?:\/\//i.test(paramUrl) ? paramUrl : fallbackSite;

  const psiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  psiUrl.searchParams.set("url", targetUrl);
  psiUrl.searchParams.set("key", apiKey);
  psiUrl.searchParams.set("strategy", strat);
  psiUrl.searchParams.set("category", "performance");

  try {
    const response = await fetch(psiUrl.toString(), { method: "GET" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = data?.error?.message || data?.error?.errors?.[0]?.message || "בקשת PageSpeed נכשלה.";
      return json({ ok: false, error: String(msg) }, 502);
    }

    const lh = data?.lighthouseResult;
    const audits = lh?.audits ?? {};
    const scoreRaw = lh?.categories?.performance?.score;
    const performanceScore =
      typeof scoreRaw === "number" && Number.isFinite(scoreRaw) ? Math.round(scoreRaw * 100) : null;

    const lcpMs = pickNumeric(audits, "largest-contentful-paint");
    const cls = pickNumeric(audits, "cumulative-layout-shift");
    const tbtMs = pickNumeric(audits, "total-blocking-time");
    const inpMs =
      pickNumeric(audits, "interaction-to-next-paint") ??
      pickNumeric(audits, "experimental-interaction-to-next-paint");

    return json({
      ok: true,
      url: targetUrl,
      strategy: strat,
      performanceScore,
      lcpMs: lcpMs != null ? Math.round(lcpMs) : null,
      cls: cls != null ? Math.round(cls * 1000) / 1000 : null,
      tbtMs: tbtMs != null ? Math.round(tbtMs) : null,
      inpMs: inpMs != null ? Math.round(inpMs) : null,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return json({ ok: false, error: "קריאה ל-PageSpeed נכשלה." }, 502);
  }
}
