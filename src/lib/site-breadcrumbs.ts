/**
 * פירורי לחם אחידים: אותם שמות סגמנט בכל האתר + JSON-LD תואם.
 */

export const BREADCRUMB_HOME_LABEL = "בית";

export type SiteBreadcrumbCrumb = {
  label: string;
  /** null = עמוד נוכחי */
  href: string | null;
};

/** מקסימום פריטים בפירור (לרוב: בית + עד 3 רמות). */
const MAX_BREADCRUMB_ITEMS = 4;

/** מקטין שרשרת ארוכה: אם יותר מ־MAX, נשארים בית + שלושת הסיומות האחרונות. */
export function capBreadcrumbTrail(crumbs: SiteBreadcrumbCrumb[]): SiteBreadcrumbCrumb[] {
  if (crumbs.length <= MAX_BREADCRUMB_ITEMS) return crumbs;
  const home = crumbs[0];
  if (home?.label === BREADCRUMB_HOME_LABEL && home.href === "/") {
    return [home, ...crumbs.slice(-(MAX_BREADCRUMB_ITEMS - 1))];
  }
  return crumbs.slice(-MAX_BREADCRUMB_ITEMS);
}

/** תווית לסגמנט URL בודד (לא לכותרת מאמר/מושג) */
const SEGMENT_LABELS: Record<string, string> = {
  blog: "מרכז הקריאה",
  articles: "מאמרים",
  topics: "נושאים",
  now: "מה המצב עכשיו",
  training: "הכשרות",
  services: "שירותים",
  glossary: "הגדרות מחדש",
  questions: "שאלות קצרות",
  intake: "צור קשר (אונליין)",
  archive: "ארכיון",
  studio: "סטודיו",
  about: "אודות NeverMind",
  "personal-consultation": "שיחה אישית",
  "premium-access": "גישת פרימיום",
  premium: "פרימיום",
  journey: "מסלולי בהירות",
  "root-problem-tree": "עץ שורש הבעיה",
  "forbidden-library": "הספרייה האסורה",
  accessibility: "נגישות",
  book: "קביעת שיחה",
  contact: "יצירת קשר",
  privacy: "מדיניות פרטיות",
  faq: "שאלות נפוצות",
  testimonials: "המלצות",
  terms: "תנאי התקשרות",
  library: "ספרייה מובנית",
  search: "חיפוש",
  me: "אזור אישי",
  unlock: "לוח בקרה",
  dashboard: "לוח ניהול",
  learning: "לוח למידה",
  settings: "הגדרות",
  simulators: "סימולטורים",
  therapists: "מטפלים ומאמנים",
  thank: "תודה",
  "thank-you": "אחרי שליחה",
  definitions: "הגדרות קצרות",
  admin: "ניהול",
  generator: "מחולל מאמרים",
  paradoxes: "פרדוקסים",
  decap: "ממשק תוכן",
};

function labelForSegment(seg: string): string {
  const mapped = SEGMENT_LABELS[seg];
  if (mapped) return mapped;
  return seg.replace(/-/g, " ");
}

/**
 * בונה שרשרת פירורי לחם מנתיב הדף.
 * @param currentPageTitle כותרת אנושית לסגמנט האחרון (מאמר, מושג, מסלול וכו׳)
 */
export function buildSiteBreadcrumbTrail(
  pathname: string,
  options?: { currentPageTitle?: string | null }
): SiteBreadcrumbCrumb[] {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/" || normalized === "") return [];

  const segments = normalized.split("/").filter(Boolean);
  const titleOpt = options?.currentPageTitle?.trim() || "";

  if (segments[0] === "journey" && segments[1] === "mental-health" && segments.length === 2) {
    return [
      { label: BREADCRUMB_HOME_LABEL, href: "/" },
      { label: "מרכז הקריאה", href: "/blog/" },
      { label: titleOpt || "עומק בתוך הנפש", href: null },
    ];
  }
  /* אין אינדקס ביניים: בית → כותרת */
  if (segments[0] === "journey" && segments.length === 2) {
    return [
      { label: BREADCRUMB_HOME_LABEL, href: "/" },
      { label: titleOpt || labelForSegment(segments[1]!), href: null },
    ];
  }
  if (segments[0] === "topics" && segments.length === 2) {
    return [
      { label: BREADCRUMB_HOME_LABEL, href: "/" },
      { label: titleOpt || labelForSegment(segments[1]!), href: null },
    ];
  }
  if (segments[0] === "definitions" && segments.length === 2) {
    return [
      { label: BREADCRUMB_HOME_LABEL, href: "/" },
      { label: titleOpt || labelForSegment(segments[1]!), href: null },
    ];
  }

  const out: SiteBreadcrumbCrumb[] = [{ label: BREADCRUMB_HOME_LABEL, href: "/" }];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    acc += `/${seg}`;
    const pathWithSlash = acc.endsWith("/") ? acc : `${acc}/`;
    const isLast = i === segments.length - 1;
    const label = isLast && titleOpt ? titleOpt : labelForSegment(seg);
    out.push({ label, href: isLast ? null : pathWithSlash });
  }
  return capBreadcrumbTrail(out);
}

export function parseBreadcrumbOverride(
  items: unknown
): SiteBreadcrumbCrumb[] | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  const out: SiteBreadcrumbCrumb[] = [];
  for (let i = 0; i < items.length; i++) {
    const raw = items[i] as { label?: unknown; href?: unknown } | null;
    if (!raw || typeof raw !== "object" || typeof raw.label !== "string") continue;
    const label = raw.label.trim();
    if (!label) continue;
    const isLast = i === items.length - 1;
    if (isLast) {
      out.push({ label, href: null });
      continue;
    }
    const h = typeof raw.href === "string" ? raw.href.trim() : "";
    out.push({ label, href: h.length > 0 ? h : "/" });
  }
  return out.length > 0 ? capBreadcrumbTrail(out) : null;
}

export function breadcrumbTrailToJsonLd(
  crumbs: SiteBreadcrumbCrumb[],
  canonicalURL: string,
  siteUrlSlash: string
): { name: string; item: string }[] {
  return crumbs.map((c, index) => {
    const isLast = index === crumbs.length - 1;
    const item = isLast
      ? canonicalURL
      : c.href
        ? new URL(String(c.href).replace(/^\//, ""), siteUrlSlash).toString()
        : canonicalURL;
    return { name: c.label, item };
  });
}
