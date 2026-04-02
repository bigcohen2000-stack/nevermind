import { fetchClubAdminOverview, isDashboardAuthorized, json } from "../../_lib/club-admin.js";

function severityFromCounts(memberIpCount, passwordIpCount) {
  const peak = Math.max(Number(memberIpCount) || 0, Number(passwordIpCount) || 0);
  if (peak >= 3) return "high";
  if (peak >= 2) return "medium";
  return "low";
}

function noteForFlag(item) {
  const memberCount = Number(item?.memberIpCount) || 0;
  const passwordCount = Number(item?.passwordIpCount) || 0;
  if (passwordCount >= 3) {
    return "אותה סיסמה הופיעה מכמה כתובות רשת בחלון קצר";
  }
  if (memberCount >= 2) {
    return "אותו חבר הופיע מכמה כתובות רשת קרובות בזמן";
  }
  return "נרשם דפוס שדורש בדיקה ידנית";
}

function attemptsForFlag(item) {
  return Math.max(Number(item?.memberIpCount) || 1, Number(item?.passwordIpCount) || 1);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!isDashboardAuthorized(request, env)) {
    return json({ ok: false, error: "נדרש אימות Cloudflare Access" }, 401);
  }

  const overview = await fetchClubAdminOverview(env);
  if (!overview.ok || overview.payload?.ok !== true) {
    return json({ ok: false, error: overview.error || "לא הצלחנו למשוך אירועי אבטחה" }, overview.status || 502);
  }

  const fraudFlags = Array.isArray(overview.payload?.fraudFlags) ? overview.payload.fraudFlags : [];
  const alarms = fraudFlags.slice(0, 5).map((item) => ({
    phone: String(item?.phone || "ללא זיהוי"),
    attempts: attemptsForFlag(item),
    severity: severityFromCounts(item?.memberIpCount, item?.passwordIpCount),
  }));

  const events = fraudFlags.length
    ? fraudFlags.slice(0, 8).map((item, index) => {
        const attempts = attemptsForFlag(item);
        const severity = severityFromCounts(item?.memberIpCount, item?.passwordIpCount);
        return {
          id: `${item?.phone || "flag"}-${item?.flaggedAt || index}`,
          phone: String(item?.phone || "ללא זיהוי"),
          createdAt: String(item?.flaggedAt || new Date().toISOString()),
          label: attempts >= 3 ? "דפוס גישה חריג" : "בדיקת גישה חוזרת",
          note: noteForFlag(item),
          attempts,
          severity,
          isAlarm: severity === "high",
        };
      })
    : [
        {
          id: "quiet-window",
          phone: "המערכת",
          createdAt: new Date().toISOString(),
          label: "אין Flag פתוח כרגע",
          note: "לא זוהו דפוסים חריגים בנתוני המועדון הפעילים",
          attempts: 0,
          severity: "low",
          isAlarm: false,
        },
      ];

  return json({
    ok: true,
    source: "worker:club_activity",
    generatedAt: new Date().toISOString(),
    alarms,
    events,
  });
}
