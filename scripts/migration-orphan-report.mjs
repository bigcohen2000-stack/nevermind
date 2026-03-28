/**
 * דו"ח כתובות ישנות בלי יעד במיגרציה.
 * שימוש:
 *   node scripts/migration-orphan-report.mjs path/to/old-urls.txt [path/to/map.json]
 *
 * old-urls.txt — שורה לכל URL מקור
 * map.json — אובייקט { "https://...": "/path/" } (או כמו ב-data/migration-url-map.example.json)
 *
 * אחרי build: ה-sitemap נוצר אוטומטית ע״י @astrojs/sitemap.
 * להגשה ל-Google Search Console: https://search.google.com/search-console — Sitemaps — הוסף את כתובת ה-sitemap מהדומיין.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const urlsFile = process.argv[2];
const mapFile = process.argv[3] ?? path.join(root, "data", "migration-url-map.json");

if (!urlsFile || !fs.existsSync(urlsFile)) {
  console.error("חובה לספק קובץ טקסט עם URL ישנים (שורה לכל אחד).");
  console.error("דוגמה: node scripts/migration-orphan-report.mjs ./old-urls.txt ./data/migration-url-map.json");
  process.exit(1);
}

/** @type {Record<string, string>} */
let map = {};
if (fs.existsSync(mapFile)) {
  try {
    map = JSON.parse(fs.readFileSync(mapFile, "utf8"));
  } catch (e) {
    console.error("לא ניתן לקרוא map JSON:", mapFile, e);
    process.exit(1);
  }
} else {
  console.warn("אזהרה: לא נמצא קובץ מיפוי — כל הכתובות יסומנו כחסרות יעד:", mapFile);
}

const lines = fs
  .readFileSync(urlsFile, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const orphans = [];
for (const line of lines) {
  const normalized = line.replace(/\/$/, "");
  let hit = map[line] || map[normalized];
  if (!hit) {
    try {
      const u = new URL(line);
      const key = `${u.origin}${u.pathname.replace(/\/$/, "")}`;
      hit = map[key];
    } catch {
      /* ignore */
    }
  }
  if (!hit || String(hit).trim() === "") {
    orphans.push(line);
  }
}

const outPath = path.join(root, "migration-orphans-report.txt");
fs.writeFileSync(outPath, orphans.length ? orphans.join("\n") + "\n" : "(אין יתומים)\n", "utf8");

console.log(`סה"כ URL בקלט: ${lines.length}`);
console.log(`ללא יעד במיפוי: ${orphans.length}`);
console.log(`דו"ח נשמר: ${outPath}`);
console.log("");
console.log("Sitemap: לאחר npm run build קיים dist/sitemap-index.xml — להגיש ב-Search Console.");

if (orphans.length) process.exit(2);
