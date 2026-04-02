import { fetchClubAdminOverview, isDashboardAuthorized, json } from "../../_lib/club-admin.js";

function formatDevice(userAgent) {
  const value = String(userAgent || "").toLowerCase();
  if (!value) return "דפדפן לא מזוהה";

  const platform = value.includes("iphone") || value.includes("ios")
    ? "iPhone"
    : value.includes("android")
      ? "Android"
      : value.includes("mac os") || value.includes("macintosh")
        ? "Mac"
        : value.includes("windows")
          ? "Windows"
          : value.includes("linux")
            ? "Linux"
            : "מכשיר";

  const browser = value.includes("edg/")
    ? "Edge"
    : value.includes("chrome/") && !value.includes("edg/")
      ? "Chrome"
      : value.includes("safari/") && !value.includes("chrome/")
        ? "Safari"
        : value.includes("firefox/")
          ? "Firefox"
          : "דפדפן";

  return `${platform} · ${browser}`;
}

function buildStatus(pathname) {
  const path = String(pathname || "").trim();
  if (path.startsWith("/admin")) return "כניסת מנהל";
  if (path.startsWith("/me")) return "אזור אישי";
  if (path.startsWith("/articles/")) return "קריאת תוכן";
  if (path.startsWith("/dashboard")) return "בקרה פנימית";
  return "גישה פעילה";
}

function minutesAgo(value) {
  const time = Date.parse(String(value || ""));
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((Date.now() - time) / 60000));
}

function isRecent(seenAt, minutesWindow) {
  const time = Date.parse(String(seenAt || ""));
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= minutesWindow * 60 * 1000;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!isDashboardAuthorized(request, env)) {
    return json({ ok: false, error: "נדרש אימות Cloudflare Access" }, 401);
  }

  const overview = await fetchClubAdminOverview(env);
  if (!overview.ok || overview.payload?.ok !== true) {
    return json({ ok: false, error: overview.error || "לא הצלחנו למשוך נתוני מועדון" }, overview.status || 502);
  }

  const recentLogins = Array.isArray(overview.payload?.recentLogins) ? overview.payload.recentLogins : [];
  const items = recentLogins.slice(0, 8).map((entry, index) => {
    const seenAt = String(entry?.seenAt || "");
    return {
      id: `${entry?.phone || "guest"}-${seenAt || index}`,
      phone: String(entry?.phone || "ללא טלפון"),
      ipFingerprint: String(entry?.ipFingerprint || "לא זמין"),
      path: String(entry?.path || "/"),
      device: formatDevice(entry?.userAgent),
      authStatus: buildStatus(entry?.path),
      seenAt,
      minutesAgo: minutesAgo(seenAt),
    };
  });

  const uniqueActive = new Set(
    recentLogins
      .filter((entry) => isRecent(entry?.seenAt, 20))
      .map((entry) => String(entry?.phone || entry?.ipFingerprint || ""))
      .filter(Boolean)
  );

  return json({
    ok: true,
    source: "worker:club_activity",
    generatedAt: new Date().toISOString(),
    totalActive: uniqueActive.size,
    totalRecent: recentLogins.length,
    items,
  });
}
