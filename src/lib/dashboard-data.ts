import type { CollectionEntry } from "astro:content";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardTone = "critical" | "watch" | "ok";

export type DashboardContentHealthItem = {
  slug: string;
  title: string;
  href: string;
  updatedLabel: string;
  daysSinceUpdate: number;
  bounceRate: number;
  tone: DashboardTone;
  status: string;
  reason: string;
};

export type DashboardSearchItem = {
  id: string;
  group: string;
  label: string;
  description: string;
  href: string;
  keywords: string[];
  meta?: string;
  tone?: DashboardTone;
};

export type DashboardOverviewSummary = {
  totalArticles: number;
  criticalArticles: number;
  watchArticles: number;
  healthyArticles: number;
};

function hashNumber(input: string): number {
  let hash = 0;
  for (const char of input) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stablePercent(input: string, min: number, max: number): number {
  const range = max - min;
  return min + (hashNumber(input) % (range + 1));
}

function formatHebrewDate(value: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function computeTone(daysSinceUpdate: number, bounceRate: number): DashboardTone {
  if (bounceRate > 70 || daysSinceUpdate > 90) return "critical";
  if (bounceRate > 60 || daysSinceUpdate > 45) return "watch";
  return "ok";
}

function toneLabel(tone: DashboardTone): string {
  if (tone === "critical") return "דורש טיפול";
  if (tone === "watch") return "במעקב";
  return "תקין";
}

function reasonLabel(daysSinceUpdate: number, bounceRate: number): string {
  if (bounceRate > 70 && daysSinceUpdate > 90) {
    return "נטישה גבוהה ועדכון ישן";
  }
  if (bounceRate > 70) {
    return "נטישה גבוהה";
  }
  if (daysSinceUpdate > 90) {
    return "עבר זמן רב מהעדכון האחרון";
  }
  if (bounceRate > 60 || daysSinceUpdate > 45) {
    return "כדאי לרענן בשבועות הקרובים";
  }
  return "התוכן מחזיק יפה כרגע";
}

export function buildDashboardContentHealth(
  articles: CollectionEntry<"articles">[],
): DashboardContentHealthItem[] {
  return articles
    .filter((entry) => entry.data.draft !== true)
    .map((entry) => {
      const updatedAt = entry.data.updatedDate ?? entry.data.pubDate;
      const updatedDate = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
      const daysSinceUpdate = clamp(
        Math.floor((Date.now() - updatedDate.getTime()) / DAY_MS),
        0,
        999,
      );
      const freshnessBias = daysSinceUpdate > 90 ? 8 : daysSinceUpdate > 45 ? 4 : -3;
      const bounceRate = clamp(
        stablePercent(entry.slug || entry.id, 38, 82) + freshnessBias,
        24,
        95,
      );
      const tone = computeTone(daysSinceUpdate, bounceRate);

      return {
        slug: entry.slug || entry.id.replace(/\.mdx$/i, ""),
        title: entry.data.title,
        href: `/articles/${entry.slug || entry.id.replace(/\.mdx$/i, "")}/`,
        updatedLabel: formatHebrewDate(updatedDate),
        daysSinceUpdate,
        bounceRate,
        tone,
        status: toneLabel(tone),
        reason: reasonLabel(daysSinceUpdate, bounceRate),
      };
    })
    .sort((left, right) => {
      const toneRank = { critical: 0, watch: 1, ok: 2 } as const;
      const toneDelta = toneRank[left.tone] - toneRank[right.tone];
      if (toneDelta !== 0) return toneDelta;
      return right.daysSinceUpdate - left.daysSinceUpdate;
    });
}

export function buildDashboardOverviewSummary(
  items: DashboardContentHealthItem[],
): DashboardOverviewSummary {
  const criticalArticles = items.filter((item) => item.tone === "critical").length;
  const watchArticles = items.filter((item) => item.tone === "watch").length;
  const healthyArticles = items.filter((item) => item.tone === "ok").length;

  return {
    totalArticles: items.length,
    criticalArticles,
    watchArticles,
    healthyArticles,
  };
}

export function buildDashboardSearchIndex(
  items: DashboardContentHealthItem[],
): DashboardSearchItem[] {
  const articleEntries = items.map((item) => ({
    id: `article:${item.slug}`,
    group: "מאמרים",
    label: item.title,
    description: item.reason,
    href: item.href,
    keywords: [
      item.slug,
      String(item.bounceRate),
      String(item.daysSinceUpdate),
      item.status,
      item.reason,
    ],
    meta: `${item.status} · ${item.bounceRate}% נטישה · ${item.daysSinceUpdate} ימים`,
    tone: item.tone,
  }));

  const adminEntries: DashboardSearchItem[] = [
    {
      id: "access:members",
      group: "ניהול גישה",
      label: "ניהול חברים",
      description: "טבלת גישה, איפוס סיסמה, הוספת חבר ובקרת כניסות",
      href: "#access",
      keywords: ["club admin", "members", "reset", "password", "access"],
      meta: "פאנל תפעולי",
      tone: "watch",
    },
    {
      id: "flags:feed",
      group: "מדדים ובקרה",
      label: "פיד אבטחה חי",
      description: "מעקב IP, ניסיונות חריגים, flags פתוחים ואזעקות",
      href: "#security-feed",
      keywords: ["fraud", "flags", "ip", "security", "alarm"],
      meta: "מתעדכן כל 12 שניות",
      tone: "critical",
    },
    {
      id: "settings:cloudflare-access",
      group: "הגדרות מערכת",
      label: "Cloudflare Access",
      description: "הקשחת כניסה ל־dashboard ול־api/admin עבור המייל שלך בלבד",
      href: "#settings",
      keywords: ["cloudflare", "access", "dashboard", "ssl", "strict"],
      meta: "חובה לפרודקשן",
      tone: "watch",
    },
    {
      id: "automation:image-pipeline",
      group: "תוכן ומאמרים",
      label: "אוטומציית תמונות",
      description: "המרת תמונה ל־webp, ניקוי שם קובץ והעברה ל־assets/images",
      href: "#image-automation",
      keywords: ["image", "webp", "upload", "filename", "assets"],
      meta: "workflow מקומי",
      tone: "ok",
    },
  ];

  return [...adminEntries, ...articleEntries];
}
