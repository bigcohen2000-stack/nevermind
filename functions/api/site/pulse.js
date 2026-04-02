import { fetchCloudflareGraphQL, isoMinutesAgo } from "../../_lib/cloudflare-analytics.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

const SITE_PULSE_QUERY = `query SitePulse($zoneTag: string, $start: Time, $end: Time) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1mGroups(limit: 3, filter: { datetime_geq: $start, datetime_lt: $end }) {
        uniq {
          uniques
        }
        sum {
          requests
        }
      }
    }
  }
}`;

function pulseMood(activeNow) {
  if (activeNow <= 1) return "אתה כאן עכשיו";
  if (activeNow <= 6) return "יש כאן תנועה שקטה";
  if (activeNow <= 24) return "יש כאן נוכחות חיה";
  return "יש כאן זרימה ערה";
}

export async function onRequestGet(context) {
  const { env } = context;
  const result = await fetchCloudflareGraphQL(env, SITE_PULSE_QUERY, {
    start: isoMinutesAgo(3),
    end: new Date().toISOString(),
  });

  if (!result.ok) {
    return json({ ok: false, error: result.error || "נתוני תנועה לא זמינים כרגע" }, result.status || 503);
  }

  const groups = result.data?.viewer?.zones?.[0]?.httpRequests1mGroups;
  const rows = Array.isArray(groups) ? groups : [];
  const activeNow = rows.reduce((max, row) => Math.max(max, Number(row?.uniq?.uniques) || 0), 0);
  const recentRequests = rows.reduce((sum, row) => sum + (Number(row?.sum?.requests) || 0), 0);

  return json({
    ok: true,
    source: "cloudflare:httpRequests1mGroups",
    generatedAt: new Date().toISOString(),
    activeNow,
    recentRequests,
    mood: pulseMood(activeNow),
    windowMinutes: 3,
  });
}
