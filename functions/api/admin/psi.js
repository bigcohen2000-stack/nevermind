import { isDashboardAuthorized, json } from "../../_lib/club-admin.js";

function pickNumeric(audits, id) {
  const value = audits?.[id]?.numericValue;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isDashboardAuthorized(request, env)) {
    return json({ ok: false, error: "נדרש אימות Cloudflare Access." }, 401);
  }

  const apiKey = String(env.PSI_API_KEY ?? env.GOOGLE_PAGESPEED_API_KEY ?? "").trim();
  if (!apiKey) {
    return json({ ok: false, error: "חסר מפתח לבדיקה החיצונית בפריסה." }, 503);
  }

  const reqUrl = new URL(request.url);
  const paramUrl = reqUrl.searchParams.get("url")?.trim();
  const strategy = (reqUrl.searchParams.get("strategy") || "mobile").toLowerCase();
  const finalStrategy = strategy === "desktop" ? "desktop" : "mobile";
  const fallbackSite =
    String(env.PUBLIC_SITE_URL ?? env.SITE_URL ?? "").trim() || "https://www.nevermind.co.il";
  const targetUrl = paramUrl && /^https?:\/\//i.test(paramUrl) ? paramUrl : fallbackSite;

  const psiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  psiUrl.searchParams.set("url", targetUrl);
  psiUrl.searchParams.set("key", apiKey);
  psiUrl.searchParams.set("strategy", finalStrategy);
  psiUrl.searchParams.set("category", "performance");

  try {
    const response = await fetch(psiUrl.toString(), { method: "GET" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.error?.message || data?.error?.errors?.[0]?.message || "בקשת בדיקת המובייל נכשלה.";
      return json({ ok: false, error: String(message) }, 502);
    }

    const lighthouse = data?.lighthouseResult;
    const audits = lighthouse?.audits ?? {};
    const scoreRaw = lighthouse?.categories?.performance?.score;
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
      strategy: finalStrategy,
      performanceScore,
      lcpMs: lcpMs != null ? Math.round(lcpMs) : null,
      cls: cls != null ? Math.round(cls * 1000) / 1000 : null,
      tbtMs: tbtMs != null ? Math.round(tbtMs) : null,
      inpMs: inpMs != null ? Math.round(inpMs) : null,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return json({ ok: false, error: "קריאה לבדיקה החיצונית נכשלה." }, 502);
  }
}
