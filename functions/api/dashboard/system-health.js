import { fetchClubWorkerJson, isDashboardAuthorized, json } from "../../_lib/club-admin.js";
import { resolveResendConfig } from "../../_lib/resend.js";

function hasValue(input) {
  return String(input ?? "").trim().length > 0;
}

function item(id, label, ok, detail) {
  return { id, label, ok, detail };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isDashboardAuthorized(request, env)) {
    return json({ ok: false, error: "נדרשת גישת Access לדשבורד." }, 401);
  }

  const resend = resolveResendConfig(env);

  const checks = [
    item(
      "club_proxy",
      "חיבור Worker",
      hasValue(env.NM_CLUB_AUTH_BASE_URL) && hasValue(env.NM_CLUB_ADMIN_SERVICE_KEY),
      hasValue(env.NM_CLUB_AUTH_BASE_URL) && hasValue(env.NM_CLUB_ADMIN_SERVICE_KEY)
        ? "כתובת המועדון ומפתח השירות קיימים"
        : "חסרים NM_CLUB_AUTH_BASE_URL או NM_CLUB_ADMIN_SERVICE_KEY"
    ),
    item(
      "forms",
      "טפסי מייל",
      resend.enabled,
      resend.enabled
        ? "Resend מוגדר עם מפתח וכתובת שולח"
        : !resend.apiKey
          ? "חסר RESEND_API_KEY"
          : !resend.from
            ? "חסר RESEND_FROM_EMAIL"
            : "חסר יעד מייל לשליחה"
    ),
    item(
      "hcaptcha",
      "אימות טפסים",
      hasValue(env.PUBLIC_HCAPTCHA_SITE_KEY),
      hasValue(env.PUBLIC_HCAPTCHA_SITE_KEY) ? "מפתח hCaptcha ציבורי מוגדר" : "PUBLIC_HCAPTCHA_SITE_KEY לא מוגדר"
    ),
    item(
      "cloudflare_analytics",
      "מונה חי של Cloudflare",
      hasValue(env.CF_API_TOKEN) && hasValue(env.CF_ZONE_ID),
      hasValue(env.CF_API_TOKEN) && hasValue(env.CF_ZONE_ID)
        ? "אפשר למשוך ספירת תנועה חיה מהאתר"
        : "חסרים CF_API_TOKEN או CF_ZONE_ID"
    ),
  ];

  const workerHealth = await fetchClubWorkerJson(env, "/health", { method: "GET" });
  checks.unshift(
    item(
      "worker_health",
      "בריאות שרת המועדון",
      workerHealth.ok === true,
      workerHealth.ok === true ? "ה־worker עונה כרגיל" : workerHealth.error || "ה־worker לא זמין כרגע"
    )
  );

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    checks,
  });
}
