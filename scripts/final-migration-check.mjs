/**
 * בדיקה לפני פרסום: קישורים פנימיים ב-dist, דפים ללא קישור נכנס, מפת מיגרציה מול _redirects,
 * שדות SEO בסיסיים, ואופציונלי מול CSV אנליטיקס.
 *
 * נכס: www.nevermind.co.il · GA4: G-361341467 (Property 343135032)
 */
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { glob } from "glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DIST_DIR = path.join(ROOT, "dist");
const MIGRATION_MAP_PATH = path.join(ROOT, "src", "data", "migration-map.ts");
const ANALYTICS_CSV = path.join(ROOT, "data", "pages-analytics.csv");
const REDIRECTS_FILE = path.join(ROOT, "public", "_redirects");

const GA4_MEASUREMENT_ID = "G-361341467";

/** דפי מקור ישנים שחייבים כיסוי במפה או ב-_redirects */
const CRITICAL_PAGES = new Set([
  "/שירותים/",
  "/ייעוץ-זוגי-ואישי/",
  "/shop/",
  "/פודקאסט-מרפסת/",
  "/טוב-ורע-האם-הם-באמת-נפרדים/",
  "/מה-זה-אהבה-טהורה/",
  "/איך-אלוהים-נראה/",
  "/מה-זה-נימוס-מה-זה-כבוד/",
  "/מהו-אגו-באמת/",
  "/7-הרגלים-מוזרים-שמגלים-עליכם-את-כל-האמת/",
  "/איך-להבדיל-בין-עובדה-לפירוש/",
  "/הילד-שלי-פוחד-משדים/",
  "/סבא-וסבתא-יקרים-בואו-נדבר-על-לילה-מתוק/",
  "/איך-לבחור-חברים-בצורה-חכמה/",
  "/איך-לזהות-מניפולציה-בשפה/",
  "/האם-להתגרש-או-להישאר/",
  "/product/אהבה-ב-20-עמודים/",
  "/course/קורס-התמכרויות/",
]);

/** קידומי נתיב ב-dist שלא מדווחים כיתום (מקורות תנועה חיצוניים / הפניות) */
const ORPHAN_EXCLUDE_REL_PREFIXES = [
  "blog/",
  "admin/",
  "dashboard",
  "premium-access",
  "404.html",
  "_astro/",
  "pagefind/",
];

/** קישורים שבורים מדפי אדמין (מאמרי טיוטה שלא ב-dist) לא חוסמים פרסום */
const BROKEN_LINK_SKIP_SOURCE_PREFIXES = ["admin/"];

const results = {
  brokenLinks: [],
  orphanPages: [],
  missingRedirects: [],
  analyticsPathsMissing: [],
  seoIssues: [],
};

function extractQuotedPairs(block) {
  const pairs = [];
  const re = /"((?:\\.|[^"\\])*)":\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    pairs.push({ oldUrl: match[1], newUrl: match[2] });
  }
  return pairs;
}

