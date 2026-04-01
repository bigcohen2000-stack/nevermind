function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function isAuthorized(request, env) {
  const url = new URL(request.url);
  const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const skipAuth = env.CLUB_ADMIN_PROXY_SKIP_AUTH === "1";
  return isLocal || skipAuth || Boolean(request.headers.get("Cf-Access-Jwt-Assertion"));
}

function makeIp(seed, index) {
  return `185.12.${40 + ((seed + index * 7) % 120)}.${18 + index}`;
}

function severityFromAttempts(attempts) {
  if (attempts >= 3) return "high";
  if (attempts === 2) return "medium";
  return "low";
}

const LABELS = [
  "IP חדש",
  "סיסמה זהה",
  "ניסיון כניסה חריג",
  "גישה מנתיב לא צפוי",
  "קצב ניסיונות גבוה",
];

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: "נדרש אימות Cloudflare Access" }, 401);
  }

  const bucket = Math.floor(Date.now() / 12000);
  const ips = [makeIp(bucket, 0), makeIp(bucket, 0), makeIp(bucket, 0), makeIp(bucket, 1), makeIp(bucket, 2), makeIp(bucket, 2)];
  const attemptsByIp = new Map();

  for (const ip of ips) {
    attemptsByIp.set(ip, (attemptsByIp.get(ip) || 0) + 1);
  }

  const events = ips.map((ip, index) => {
    const attempts = attemptsByIp.get(ip) || 1;
    const severity = severityFromAttempts(attempts);
    const isAlarm = attempts >= 3;
    const label = LABELS[(bucket + index) % LABELS.length];
    return {
      id: `${ip}-${index}`,
      ip,
      createdAt: new Date(Date.now() - index * 70000).toISOString(),
      label,
      note: isAlarm
        ? "שלושה ניסיונות מאותו IP בתוך חלון קצר"
        : attempts === 2
          ? "שני ניסיונות קרובים שדורשים מעקב"
          : "אירוע נמוך שמסומן לתצפית",
      attempts,
      severity,
      isAlarm,
    };
  });

  const alarms = [...attemptsByIp.entries()]
    .filter(([, attempts]) => attempts >= 3)
    .map(([ip, attempts]) => ({ ip, attempts, severity: severityFromAttempts(attempts) }));

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    alarms,
    events,
  });
}
