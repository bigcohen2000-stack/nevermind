/**
 * ייבוא נתיבים מ-GA4 (CSV) ומיזוג ל-migration-map.ts + עדכון public/_redirects.
 *
 * כללי מיפוי (מפרט GA4):
 * - /product/* → /products/* (אותו suffix)
 * - /course/* → /courses/*
 * - /courses/*, /articles/* → ללא שינוי
 * - מקטע יחיד /slug/ → /blog/slug/
 * - אחרת → /blog/ + הנתיב המלא (ללא כפילות /blog/)
 * - /shop/, /cart/ → /products/
 *
 * שימוש:
 *   node scripts/update-migration-from-analytics.mjs --dry-run
 *   node scripts/update-migration-from-analytics.mjs --write
 *   node scripts/update-migration-from-analytics.mjs --sync-redirects-only
 *
 * קובץ ברירת מחדל: data/דפים_ומסכים_נתיב_הדף_וסיווג_המסך.csv
 * ניתן לדרוס: NM_ANALYTICS_CSV=./path/to.csv
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const CSV_DEFAULT = path.join(ROOT, "data", "דפים_ומסכים_נתיב_הדף_וסיווג_המסך.csv");
const MIGRATION_MAP = path.join(ROOT, "src", "data", "migration-map.ts");
const REDIRECTS_FILE = path.join(ROOT, "public", "_redirects");
const REPORT_FILE = path.join(ROOT, "data", "migration-analytics-report.txt");

const PATH_COL = "נתיב הדף וסיווג המסך";
const VIEWS_COL = "צפיות";

const WRITE = process.argv.includes("--write");
const DRY = !WRITE;

/** יעדים שאינם תחת /blog/ → CORE_REDIRECTS */
const CORE_DEST_PREFIXES = [
  "/products/",
  "/courses/",
  "/articles/",
  "/services/",
  "/podcast/",
  "/intake/",
  "/contact/",
  "/archive/",
  "/about/",
  "/method/",
  "/personal-consultation/",
  "/therapists/",
  "/privacy/",
  "/terms/",
  "/glossary/",
  "/admin/",
  "/",
];

function extractQuotedPairs(block) {
  const pairs = [];
  const re = /"((?:\\.|[^"\\])*)":\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    pairs.push({ oldUrl: match[1], newUrl: match[2] });
  }
  return pairs;
}

