import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const distDir = path.join(root, "dist");
const articlesDir = path.join(root, "src/content/articles");
const locksPath = path.join(root, "src/lib/generated/premium-locks.json");

if (!fs.existsSync(distDir)) {
  console.error("postbuild-article-seo-check: אין תיקיית dist. הרץ build קודם.");
  process.exit(1);
}

if (!fs.existsSync(articlesDir)) {
  console.error("postbuild-article-seo-check: חסרה src/content/articles");
  process.exit(1);
}

/** @param {string} mdxBody */
function mdxContentToSeoPlain(mdxBody) {
  const plainText = mdxBody.replace(/<[^>]*>/g, " ");
  return plainText.replace(/\s+/g, " ").trim();
}

/** @param {string} s */
function norm(s) {
  return s.replace(/\s+/g, " ").trim();
}

/** @param {unknown} value */
function toIsoDateOnly(value) {
  if (value == null) return null;
  const d = new Date(/** @type {string | number | Date} */ (value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** @param {unknown} value */
function toIsoW3C(value) {
  if (value == null) return null;
  const d = new Date(/** @type {string | number | Date} */ (value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * @param {string} html
 * @returns {unknown[]}
 */
function collectLdJsonObjects(html) {
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  /** @type {unknown[]} */
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const x of parsed) out.push(x);
      } else {
        out.push(parsed);
      }
    } catch {
      /* בלוקים לא תקינים (למשל תבנית שלא הורנדרה) — מדלגים */
    }
  }
  return out;
}

/**
 * @param {unknown[]} objs
 * @returns {Record<string, unknown> | null}
 */
function findArticleSchema(objs) {
  for (const o of objs) {
    if (o && typeof o === "object" && !Array.isArray(o)) {
      const t = /** @type {Record<string, unknown>} */ (o)["@type"];
      if (t === "Article") return /** @type {Record<string, unknown>} */ (o);
    }
  }
  return null;
}

/** תוכן גלוי בלבד: בלי תגי script (כולל מודולים עם import ל-astro:actions) */
function stripAllScriptTags(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

/**
 * @template T
 * @param {T[]} arr
 * @param {number} n
 * @returns {T[]}
 */
function pickRandom(arr, n) {
  const seedRaw = process.env.NM_POSTBUILD_TEST_SEED;
  const seed = seedRaw !== undefined && seedRaw !== "" ? Number(seedRaw) : Date.now();
  let s = Number.isFinite(seed) ? seed % 2147483647 : 12345;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/** @type {Record<string, string>} */
let premiumLocks = {};
try {
  premiumLocks = JSON.parse(fs.readFileSync(locksPath, "utf8"));
} catch {
  premiumLocks = {};
}

/** @type {{ slug: string; isPremium: boolean; expectedArticleBody: string; lastmodIso: string }[]} */
const catalog = [];

for (const name of fs.readdirSync(articlesDir)) {
  if (!name.endsWith(".mdx")) continue;
  const full = path.join(articlesDir, name);
  const raw = fs.readFileSync(full, "utf8");
  let data;
  let content;
  try {
    const p = matter(raw);
    data = p.data;
    content = p.content;
  } catch {
    continue;
  }
  if (data.draft === true) continue;
  const fileSlug = name.replace(/\.mdx$/i, "");
  const slug =
    typeof data.slug === "string" && data.slug.trim().length > 0
      ? data.slug.trim()
      : fileSlug;
  const isPremium = Boolean(data.isPremium);
  const expectedArticleBody = mdxContentToSeoPlain(content).slice(0, 120000);
  const mod = data.updatedDate ?? data.pubDate;
  const lastmodIso = toIsoW3C(mod);
  if (!lastmodIso) {
    console.error(`postbuild-article-seo-check: חסר pubDate/updatedDate במאמר ${slug}`);
    process.exit(1);
  }
  const distHtml = path.join(distDir, "articles", slug, "index.html");
  if (!fs.existsSync(distHtml)) {
    continue;
  }
  catalog.push({ slug, isPremium, expectedArticleBody, lastmodIso });
}

if (catalog.length === 0) {
  console.error("postbuild-article-seo-check: אין מאמרים לבדיקה");
  process.exit(1);
}

const sample = pickRandom(catalog, 5);
const sitemapFiles = fs
  .readdirSync(distDir)
  .filter((f) => /^sitemap-\d+\.xml$/i.test(f) && f !== "sitemap-index.xml")
  .map((f) => path.join(distDir, f));

let sitemapBlob = "";
for (const f of sitemapFiles) {
  sitemapBlob += fs.readFileSync(f, "utf8");
}

let failed = false;

for (const row of sample) {
  const htmlPath = path.join(distDir, "articles", row.slug, "index.html");
  if (!fs.existsSync(htmlPath)) {
    console.error(`postbuild-article-seo-check: חסר ${htmlPath}`);
    failed = true;
    continue;
  }
  const html = fs.readFileSync(htmlPath, "utf8");
  const objs = collectLdJsonObjects(html);
  const article = findArticleSchema(objs);
  if (!article) {
    console.error(`postbuild-article-seo-check: אין Article ב-JSON-LD — ${row.slug}`);
    failed = true;
    continue;
  }

  const free = article["isAccessibleForFree"];
  if (row.isPremium) {
    if (free !== false) {
      console.error(`postbuild-article-seo-check: פרימיום ${row.slug}: מצופה isAccessibleForFree: false, התקבל: ${JSON.stringify(free)}`);
      failed = true;
    }
  } else if (free === false) {
    console.error(`postbuild-article-seo-check: מאמר חינמי ${row.slug}: לא אמור isAccessibleForFree: false`);
    failed = true;
  }

  const body = article["articleBody"];
  if (typeof body !== "string" || norm(body).length < 80) {
    console.error(`postbuild-article-seo-check: articleBody חלש או חסר — ${row.slug}`);
    failed = true;
  } else {
    const exp = norm(row.expectedArticleBody);
    const got = norm(body);
    if (got !== exp) {
      console.error(`postbuild-article-seo-check: articleBody לא תואם מקור MDX — ${row.slug}`);
      failed = true;
    }
  }

  const htmlNoScripts = stripAllScriptTags(html);
  if (/\n\s*import\s+/.test(htmlNoScripts) || /\n\s*export\s+/.test(htmlNoScripts)) {
    console.error(`postbuild-article-seo-check: חשד לדליפת import/export מ-MDX — ${row.slug}`);
    failed = true;
  }
  const lockRaw = premiumLocks[row.slug];
  if (typeof lockRaw === "string" && lockRaw.trim().length > 40) {
    const lockPlain = norm(mdxContentToSeoPlain(lockRaw));
    const probe = lockPlain.slice(0, 120);
    if (probe.length > 40 && htmlNoScripts.includes(probe)) {
      console.error(`postbuild-article-seo-check: תוכן נעול מופיע ב-HTML סטטי — ${row.slug}`);
      failed = true;
    }
  }

  const urlNeedle = `https://www.nevermind.co.il/articles/${row.slug}/`;
  const esc = row.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRe = new RegExp(
    `<url>\\s*<loc>https://www\\.nevermind\\.co\\.il/articles/${esc}/</loc>[\\s\\S]*?</url>`,
    "i"
  );
  const block = sitemapBlob.match(blockRe);
  if (!block) {
    console.error(`postbuild-article-seo-check: ה-sitemap לא מכיל URL למאמר ${row.slug}`);
    failed = true;
  } else {
    const lm = block[0].match(/<lastmod>([^<]+)<\/lastmod>/i);
    if (!lm) {
      console.error(`postbuild-article-seo-check: חסר lastmod ב-sitemap למאמר ${row.slug}`);
      failed = true;
    } else {
      const expectedDate = toIsoDateOnly(row.lastmodIso);
      const got = lm[1].trim().slice(0, 10);
      if (expectedDate && got !== expectedDate) {
        console.error(
          `postbuild-article-seo-check: lastmod ב-sitemap לא תואם frontmatter — ${row.slug} מצופה ${expectedDate} התקבל ${got}`
        );
        failed = true;
      }
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`postbuild-article-seo-check: עבר (${sample.length} מאמרים, דגימה).`);
