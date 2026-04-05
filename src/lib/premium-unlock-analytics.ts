export type PremiumUnlockAnalyticsInput = {
  articleSlug: string;
  premiumSessionCookie: string | undefined;
  gaClientIdParam: string | null | undefined;
  scrollRatio: number | null | undefined;
  referer: string | null | undefined;
};

function clampScrollRatio(v: number | null | undefined): number | undefined {
  if (v === null || v === undefined || Number.isNaN(v)) return undefined;
  const x = Math.min(1, Math.max(0, v));
  return Math.round(x * 1000) / 1000;
}

export async function reportPremiumArticleUnlocked(input: PremiumUnlockAnalyticsInput): Promise<void> {
  const hook =
    typeof import.meta.env.ANALYTICS_PREMIUM_WEBHOOK_URL === "string"
      ? import.meta.env.ANALYTICS_PREMIUM_WEBHOOK_URL.trim()
      : "";
  if (hook.length === 0) return;

  const scroll = clampScrollRatio(input.scrollRatio);
  const ref = (input.referer ?? "").trim().slice(0, 512);
  const slug = input.articleSlug.trim().slice(0, 200);
  const sessionHint =
    typeof input.premiumSessionCookie === "string" && input.premiumSessionCookie.trim().length > 0
      ? input.premiumSessionCookie.trim().slice(0, 80)
      : null;

  await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "premium_article_open",
      article_slug: slug,
      unlock_scroll_ratio: scroll ?? null,
      page_referrer: ref || null,
      session_hint: sessionHint,
      ts: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(2800),
  }).catch(() => {});
}
