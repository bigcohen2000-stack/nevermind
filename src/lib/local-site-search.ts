import { glossaryConcepts } from "../data/glossary";

export type SiteSearchHit = {
  url: string;
  title: string;
  excerpt: string;
};

const STATIC_HITS: SiteSearchHit[] = [
  {
    url: "/articles/",
    title: "ארכיון מאמרים",
    excerpt: "כל המאמרים הזמינים באתר.",
  },
  {
    url: "/library/",
    title: "ספרייה מובנית",
    excerpt: "מבנה וקריאה מסודרת בתוך האתר.",
  },
  {
    url: "/glossary/",
    title: "הגדרות מחדש",
    excerpt: "מושגי יסוד והסכמה על משמעות מילים.",
  },
  {
    url: "/questions/",
    title: "שאלות קצרות",
    excerpt: "מיקרו־תשובות ונקודות חדות.",
  },
  {
    url: "/services/",
    title: "שירותים ומחירון",
    excerpt: "מסלולים ומה כלול.",
  },
  {
    url: "/intake/",
    title: "צור קשר (אונליין)",
    excerpt: "כתיבה או סימון לפני שיחה.",
  },
  {
    url: "/about/#nm-about-faq",
    title: "שאלות ותשובות על שיטת NeverMind",
    excerpt: "מה זו השיטה, איך שונה, זמן, אגו, זוגיות, מסלול ופרטיות.",
  },
];

function normalizeQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** התאמה לעברית: תת־מחרוזת בלי תלות ברישיות (בעברית בדרך כלל זהה) */
function haystackIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return haystack.includes(needle);
}

/**
 * תוצאות מקומיות כש־Pagefind ריק או לא זמין.
 * מכסה גלוסר + עמודי ליבה לפי כותרת/מילות מפתח.
 */
export function localSiteSearch(query: string, limit = 10): SiteSearchHit[] {
  const q = normalizeQuery(query);
  if (!q) return [];

  const lower = q.toLowerCase();
  const out: SiteSearchHit[] = [];
  const seen = new Set<string>();

  const push = (item: SiteSearchHit) => {
    const key = item.url.split("?")[0];
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };

  for (const c of glossaryConcepts) {
    const title = c.title.trim();
    const summary = c.summary.trim();
    const blob = `${title} ${summary} ${c.keywords.join(" ")} ${c.slug}`.toLowerCase();
    const hit =
      haystackIncludes(title, q) ||
      haystackIncludes(q, title) ||
      c.keywords.some((k) => haystackIncludes(k, q) || haystackIncludes(q, k)) ||
      haystackIncludes(blob, lower) ||
      haystackIncludes(c.slug.toLowerCase(), lower);

    if (hit) {
      push({
        url: `/glossary/${c.slug}/`,
        title: `מושג: ${c.title}`,
        excerpt: summary,
      });
    }
  }

  for (const s of STATIC_HITS) {
    const t = `${s.title} ${s.excerpt}`.toLowerCase();
    if (haystackIncludes(t, lower) || haystackIncludes(s.title, q)) {
      push({ ...s });
    }
  }

  return out.slice(0, limit);
}

export function mergeSearchResults<T extends SiteSearchHit>(
  primary: T[],
  fallback: T[],
  limit: number
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];

  const add = (item: T) => {
    const key = item.url.split("?")[0].replace(/\/+$/, "") || item.url;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
    return merged.length >= limit;
  };

  for (const p of primary) {
    if (add(p)) return merged;
  }
  for (const f of fallback) {
    if (add(f)) return merged;
  }
  return merged;
}
