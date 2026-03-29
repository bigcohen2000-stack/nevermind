import { createHash } from "node:crypto";

const GA4_URL = "https://www.google-analytics.com/mp/collect";

export type PremiumUnlockAnalyticsInput = {
  articleSlug: string;
  /** ערך עוגיית הסשן לפרימיום — ליצירת client_id יציב ללא gtag */
  premiumSessionCookie: string | undefined;
  /** מזהה מ־_ga בדפדפן (אופציונלי) */
  gaClientIdParam: string | null | undefined;
  /** יחס גלילה 0–1 בזמן הבקשה (קורלציה ל־30% הראשונים) */
  scrollRatio: number | null | undefined;
  referer: string | null | undefined;
};

function sanitizeGaClientId(raw: string): string | null {
  const t = raw.trim().slice(0, 120);
  if (t.length < 4) return null;
  if (!/^[0-9A-Za-z._-]+$/.test(t)) return null;
  return t;
}

function stableClientIdFromPremiumCookie(cookie: string): string {
  const h = createHash("sha256").update(cookie, "utf8").digest("hex");
  return `prem.${h.slice(0, 24)}`;
}

function resolveClientId(input: PremiumUnlockAnalyticsInput): string {
  const fromParam = input.gaClientIdParam ? sanitizeGaClientId(input.gaClientIdParam) : null;
  if (fromParam) return fromParam;
  if (input.premiumSessionCookie && input.premiumSessionCookie.length > 8) {
    return stableClientIdFromPremiumCookie(input.premiumSessionCookie);
  }
  return `anon.${Date.now()}`;
}

function clampScrollRatio(v: number | null | undefined): number | undefined {
  if (v === null || v === undefined || Number.isNaN(v)) return undefined;
  const x = Math.min(1, Math.max(0, v));
  return Math.round(x * 1000) / 1000;
}

/**
 * דיווח שרתי על פתיחת תוכן פרימיום (אחרי אימות מלא).
 * GA4 MP: דורש GA4_MEASUREMENT_ID + GA4_API_SECRET.
 * Webhook: אופציונלי — ANALYTICS_PREMIUM_WEBHOOK_URL.
 */
export async function reportPremiumArticleUnlocked(input: PremiumUnlockAnalyticsInput): Promise<void> {
  const clientId = resolveClientId(input);
  const scroll = clampScrollRatio(input.scrollRatio);
  const ref = (input.referer ?? "").trim().slice(0, 512);
  const slug = input.articleSlug.trim().slice(0, 200);

  const mid = typeof import.meta.env.GA4_MEASUREMENT_ID === "string" ? import.meta.env.GA4_MEASUREMENT_ID.trim() : "";
  const secret = typeof import.meta.env.GA4_API_SECRET === "string" ? import.meta.env.GA4_API_SECRET.trim() : "";

  const eventParams: Record<string, string | number> = {
    engagement_time_msec: 1,
    article_slug: slug,
  };
  if (scroll !== undefined) {
    eventParams.unlock_scroll_ratio = scroll;
  }
  if (ref.length > 0) {
    eventParams.page_referrer = ref;
  }

  const tasks: Promise<unknown>[] = [];

  if (mid.length > 0 && secret.length > 0) {
    const url = `${GA4_URL}?measurement_id=${encodeURIComponent(mid)}&api_secret=${encodeURIComponent(secret)}`;
    const body = JSON.stringify({
      client_id: clientId,
      events: [{ name: "premium_article_open", params: eventParams }],
    });
    tasks.push(
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(2800),
      }).catch(() => {})
    );
  }

  const hook =
    typeof import.meta.env.ANALYTICS_PREMIUM_WEBHOOK_URL === "string"
      ? import.meta.env.ANALYTICS_PREMIUM_WEBHOOK_URL.trim()
      : "";
  if (hook.length > 0) {
    tasks.push(
      fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "premium_article_open",
          article_slug: slug,
          unlock_scroll_ratio: scroll ?? null,
          page_referrer: ref || null,
          client_id_hint: clientId.slice(0, 80),
          ts: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(2800),
      }).catch(() => {})
    );
  }

  if (tasks.length === 0) return;
  await Promise.all(tasks);
}