function parseBlock(ts, name) {
  const reBlock = new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\} as const`, "s");
  const m = ts.match(reBlock);
  if (!m) throw new Error(`חסר בלוק ${name}`);
  return extractQuotedPairs(m[1]);
}

function pairsToMap(pairs) {
  const o = {};
  for (const { oldUrl, newUrl } of pairs) {
    o[oldUrl] = newUrl;
  }
  return o;
}

function ensureTrailingSlash(p) {
  if (!p || p === "/") return p;
  return p.endsWith("/") ? p : `${p}/`;
}

function normalizeIncomingPath(raw) {
  let p = String(raw ?? "").trim();
  if (!p || p.startsWith("#")) return "";
  try {
    p = decodeURIComponent(p.replace(/\+/g, "%20"));
  } catch {
    /* נשאר כמו שהוא */
  }
  if (!p.startsWith("/")) p = `/${p}`;
  return ensureTrailingSlash(p);
}

function shouldSkipPath(p) {
  const lower = p.toLowerCase();
  if (p === "" || p === "/") return false;
  if (lower.includes("wp-admin") || lower.includes("wp-login")) return true;
  if (lower.startsWith("/api") || lower.includes("/api/")) return true;
  if (p.includes("חיפוש")) return true;
  if (lower.includes("my-account")) return true;
  if (lower.includes("member-login")) return true;
  if (lower.includes("registration")) return true;
  if (/%[0-9a-f]{2}/i.test(p) && /%d7|%d6/i.test(lower) && p.length < 40) {
    return true;
  }
  return false;
}

/** מקטע יחיד ישן → דף ליבה (לא /blog/) */
const LEGACY_SINGLE_SLUG = {
  "שיטת-nevermind-שכל-שמרגיש-רגש-שחושב": "/method/",
  "מי-אני": "/about/",
  "חדש-באתר": "/",
  "ייעוץ-אישי": "/personal-consultation/",
  "יצירת-קשר": "/intake/",
  "love-attraction-relationship-success": "/archive/",
  "עמוד-התוכן-המרכזי-של-nevermind-צוהר-לחקירה-עצמ": "/articles/",
  "📄-זכויות-יוצרים-והפניות": "/terms/",
  "lama-bali": "/archive/",
  "קורסים": "/archive/",
  "אבטחת-מידע-ותשלומים": "/privacy/",
  "פוסטים-אחרונים-ותכני-האתר": "/articles/",
  "שיטות-טיפול": "/services/",
  "תנאי-שימוש-והחזרים": "/terms/",
  "תרמו-לאתר-נתינה-שמתחילה-במקום-עמוק-י": "/",
  "what-is-consciousness": "/glossary/self/",
};

/** כותרות WordPress ארוכות → slug קנוני תחת /blog/ */
const BLOG_PREFIX_TO_CANONICAL = [
  [/^\/האם-להתגרש-או-להישאר/i, "/blog/האם-להתגרש-או-להישאר/"],
  [/^\/מה-זה-אהבה-טהורה/i, "/blog/מה-זה-אהבה-טהורה/"],
  [/^\/מה-זה-נימוס-מה-זה-כבוד/i, "/blog/מה-זה-נימוס-מה-זה-כבוד/"],
  [/^\/איך-להבדיל-בין-עובדה-לפירוש/i, "/blog/איך-להבדיל-בין-עובדה-לפירוש/"],
  [/^\/איך-לזהות-מניפולציה-בשפה/i, "/blog/איך-לזהות-מניפולציה-בשפה/"],
  [/^\/האם-צריך-זוגיות/i, "/blog/האם-צריך-זוגיות-כדי-להיות-מאושרים/"],
  [/^\/האם-הזמן-והמקום/i, "/blog/האם-הזמן-והמקום-הם-רק-אשליה/"],
  [/^\/איך-לדעת-למה-מישהו-לא-אוהב/i, "/blog/איך-לדעת-למה-מישהו-לא-אוהב-אותך/"],
  [/^\/איך-להיות-שלם-באמת/i, "/blog/איך-להיות-שלם-באמת/"],
  [/^\/5-זיכרונות-ילדות/i, "/blog/5-זיכרונות-ילדות-שמנהלים-את-חייכם/"],
  [/^\/6-חלומות-ילדות/i, "/blog/6-חלומות-ילדות-שרודפים-אחריכם/"],
  [/^\/7-משפטים-שהרסו/i, "/blog/7-משפטים-שהרסו-לכם-את-החיים/"],
  [/^\/איך-לבחור-חברים/i, "/blog/איך-לבחור-חברים-בצורה-חכמה/"],
  [/^\/לקוחות-שמבטלים-פגישות/i, "/blog/איך-להתמודד-עם-לקוחות-שמבטלים-פגישות/"],
  [/^\/דייט-ראשון/i, "/blog/לתכנן-דייט-ראשון-מוצלח/"],
  [/^\/האם-דיאטת-קיטו/i, "/blog/האם-דיאטת-קיטו-באמת-עובדת/"],
  [/^\/רגעי-תובנה-60/i, "/blog/רגעי-תובנה-60-שניות-לתובנה-חדשה/"],
  [/^\/למה-אמון-עצמי/i, "/blog/למה-אמון-עצמי-הוא-המפתח/"],
  [/^\/חושב-שאתה-המשיח/i, "/blog/חושב-שאתה-המשיח/"],
  [/^\/להגיד-למישהו-שאתה-אוהב/i, "/blog/האם-להגיד-למישהו-שאתה-אוהב-אותו/"],
  [/^\/התמודדות-עם-דחיינות/i, "/blog/דחיינות-למה-אנחנו-מושכים-זמן/"],
];

/** מיפוי: מפרט GA4 + יעדי ליבה קיימים + קנוניזציית בלוג */
function mapPathSpec(oldPath) {
  const p = ensureTrailingSlash(oldPath);
  if (p === "/") return "/";

  if (p === "/shop/" || p === "/cart/") return "/products/";

  if (p.startsWith("/tag/")) return "/articles/";
  if (p.startsWith("/product-tag/")) return "/products/";
  if (p.startsWith("/lesson-tag/")) return "/archive/";

  if (p.startsWith("/product/")) {
    if (p.includes("לרכישת-הספר-אהבה-ב-20-עמודים")) return "/products/אהבה-ב-20-עמודים/";
    if (p.includes("התמכרויות-וגמילה-מהתמכרות-קורס-תודע")) return "/courses/קורס-התמכרויות/";
    const rest = p.slice("/product/".length);
    return ensureTrailingSlash(`/products/${rest}`);
  }

  if (p.startsWith("/course/")) {
    const rest = p.slice("/course/".length);
    return ensureTrailingSlash(`/courses/${rest}`);
  }

  if (p.startsWith("/courses/") || p.startsWith("/articles/")) {
    return p;
  }

  if (p.startsWith("/blog/")) {
    return p;
  }

  for (const [re, dest] of BLOG_PREFIX_TO_CANONICAL) {
    if (re.test(p)) return dest;
  }

  const segments = p.split("/").filter(Boolean);
  if (segments.length === 1) {
    const slug = segments[0];
    const core = LEGACY_SINGLE_SLUG[slug];
    if (core) return ensureTrailingSlash(core);
    return `/blog/${slug}/`;
  }

  const withoutLeading = p.replace(/^\/+/, "");
  return ensureTrailingSlash(`/blog/${withoutLeading}`);
}

function isCoreDestination(dest) {
  if (dest === "/") return true;
  return CORE_DEST_PREFIXES.some((pre) => pre !== "/" && dest.startsWith(pre));
}

/** רק בלוקי `// אנליטיקס … ייבוא אוטומטי` (מקף רגיל / en / em; לא `// אנליטיקס:` ידני) */
function stripAnalyticsInjectionInChunk(chunk) {
  let out = chunk;
  let prev;
  const marker =
    /\n\n  \/\/ אנליטיקס[\s\u2013\u2014-]+ייבוא אוטומטי[^\n]*\n[\s\S]*?(?=\n\s*\} as const;)/g;
  do {
    prev = out;
    out = out.replace(marker, "\n");
  } while (out !== prev);
  return out;
}

