import { fetchCloudflareGraphQL, isoMinutesAgo } from "../../_lib/cloudflare-analytics.js";

const EDGE_CACHE_SECONDS = 30;
const EDGE_STALE_SECONDS = 120;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, s-maxage=${EDGE_CACHE_SECONDS}, stale-while-revalidate=${EDGE_STALE_SECONDS}`,
      "cdn-cache-control": `public, max-age=${EDGE_CACHE_SECONDS}, stale-while-revalidate=${EDGE_STALE_SECONDS}`,
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

function degradedPayload(reason) {
  return {
    ok: true,
    available: false,
    source: "cloudflare:httpRequests1mGroups",
    generatedAt: new Date().toISOString(),
    activeNow: null,
    recentRequests: null,
    mood: "הספירה החיה ממתינה לחיבור",
    reason,
    windowMinutes: 3,
  };
}

async function maybeReadCached(request) {
  const cache = globalThis.caches?.default;
  if (!cache) return null;
  return cache.match(request);
}

function maybeStoreCached(context, request, response) {
  const cache = globalThis.caches?.default;
  if (!cache) return;
  context.waitUntil(cache.put(request, response.clone()));
}

export async function onRequestGet(context) {
  const { env, request } = context;

  const cached = await maybeReadCached(request);
  if (cached) {
    return cached;
  }

  const result = await fetchCloudflareGraphQL(env, SITE_PULSE_QUERY, {
    start: isoMinutesAgo(3),
    end: new Date().toISOString(),
  });

  if (!result.ok) {
    const response = json(degradedPayload(result.error || "נתוני תנועה לא זמינים כרגע"), 200);
    maybeStoreCached(context, request, response);
    return response;
  }

  const groups = result.data?.viewer?.zones?.[0]?.httpRequests1mGroups;
  const rows = Array.isArray(groups) ? groups : [];
  const activeNow = rows.reduce((max, row) => Math.max(max, Number(row?.uniq?.uniques) || 0), 0);
  const recentRequests = rows.reduce((sum, row) => sum + (Number(row?.sum?.requests) || 0), 0);

  const response = json({
    ok: true,
    available: true,
    source: "cloudflare:httpRequests1mGroups",
    generatedAt: new Date().toISOString(),
    activeNow,
    recentRequests,
    mood: pulseMood(activeNow),
    reason: "",
    windowMinutes: 3,
  });
  maybeStoreCached(context, request, response);
  return response;
}
