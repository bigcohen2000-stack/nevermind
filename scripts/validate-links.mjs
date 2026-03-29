/**
 * QA: מיגרציה WordPress → Astro
 * - מפתחות ישנים מ-migration-map.ts מול public/_redirects
 * - ערכים חדשים מול קבצי .astro תחת src/pages
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const migrationPath = join(root, "src", "data", "migration-map.ts");
const redirectsPath = join(root, "public", "_redirects");
const pagesRoot = join(root, "src", "pages");

function readText(path) {
  return readFileSync(path, "utf8");
}

function extractQuotedPairs(block) {
  const pairs = [];
  const re = /"((?:\\.|[^"\\])*)":\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    pairs.push({ oldUrl: match[1], newUrl: match[2] });
  }
  return pairs;
}

/** CORE_REDIRECTS + BLOG_REDIRECTS (מפה מפוזרת, בלי לפרש Object.freeze spread) */
function parseMigrationMap(tsSource) {
  const names = ["BLOG_REDIRECTS", "CORE_REDIRECTS"];
  const pairs = [];
  for (const name of names) {
    const reBlock = new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\} as const`, "s");
    const m = tsSource.match(reBlock);
    if (!m) throw new Error(`לא נמצא ${name} ב-migration-map.ts`);
    pairs.push(...extractQuotedPairs(m[1]));
  }
  if (pairs.length === 0) throw new Error("לא נמצאו הפניות במפה");
  const dedup = new Map();
  for (const { oldUrl, newUrl } of pairs) {
    const o = oldUrl.startsWith("/") ? oldUrl : `/${oldUrl}`;
    const n = newUrl.startsWith("/") ? newUrl : `/${newUrl}`;
    dedup.set(o, n);
  }
  return [...dedup.entries()].map(([oldUrl, newUrl]) => ({ oldUrl, newUrl }));
}

function parseRedirectRules(content) {
  const rules = [];
  for (const line of content.split(/\r?\n/)) {
    let t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const hash = t.indexOf("#");
    if (hash >= 0) t = t.slice(0, hash).trim();
    const parts = t.split(/\s+/).filter(Boolean);
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

/** האם יש מסלול Astro סטטי או דינמי שמכסה את נתיב היעד */
function newUrlHasPage(normPath) {
  const parts = normPath.split("/").filter(Boolean);

  if (parts.length === 0) {
    return existsSync(join(pagesRoot, "index.astro"));
  }

  const asFile = join(pagesRoot, ...parts) + ".astro";
  if (existsSync(asFile)) return true;

  const asIndex = join(pagesRoot, ...parts, "index.astro");
  if (existsSync(asIndex)) return true;

  for (let i = parts.length; i >= 1; i--) {
    const baseParts = parts.slice(0, i);
    const rest = parts.slice(i);
    if (rest.length === 0) continue;
    const slugRest = join(pagesRoot, ...baseParts, "[...slug].astro");
    if (existsSync(slugRest)) return true;
    const idFile = join(pagesRoot, ...baseParts, "[id].astro");
    if (existsSync(idFile) && rest.length === 1) return true;
    const topicFile = join(pagesRoot, ...baseParts, "[topic].astro");
    if (existsSync(topicFile) && rest.length === 1) return true;
    const termFile = join(pagesRoot, ...baseParts, "[term].astro");
    if (existsSync(termFile) && rest.length === 1) return true;
    const slugFile = join(pagesRoot, ...baseParts, "[slug].astro");
    if (existsSync(slugFile) && rest.length === 1) return true;
  }

  return false;
}

function main() {
  const ts = readText(migrationPath);
  const redirectsRaw = readText(redirectsPath);
  const pairs = parseMigrationMap(ts);
  const rules = parseRedirectRules(redirectsRaw);

  const lines = [];
  let fail = false;

  for (const { oldUrl, newUrl } of pairs) {
    const oldDisplay = oldUrl.startsWith("/") ? oldUrl : `/${oldUrl}`;
    if (redirectCovers(rules, oldDisplay)) {
      lines.push(`✅ Redirect exists for [${oldDisplay}]`);
    } else {
      fail = true;
      lines.push(`❌ MISSING Redirect for [${oldDisplay}]`);
    }
  }

  for (const { newUrl } of pairs) {
    const n = normalizePath(newUrl);
    const display = newUrl.startsWith("/") ? newUrl : `/${newUrl}`;
    if (newUrlHasPage(n)) {
      lines.push(`✅ Page route exists for [${display}]`);
    } else {
      fail = true;
      lines.push(`❌ MISSING Page for [${display}]`);
    }
  }

  console.log(lines.join("\n"));

  if (fail) {
    console.error("\nValidation failed: fix redirects or add pages before DNS switch.");
    process.exit(1);
  }

  console.log("\nMigration Safe for DNS Switch");
  process.exit(0);
}

main();