function formatPairLineWithViews(oldUrl, newUrl, views) {
  const tag = views >= 10 ? " // high priority" : "";
  return `  ${JSON.stringify(oldUrl)}: ${JSON.stringify(newUrl)}, // ${views} צפיות${tag}`;
}

function redirectFileToken(p) {
  let s = p.trim();
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s || "/";
}

function hasRedirectRule(redirectContent, oldPath) {
  const target = redirectFileToken(oldPath);
  for (const line of redirectContent.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const hash = t.indexOf("#");
    const rulePart = hash >= 0 ? t.slice(0, hash).trim() : t;
    const parts = rulePart.split(/\s+/).filter(Boolean);
    if (parts.length < 3) continue;
    const code = parts[parts.length - 1];
    if (code !== "301") continue;
    const from = parts[0];
    if (from === target) return true;
    if (from.endsWith("/*")) {
      const pref = from.slice(0, -2);
      if (!pref || pref === "/") continue;
      if (target === pref || target.startsWith(`${pref}/`)) return true;
    }
  }
  return false;
}

/** זוגות + צפיות מ־migration-map.ts (הערות // N צפיות) */
function parseBlockWithViewHints(ts, name) {
  const reBlock = new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\} as const`, "s");
  const m = ts.match(reBlock);
  if (!m) throw new Error(name);
  const out = [];
  for (const line of m[1].split("\n")) {
    const trimmed = line.trim();
    const pm = trimmed.match(/^\s*("(?:\\.|[^"\\])*")\s*:\s*("(?:\\.|[^"\\])*")\s*,/);
    if (!pm) continue;
    let oldUrl;
    let newUrl;
    try {
      oldUrl = JSON.parse(pm[1]);
      newUrl = JSON.parse(pm[2]);
    } catch {
      continue;
    }
    const vm = trimmed.match(/\/\/\s*(\d+)\s*צפיות/);
    out.push({
      oldUrl,
      newUrl,
      views: vm ? parseInt(vm[1], 10) : 0,
    });
  }
  return out;
}

function collectStaticRedirectFroms(redContent) {
  const exact = new Set();
  const wildPrefixes = [];
  const marker = "## אנליטיקס";
  const cut = redContent.indexOf(marker);
  const head = cut >= 0 ? redContent.slice(0, cut) : redContent;
  for (const line of head.split(/\r?\n/)) {
    let t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("##")) continue;
    const hash = t.indexOf("#");
    if (hash >= 0) t = t.slice(0, hash).trim();
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length < 3 || parts[parts.length - 1] !== "301") continue;
    const from = parts[0];
    exact.add(from);
    if (from.endsWith("/*")) {
      wildPrefixes.push(from.slice(0, -2));
    }
  }
  return { exact, wildPrefixes };
}

function isCoveredByStaticRules(fromT, { exact, wildPrefixes }) {
  if (exact.has(fromT)) return true;
  for (const pref of wildPrefixes) {
    const base = pref.endsWith("/") ? pref.replace(/\/+$/, "") : pref;
    if (fromT === base || fromT.startsWith(`${base}/`)) return true;
  }
  return false;
}

function buildAnalyticsRedirectLines(mapTs) {
  const core = parseBlockWithViewHints(mapTs, "CORE_REDIRECTS");
  const blog = parseBlockWithViewHints(mapTs, "BLOG_REDIRECTS");
  const merged = [...core, ...blog].filter((x) => x.oldUrl && x.newUrl && x.oldUrl !== x.newUrl);
  const byOld = new Map();
  for (const x of merged) {
    const prev = byOld.get(x.oldUrl);
    if (!prev || (x.views || 0) >= (prev.views || 0)) byOld.set(x.oldUrl, x);
  }
  const combined = [...byOld.values()].sort((a, b) => (b.views || 0) - (a.views || 0));

  const lines = ["## אנליטיקס (ייבוא אוטומטי)"];
  const staticRules = collectStaticRedirectFroms(fs.readFileSync(REDIRECTS_FILE, "utf8"));

  for (const { oldUrl, newUrl, views } of combined) {
    const fromT = redirectFileToken(oldUrl);
    const toT = redirectFileToken(newUrl);
    if (fromT === toT) continue;
    if (isCoveredByStaticRules(fromT, staticRules)) continue;

    const label =
      views >= 10
        ? `priority high (${views} views)`
        : views > 0
          ? `priority (${views} views)`
          : "priority";
    lines.push(`${fromT} ${toT} 301 # ${label}`);
  }
  lines.push("");
  return lines.join("\n");
}