function parseMigrationMap(tsSource) {
  const names = ["CORE_REDIRECTS", "BLOG_REDIRECTS"];
  const pairs = [];
  for (const name of names) {
    const reBlock = new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\} as const`, "s");
    const m = tsSource.match(reBlock);
    if (!m) throw new Error(`לא נמצא ${name} ב-migration-map.ts`);
    pairs.push(...extractQuotedPairs(m[1]));
  }
  if (pairs.length === 0) throw new Error("לא נמצאו הפניות במפה");
  return pairs;
}

function parseRedirectRules(content) {
  const rules = [];
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const parts = t.split(/\s+/);
    if (parts.length < 3) continue;
    const code = parts[parts.length - 1];
    const to = parts[parts.length - 2];
    const from = parts.slice(0, -2).join(" ");
    if (!/^\d{3}$/.test(code)) continue;
    if (code === "404") continue;
    rules.push({ from, to, code });
  }
  return rules;
}

function normalizePath(p) {
  let s = String(p).trim();
  if (!s.startsWith("/")) s = `/${s}`;
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s || "/";
}

function redirectCovers(rules, oldPath) {
  const n = normalizePath(oldPath);
  for (const r of rules) {
    const from = r.from;
    if (from.endsWith("/*")) {
      const pref = normalizePath(from.slice(0, -2));
      if (n === pref || n.startsWith(`${pref}/`)) return true;
    } else if (normalizePath(from) === n) {
      return true;
    }
  }
  return false;
}

function migrationLookup(pairs) {
  const byOld = new Map();
  for (const { oldUrl, newUrl } of pairs) {
    byOld.set(normalizePath(oldUrl), newUrl);
  }
  return byOld;
}

function looksLikeStaticAsset(subPath) {
  const base = subPath.split("/").pop() ?? "";
  if (!base.includes(".")) return false;
  return /\.(svg|png|jpe?g|gif|webp|ico|avif|css|js|mjs|map|json|webmanifest|woff2?|ttf|txt|xml|pdf)$/i.test(
    base,
  );
}

function hrefToCandidateFiles(distRoot, href) {
  const raw = href.split("?")[0].split("#")[0].trim();
  if (!raw || raw.startsWith("//")) return [];
  let pathname = raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      return [];
    }
  }
  if (!pathname.startsWith("/")) return [];

  let sub = pathname.slice(1);
  if (!sub) return [path.join(distRoot, "index.html")];

  if (sub.endsWith(".html")) {
    return [path.join(distRoot, sub)];
  }
  if (looksLikeStaticAsset(sub)) {
    return [path.join(distRoot, sub)];
  }
  if (sub.endsWith("/")) {
    return [path.join(distRoot, sub, "index.html")];
  }
  return [path.join(distRoot, sub, "index.html"), path.join(distRoot, `${sub}.html`)];
}

async function fileExists(f) {
  try {
    await access(f);
    return true;
  } catch {
    return false;
  }
}

function relFromDist(absPath) {
  return path.relative(DIST_DIR, absPath).replace(/\\/g, "/");
}

function shouldSkipOrphan(relPath) {
  const n = relPath.replace(/\\/g, "/");
  return ORPHAN_EXCLUDE_REL_PREFIXES.some((pre) => n === pre || n.startsWith(pre));
}

async function checkBrokenLinks() {
  console.log("בודק קישורים פנימיים ב-dist…");
  const htmlFiles = await glob("**/*.html", { cwd: DIST_DIR, nodir: true, posix: true });
  const linkedRel = new Set();

  for (const rel of htmlFiles) {
    const file = path.join(DIST_DIR, rel);
    const content = await readFile(file, "utf8");
    const linkRegex = /href=["']([^"']+)["']/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.toLowerCase().startsWith("javascript:")
      ) {
        continue;
      }

      const candidates = hrefToCandidateFiles(DIST_DIR, href);
      let ok = false;
      for (const c of candidates) {
        if (await fileExists(c)) {
          ok = true;
          linkedRel.add(relFromDist(c));
          break;
        }
      }
      if (!ok && candidates.length > 0) {
        const skip = BROKEN_LINK_SKIP_SOURCE_PREFIXES.some((pre) => rel === pre || rel.startsWith(pre));
        if (!skip) {
          results.brokenLinks.push({
            from: rel,
            to: href,
            tried: candidates.map((c) => relFromDist(c)),
          });
        }
      }
    }
  }

  for (const rel of htmlFiles) {
    if (shouldSkipOrphan(rel)) continue;
    if (rel === "index.html" || rel === "404.html") continue;
    if (!linkedRel.has(rel)) {
      results.orphanPages.push({ path: rel });
    }
  }
}

async function checkRedirects() {
  console.log("בודק מפת מיגרציה מול _redirects…");
  const ts = await readFile(MIGRATION_MAP_PATH, "utf8");
  const redirectsContent = await readFile(REDIRECTS_FILE, "utf8");
  const pairs = parseMigrationMap(ts);
  const rules = parseRedirectRules(redirectsContent);
  const byOld = migrationLookup(pairs);

  for (const oldPath of CRITICAL_PAGES) {
    const hasMap = byOld.has(normalizePath(oldPath));
    const hasRule = redirectCovers(rules, oldPath);
    if (!hasMap && !hasRule) {
      results.missingRedirects.push({ oldPath, reason: "אין רשומה במפה ואין כלל מתאים ב-_redirects" });
    }
  }
}

async function loadAnalyticsPaths() {
  try {
    const csv = await readFile(ANALYTICS_CSV, "utf8");
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      comment: "#",
    });
    const pathKeys = ["path", "Path", "page_path", "Page path", "נתיב", "URL", "url"];
    const out = [];
    for (const row of records) {
      let p = null;
      for (const k of pathKeys) {
        if (row[k] != null && String(row[k]).trim()) {
          p = String(row[k]).trim();
          break;
        }
      }
      if (!p) continue;
      try {
        if (p.startsWith("http://") || p.startsWith("https://")) {
          p = new URL(p).pathname;
        }
      } catch {
        continue;
      }
      if (!p.startsWith("/")) p = `/${p}`;
      out.push(p);
    }
    return out;
  } catch {
    console.warn("אין קובץ data/pages-analytics.csv או לא ניתן לקרוא — מדלג על השוואת נתיבים לאנליטיקס.");
    return null;
  }
}

async function checkAnalyticsVsMigration() {
  const paths = await loadAnalyticsPaths();
  if (paths == null || paths.length === 0) return;

  console.log("משווה נתיבים מ-CSV אנליטיקס למפה/הפניות…");
  const ts = await readFile(MIGRATION_MAP_PATH, "utf8");
  const redirectsContent = await readFile(REDIRECTS_FILE, "utf8");
  const pairs = parseMigrationMap(ts);
  const rules = parseRedirectRules(redirectsContent);
  const byOld = migrationLookup(pairs);

  const seen = new Set();
  for (const raw of paths) {
    const key = normalizePath(raw);
    if (seen.has(key)) continue;
    seen.add(key);
    if (byOld.has(key) || redirectCovers(rules, raw)) continue;
    results.analyticsPathsMissing.push(raw);
  }
}

async function checkSEO() {
  console.log("בודק תגי SEO בסיסיים ב-dist…");
  const htmlFiles = await glob("**/*.html", { cwd: DIST_DIR, nodir: true, posix: true });

  for (const rel of htmlFiles) {
    const content = await readFile(path.join(DIST_DIR, rel), "utf8");

    const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
    const titleText = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "";
    if (!titleText || [...titleText].length > 60) {
      results.seoIssues.push({ page: rel, issue: "חסר title או ארוך מ־60 תווים (ספירת graphemes בסיסית)" });
    }

    if (!content.includes('name="description"')) {
      results.seoIssues.push({ page: rel, issue: "חסר meta description" });
    }

    if (!content.includes('rel="canonical"')) {
      results.seoIssues.push({ page: rel, issue: "חסר canonical" });
    }

    const is404 = rel === "404.html" || rel.endsWith("/404.html");
    if (!is404 && !content.includes(GA4_MEASUREMENT_ID)) {
      results.seoIssues.push({
        page: rel,
        issue: `חסר מזהה GA4 ${GA4_MEASUREMENT_ID} (הגדר PUBLIC_GA_MEASUREMENT_ID בבילד או בדוק שאנליטיקס נטען)`,
      });
    }
  }
}

function printReport() {
  console.log("\n" + "=".repeat(60));
  console.log("תוצאות בדיקת מיגרציה לפני פרסום");
  console.log("=".repeat(60) + "\n");

  if (results.brokenLinks.length > 0) {
    console.log(`קישורים שבורים: ${results.brokenLinks.length}`);
    results.brokenLinks.slice(0, 15).forEach((l) => {
      console.log(`   ${l.from} → ${l.to}`);
    });
    if (results.brokenLinks.length > 15) console.log(`   …ועוד ${results.brokenLinks.length - 15}`);
  } else {
    console.log("אין קישורים פנימיים שבורים (לפי dist).");
  }

  console.log("");

  if (results.orphanPages.length > 0) {
    console.log(`דפי HTML ללא קישור נכנס פנימי (מסונן): ${results.orphanPages.length}`);
    results.orphanPages.slice(0, 12).forEach((p) => console.log(`   ${p.path}`));
    if (results.orphanPages.length > 12) console.log(`   …ועוד ${results.orphanPages.length - 12}`);
  } else {
    console.log("אין דפים יתומים לפי ההגדרה (אחרי סינון blog/admin וכו׳).");
  }

  console.log("");

  if (results.missingRedirects.length > 0) {
    console.log(`הפניות חסרות לדפים קריטיים: ${results.missingRedirects.length}`);
    results.missingRedirects.forEach((r) => console.log(`   ${r.oldPath}`));
  } else {
    console.log("כל דפי המקור הקריטיים מכוסים במפה או ב-_redirects.");
  }

  console.log("");

  if (results.analyticsPathsMissing.length > 0) {
    console.log(
      `אזהרה: נתיבים מ-CSV בלי כיסוי במפה/הפניות: ${results.analyticsPathsMissing.length} (ייתכן נתיבים חדשים באתר; לא חוסם יציאה)`,
    );
    results.analyticsPathsMissing.slice(0, 20).forEach((p) => console.log(`   ${p}`));
    if (results.analyticsPathsMissing.length > 20) console.log(`   …ועוד ${results.analyticsPathsMissing.length - 20}`);
  }

  console.log("");

  if (results.seoIssues.length > 0) {
    console.log(`הערות SEO/אנליטיקס: ${results.seoIssues.length}`);
    results.seoIssues.slice(0, 12).forEach((i) => console.log(`   ${i.page}: ${i.issue}`));
    if (results.seoIssues.length > 12) console.log(`   …ועוד ${results.seoIssues.length - 12}`);
  } else {
    console.log("אין הערות SEO בסיסיות לפי הסקריפט.");
  }

  console.log("\n" + "=".repeat(60));

  const criticalFailure = results.brokenLinks.length > 0 || results.missingRedirects.length > 0;

  if (criticalFailure) {
    console.log("הבדיקה נכשלה: קישורים שבורים או דפים קריטיים בלי מפה/הפניה.");
    process.exit(1);
  }

  console.log("המעבר הקריטי עבר (קישורים + דפים קריטיים). בדוק ידנית יתומים והערות SEO.");
  process.exit(0);
}

async function main() {
  console.log("מתחיל final-migration-check…\n");
  await access(DIST_DIR).catch(() => {
    console.error("תיקיית dist לא קיימת. הרץ קודם: npm run build");
    process.exit(1);
  });

  await checkBrokenLinks();
  await checkRedirects();
  await checkAnalyticsVsMigration();
  await checkSEO();
  printReport();
}

main().catch((err) => {
  console.error("שגיאה:", err);
  process.exit(1);
});
