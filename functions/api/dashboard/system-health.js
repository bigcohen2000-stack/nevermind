import { fetchClubWorkerJson, isDashboardAuthorized, json } from "../../_lib/club-admin.js";
import { resolveResendConfig } from "../../_lib/resend.js";

function hasValue(input) {
  return String(input ?? "").trim().length > 0;
}

function hasKvBinding(binding) {
  return Boolean(
    binding &&
      typeof binding.get === "function" &&
      typeof binding.put === "function" &&
      typeof binding.list === "function"
  );
}

function statusFrom(ok, priority = "required") {
  if (ok) return "ok";
  if (priority === "optional") return "optional";
  if (priority === "recommended") return "warn";
  return "missing";
}

function item(id, label, status, priority, detail, action = "") {
  return {
    id,
    label,
    status,
    priority,
    detail,
    action,
    ok: status === "ok",
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isDashboardAuthorized(request, env)) {
    return json({ ok: false, error: "נדרשת גישת Access לדשבורד." }, 401);
  }

  const resend = resolveResendConfig(env);
  const hasClubProxy = hasValue(env.NM_CLUB_AUTH_BASE_URL) && hasValue(env.NM_CLUB_ADMIN_SERVICE_KEY);
  const hasPremiumSession = hasValue(env.PREMIUM_SESSION_SECRET);
  const hasCloudflareAnalytics = hasValue(env.CF_API_TOKEN) && hasValue(env.CF_ZONE_ID);
  const hasSearchGaps = hasKvBinding(env.SEARCH_GAPS);
  const hasPageSpeedKey = hasValue(env.PSI_API_KEY) || hasValue(env.GOOGLE_PAGESPEED_API_KEY);
  const hasHcaptcha = hasValue(env.PUBLIC_HCAPTCHA_SITE_KEY);

  const checks = [
    item(
      "club_proxy",
      "חיבור Worker",
      statusFrom(hasClubProxy, "required"),
      "required",
      hasClubProxy
        ? "כתובת המועדון ומפתח השירות קיימים"
        : "חסרים NM_CLUB_AUTH_BASE_URL או NM_CLUB_ADMIN_SERVICE_KEY",
      hasClubProxy ? "" : "להשאיר רק proxy אחד פעיל: URL אחד ומפתח שירות אחד."
    ),
    item(
      "premium_session",
      "סשן פרימיום",
      statusFrom(hasPremiumSession, "required"),
      "required",
      hasPremiumSession ? "PREMIUM_SESSION_SECRET מוגדר" : "חסר PREMIUM_SESSION_SECRET",
      hasPremiumSession ? "" : "להגדיר secret יציב כדי שגישה לתוכן סגור לא תאבד בין בקשות."
    ),
    item(
      "forms",
      "טפסי מייל",
      statusFrom(resend.enabled, "recommended"),
      "recommended",
      resend.enabled
        ? `Resend מוגדר ונשלח ל-${resend.to || resend.from}`
        : !resend.apiKey
          ? "חסר RESEND_API_KEY"
          : !resend.from
            ? "חסר RESEND_FROM_EMAIL"
            : "חסר יעד מייל לשליחה",
      resend.enabled
        ? "אם RESEND_TO_EMAIL לא מוגדר, המערכת משתמשת אוטומטית ב-RESEND_FROM_EMAIL כיעד."
        : "אם לא משתמשים בטפסי מייל כרגע, אפשר להשאיר כבוי בלי לפגוע בדשבורד."
    ),
    item(
      "hcaptcha",
      "אימות טפסים",
      statusFrom(hasHcaptcha, "optional"),
      "optional",
      hasHcaptcha ? "מפתח hCaptcha ציבורי מוגדר" : "PUBLIC_HCAPTCHA_SITE_KEY לא מוגדר",
      hasHcaptcha ? "" : "להפעיל רק אם יש ספאם בטפסים. אחרת זו שכבה מיותרת."
    ),
    item(
      "cloudflare_analytics",
      "מונה חי של Cloudflare",
      statusFrom(hasCloudflareAnalytics, "recommended"),
      "recommended",
      hasCloudflareAnalytics
        ? "CF_API_TOKEN ו-CF_ZONE_ID מוגדרים. נשאר רק לאמת של-token יש Zone Analytics Read"
        : "חסרים CF_API_TOKEN או CF_ZONE_ID",
      hasCloudflareAnalytics
        ? "אם כרטיס הזמן-אמת ריק, הסיבה הסבירה היא scope לא נכון בטוקן ולא משתנה סביבה חסר."
        : "להגדיר token עם Zone Analytics Read בלבד. זה מספיק, ולא צריך הרשאות רחבות."
    ),
    item(
      "search_gaps",
      "Search Gaps KV",
      statusFrom(hasSearchGaps, "recommended"),
      "recommended",
      hasSearchGaps
        ? "SEARCH_GAPS קשור ל-Pages ושומר פערי חיפוש בין פריסות"
        : "SEARCH_GAPS לא קשור, ולכן פערי חיפוש יישמרו רק בזיכרון זמני",
      hasSearchGaps ? "" : "כדאי לקשור KV אחד בשם SEARCH_GAPS. זה זול ושומר היסטוריית חיפוש שימושית."
    ),
    item(
      "pagespeed_api",
      "PageSpeed לפי דרישה",
      statusFrom(hasPageSpeedKey, "optional"),
      "optional",
      hasPageSpeedKey ? "יש מפתח ל-PageSpeed API והבדיקה תרוץ רק בלחיצה" : "אין PSI_API_KEY או GOOGLE_PAGESPEED_API_KEY",
      hasPageSpeedKey ? "" : "לא חובה. אם חשוב לך ציון מובייל מתוך הדשבורד, להגדיר מפתח אחד. אחרת עדיף להשאיר כבוי."
    ),
  ];

  const workerHealth = await fetchClubWorkerJson(env, "/health", { method: "GET" });
  checks.unshift(
    item(
      "worker_health",
      "בריאות שרת המועדון",
      statusFrom(workerHealth.ok === true, "required"),
      "required",
      workerHealth.ok === true ? "ה-worker עונה כרגיל" : workerHealth.error || "ה-worker לא זמין כרגע",
      workerHealth.ok === true ? "" : "לבדוק קודם שה-worker חי לפני שמחפשים תקלות בדשבורד."
    )
  );

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    checks,
  });
}