function replaceAnalyticsRedirectsSection(redContent, newBlock) {
  const start = redContent.indexOf("## אנליטיקס");
  const tax = redContent.indexOf("# טקסונומיות WordPress");
  const fallback = redContent.indexOf("## 4. Final Fallback");
  const end = tax >= 0 ? tax : fallback >= 0 ? fallback : redContent.length;

  if (start < 0) {
    const insertAt = tax >= 0 ? tax : redContent.length;
    return `${redContent.slice(0, insertAt)}${newBlock}\n${redContent.slice(insertAt)}`;
  }
  return `${redContent.slice(0, start)}${newBlock}${redContent.slice(end)}`;
}

function writeReport({ totalWithTraffic, highTrafficCount, orphans, highList, orphanSample }) {
  const lines = [
    "דוח מיגרציה מ-GA4 (CSV)",
    `נוצר: ${new Date().toISOString()}`,
    "",
    `סה\"כ דפים עם צפיות > 0 (אחרי סינון נתיבים): ${totalWithTraffic}`,
    `דפים עם 10+ צפיות: ${highTrafficCount}`,
    `דפים יתומים (0 צפיות, נתיב לא מסונן): ${orphans.length}`,
    "",
    "--- דגימת 10+ צפיות ---",
    ...highList.map((x) => `${x.oldPath}\t${x.views}\t→\t${mapPathSpec(x.oldPath)}`),
    "",
    "--- דגימת יתומים (עד 80 שורות) ---",
    ...orphanSample.map((x) => `${x.oldPath}\t${x.views}`),
    "",
  ];
  fs.writeFileSync(REPORT_FILE, lines.join("\n"), "utf8");
  console.log(`דוח: ${path.relative(ROOT, REPORT_FILE)}`);
}

