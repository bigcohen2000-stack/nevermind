/**
 * לפני פרסום: פסילה עם מיקום שורה; תוכן רגיש בלי isPremium → עדכון אוטומטי (מקומי בלבד).
 * ב-CI (process.env.CI): read-only — אין כתיבה; חסר isPremium או blocklist → כשל.
 * מופעל דרך pre-publish-check.mjs או: npx tsx scripts/pre-publish-check.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  findPhraseLineOccurrences,
  validateAndClassify,
} from "../src/utils/contentValidator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contentRoot = path.join(root, "src", "content");

/** true כשמשתני CI מקובלים (GitHub וכו׳ מגדירים CI=true) */
function isCiReadOnly(): boolean {
  const raw = process.env.CI;
  if (raw === undefined || raw === "") return false;
  const t = String(raw).trim().toLowerCase();
  if (t === "0" || t === "false" || t === "no" || t === "off") return false;
  return true;
}

const readOnly = isCiReadOnly();

function* walkMdxFiles(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walkMdxFiles(full);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith(".mdx")) yield full;
  }
}

type BlockError = { rel: string; phrase: string; lines: number[] };
type PremiumMissingError = { rel: string; triggers: string[] };

const blockErrors: BlockError[] = [];
const premiumMissingErrors: PremiumMissingError[] = [];
const premiumAutoFixWarnings: string[] = [];

if (readOnly) {
  console.warn("pre-publish-check: מצב CI — read-only (ללא עדכון קבצים).");
}

for (const abs of walkMdxFiles(contentRoot)) {
  const raw = fs.readFileSync(abs, "utf8");
  const rel = path.relative(root, abs).replace(/\\/g, "/");
  const classified = validateAndClassify(raw);

  if (!classified.valid) {
    for (const phrase of classified.matchedBlocklist) {
      const lines = findPhraseLineOccurrences(raw, phrase);
      blockErrors.push({ rel, phrase, lines: lines.length > 0 ? lines : [0] });
    }
  }

  if (classified.recommendPremium) {
    let parsed: ReturnType<typeof matter>;
    try {
      parsed = matter(raw);
    } catch {
      const msg = `${rel}: לא ניתן לפרסר frontmatter — דלג על בדיקת isPremium.`;
      if (readOnly) {
        premiumMissingErrors.push({ rel, triggers: ["(frontmatter שבור)"] });
        console.error(`pre-publish-check: ${msg}`);
      } else {
        console.warn(`pre-publish-check: ${msg}`);
      }
      continue;
    }
    const data = parsed.data as Record<string, unknown>;
    const isPremium = Boolean(data.isPremium);
    if (!isPremium) {
      if (readOnly) {
        premiumMissingErrors.push({ rel, triggers: [...classified.matchedSensitive] });
      } else {
        data.isPremium = true;
        const out = matter.stringify(parsed.content, data);
        fs.writeFileSync(abs, out, "utf8");
        premiumAutoFixWarnings.push(
          `${rel}: נושא רגיש — isPremium עודכן ל-true (טריגרים: ${classified.matchedSensitive.join(", ")}).`
        );
      }
    }
  }
}

for (const msg of premiumAutoFixWarnings) {
  console.warn(`pre-publish-check: ${msg}`);
}

const hasFailures = blockErrors.length > 0 || premiumMissingErrors.length > 0;

if (premiumMissingErrors.length > 0) {
  console.error("pre-publish-check: ב-CI נדרש isPremium: true לתוכן רגיש — ה-build נכשל.\n");
  for (const e of premiumMissingErrors) {
    console.error(`  • ${e.rel} — טריגרים: ${e.triggers.join(", ")}`);
  }
}

if (blockErrors.length > 0) {
  console.error("pre-publish-check: פסילת שפה — ה-build נכשל.\n");
  for (const e of blockErrors) {
    const linePart = e.lines[0] === 0 ? "שורה לא זוהתה" : `שורה/ות: ${e.lines.join(", ")}`;
    console.error(`  • ${e.rel} — "${e.phrase}" (${linePart})`);
  }
}

if (hasFailures) {
  process.exit(1);
}

console.log("pre-publish-check: עבר (כל קבצי ה-MDX תחת src/content).");
