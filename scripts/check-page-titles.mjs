#!/usr/bin/env node
/**
 * אחרי build: סורק dist/**/*.html ומדווח על <title> ארוכים מדי (הנחה 60 תווים לערך).
 * שימוש: npm run build && node scripts/check-page-titles.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const MAX = 60;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, " ") : "";
}

const files = walk(DIST);
const long = [];
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const title = extractTitle(html);
  if (!title) continue;
  const len = [...title].length;
  if (len > MAX) {
    long.push({ file: path.relative(DIST, file), len, title });
  }
}

long.sort((a, b) => b.len - a.len);
if (long.length === 0) {
  console.log(`check-page-titles: כל הכותרות ב-dist עד ${MAX} תווים (לפי ספירת graphemes בסיסית).`);
  process.exit(0);
}

console.error(`check-page-titles: נמצאו ${long.length} כותרות מעל ${MAX} תווים:`);
for (const row of long.slice(0, 40)) {
  console.error(`  [${row.len}] ${row.file}\n    ${row.title}`);
}
if (long.length > 40) console.error(`  … ועוד ${long.length - 40}`);
process.exit(1);