function main() {
  if (process.argv.includes("--sync-redirects-only")) {
    syncRedirectsWithMap();
    console.log("\nהמשך: npm run validate:links");
    return;
  }

  const csvPath = process.env.NM_ANALYTICS_CSV
    ? path.resolve(ROOT, process.env.NM_ANALYTICS_CSV)
    : CSV_DEFAULT;

  if (!fs.existsSync(csvPath)) {
    console.error(`לא נמצא CSV: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    comment: "#",
    relax_column_count: true,
  });

  const normalizedRows = [];
  for (const r of records) {
    const rawPath = r[PATH_COL];
    if (rawPath == null || String(rawPath).trim() === "") continue;
    const p = normalizeIncomingPath(rawPath);
    if (!p || shouldSkipPath(p)) continue;
    const views = parseInt(String(r[VIEWS_COL] ?? "0"), 10) || 0;
    normalizedRows.push({ oldPath: p, views });
  }

  const pagesWithTraffic = normalizedRows.filter((x) => x.views > 0);
  const orphans = normalizedRows.filter((x) => x.views === 0);

  const byPath = new Map();
  for (const { oldPath, views } of pagesWithTraffic) {
    const prev = byPath.get(oldPath);
    if (!prev || views > prev) byPath.set(oldPath, views);
  }

  const highTraffic = [...byPath.entries()]
    .filter(([, v]) => v >= 10)
    .map(([oldPath, views]) => ({ oldPath, views }))
    .sort((a, b) => b.views - a.views);

  const orphanSample = orphans.slice(0, 80);

  writeReport({
    totalWithTraffic: pagesWithTraffic.length,
    highTrafficCount: highTraffic.length,
    orphans,
    highList: highTraffic.slice(0, 40),
    orphanSample,
  });

  console.log(`נקרא CSV: ${path.relative(ROOT, csvPath)}`);
  console.log(`דפים עם צפיות ≥1 (אחרי סינון): ${pagesWithTraffic.length}`);
  console.log(`10+ צפיות: ${highTraffic.length}`);
  console.log(`יתומים 0 צפיות (לא מסוננים): ${orphans.length}\n`);

  console.log("דגימה: 10+ צפיות → יעד:");
  for (const row of highTraffic.slice(0, 20)) {
    console.log(`  ${row.oldPath} (${row.views}) → ${mapPathSpec(row.oldPath)}`);
  }
  if (highTraffic.length > 20) console.log(`  …ועוד ${highTraffic.length - 20}`);

  if (DRY) {
    console.log("\nמצב dry-run: לא נכתבו קבצים. הרץ עם --write לעדכון migration-map.ts ו-_redirects.");
    process.exit(0);
  }

  const mapTsPristine = fs.readFileSync(MIGRATION_MAP, "utf8");
  let mapTs = mapTsPristine;
  const coreStart = mapTs.indexOf("export const CORE_REDIRECTS = {");
  const blogStart = mapTs.indexOf("export const BLOG_REDIRECTS = {");
  const seoStart = mapTs.indexOf("/** SEO CONSTANTS");
  if (coreStart < 0 || blogStart < 0 || seoStart < 0) {
    throw new Error("מבנה migration-map.ts לא צפוי (CORE / BLOG / SEO)");
  }

  const coreChunk = mapTs.slice(coreStart, blogStart);
  const blogChunk = mapTs.slice(blogStart, seoStart);
  const strippedCore = stripAnalyticsInjectionInChunk(coreChunk);
  const strippedBlog = stripAnalyticsInjectionInChunk(blogChunk);
  mapTs = mapTs.slice(0, coreStart) + strippedCore + mapTs.slice(blogStart);
  const blogStart2 = mapTs.indexOf("export const BLOG_REDIRECTS = {");
  const seoStart2 = mapTs.indexOf("/** SEO CONSTANTS");
  mapTs = mapTs.slice(0, blogStart2) + stripAnalyticsInjectionInChunk(mapTs.slice(blogStart2, seoStart2)) + mapTs.slice(seoStart2);

  const coreManualKeys = new Set(Object.keys(pairsToMap(parseBlock(mapTs, "CORE_REDIRECTS"))));
  const blogManualKeys = new Set(Object.keys(pairsToMap(parseBlock(mapTs, "BLOG_REDIRECTS"))));

  const coreEntries = [];
  const blogEntries = [];
  for (const [oldPath, views] of byPath.entries()) {
    if (oldPath === "/") continue;
    let newPath = mapPathSpec(oldPath);
    newPath = ensureTrailingSlash(newPath);
    if (newPath === "//") newPath = "/";
    if (oldPath === newPath) continue;

    const item = { oldPath, newPath, views };
    if (isCoreDestination(newPath)) {
      if (coreManualKeys.has(oldPath)) continue;
      coreEntries.push(item);
    } else {
      if (blogManualKeys.has(oldPath)) continue;
      blogEntries.push(item);
    }
  }

  const allCoreOldPaths = new Set(coreManualKeys);
  for (const e of coreEntries) allCoreOldPaths.add(e.oldPath);
  const blogFiltered = blogEntries.filter((e) => !allCoreOldPaths.has(e.oldPath));
  blogEntries.length = 0;
  blogEntries.push(...blogFiltered);

  const sortByViews = (a, b) => b.views - a.views;
  const partition = (arr) => {
    const hi = arr.filter((x) => x.views >= 10).sort(sortByViews);
    const lo = arr.filter((x) => x.views < 10).sort(sortByViews);
    return { hi, lo };
  };
  const c = partition(coreEntries);
  const b = partition(blogEntries);

  function formatSection({ hi, lo }, labelCore) {
    if (hi.length === 0 && lo.length === 0) return "";
    const lines = [];
    lines.push(`\n\n  // אנליטיקס — ייבוא אוטומטי (${labelCore})`);
    if (hi.length) {
      lines.push("  // GA4: עדיפות גבוהה 10+ צפיות");
      for (const x of hi) lines.push(formatPairLineWithViews(x.oldPath, x.newPath, x.views));
    }
    if (lo.length) {
      lines.push("  // GA4: מתחת ל-10 צפיות");
      for (const x of lo) lines.push(formatPairLineWithViews(x.oldPath, x.newPath, x.views));
    }
    return lines.join("\n");
  }

  if (coreEntries.length === 0 && blogEntries.length === 0) {
    console.log(
      "\nאין מה להזריק מה-CSV (אין נתיבים עם צפיות שמשנים יעד). migration-map.ts לא נערך כדי לא למחוק בלוקי GA4 קיימים.",
    );
    syncRedirectsWithMap();
    console.log("\nהמשך מומלץ: npm run validate:links && npm run build && npm run check:migration");
    return;
  }

  const insertCore = formatSection(c, "CORE");
  const insertBlog = formatSection(b, "BLOG");

  if (insertCore) {
    const coreClose = mapTs.indexOf("\n} as const;", mapTs.indexOf("export const CORE_REDIRECTS = {"));
    if (coreClose < 0) throw new Error("סגירת CORE_REDIRECTS לא נמצאה");
    mapTs = mapTs.slice(0, coreClose) + insertCore + mapTs.slice(coreClose);
  }

  if (insertBlog) {
    const blogOpen3 = mapTs.indexOf("export const BLOG_REDIRECTS = {");
    const blogClose = mapTs.indexOf("\n} as const;", blogOpen3 + 1);
    if (blogClose < 0) throw new Error("סגירת BLOG_REDIRECTS לא נמצאה");
    mapTs = mapTs.slice(0, blogClose) + insertBlog + mapTs.slice(blogClose);
  }

  fs.writeFileSync(MIGRATION_MAP, mapTs, "utf8");
  console.log(`\nעודכן: ${path.relative(ROOT, MIGRATION_MAP)}`);

  syncRedirectsWithMap();

  console.log("\nהמשך מומלץ: npm run validate:links && npm run build && npm run check:migration");
}

function syncRedirectsWithMap() {
  const mapTs = fs.readFileSync(MIGRATION_MAP, "utf8");
  let redContent = fs.readFileSync(REDIRECTS_FILE, "utf8");
  const newBlock = buildAnalyticsRedirectLines(mapTs);
  redContent = replaceAnalyticsRedirectsSection(redContent, newBlock);
  fs.writeFileSync(REDIRECTS_FILE, redContent, "utf8");
  console.log(`עודכן: ${path.relative(ROOT, REDIRECTS_FILE)} (בלוק אנליטיקס מחודש)`);

  const pairs = [...parseBlock(mapTs, "CORE_REDIRECTS"), ...parseBlock(mapTs, "BLOG_REDIRECTS")];
  let missing = 0;
  for (const { oldUrl, newUrl } of pairs) {
    if (oldUrl === newUrl) continue;
    if (!hasRedirectRule(redContent, oldUrl)) missing++;
  }
  if (missing > 0) {
    console.log(`אזהרה: ${missing} זוגות במפה ללא כלל 301 מפורש (ייתכן כיסוי splat).`);
  }
}

main();
